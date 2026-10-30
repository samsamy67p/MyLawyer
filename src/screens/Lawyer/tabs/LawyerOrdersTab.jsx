import React, { useState } from 'react';
import {
  MapPin,
  Check,
  X,
  CheckCircle2,
  Calendar,
  User,
  CheckSquare,
  FileText,
  Coins,
  ShieldAlert,
} from 'lucide-react';

export default function LawyerOrdersTab({
  ordersList,
  onAcceptOrder,
  onRejectOrder,
  onCompleteOrder,
}) {
  const [ordersFilter, setOrdersFilter] = useState('ALL'); // 'ALL' | 'INCOMING' | 'ACTIVE' | 'COMPLETED'

  const filteredOrders = ordersList.filter((o) => {
    if (ordersFilter === 'ALL') return true;
    return o.status === ordersFilter;
  });

  const handleOpenMapLocation = (order) => {
    const query = encodeURIComponent(order.specialty || order.serviceTitle || 'القاهرة');
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="orders-main-content">
      {/* فلتر تصنيف الطلبات */}
      <div className="orders-filter-row">
        <button
          type="button"
          className={`orders-filter-pill ${ordersFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setOrdersFilter('ALL')}
        >
          <span>الكل</span>
          <span className="filter-count-badge">{ordersList.length}</span>
        </button>
        <button
          type="button"
          className={`orders-filter-pill ${ordersFilter === 'INCOMING' ? 'active' : ''}`}
          onClick={() => setOrdersFilter('INCOMING')}
        >
          <span>الواردة</span>
          <span className="filter-count-badge">
            {ordersList.filter((o) => o.status === 'INCOMING').length}
          </span>
        </button>
        <button
          type="button"
          className={`orders-filter-pill ${ordersFilter === 'ACTIVE' ? 'active' : ''}`}
          onClick={() => setOrdersFilter('ACTIVE')}
        >
          <span>الجارية</span>
          <span className="filter-count-badge">
            {ordersList.filter((o) => o.status === 'ACTIVE').length}
          </span>
        </button>
        <button
          type="button"
          className={`orders-filter-pill ${ordersFilter === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => setOrdersFilter('COMPLETED')}
        >
          <span>المكتملة</span>
          <span className="filter-count-badge">
            {ordersList.filter((o) => o.status === 'COMPLETED').length}
          </span>
        </button>
      </div>

      {/* قائمة بطاقات الطلبات المنسقة */}
      <div className="orders-cards-list">
        {filteredOrders.map((order) => (
          <div key={order.id} className="lawyer-order-card">
            <div className="lawyer-order-content">
              {/* قائمة بيانات الطلب: كل معلومة في سطر منفصل ومنسق */}
              <div className="lawyer-order-rows">
                {/* 1. السطر الأول: رقم الطلب وحالته المباشرة */}
                <div className="flex items-center justify-between text-right border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500">رقم الطلب:</span>
                    <span className="text-sm font-bold text-[#1D4ED8] tracking-wider">#{order.id}</span>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      order.status === 'COMPLETED'
                        ? 'text-emerald-600'
                        : order.status === 'ACTIVE'
                        ? 'text-amber-600'
                        : order.status === 'CANCELLED'
                        ? 'text-rose-600'
                        : 'text-[#1D4ED8]'
                    }`}
                  >
                    {order.statusLabel}
                  </span>
                </div>

                {/* 2. السطر الثاني: تاريخ ووقت الطلب */}
                <div className="lawyer-order-row-item">
                  <span className="lawyer-order-row-label">
                    <Calendar size={13} className="text-[#1D4ED8]" />
                    <span>تاريخ ووقت الطلب</span>
                  </span>
                  <span className="lawyer-order-row-value">{order.date}</span>
                </div>

                {/* 3. السطر الثالث: الخدمة المطلوبة */}
                <div className="lawyer-order-row-item">
                  <span className="lawyer-order-row-label">
                    <ShieldAlert size={13} className="text-[#1D4ED8]" />
                    <span>الخدمة</span>
                  </span>
                  <span className="lawyer-order-row-value lawyer-order-row-value-primary">
                    {order.serviceTitle || 'محاميك حالاً'}
                  </span>
                </div>

                {/* 4. السطر الرابع: اسم الموكل */}
                <div className="lawyer-order-row-item">
                  <span className="lawyer-order-row-label">
                    <User size={13} className="text-[#1D4ED8]" />
                    <span>الموكل</span>
                  </span>
                  <span className="lawyer-order-row-value lawyer-order-row-value-highlight">
                    {order.clientName}
                  </span>
                </div>

                {/* 5. السطر الخامس: الاختيار الذي اختاره الموكل عند طلب الخدمة */}
                {(order.clientChoice || order.specialty) && (
                  <div className="lawyer-order-row-item">
                    <span className="lawyer-order-row-label">
                      <CheckSquare size={13} className="text-[#1D4ED8]" />
                      <span>اختيار الموكل</span>
                    </span>
                    <span className="lawyer-order-row-value text-slate-800 font-semibold">
                      {order.clientChoice || order.specialty}
                    </span>
                  </div>
                )}

                {/* 6. السطر السادس: نص المشكلة التي كتبها الموكل */}
                {order.problemDescription && (
                  <div className="lawyer-order-row-item">
                    <span className="lawyer-order-row-label">
                      <FileText size={13} className="text-[#1D4ED8]" />
                      <span>نص المشكلة المكتوبة من الموكل</span>
                    </span>
                    <p className="lawyer-order-row-value-desc m-0">
                      {order.problemDescription}
                    </p>
                  </div>
                )}

                {/* 7. السطر السابع: الأتعاب */}
                <div className="lawyer-order-row-item pt-1">
                  <span className="lawyer-order-row-label">
                    <Coins size={13} className="text-[#1D4ED8]" />
                    <span>الأتعاب المستحقة</span>
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="lawyer-order-row-value-price">{order.price}</span>
                    <span className="text-xs font-bold text-slate-500">ج.م (أتعاب فورية)</span>
                  </div>
                </div>
              </div>

              {/* 8. السطر الثامن: أزرار الإجراءات وحالة إنجاز أو إلغاء الطلب */}
              <div className="lawyer-order-actions-grid">
                {/* 1. إذا كان طلب جديد: إظهار فتح الخريطة، قبول، اعتذار */}
                {order.status === 'INCOMING' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenMapLocation(order)}
                      className="lawyer-order-btn lawyer-order-btn-map"
                    >
                      <MapPin size={14} />
                      <span>فتح الخريطة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onAcceptOrder?.(order.id)}
                      className="lawyer-order-btn lawyer-order-btn-accept"
                    >
                      <Check size={14} />
                      <span>قبول</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRejectOrder?.(order.id)}
                      className="lawyer-order-btn lawyer-order-btn-reject"
                    >
                      <X size={14} />
                      <span>اعتذار</span>
                    </button>
                  </>
                )}

                {/* 2. إذا كان قيد التنفيذ: إظهار إنهاء المهمة */}
                {order.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => onCompleteOrder?.(order.id, order.price)}
                    className="lawyer-order-btn lawyer-order-btn-complete"
                  >
                    <CheckCircle2 size={14} />
                    <span>إنهاء المهمة</span>
                  </button>
                )}

                {/* 3. بعد الإنهاء: تمييز الطلب أنه منجز (تم إنجاز الطلب) */}
                {order.status === 'COMPLETED' && (
                  <div className="lawyer-order-status-completed">
                    <CheckCircle2 size={14} />
                    <span>تم إنجاز الطلب</span>
                  </div>
                )}

                {/* 4. إذا كان ملغي: إظهار أنه ملغي */}
                {order.status === 'CANCELLED' && (
                  <div className="lawyer-order-status-cancelled">
                    <X size={14} />
                    <span>تم إلغاء الطلب</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="bg-white p-8 rounded-[7px] border border-slate-200 text-center shadow-xs">
            <p className="text-xs text-slate-500 m-0">لا توجد طلبات في هذا القسم حالياً</p>
          </div>
        )}
      </div>
    </main>
  );
}
