import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { query, withTransaction } from '../../database/index.js';
import { config } from '../../config/index.js';

// Ensure storage directories exist
if (!fs.existsSync(config.publicStoragePath)) {
  fs.mkdirSync(config.publicStoragePath, { recursive: true });
}
const avatarsDir = path.join(config.publicStoragePath, 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

if (!fs.existsSync(config.privateStoragePath)) {
  fs.mkdirSync(config.privateStoragePath, { recursive: true });
}

export async function lawyerRoutes(fastify: FastifyInstance) {
  // Authentication hook
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ success: false, error: 'غير مصرح: يرجى تسجيل الدخول' });
    }
  });

  // GET /api/v1/lawyers/me
  fastify.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, role } = request.user as { userId: string; role: string };

    if (role !== 'lawyer' && role !== 'admin') {
      return reply.status(403).send({ success: false, error: 'هذا المسار مخصص للمحامين فقط' });
    }

    const lawyerRes = await query(
      `SELECT lp.id as profile_id, lp.full_name, lp.profile_photo_path, lp.approval_status,
              lp.syndicate_number, lp.bio, lp.submitted_at, lp.approved_at, lp.rejected_at, lp.rejection_reason,
              u.id as user_id, u.email, u.phone, u.status
       FROM lawyer_profiles lp
       JOIN users u ON lp.user_id = u.id
       WHERE lp.user_id = $1`,
      [userId]
    );

    if (lawyerRes.rows.length === 0) {
      return reply.status(404).send({ success: false, error: 'ملف المحامي غير موجود' });
    }

    const lawyer = lawyerRes.rows[0];

    // Fetch uploaded documents
    const docsRes = await query(
      `SELECT id, document_type, original_filename, mime_type, file_size, is_current, uploaded_at
       FROM lawyer_documents
       WHERE lawyer_profile_id = $1
       ORDER BY uploaded_at DESC`,
      [lawyer.profile_id]
    );

    return reply.send({
      success: true,
      data: {
        profile: lawyer,
        documents: docsRes.rows
      }
    });
  });

  // POST /api/v1/lawyers/me/profile-photo (Public upload, avatars)
  fastify.post('/me/profile-photo', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, role } = request.user as { userId: string; role: string };
    if (role !== 'lawyer' && role !== 'admin') {
      return reply.status(403).send({ success: false, error: 'مخصص للمحامين فقط' });
    }

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ success: false, error: 'لم يتم إرسال ملف الصورة' });
    }

    // Validate mime type
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMime.includes(data.mimetype)) {
      return reply.status(400).send({ success: false, error: 'نوع الملف غير مدعوم، يرجى رفع صورة JPG أو PNG أو WEBP' });
    }

    const ext = data.mimetype === 'image/png' ? '.png' : data.mimetype === 'image/webp' ? '.webp' : '.jpg';
    const filename = `avatar_${crypto.randomUUID()}${ext}`;
    const filePath = path.join(avatarsDir, filename);

    // Stream to file
    await pipeline(data.file, fs.createWriteStream(filePath));

    // Relative web accessible path
    const relativeWebPath = `/uploads/avatars/${filename}`;

    await query(
      `UPDATE lawyer_profiles
       SET profile_photo_path = $1, updated_at = NOW()
       WHERE user_id = $2`,
      [relativeWebPath, userId]
    );

    return reply.send({
      success: true,
      message: 'تم رفع الصورة الشخصية بنجاح',
      data: {
        profilePhotoPath: relativeWebPath
      }
    });
  });

  // POST /api/v1/lawyers/me/documents (Private upload, syndicate card)
  fastify.post('/me/documents', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, role } = request.user as { userId: string; role: string };
    if (role !== 'lawyer' && role !== 'admin') {
      return reply.status(403).send({ success: false, error: 'مخصص للمحامين فقط' });
    }

    const lawyerRes = await query('SELECT id FROM lawyer_profiles WHERE user_id = $1', [userId]);
    if (lawyerRes.rows.length === 0) {
      return reply.status(404).send({ success: false, error: 'ملف المحامي غير موجود' });
    }
    const profileId = lawyerRes.rows[0].id;

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ success: false, error: 'لم يتم إرسال الملف' });
    }

    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMime.includes(data.mimetype)) {
      return reply.status(400).send({ success: false, error: 'نوع الملف غير مدعوم، يرجى رفع صورة أو ملف PDF' });
    }

    const ext = path.extname(data.filename) || (data.mimetype === 'application/pdf' ? '.pdf' : '.jpg');
    const secretStorageName = `doc_${crypto.randomBytes(24).toString('hex')}${ext}`;
    const secretStoragePath = path.join(config.privateStoragePath, secretStorageName);

    // Stream file to private storage
    await pipeline(data.file, fs.createWriteStream(secretStoragePath));

    const stats = fs.statSync(secretStoragePath);

    // Save record in database
    const docRes = await withTransaction(async (client) => {
      // Mark previous syndicate cards as not current
      await client.query(
        `UPDATE lawyer_documents
         SET is_current = FALSE
         WHERE lawyer_profile_id = $1 AND document_type = 'syndicate_card'`,
        [profileId]
      );

      const inserted = await client.query(
        `INSERT INTO lawyer_documents (lawyer_profile_id, document_type, storage_path, original_filename, mime_type, file_size, is_current)
         VALUES ($1, 'syndicate_card', $2, $3, $4, $5, TRUE)
         RETURNING id, document_type, original_filename, mime_type, file_size, uploaded_at`,
        [profileId, secretStoragePath, data.filename, data.mimetype, stats.size]
      );
      return inserted.rows[0];
    });

    return reply.status(201).send({
      success: true,
      message: 'تم رفع صورة كارنيه المحاماة بنجاح في المسار المحمي',
      data: docRes
    });
  });

  // GET /api/v1/documents/:id (Secure private document download)
  fastify.get('/documents/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, role } = request.user as { userId: string; role: string };
    const { id } = request.params as { id: string };

    const docRes = await query(
      `SELECT d.id, d.storage_path, d.mime_type, d.original_filename, lp.user_id
       FROM lawyer_documents d
       JOIN lawyer_profiles lp ON d.lawyer_profile_id = lp.id
       WHERE d.id = $1`,
      [id]
    );

    if (docRes.rows.length === 0) {
      return reply.status(404).send({ success: false, error: 'المستند غير موجود' });
    }

    const doc = docRes.rows[0];

    // Authorization check: Must be the owner lawyer or an admin
    if (role !== 'admin' && doc.user_id !== userId) {
      return reply.status(403).send({ success: false, error: 'غير مصرح لك بعرض هذا المستند الخاص' });
    }

    if (!fs.existsSync(doc.storage_path)) {
      return reply.status(404).send({ success: false, error: 'الملف غير موجود على السيرفر' });
    }

    const fileStream = fs.createReadStream(doc.storage_path);
    reply.header('Content-Type', doc.mime_type);
    reply.header('Content-Disposition', `inline; filename="${encodeURIComponent(doc.original_filename)}"`);
    return reply.send(fileStream);
  });
}
