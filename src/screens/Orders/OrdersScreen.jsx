import React, { useState } from 'react';
import {
  MapPin,
  Phone,
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
  Clock,
  Ban,
  FileCheck,
} from 'lucide-react';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import emptyOrdersIllustration from '../../assets/undraw_done_erdp.svg';
import './OrdersScreen.css';

const CLIENT_ORDERS_DATA = [
  {
    id: 'ORD-8921',
    serviceTitle: 'محاميك حالاً',
    lawyerName: 'أ/ كريم الديب',
    lawyerPhone: '01012345678',
    specialty: 'حضور فوري وتحرير محضر إثبات حالة',
    clientChoice: 'قسم شرطة الدقي — تحرير محضر إثبات حالة',
    problemDescription: 'وقوع خلاف تجاري في المعرض ومحتاج حضور محامي فوري بالقسم لإنهاء المحضر والصلح.',
    status: 'ACTIVE',
    statusLabel: 'جاري التنفيذ',
    date: 'اليوم، 01:30 م',
    price: 350,
  },
  {
    id: 'ORD-7612',
    serviceTitle: 'محاميك حالاً',
    lawyerName: 'أ/ سارة المهدي',
    lawyerPhone: '01123456789',
    specialty: 'حضور تحقيق عاجل بالنيابة',
    clientChoice: 'نيابة العجوزة — تحقيق عاجل وطلب إخلاء سبيل',
    problemDescription: 'حضور جلسة تحقيق صباحية في نيابة العجوزة وتقديم أوراق الدفاع وطلب الإفراج.',
    status: 'COMPLETED',
    statusLabel: 'مكتمل بنجاح',
    date: '28 أكتوبر 2026',
    price: 600,
  },
  {
    id: 'ORD-6401',
    serviceTitle: 'محاميك حالاً',
    lawyerName: 'أ/ تامر الشناوي',
    lawyerPhone: '01234567890',
    specialty: 'إنهاء إجراء وتوثيق رسمي بالشهر العقاري',
    clientChoice: 'فرع توثيق الدقي — توثيق عقد وإصدار توكيل',
    problemDescription: 'إنهاء إجراءات تسجيل عقد وكالة تجارية واستخراج صورة رسمية موثقة.',
    status: 'COMPLETED',
    statusLabel: 'مكتمل بنجاح',
    date: '24 أكتوبر 2026',
    price: 500,
  },
];

export default function OrdersScreen({ activeNavTab = 'orders', onNavTabChange }) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  const [ordersList] = useState(CLIENT_ORDERS_DATA);

  const filteredOrders = ordersList.filter((order) => {
    if (filter === 'ALL') return true;
    return order.status === filter;
  });

  const handleOpenMapLocation = (order) => {
    const query = encodeURIComponent(order.clientChoice || order.specialty || 'القاهرة');
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="orders-screen-layout">
      <Header title="الطلبات" />

      <main className="orders-main-content flex-1 flex flex-col">
        {/* شريط فلاتر تصنيف الطلبات الموسع والقابل للتمرير الأفقي بالأيقونات (مطابق لواجهة المحامي) */}
        <div className="lawyer-orders-filter-scroll">
          <button
            type="button"
            className={`lawyer-filter-pill ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            <Layers size={15} />
            <span>الكل</span>
            <span className="lawyer-filter-count">{ordersList.length}</span>
          </button>

          <button
            type="button"
            className={`lawyer-filter-pill ${filter === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setFilter('ACTIVE')}
          >
            <Clock size={15} />
            <span>الجارية</span>
            <span className="lawyer-filter-count">
              {ordersList.filter((o) => o.status === 'ACTIVE').length}
            </span>
          </button>

          <button
            type="button"
            className={`lawyer-filter-pill ${filter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilter('COMPLETED')}
          >
            <CheckCircle2 size={15} />
            <span>المكتملة</span>
            <span className="lawyer-filter-count">
              {ordersList.filter((o) => o.status === 'COMPLETED').length}
            </span>
          </button>

          <button
            type="button"
            className={`lawyer-filter-pill ${filter === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => setFilter('CANCELLED')}
          >
            <Ban size={15} />
            <span>الملغية</span>
            <span className="lawyer-filter-count">
              {ordersList.filter((o) => o.status === 'CANCELLED').length}
            </span>
          </button>
        </div>

        {/* قائمة بطاقات الطلبات المنسقة أو الحالة الفارغة في منتصف الصفحة (مطابقة 100% لواجهة المحامي) */}
        <div
          className={`orders-cards-list ${
            filteredOrders.length === 0
              ? 'flex-1 flex flex-col justify-center items-center my-auto min-h-[50vh]'
              : ''
          }`}
        >
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

                    {/* 5. المحامي المكلف (خاصة بصلاحية الموكل) */}
                    <tr>
                      <th>
                        <div className="lawyer-order-table-label">
                          <User size={13} className="text-[#1D4ED8]" />
                          <span>المحامي</span>
                        </div>
                      </th>
                      <td className="font-bold text-slate-900">{order.lawyerName}</td>
                    </tr>

                    {/* 6. الاختيار الذي اختاره الموكل */}
                    {(order.clientChoice || order.specialty) && (
                      <tr>
                        <th>
                          <div className="lawyer-order-table-label">
                            <CheckSquare size={13} className="text-[#1D4ED8]" />
                            <span>اختيارك للخدمة</span>
                          </div>
                        </th>
                        <td className="text-slate-800">{order.clientChoice || order.specialty}</td>
                      </tr>
                    )}

                    {/* 7. نص المشكلة التي كتبها الموكل */}
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

                    {/* 8. الأتعاب */}
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

                {/* أزرار الإجراءات الخاصة بالموكل جنباً إلى جنب مع خط فاصل بشرط متقطعة */}
                <div className="lawyer-order-actions-grid">
                  {/* إجراءات الطلب الجاري للموكل: تتبع الخريطة والاتصال بالمحامي */}
                  {order.status === 'ACTIVE' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenMapLocation(order)}
                        className="lawyer-order-btn lawyer-order-btn-map"
                      >
                        <MapPin size={14} />
                        <span>موقع الإجراء</span>
                      </button>

                      {order.lawyerPhone && (
                        <a
                          href={`tel:${order.lawyerPhone}`}
                          className="lawyer-order-btn lawyer-order-btn-call"
                        >
                          <Phone size={14} />
                          <span>اتصال بالمحامي</span>
                        </a>
                      )}
                    </>
                  )}

                  {/* حالة الطلب المكتمل للموكل: تمييز بنجاح الإنجاز */}
                  {order.status === 'COMPLETED' && (
                    <div className="lawyer-order-status-completed">
                      <FileCheck size={14} />
                      <span>تم إنجاز الطلب بنجاح</span>
                    </div>
                  )}

                  {/* حالة الطلب الملغي للموكل */}
                  {order.status === 'CANCELLED' && (
                    <div className="lawyer-order-status-cancelled">
                      <Ban size={14} />
                      <span>تم إلغاء الطلب</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-6 px-4 select-none my-auto">
              <img
                src={emptyOrdersIllustration}
                alt="لا توجد طلبات"
                className="w-52 max-w-[70vw] h-auto max-h-48 mb-4 object-contain opacity-95 pointer-events-none"
              />
              <p className="text-sm font-semibold text-slate-500 m-0">
                لا توجد طلبات في هذا القسم حالياً
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav activeTab={activeNavTab} onTabChange={onNavTabChange} />
    </div>
  );
}

