import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query, withTransaction } from '../../database/index.js';
import { sanitizeText } from '../../utils/security.js';

interface AuthenticatedUser {
  userId: string;
  role: 'client' | 'lawyer' | 'admin';
}

export async function orderRoutes(fastify: FastifyInstance) {
  // Authentication hook for all order endpoints
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ success: false, error: 'غير مصرح: يرجى تسجيل الدخول' });
    }
  });

  // 1. POST /api/v1/orders - Create a new service order
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as AuthenticatedUser;

    const body = request.body as {
      lawyerId?: string;
      serviceType?: string;
      serviceTitle?: string;
      problemType?: string;
      problemDescription?: string;
      clientLat?: number;
      clientLon?: number;
      clientAddress?: string;
      price?: number;
    };

    if (!body.lawyerId) {
      return reply.status(400).send({ success: false, error: 'يجب تحديد المحامي المطلوب' });
    }

    if (!body.problemDescription || body.problemDescription.trim().length === 0) {
      return reply.status(400).send({ success: false, error: 'يرجى كتابة وصف تفصيلي للمشكلة أو المهمة' });
    }

    const clientLat = Number(body.clientLat);
    const clientLon = Number(body.clientLon);
    if (!Number.isFinite(clientLat) || !Number.isFinite(clientLon)) {
      return reply.status(400).send({ success: false, error: 'إحداثيات موقع العميل غير صالحة' });
    }

    // Verify target lawyer exists, is active, approved, and available
    const lawyerRes = await query(
      `SELECT u.id as user_id, u.status, lp.full_name, lp.approval_status, lp.is_available, lp.latitude, lp.longitude
       FROM users u
       JOIN lawyer_profiles lp ON u.id = lp.user_id
       WHERE u.id = $1 AND u.role = 'lawyer'`,
      [body.lawyerId]
    );

    if (lawyerRes.rows.length === 0) {
      return reply.status(404).send({ success: false, error: 'المحامي المحدد غير موجود' });
    }

    const targetLawyer = lawyerRes.rows[0];
    if (targetLawyer.approval_status !== 'approved' || targetLawyer.status !== 'active') {
      return reply.status(400).send({ success: false, error: 'عذراً، المحامي المحدد ليس في حالة نشطة ومعتمدة حالياً' });
    }

    // Generate unique order number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${randomSuffix}`;

    const cleanServiceTitle = sanitizeText(body.serviceTitle || 'محاميك حالاً', 255);
    const cleanProblemType = body.problemType ? sanitizeText(body.problemType, 100) : null;
    const cleanDescription = sanitizeText(body.problemDescription, 3000);
    const cleanAddress = body.clientAddress ? sanitizeText(body.clientAddress, 500) : null;
    const finalPrice = Number(body.price) > 0 ? Number(body.price) : 350.00;

    const newOrder = await withTransaction(async (client) => {
      const orderRes = await client.query(
        `INSERT INTO service_orders (
          order_number, client_id, lawyer_id, service_type,
          service_title, problem_type, problem_description,
          client_latitude, client_longitude, client_address,
          lawyer_latitude, lawyer_longitude, price, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'PENDING')
        RETURNING *`,
        [
          orderNumber,
          userId,
          targetLawyer.user_id,
          body.serviceType || 'lawyer_now',
          cleanServiceTitle,
          cleanProblemType,
          cleanDescription,
          clientLat,
          clientLon,
          cleanAddress,
          targetLawyer.latitude,
          targetLawyer.longitude,
          finalPrice,
        ]
      );

      const createdOrder = orderRes.rows[0];

      await client.query(
        `INSERT INTO order_status_logs (order_id, changed_by_user_id, old_status, new_status, note)
         VALUES ($1, $2, NULL, 'PENDING', 'تم إنشاء الطلب بنجاح وإرساله للمحامي')`,
        [createdOrder.id, userId]
      );

      return createdOrder;
    });

    return reply.status(201).send({
      success: true,
      message: 'تم إرسال طلبك إلى المحامي بنجاح',
      data: {
        id: newOrder.id,
        orderNumber: newOrder.order_number,
        serviceTitle: newOrder.service_title,
        problemType: newOrder.problem_type,
        problemDescription: newOrder.problem_description,
        price: Number(newOrder.price),
        status: newOrder.status,
        createdAt: newOrder.created_at,
        lawyer: {
          id: targetLawyer.user_id,
          name: targetLawyer.full_name,
        }
      }
    });
  });

  // 2. GET /api/v1/orders - List orders for current user (client or lawyer)
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, role } = request.user as AuthenticatedUser;
    const queryParams = request.query as { status?: string };
    const statusFilter = queryParams.status ? queryParams.status.toUpperCase() : 'ALL';

    let sql = `
      SELECT o.*,
             u_client.phone as client_phone,
             u_client.email as client_email,
             COALESCE(u_client.phone, 'موكل') as client_name,
             u_lawyer.phone as lawyer_phone,
             lp.full_name as lawyer_name,
             lp.profile_photo_path as lawyer_avatar,
             lp.specialty as lawyer_specialty,
             lp.rating as lawyer_rating
      FROM service_orders o
      JOIN users u_client ON o.client_id = u_client.id
      JOIN users u_lawyer ON o.lawyer_id = u_lawyer.id
      JOIN lawyer_profiles lp ON u_lawyer.id = lp.user_id
    `;

    const params: any[] = [userId];

    if (role === 'lawyer') {
      sql += ` WHERE o.lawyer_id = $1`;
    } else if (role === 'client') {
      sql += ` WHERE o.client_id = $1`;
    } else {
      // admin can view all
      sql = sql.replace('WHERE o.client_id = $1', '');
      params.pop();
    }

    if (statusFilter !== 'ALL') {
      if (params.length > 0) {
        params.push(statusFilter);
        sql += ` AND o.status = $${params.length}`;
      } else {
        params.push(statusFilter);
        sql += ` WHERE o.status = $1`;
      }
    }

    sql += ` ORDER BY o.created_at DESC LIMIT 100`;

    const res = await query(sql, params);

    const formattedOrders = res.rows.map((o) => {
      let statusLabel = 'طلب وارد';
      if (o.status === 'PENDING') statusLabel = 'قيد انتظار الموافقة';
      else if (o.status === 'ACCEPTED') statusLabel = 'تم قبول الطلب';
      else if (o.status === 'ACTIVE') statusLabel = 'جاري التنفيذ';
      else if (o.status === 'COMPLETED') statusLabel = 'مكتمل بنجاح';
      else if (o.status === 'CANCELLED') statusLabel = 'تم الإلغاء';
      else if (o.status === 'REJECTED') statusLabel = 'تم الاعتذار';

      const createdAtDate = new Date(o.created_at);
      const formattedDate = createdAtDate.toLocaleDateString('ar-EG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      return {
        id: o.order_number,
        orderId: o.id,
        orderNumber: o.order_number,
        serviceTitle: o.service_title,
        clientName: o.client_name,
        clientPhone: o.client_phone,
        clientChoice: o.problem_type || o.service_title,
        problemDescription: o.problem_description,
        specialty: o.lawyer_specialty || 'محامٍ معتمد',
        lawyerName: o.lawyer_name,
        lawyerPhone: o.lawyer_phone,
        lawyerAvatar: o.lawyer_avatar,
        status: o.status,
        statusLabel,
        price: Number(o.price),
        date: formattedDate,
        createdAt: o.created_at,
        clientLatitude: Number(o.client_latitude),
        clientLongitude: Number(o.client_longitude),
        clientAddress: o.client_address,
        lawyerLatitude: o.lawyer_latitude ? Number(o.lawyer_latitude) : null,
        lawyerLongitude: o.lawyer_longitude ? Number(o.lawyer_longitude) : null,
        cancellationReason: o.cancellation_reason,
        rejectionReason: o.rejection_reason,
        acceptedAt: o.accepted_at,
        completedAt: o.completed_at,
      };
    });

    return reply.send({
      success: true,
      data: formattedOrders,
    });
  });

  // 3. GET /api/v1/orders/:id - Get single order details with ownership verification
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, role } = request.user as AuthenticatedUser;
    const { id } = request.params as { id: string };

    const orderRes = await query(
      `SELECT o.*,
              u_client.phone as client_phone,
              u_client.email as client_email,
              u_lawyer.phone as lawyer_phone,
              lp.full_name as lawyer_name,
              lp.profile_photo_path as lawyer_avatar,
              lp.specialty as lawyer_specialty
       FROM service_orders o
       JOIN users u_client ON o.client_id = u_client.id
       JOIN users u_lawyer ON o.lawyer_id = u_lawyer.id
       JOIN lawyer_profiles lp ON u_lawyer.id = lp.user_id
       WHERE o.id::text = $1 OR o.order_number = $1`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return reply.status(404).send({ success: false, error: 'الطلب غير موجود' });
    }

    const order = orderRes.rows[0];

    // Authorization check
    if (role !== 'admin' && order.client_id !== userId && order.lawyer_id !== userId) {
      return reply.status(403).send({ success: false, error: 'غير مصرح لك بعرض تفاصيل هذا الطلب' });
    }

    // Fetch audit trail logs
    const logsRes = await query(
      `SELECT l.id, l.old_status, l.new_status, l.note, l.created_at, u.phone as changed_by_phone
       FROM order_status_logs l
       JOIN users u ON l.changed_by_user_id = u.id
       WHERE l.order_id = $1
       ORDER BY l.created_at ASC`,
      [order.id]
    );

    return reply.send({
      success: true,
      data: {
        order,
        statusHistory: logsRes.rows,
      }
    });
  });

  // 4. POST /api/v1/orders/:id/accept - Lawyer accepts incoming order
  fastify.post('/:id/accept', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, role } = request.user as AuthenticatedUser;
    const { id } = request.params as { id: string };

    if (role !== 'lawyer' && role !== 'admin') {
      return reply.status(403).send({ success: false, error: 'قبول الطلبات مخصص للمحامي المعني فقط' });
    }

    const orderRes = await query(
      `SELECT * FROM service_orders WHERE (id::text = $1 OR order_number = $1) AND lawyer_id = $2`,
      [id, userId]
    );

    if (orderRes.rows.length === 0) {
      return reply.status(404).send({ success: false, error: 'الطلب غير موجود أو غير مسند إليك' });
    }

    const order = orderRes.rows[0];
    if (order.status !== 'PENDING') {
      return reply.status(400).send({
        success: false,
        error: `لا يمكن قبول الطلب؛ حالته الحالية: ${order.status}`,
      });
    }

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE service_orders
         SET status = 'ACCEPTED', accepted_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [order.id]
      );

      await client.query(
        `INSERT INTO order_status_logs (order_id, changed_by_user_id, old_status, new_status, note)
         VALUES ($1, $2, 'PENDING', 'ACCEPTED', 'وافق المحامي على تولي الطلب')`,
        [order.id, userId]
      );
    });

    return reply.send({
      success: true,
      message: 'تم قبول الطلب بنجاح',
      data: { orderId: order.id, status: 'ACCEPTED' },
    });
  });

  // 5. POST /api/v1/orders/:id/reject - Lawyer rejects incoming order
  fastify.post('/:id/reject', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, role } = request.user as AuthenticatedUser;
    const { id } = request.params as { id: string };
    const body = request.body as { reason?: string };

    if (role !== 'lawyer' && role !== 'admin') {
      return reply.status(403).send({ success: false, error: 'الاعتذار عن الطلبات مخصص للمحامي المعني فقط' });
    }

    const orderRes = await query(
      `SELECT * FROM service_orders WHERE (id::text = $1 OR order_number = $1) AND lawyer_id = $2`,
      [id, userId]
    );

    if (orderRes.rows.length === 0) {
      return reply.status(404).send({ success: false, error: 'الطلب غير موجود أو غير مسند إليك' });
    }

    const order = orderRes.rows[0];
    if (order.status !== 'PENDING') {
      return reply.status(400).send({
        success: false,
        error: `لا يمكن رفض الطلب؛ حالته الحالية: ${order.status}`,
      });
    }

    const cleanReason = body.reason ? sanitizeText(body.reason, 500) : 'المحامي غير متاح حالياً للمهمة';

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE service_orders
         SET status = 'REJECTED', rejection_reason = $1, updated_at = NOW()
         WHERE id = $2`,
        [cleanReason, order.id]
      );

      await client.query(
        `INSERT INTO order_status_logs (order_id, changed_by_user_id, old_status, new_status, note)
         VALUES ($1, $2, 'PENDING', 'REJECTED', $3)`,
        [order.id, userId, `اعتذر المحامي: ${cleanReason}`]
      );
    });

    return reply.send({
      success: true,
      message: 'تم تسجيل الاعتذار عن الطلب',
      data: { orderId: order.id, status: 'REJECTED' },
    });
  });

  // 6. POST /api/v1/orders/:id/confirm-payment - Client confirms payment and activates order
  fastify.post('/:id/confirm-payment', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as AuthenticatedUser;
    const { id } = request.params as { id: string };

    const orderRes = await query(
      `SELECT * FROM service_orders WHERE (id::text = $1 OR order_number = $1) AND client_id = $2`,
      [id, userId]
    );

    if (orderRes.rows.length === 0) {
      return reply.status(404).send({ success: false, error: 'الطلب غير موجود' });
    }

    const order = orderRes.rows[0];
    if (order.status !== 'ACCEPTED' && order.status !== 'PENDING') {
      return reply.status(400).send({
        success: false,
        error: `لا يمكن تأكيد الدفع في الحالة الحالية: ${order.status}`,
      });
    }

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE service_orders
         SET status = 'ACTIVE', updated_at = NOW()
         WHERE id = $1`,
        [order.id]
      );

      await client.query(
        `INSERT INTO order_status_logs (order_id, changed_by_user_id, old_status, new_status, note)
         VALUES ($1, $2, $3, 'ACTIVE', 'تم سداد الرسوم وبدء سريان المهمة')`,
        [order.id, userId, order.status]
      );
    });

    return reply.send({
      success: true,
      message: 'تم تأكيد الدفع وتفعيل الطلب بنجاح',
      data: { orderId: order.id, status: 'ACTIVE' },
    });
  });

  // 7. POST /api/v1/orders/:id/complete - Lawyer completes active order
  fastify.post('/:id/complete', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, role } = request.user as AuthenticatedUser;
    const { id } = request.params as { id: string };

    if (role !== 'lawyer' && role !== 'admin') {
      return reply.status(403).send({ success: false, error: 'إنهاء الطلبات مخصص للمحامي المعني فقط' });
    }

    const orderRes = await query(
      `SELECT * FROM service_orders WHERE (id::text = $1 OR order_number = $1) AND lawyer_id = $2`,
      [id, userId]
    );

    if (orderRes.rows.length === 0) {
      return reply.status(404).send({ success: false, error: 'الطلب غير موجود أو غير مسند إليك' });
    }

    const order = orderRes.rows[0];
    if (order.status !== 'ACTIVE' && order.status !== 'ACCEPTED') {
      return reply.status(400).send({
        success: false,
        error: `لا يمكن إتمام الطلب في حالته الحالية: ${order.status}`,
      });
    }

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE service_orders
         SET status = 'COMPLETED', completed_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [order.id]
      );

      await client.query(
        `INSERT INTO order_status_logs (order_id, changed_by_user_id, old_status, new_status, note)
         VALUES ($1, $2, $3, 'COMPLETED', 'تم إنهاء المهمة القانونية بنجاح')`,
        [order.id, userId, order.status]
      );
    });

    return reply.send({
      success: true,
      message: 'تم إتمام المهمة بنجاح، شكراً لجهودكم',
      data: { orderId: order.id, status: 'COMPLETED' },
    });
  });

  // 8. POST /api/v1/orders/:id/cancel - Client or Lawyer cancels order
  fastify.post('/:id/cancel', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, role } = request.user as AuthenticatedUser;
    const { id } = request.params as { id: string };
    const body = request.body as { reason?: string };

    const orderRes = await query(
      `SELECT * FROM service_orders WHERE (id::text = $1 OR order_number = $1)`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return reply.status(404).send({ success: false, error: 'الطلب غير موجود' });
    }

    const order = orderRes.rows[0];

    // Authorization
    if (role !== 'admin' && order.client_id !== userId && order.lawyer_id !== userId) {
      return reply.status(403).send({ success: false, error: 'غير مصرح لك بإلغاء هذا الطلب' });
    }

    if (order.status === 'COMPLETED') {
      return reply.status(400).send({ success: false, error: 'لا يمكن إلغاء طلب مكتمل بالفعل' });
    }
    if (order.status === 'CANCELLED') {
      return reply.status(400).send({ success: false, error: 'الطلب ملغى بالفعل مسبقاً' });
    }

    const cleanReason = body.reason ? sanitizeText(body.reason, 500) : 'تم الإلغاء بناءً على طلب المستخدم';

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE service_orders
         SET status = 'CANCELLED', cancelled_at = NOW(), cancellation_reason = $1, updated_at = NOW()
         WHERE id = $2`,
        [cleanReason, order.id]
      );

      await client.query(
        `INSERT INTO order_status_logs (order_id, changed_by_user_id, old_status, new_status, note)
         VALUES ($1, $2, $3, 'CANCELLED', $4)`,
        [order.id, userId, order.status, `تم الإلغاء: ${cleanReason}`]
      );
    });

    return reply.send({
      success: true,
      message: 'تم إلغاء الطلب بنجاح',
      data: { orderId: order.id, status: 'CANCELLED' },
    });
  });
}
