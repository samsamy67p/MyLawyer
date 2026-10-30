import React, { useState } from 'react';
import { Clock, CheckCircle2, Calendar, ChevronLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export default function LawyerOrdersTab({
  ordersList,
  onAcceptOrder,
  onRejectOrder,
  onCompleteOrder,
}) {
  const [ordersFilter, setOrdersFilter] = useState('INCOMING'); // 'ALL' | 'INCOMING' | 'ACTIVE' | 'COMPLETED'

  const filteredOrders = ordersList.filter((o) => {
    if (ordersFilter === 'ALL') return true;
    return o.status === ordersFilter;
  });

  return (
    <main className="orders-main-content">
      {/* Filter Pills matching OrdersScreen.css 1:1 */}
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

      {/* Orders Cards List */}
      <div className="orders-cards-list">
        {filteredOrders.map((order) => (
          <div key={order.id} className="order-card-item">
            <div className="order-card-top">
              <span className="order-id-badge">#{order.id}</span>
              <span
                className={`order-status-tag ${
                  order.status === 'ACTIVE' || order.status === 'INCOMING'
                    ? 'status-active'
                    : 'status-done'
                }`}
              >
                {order.status === 'COMPLETED' ? (
                  <CheckCircle2 size={13} className="text-emerald-600" />
                ) : (
                  <Clock size={13} className="animate-spin text-amber-600" />
                )}
                <span>{order.statusLabel}</span>
              </span>
            </div>

            <div className="order-card-body">
              <h4 className="order-service-name">{order.serviceTitle}</h4>
              <div className="order-lawyer-line">
                <span className="order-lawyer-name">الموكل: {order.clientName}</span>
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

              <div className="flex items-center gap-1.5">
                {order.status === 'INCOMING' && (
                  <>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => onAcceptOrder?.(order.id)}
                      className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      قبول الطلب
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onRejectOrder?.(order.id)}
                      className="h-8 text-xs font-bold text-rose-600"
                    >
                      اعتذار
                    </Button>
                  </>
                )}

                {order.status === 'ACTIVE' && (
                  <>
                    <a
                      href={`tel:${order.clientPhone}`}
                      className="h-8 px-2.5 text-xs font-bold rounded-[6px] bg-blue-50 text-[#1D4ED8] flex items-center gap-1 border border-blue-200"
                    >
                      اتصال
                    </a>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => onCompleteOrder?.(order.id, order.price)}
                      className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      إنهاء الإجراء
                    </Button>
                  </>
                )}

                {order.status === 'COMPLETED' && (
                  <button type="button" className="order-view-details-btn">
                    <span>الفاتورة</span>
                    <ChevronLeft size={14} />
                  </button>
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

