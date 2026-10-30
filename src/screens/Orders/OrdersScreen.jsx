import React, { useState } from 'react';
import { Clock, CheckCircle2, ChevronLeft, Calendar } from 'lucide-react';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import './OrdersScreen.css';

const DUMMY_ORDERS = [
  {
    id: 'ORD-8921',
    serviceTitle: 'محاميك حالاً',
    lawyerName: 'أ/ كريم الديب',
    specialty: 'مدني وجنائي',
    status: 'IN_PROGRESS',
    statusLabel: 'جاري التنفيذ',
    date: '30 أكتوبر 2026',
    price: 350,
  },
  {
    id: 'ORD-7612',
    serviceTitle: 'استشارة هاتفية سريعة',
    lawyerName: 'أ/ سارة المهدي',
    specialty: 'شركات وعقود',
    status: 'COMPLETED',
    statusLabel: 'مكتمل',
    date: '28 أكتوبر 2026',
    price: 200,
  },
  {
    id: 'ORD-6401',
    serviceTitle: 'مراجعة وصياغة عقد',
    lawyerName: 'أ/ تامر الشناوي',
    specialty: 'عقارات وتعويضات',
    status: 'COMPLETED',
    statusLabel: 'مكتمل',
    date: '24 أكتوبر 2026',
    price: 500,
  },
];

export default function OrdersScreen({ activeNavTab = 'orders', onNavTabChange }) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED'

  const filteredOrders = DUMMY_ORDERS.filter((order) => {
    if (filter === 'ACTIVE') return order.status === 'IN_PROGRESS';
    if (filter === 'COMPLETED') return order.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="orders-screen-layout">
      <Header title="الطلبات" />

      <main className="orders-main-content">
        {/* Filter Pills */}
        <div className="orders-filter-row">
          <button
            type="button"
            className={`orders-filter-pill ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            <span>الكل</span>
            <span className="filter-count-badge">{DUMMY_ORDERS.length}</span>
          </button>
          <button
            type="button"
            className={`orders-filter-pill ${filter === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setFilter('ACTIVE')}
          >
            <span>الجارية</span>
            <span className="filter-count-badge">1</span>
          </button>
          <button
            type="button"
            className={`orders-filter-pill ${filter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilter('COMPLETED')}
          >
            <span>المكتملة</span>
            <span className="filter-count-badge">2</span>
          </button>
        </div>

        {/* Orders List */}
        <div className="orders-cards-list">
          {filteredOrders.map((order) => (
            <div key={order.id} className="order-card-item">
              <div className="order-card-top">
                <span className="order-id-badge">#{order.id}</span>
                <span
                  className={`order-status-tag ${
                    order.status === 'IN_PROGRESS' ? 'status-active' : 'status-done'
                  }`}
                >
                  {order.status === 'IN_PROGRESS' ? (
                    <Clock size={13} className="animate-spin text-amber-600" />
                  ) : (
                    <CheckCircle2 size={13} className="text-emerald-600" />
                  )}
                  <span>{order.statusLabel}</span>
                </span>
              </div>

              <div className="order-card-body">
                <h4 className="order-service-name">{order.serviceTitle}</h4>
                <div className="order-lawyer-line">
                  <span className="order-lawyer-name">{order.lawyerName}</span>
                  <span className="order-lawyer-dot">•</span>
                  <span className="order-lawyer-spec">{order.specialty}</span>
                </div>
              </div>

              <div className="order-card-footer">
                <div className="order-meta-info">
                  <span className="order-date-item">
                    <Calendar size={13} />
                    <span>{order.date}</span>
                  </span>
                  <span className="order-price-val">{order.price} ج.م</span>
                </div>
                <button type="button" className="order-view-details-btn">
                  <span>التفاصيل</span>
                  <ChevronLeft size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNav activeTab={activeNavTab} onTabChange={onNavTabChange} />
    </div>
  );
}

