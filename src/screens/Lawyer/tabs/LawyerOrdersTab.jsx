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
  Activity,
  Hash,
  Layers,
  Inbox,
  Clock,
  Ban,
} from 'lucide-react';
import emptyOrdersIllustration from '../../../assets/undraw_done_erdp.svg';

export default function LawyerOrdersTab({
  ordersList,
  onAcceptOrder,
  onRejectOrder,
  onCompleteOrder,
}) {
  const [ordersFilter, setOrdersFilter] = useState('ALL'); // 'ALL' | 'INCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

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
      {/* فلتر تصنيف الطلبات الموسع والقابل للتمرير الأفقي المريح بالأيقونات */}
      <div className="lawyer-orders-filter-scroll">
        <button
          type="button"
          className={`lawyer-filter-pill ${ordersFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setOrdersFilter('ALL')}
        >
          <Layers size={15} />
          <span>الكل</span>
          <span className="lawyer-filter-count">{ordersList.length}</span>
        </button>
        <button
          type="button"
          className={`lawyer-filter-pill ${ordersFilter === 'INCOMING' ? 'active' : ''}`}
          onClick={() => setOrdersFilter('INCOMING')}
        >
          <Inbox size={15} />
          <span>الواردة</span>
          <span className="lawyer-filter-count">
            {ordersList.filter((o) => o.status === 'INCOMING').length}
          </span>
        </button>
        <button
          type="button"
          className={`lawyer-filter-pill ${ordersFilter === 'ACTIVE' ? 'active' : ''}`}
          onClick={() => setOrdersFilter('ACTIVE')}
        >
          <Clock size={15} />
          <span>الجارية</span>
          <span className="lawyer-filter-count">
            {ordersList.filter((o) => o.status === 'ACTIVE').length}
          </span>
        </button>
        <button
          type="button"
          className={`lawyer-filter-pill ${ordersFilter === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => setOrdersFilter('COMPLETED')}
        >
          <CheckCircle2 size={15} />
          <span>المكتملة</span>
          <span className="lawyer-filter-count">
            {ordersList.filter((o) => o.status === 'COMPLETED').length}
          </span>
        </button>
        <button
          type="button"
          className={`lawyer-filter-pill ${ordersFilter === 'CANCELLED' ? 'active' : ''}`}
          onClick={() => setOrdersFilter('CANCELLED')}
        >
          <Ban size={15} />
          <span>الملغية</span>
          <span className="lawyer-filter-count">
            {ordersList.filter((o) => o.status === 'CANCELLED').length}
          </span>
        </button>
      </div>

      {/* قائمة بطاقات الطلبات المنسقة */}
      <div className="orders-cards-list">
        {filteredOrders.map((order) => (
          <div key={order.id} className="lawyer-order-card">
            <div className="lawyer-order-content">
              {/* جدول تفاصيل الطلب المتناسق */}
              <table className="lawyer-order-table">
                <tbody>
                  {/* 1. حالة الطلب */}
                  <tr>
                    <th>
                      <div className="lawyer-order-table-label">
                        <Activity size={13} className="text-[#1D4ED8]" />
                        <span>حالة الطلب</span>
                      </div>
                    </th>
                    <td>
                      <span
                        className={`font-bold text-xs ${
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
                    </td>
                  </tr>

                  {/* 2. رقم الطلب */}
                  <tr>
                    <th>
                      <div className="lawyer-order-table-label">
                        <Hash size={13} className="text-[#1D4ED8]" />
                        <span>رقم الطلب</span>
                      </div>
                    </th>
                    <td>
                      <span className="font-bold text-slate-800 tracking-wider">#{order.id}</span>
                    </td>
                  </tr>

                  {/* 3. تاريخ ووقت الطلب */}
                  <tr>
                    <th>
                      <div className="lawyer-order-table-label">
                        <Calendar size={13} className="text-[#1D4ED8]" />
                        <span>تاريخ ووقت الطلب</span>
                      </div>
                    </th>
                    <td className="text-slate-700">{order.date}</td>
                  </tr>

                  {/* 4. الخدمة الرئيسية */}
                  <tr>
                    <th>
                      <div className="lawyer-order-table-label">
                        <ShieldAlert size={13} className="text-[#1D4ED8]" />
                        <span>الخدمة</span>
                      </div>
                    </th>
                    <td className="font-bold text-[#1D4ED8]">
                      محاميك حالاً
                    </td>
                  </tr>

                  {/* 4. الموكل */}
                  <tr>
                    <th>
                      <div className="lawyer-order-table-label">
                        <User size={13} className="text-[#1D4ED8]" />
                        <span>الموكل</span>
                      </div>
                    </th>
                    <td className="font-bold text-slate-900">{order.clientName}</td>
                  </tr>

                  {/* 5. الاختيار الذي اختاره الموكل */}
                  {(order.clientChoice || order.specialty) && (
                    <tr>
                      <th>
                        <div className="lawyer-order-table-label">
                          <CheckSquare size={13} className="text-[#1D4ED8]" />
                          <span>اختيار الموكل</span>
                        </div>
                      </th>
                      <td className="text-slate-800">{order.clientChoice || order.specialty}</td>
                    </tr>
                  )}

                  {/* 6. نص المشكلة التي كتبها الموكل */}
                  {order.problemDescription && (
                    <tr>
                      <th>
                        <div className="lawyer-order-table-label">
                          <FileText size={13} className="text-[#1D4ED8]" />
                          <span>نص المشكلة</span>
                        </div>
                      </th>
                      <td className="text-slate-700 leading-relaxed font-normal text-[12.5px]">
                        {order.problemDescription}
                      </td>
                    </tr>
                  )}

                  {/* 7. الأتعاب */}
                  <tr>
                    <th>
                      <div className="lawyer-order-table-label">
                        <Coins size={13} className="text-[#1D4ED8]" />
                        <span>الأتعاب</span>
                      </div>
                    </th>
                    <td>
                      <div className="inline-flex items-baseline justify-center gap-1">
                        <span className="text-base font-extrabold text-[#1D4ED8]">{order.price}</span>
                        <span className="text-xs font-bold text-slate-500">ج.م (أتعاب فورية)</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

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
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 select-none">
            <img
              src={emptyOrdersIllustration}
              alt="لا توجد طلبات"
              className="w-48 h-auto max-h-40 mb-4 object-contain opacity-95 pointer-events-none"
            />
            <p className="text-sm font-semibold text-slate-500 m-0">
              لا توجد طلبات في هذا القسم حالياً
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
