import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query, withTransaction } from '../../database/index.js';
import { sanitizeText } from '../../utils/security.js';

export async function adminRoutes(fastify: FastifyInstance) {
  // Strict admin authorization hook
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const { role } = request.user as { role: string };
      if (role !== 'admin') {
        return reply.status(403).send({ success: false, error: 'غير مصرح: هذه العمليات تتطلب صلاحيات إدارة النظام' });
      }
    } catch {
      return reply.status(401).send({ success: false, error: 'غير مصرح: يرجى تسجيل الدخول كمسؤول' });
    }
  });

  // GET /api/v1/admin/lawyers/pending
  fastify.get('/lawyers/pending', async (_request: FastifyRequest, reply: FastifyReply) => {
    const res = await query(
      `SELECT lp.id as profile_id, lp.full_name, lp.syndicate_number, lp.submitted_at, lp.profile_photo_path,
              u.id as user_id, u.email, u.phone, u.status,
              (SELECT id FROM lawyer_documents ld WHERE ld.lawyer_profile_id = lp.id AND ld.is_current = TRUE LIMIT 1) as document_id
       FROM lawyer_profiles lp
       JOIN users u ON lp.user_id = u.id
       WHERE lp.approval_status = 'pending'
       ORDER BY lp.submitted_at ASC`
    );

    return reply.send({
      success: true,
      data: res.rows
    });
  });

  // POST /api/v1/admin/lawyers/:id/decision
  fastify.post('/lawyers/:id/decision', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId: adminId } = request.user as { userId: string };
    const { id } = request.params as { id: string };
    const { decision, reason } = request.body as { decision: 'approved' | 'rejected' | 'suspended' | 'reactivated'; reason?: string };

    if (!['approved', 'rejected', 'suspended', 'reactivated'].includes(decision)) {
      return reply.status(400).send({ success: false, error: 'القرار غير صالح' });
    }

    const lawyerRes = await query('SELECT id, user_id FROM lawyer_profiles WHERE id = $1', [id]);
    if (lawyerRes.rows.length === 0) {
      return reply.status(404).send({ success: false, error: 'ملف المحامي غير موجود' });
    }
    const lawyer = lawyerRes.rows[0];

    const cleanReason = reason ? sanitizeText(reason, 1000) : null;
    let targetUserStatus = 'pending_admin_approval';
    let targetProfileStatus = 'pending';

    if (decision === 'approved' || decision === 'reactivated') {
      targetUserStatus = 'active';
      targetProfileStatus = 'approved';
    } else if (decision === 'rejected') {
      targetUserStatus = 'rejected';
      targetProfileStatus = 'rejected';
    } else if (decision === 'suspended') {
      targetUserStatus = 'suspended';
      targetProfileStatus = 'suspended';
    }

    await withTransaction(async (client) => {
      // Update lawyer profile
      await client.query(
        `UPDATE lawyer_profiles
         SET approval_status = $1::lawyer_approval_status,
             approved_at = CASE WHEN $1::text = 'approved' THEN NOW() ELSE approved_at END,
             rejected_at = CASE WHEN $1::text = 'rejected' THEN NOW() ELSE rejected_at END,
             rejection_reason = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [targetProfileStatus, cleanReason, id]
      );

      // Update user status
      await client.query(
        'UPDATE users SET status = $1::user_status, updated_at = NOW() WHERE id = $2',
        [targetUserStatus, lawyer.user_id]
      );

      // Audit history
      await client.query(
        `INSERT INTO lawyer_approval_history (lawyer_profile_id, action, reason, admin_user_id)
         VALUES ($1, $2::approval_action_type, $3, $4)`,
        [id, decision, cleanReason, adminId]
      );
    });

    return reply.send({
      success: true,
      message: `تم اتخاذ القرار (${decision}) بنجاح لحساب المحامي`
    });
  });
}
