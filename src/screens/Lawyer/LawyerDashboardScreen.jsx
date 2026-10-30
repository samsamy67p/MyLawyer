import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import { useRouter } from '../../router/useRouter';
import { ordersApi, lawyerApi } from '../../services/apiClient';

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
  const { registerModalDismiss, unregisterModalDismiss } = useRouter();
  const [activeNavTab, setActiveNavTab] = useState('home');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [ordersList, setOrdersList] = useState([]);
  const [availableBalance, setAvailableBalance] = useState(1850);

  // Fetch initial profile & availability
  useEffect(() => {
    let isMounted = true;
    lawyerApi.getProfile()
      .then((res) => {
        if (isMounted && res?.data?.profile) {
          setIsAvailable(res.data.profile.is_available === true);
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // Fetch real incoming and active orders from database
  const refreshOrders = useCallback(() => {
    ordersApi.getOrders('ALL')
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setOrdersList(res.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshOrders();
    const interval = setInterval(refreshOrders, 10000); // 10s auto-refresh for live orders
    return () => clearInterval(interval);
  }, [refreshOrders]);

  // Handle availability toggle + GPS coordinate broadcast
  const handleToggleAvailability = async () => {
    const nextVal = !isAvailable;
    setIsAvailable(nextVal);
    try {
      await lawyerApi.updateAvailability(nextVal);
      if (nextVal && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            lawyerApi.updateLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {});
          },
          () => {},
          { timeout: 8000, enableHighAccuracy: true }
        );
      }
    } catch {
      // Revert if request fails
      setIsAvailable(!nextVal);
    }
  };

  // تسجيل إغلاق نافذة سحب الأرباح عند ضغط زر الرجوع في الهاتف
  useEffect(() => {
    if (isWithdrawOpen) {
      const dismiss = () => setIsWithdrawOpen(false);
      registerModalDismiss?.(dismiss);
      return () => unregisterModalDismiss?.(dismiss);
    }
  }, [isWithdrawOpen, registerModalDismiss, unregisterModalDismiss]);

  // Order Handlers connected to real backend
  const handleAcceptOrder = async (orderId) => {
    try {
      await ordersApi.acceptOrder(orderId);
      refreshOrders();
    } catch {
      refreshOrders();
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      await ordersApi.rejectOrder(orderId, 'المحامي غير متاح حالياً للمهمة');
      refreshOrders();
    } catch {
      refreshOrders();
    }
  };

  const handleCompleteOrder = async (orderId, amount) => {
    try {
      await ordersApi.completeOrder(orderId);
      setAvailableBalance((prev) => prev + (amount || 350));
      refreshOrders();
    } catch {
      refreshOrders();
    }
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
        return 'الرئيسية';
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
          onToggleAvailability={handleToggleAvailability}
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
