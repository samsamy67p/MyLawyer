import React, { useState } from 'react';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';

import LawyerHomeTab from './tabs/LawyerHomeTab';
import LawyerOrdersTab from './tabs/LawyerOrdersTab';
import LawyerWalletTab from './tabs/LawyerWalletTab';
import LawyerAccountTab from './tabs/LawyerAccountTab';
import LawyerWithdrawModal from './components/LawyerWithdrawModal';

// Shared Client Stylesheets
import '../Home/HomeScreen.css';
import '../Orders/OrdersScreen.css';
import '../Wallet/WalletScreen.css';
import '../Account/AccountScreen.css';

export default function LawyerDashboardScreen({ user, onLogout }) {
  const [activeNavTab, setActiveNavTab] = useState('home');
  const [isAvailable, setIsAvailable] = useState(true);

  // Orders State
  const [ordersList, setOrdersList] = useState([
    {
      id: 'ORD-8922',
      serviceTitle: 'محاميك حالاً: تحرير محضر إثبات حالة بقسم الشرطة',
      clientName: 'أ/ كمال محمود',
      specialty: 'قسم شرطة الدقي — 1.8 كم (6 دقائق)',
      status: 'INCOMING',
      statusLabel: 'طلب وارد مباشر',
      date: 'اليوم، منذ دقيقتين',
      price: 350,
      clientPhone: '01098765432',
    },
    {
      id: 'ORD-8921',
      serviceTitle: 'حضور تحقيق نيابة وحراسة قضائية',
      clientName: 'أ/ طارق عبد الرحمن',
      specialty: 'نيابة العجوزة الابتدائية',
      status: 'ACTIVE',
      statusLabel: 'جاري التنفيذ',
      date: 'اليوم، 1:30 م',
      price: 600,
      clientPhone: '01123456789',
    },
    {
      id: 'ORD-7612',
      serviceTitle: 'صياغة وتوثيق عقد إيجار مقهى تجاري',
      clientName: 'شركة النور للمقاولات',
      specialty: 'عقود وشركات تجارية',
      status: 'COMPLETED',
      statusLabel: 'مكتمل بنجاح',
      date: '28 أكتوبر 2026',
      price: 900,
      clientPhone: '01234567890',
    },
  ]);

  // Wallet State
  const [availableBalance, setAvailableBalance] = useState(1850);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // Order Handlers
  const handleAcceptOrder = (orderId) => {
    setOrdersList((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: 'ACTIVE', statusLabel: 'جاري التنفيذ' }
          : o
      )
    );
  };

  const handleRejectOrder = (orderId) => {
    setOrdersList((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleCompleteOrder = (orderId, amount) => {
    setOrdersList((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: 'COMPLETED', statusLabel: 'مكتمل بنجاح' }
          : o
      )
    );
    setAvailableBalance((prev) => prev + amount);
  };

  const handleConfirmWithdrawal = (amount) => {
    setAvailableBalance((prev) => Math.max(0, prev - amount));
  };

  const getHeaderTitle = () => {
    switch (activeNavTab) {
      case 'orders':
        return 'الطلبات';
      case 'wallet':
        return 'المحفظة';
      case 'account':
        return 'الحساب';
      case 'home':
      default:
        return 'MyLawyer';
    }
  };

  const getScreenLayoutClass = () => {
    switch (activeNavTab) {
      case 'orders':
        return 'orders-screen-layout';
      case 'wallet':
        return 'wallet-screen-layout';
      case 'account':
        return 'account-screen-layout';
      case 'home':
      default:
        return 'home-screen-layout';
    }
  };

  return (
    <div className={getScreenLayoutClass()}>
      <Header
        title={getHeaderTitle()}
        onSearchClick={() => {}}
        onNotificationClick={() => setActiveNavTab('orders')}
      />

      {activeNavTab === 'home' && (
        <LawyerHomeTab
          user={user}
          availableBalance={availableBalance}
          isAvailable={isAvailable}
          onToggleAvailability={() => setIsAvailable((prev) => !prev)}
          onNavigateTab={setActiveNavTab}
        />
      )}

      {activeNavTab === 'orders' && (
        <LawyerOrdersTab
          ordersList={ordersList}
          onAcceptOrder={handleAcceptOrder}
          onRejectOrder={handleRejectOrder}
          onCompleteOrder={handleCompleteOrder}
        />
      )}

      {activeNavTab === 'wallet' && (
        <LawyerWalletTab
          availableBalance={availableBalance}
          onOpenWithdraw={() => setIsWithdrawOpen(true)}
        />
      )}

      {activeNavTab === 'account' && (
        <LawyerAccountTab
          user={user}
          onLogout={onLogout}
        />
      )}

      <BottomNav
        activeTab={activeNavTab}
        onTabChange={(tabId) => setActiveNavTab(tabId)}
      />

      <LawyerWithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={availableBalance}
        onConfirmWithdrawal={handleConfirmWithdrawal}
      />
    </div>
  );
}
