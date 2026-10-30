import React, { useState } from 'react';
import {
  MapPin,
  Check,
  X,
  Phone,
  CheckCircle2,
  Zap,
  Calendar,
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
            {/* محتوى البطاقة المنظم */}
            <div className="lawyer-order-content">
              {/* 1. أعلى البطاقة: رقم الطلب دون حاوية مع التاريخ والحالة */}
              <div className="flex items-center justify-between text-right">
                <span className="text-sm font-bold text-slate-700 tracking-wide">
                  #{order.id}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{order.date}</span>
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      order.status === 'COMPLETED'
                        ? 'text-emerald-600'
                        : order.status === 'ACTIVE'
                        ? 'text-amber-600'
                        : 'text-[#1D4ED8]'
                    }`}
                  >
                    {order.statusLabel}
                  </span>
                </div>
              </div>

              {/* 2. جسم البطاقة: الأيقونة الدائرية، اسم الخدمة، اسم الموكل، والسعر */}
              <div className="flex items-start justify-between gap-3 pt-1">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* الأيقونة الدائرية المتناسقة مع هوية التطبيق */}
                  <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-[#1D4ED8]">
                    <Zap size={18} />
                  </div>

                  {/* نصوص الخدمة والموكل والتفاصيل */}
                  <div className="flex flex-col gap-1 text-right min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 m-0 leading-snug">
                      محاميك حالاً
                    </h4>
                    <p className="text-xs font-semibold text-slate-700 m-0">
                      الموكل: {order.clientName}
                    </p>
                    <p className="text-[11px] text-slate-500 m-0 line-clamp-1">
                      {order.specialty}
                    </p>
                  </div>
                </div>

                {/* السعر المالي البارز */}
                <div className="shrink-0 text-left flex flex-col items-end justify-center pl-1">
                  <span className="text-base sm:text-lg font-bold text-[#1D4ED8] leading-none">
                    {order.price} ج.م
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-medium">أتعاب فورية</span>
                </div>
              </div>

              {/* 3. شريط الأزرار المنسقة والموحدة مع إطار متقطع (Dashed Border) */}
              <div className="lawyer-order-actions">
                {/* زر فتح الخريطة */}
                <button
                  type="button"
                  onClick={() => handleOpenMapLocation(order)}
                  className="lawyer-order-btn lawyer-order-btn-map"
                >
                  <MapPin size={14} />
                  <span>فتح الخريطة</span>
                </button>

                {/* أزرار الحالات الخاصة بالطلب */}
                {order.status === 'INCOMING' && (
                  <>
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

                {order.status === 'ACTIVE' && (
                  <>
                    <a
                      href={`tel:${order.clientPhone}`}
                      className="lawyer-order-btn lawyer-order-btn-call"
                    >
                      <Phone size={14} />
                      <span>اتصال بالموكل</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onCompleteOrder?.(order.id, order.price)}
                      className="lawyer-order-btn lawyer-order-btn-complete"
                    >
                      <CheckCircle2 size={14} />
                      <span>إنهاء الإجراء</span>
                    </button>
                  </>
                )}

                {order.status === 'COMPLETED' && (
                  <div className="lawyer-order-status-completed">
                    <CheckCircle2 size={14} />
                    <span>تم إنجاز الطلب بنجاح</span>
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
