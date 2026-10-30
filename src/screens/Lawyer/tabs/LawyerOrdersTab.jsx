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
import { Button } from '../../../components/ui/Button';

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

      {/* قائمة بطاقات الطلبات المنسقة بستيل الـ Wave المناسب لألوان التطبيق */}
      <div className="orders-cards-list">
        {filteredOrders.map((order) => (
          <div key={order.id} className="lawyer-order-card">
            {/* الخلفية الجمالية المنحنية (Wave SVG) المتوافقة مع ألوان هوية التطبيق الزرقاء */}
            <svg
              className="lawyer-order-wave"
              viewBox="0 0 1440 320"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M0,256L11.4,240C22.9,224,46,192,69,192C91.4,192,114,224,137,234.7C160,245,183,235,206,213.3C228.6,192,251,160,274,149.3C297.1,139,320,149,343,181.3C365.7,213,389,267,411,282.7C434.3,299,457,277,480,250.7C502.9,224,526,192,549,181.3C571.4,171,594,181,617,208C640,235,663,277,686,256C708.6,235,731,149,754,122.7C777.1,96,800,128,823,165.3C845.7,203,869,245,891,224C914.3,203,937,117,960,112C982.9,107,1006,181,1029,197.3C1051.4,213,1074,171,1097,144C1120,117,1143,107,1166,133.3C1188.6,160,1211,224,1234,218.7C1257.1,213,1280,139,1303,133.3C1325.7,128,1349,192,1371,192C1394.3,192,1417,128,1429,96L1440,64L1440,320L1428.6,320C1417.1,320,1394,320,1371,320C1348.6,320,1326,320,1303,320C1280,320,1257,320,1234,320C1211.4,320,1189,320,1166,320C1142.9,320,1120,320,1097,320C1074.3,320,1051,320,1029,320C1005.7,320,983,320,960,320C937.1,320,914,320,891,320C868.6,320,846,320,823,320C800,320,777,320,754,320C731.4,320,709,320,686,320C662.9,320,640,320,617,320C594.3,320,571,320,549,320C525.7,320,503,320,480,320C457.1,320,434,320,411,320C388.6,320,366,320,343,320C320,320,297,320,274,320C251.4,320,229,320,206,320C182.9,320,160,320,137,320C114.3,320,91,320,69,320C45.7,320,23,320,11,320L0,320Z"
                fill="#1D4ED8"
                fillOpacity={0.08}
              />
            </svg>

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
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-[5px] ${
                      order.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : order.status === 'ACTIVE'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-blue-50 text-[#1D4ED8] border border-blue-100'
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

              {/* 3. شريط الأزرار المنسقة: فتح الخريطة، قبول، اعتذار */}
              <div className="flex items-center gap-2 pt-2.5 mt-1 border-t border-slate-100 flex-wrap">
                {/* زر فتح الخريطة المنسق بالأيقونة */}
                <button
                  type="button"
                  onClick={() => handleOpenMapLocation(order)}
                  className="h-8 px-3 rounded-[6px] text-xs font-bold bg-blue-50 text-[#1D4ED8] hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 transition-all"
                >
                  <MapPin size={13} />
                  <span>فتح الخريطة</span>
                </button>

                {/* أزرار الحالات الخاصة بالطلب */}
                {order.status === 'INCOMING' && (
                  <>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => onAcceptOrder?.(order.id)}
                      className="h-8 px-3.5 text-xs font-bold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-[6px] flex items-center gap-1.5 shadow-xs"
                    >
                      <Check size={13} />
                      <span>قبول</span>
                    </Button>

                    <button
                      type="button"
                      onClick={() => onRejectOrder?.(order.id)}
                      className="h-8 px-3 rounded-[6px] text-xs font-bold bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 flex items-center gap-1 transition-all"
                    >
                      <X size={13} />
                      <span>اعتذار</span>
                    </button>
                  </>
                )}

                {order.status === 'ACTIVE' && (
                  <>
                    <a
                      href={`tel:${order.clientPhone}`}
                      className="h-8 px-3 rounded-[6px] text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 transition-all"
                    >
                      <Phone size={13} />
                      <span>اتصال بالموكل</span>
                    </a>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => onCompleteOrder?.(order.id, order.price)}
                      className="h-8 px-3.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-[6px] flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 size={13} />
                      <span>إنهاء الإجراء</span>
                    </Button>
                  </>
                )}

                {order.status === 'COMPLETED' && (
                  <div className="mr-auto flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-[5px] border border-emerald-200">
                    <CheckCircle2 size={13} />
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
