import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

import { RouterProvider, useRouter, ROUTES } from './router/index.js';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { safeJsonParse } from './lib/security';
import OfflineView from './components/feedback/OfflineView';
import ScreenErrorBoundary from './components/feedback/ScreenErrorBoundary';
import InteractiveSplashScreen from './components/splash/InteractiveSplashScreen';

import LoginScreen from './screens/Auth/LoginScreen';

const loadLocationScreen = () => import('./screens/Location/LocationScreen');
const loadMapScreen = () => import('./screens/Map/MapScreen');
const loadLawyerNowRequestScreen = () => import('./screens/LawyerNow/LawyerNowRequestScreen');
const loadLawyerNowScreen = () => import('./screens/LawyerNow/LawyerNowScreen');
const loadHomeScreen = () => import('./screens/Home/HomeScreen');
const loadOrdersScreen = () => import('./screens/Orders/OrdersScreen');
const loadWalletScreen = () => import('./screens/Wallet/WalletScreen');
const loadAccountScreen = () => import('./screens/Account/AccountScreen');

const LocationScreen = lazy(loadLocationScreen);
const MapScreen = lazy(loadMapScreen);
const LawyerNowRequestScreen = lazy(loadLawyerNowRequestScreen);
const LawyerNowScreen = lazy(loadLawyerNowScreen);
const HomeScreen = lazy(loadHomeScreen);
const OrdersScreen = lazy(loadOrdersScreen);
const WalletScreen = lazy(loadWalletScreen);
const AccountScreen = lazy(loadAccountScreen);

/**
 * المحتوى الداخلي للتطبيق المربوط بنظام الـ Router
 */
function AppNavigationContent({
  currentUser,
  setCurrentUser,
  userLocation,
  setUserLocation,
  setIsLocationDone,
}) {
  const { currentPath, navigate, registerModalDismiss, unregisterModalDismiss } = useRouter();

  // تفاصيل طلب "محاميك حالاً" ومعرف الجلسة لإعادة الضبط النظيف
  const [lawyerNowRequestDetails, setLawyerNowRequestDetails] = useState(null);
  const [requestSessionId, setRequestSessionId] = useState(0);

  // موقع مؤقت لمعاينته في الخريطة التمهيدية
  const [pendingLocation, setPendingLocation] = useState(null);

  // انتقال فوري وسلس بين الشاشات بدون لودينج خارجي
  const transitionTo = useCallback((toRoute, options = {}) => {
    navigate(toRoute, options);
  }, [navigate]);

  // معالجة تسجيل الدخول الناجح
  const handleLoginSuccess = (user) => {
    try {
      localStorage.setItem('mylawyer_user', JSON.stringify(user));
    } catch (e) {
      console.warn(e);
    }
    setCurrentUser(user);

    // إذا كان الموقع قد تم حفظه مسبقاً -> التوجه للرئيسية، وإلا -> شاشة إعداد الموقع
    const locDone = localStorage.getItem('mylawyer_location_done') === 'true';
    if (locDone) {
      transitionTo(ROUTES.HOME, { replace: true });
    } else {
      transitionTo(ROUTES.LOCATION_SETUP, { replace: true });
    }
  };

  // حفظ الموقع المختار
  const handleLocationSave = (coords, address) => {
    try {
      const locData = { coords, address };
      localStorage.setItem('mylawyer_location', JSON.stringify(locData));
      localStorage.setItem('mylawyer_location_done', 'true');
      setUserLocation(locData);
      setIsLocationDone(true);
    } catch (e) {
      console.warn(e);
    }
    transitionTo(ROUTES.HOME, { replace: true });
  };

  // تخطي تحديد الموقع
  const handleLocationSkip = () => {
    try {
      localStorage.setItem('mylawyer_location_done', 'true');
      setIsLocationDone(true);
    } catch (e) {
      console.warn(e);
    }
    transitionTo(ROUTES.HOME, { replace: true });
  };

  // تسجيل الخروج
  const handleLogout = () => {
    try {
      localStorage.removeItem('mylawyer_user');
    } catch (e) {
      console.warn(e);
    }
    setCurrentUser(null);
    transitionTo(ROUTES.LOGIN, { replace: true });
  };

  // ربط النوافذ المنبثقة والسحب السفلي (Modal Dismiss) بزر الرجوع
  const handleModalStateChange = useCallback((isOpen, dismissFn) => {
    if (isOpen) {
      registerModalDismiss(dismissFn);
    } else {
      unregisterModalDismiss();
    }
  }, [registerModalDismiss, unregisterModalDismiss]);

  // حماية المسارات: إذا لم يكن مسجلاً وحاول فتح مسار محمي -> إعادة توجيه لـ Login
  useEffect(() => {
    if (!currentUser && currentPath !== ROUTES.LOGIN) {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [currentUser, currentPath, navigate]);

  // تحديد ما يتم عرضه وفق مسار التوجيه الحالي (Current Route)
  // - Suspense: الانتقالات تتم عبر startTransition في الـ Router، لذا تبقى الشاشة الحالية ظاهرة
  //   أثناء تحميل الشاشة التالية ولا يظهر الـ fallback إلا عند أول تشغيل (وهي محمّلة مسبقاً).
  // - ScreenErrorBoundary: يحصر أي خطأ عرض داخل الشاشة بدلاً من ترك WebView فارغاً.
  return (
    <ScreenErrorBoundary
      resetKey={currentPath}
      onRecover={() => transitionTo(currentUser ? ROUTES.HOME : ROUTES.LOGIN, { replace: true })}
    >
    <Suspense fallback={<div className="page-transition-wrapper" />}>
      {/* 1. مسار تسجيل الدخول: /login */}
      {currentPath === ROUTES.LOGIN && (
        <div className="page-transition-wrapper" key="auth-screen">
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onGuestLogin={() => handleLoginSuccess({ isGuest: true })}
          />
        </div>
      )}

      {/* 2. مسار إعداد وتحديد الموقع: /location/setup */}
      {currentPath === ROUTES.LOCATION_SETUP && (
        <div className="page-transition-wrapper" key="location-setup-screen">
          <LocationScreen
            existingLocation={userLocation}
            onLocationConfirmed={handleLocationSave}
            onViewOnMap={(coords, address) => {
              setPendingLocation({ coords, address });
              transitionTo(ROUTES.LOCATION_MAP);
            }}
            onSkip={handleLocationSkip}
          />
        </div>
      )}

      {/* 3. مسار خريطة تحديد الموقع التمهيدية: /location/map */}
      {currentPath === ROUTES.LOCATION_MAP && (
        <div className="page-transition-wrapper" key="location-map-screen">
          <MapScreen
            userCoords={pendingLocation?.coords || userLocation?.coords}
            addressTitle={pendingLocation?.address || userLocation?.address}
            onConfirmLocation={(coords, address) => {
              handleLocationSave(coords, address);
            }}
            onBack={() => transitionTo(ROUTES.LOCATION_SETUP)}
            onModalStateChange={handleModalStateChange}
          />
        </div>
      )}

      {/* 4. مسار طلب خدمة "محاميك حالاً" - الخطوة 1 و 2: /lawyer-now/request */}
      {currentPath === ROUTES.LAWYER_NOW_REQUEST && (
        <div
          className="page-transition-wrapper"
          key={`lawyer-now-request-screen-${requestSessionId}`}
        >
          <LawyerNowRequestScreen
            initialDetails={lawyerNowRequestDetails}
            onBack={() => {
              setRequestSessionId((prev) => prev + 1);
              setLawyerNowRequestDetails(null);
              transitionTo(ROUTES.HOME);
            }}
            onModalStateChange={handleModalStateChange}
            onProceedToMap={(details) => {
              setLawyerNowRequestDetails(details || null);
              transitionTo(ROUTES.LAWYER_NOW_MAP);
            }}
          />
        </div>
      )}

      {/* 5. مسار خريطة الملاحة الحية والمحامين: /lawyer-now/map */}
      {currentPath === ROUTES.LAWYER_NOW_MAP && (
        <div
          className="page-transition-wrapper"
          key={`lawyer-now-map-screen-${requestSessionId}`}
        >
          <LawyerNowScreen
            userCoords={userLocation?.coords}
            addressTitle={userLocation?.address}
            requestDetails={lawyerNowRequestDetails}
            onBack={() => transitionTo(ROUTES.LAWYER_NOW_REQUEST)}
            onModalStateChange={handleModalStateChange}
            onNavigateToOrders={() => {
              transitionTo(ROUTES.ORDERS);
            }}
            onStartNewRequest={() => {
              setRequestSessionId((prev) => prev + 1);
              setLawyerNowRequestDetails(null);
              transitionTo(ROUTES.LAWYER_NOW_REQUEST, { replace: true });
            }}
          />
        </div>
      )}

      {/* 6. تبويب الشاشة الرئيسية: / */}
      {currentPath === ROUTES.HOME && (
        <div className="page-transition-wrapper" key="home-screen">
          <HomeScreen
            userLocation={userLocation}
            activeNavTab="home"
            onNavTabChange={(tabId, route) => {
              if (route && route !== ROUTES.HOME) {
                transitionTo(route);
              }
            }}
            onChangeLocation={() => transitionTo(ROUTES.LOCATION_SETUP)}
            onOpenLiveMap={() => {
              setRequestSessionId((prev) => prev + 1);
              setLawyerNowRequestDetails(null);
              transitionTo(ROUTES.LAWYER_NOW_REQUEST);
            }}
          />
        </div>
      )}

      {/* 7. تبويب الطلبات: /orders */}
      {currentPath === ROUTES.ORDERS && (
        <div className="page-transition-wrapper" key="orders-screen">
          <OrdersScreen
            activeNavTab="orders"
            onNavTabChange={(tabId, route) => {
              if (route && route !== ROUTES.ORDERS) {
                transitionTo(route);
              }
            }}
          />
        </div>
      )}

      {/* 8. تبويب المحفظة: /wallet */}
      {currentPath === ROUTES.WALLET && (
        <div className="page-transition-wrapper" key="wallet-screen">
          <WalletScreen
            activeNavTab="wallet"
            onNavTabChange={(tabId, route) => {
              if (route && route !== ROUTES.WALLET) {
                transitionTo(route);
              }
            }}
          />
        </div>
      )}

      {/* 9. تبويب الحساب: /account */}
      {currentPath === ROUTES.ACCOUNT && (
        <div className="page-transition-wrapper" key="account-screen">
          <AccountScreen
            currentUser={currentUser}
            userLocation={userLocation}
            onLogout={handleLogout}
            activeNavTab="account"
            onNavTabChange={(tabId, route) => {
              if (route && route !== ROUTES.ACCOUNT) {
                transitionTo(route);
              }
            }}
          />
        </div>
      )}
    </Suspense>
    </ScreenErrorBoundary>
  );
}

/**
 * المكون الرئيسي للتطبيق App
 */
export default function App() {
  // البدء دائماً بصفحة تسجيل الدخول في كل مرة يتم فيها فتح التطبيق
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      localStorage.removeItem('mylawyer_user');
    } catch {
      // ignore storage errors
    }
    return null;
  });

  const [userLocation, setUserLocation] = useState(() => {
    return safeJsonParse(localStorage.getItem('mylawyer_location'), null);
  });

  const [isLocationDone, setIsLocationDone] = useState(() => {
    try {
      return localStorage.getItem('mylawyer_location_done') === 'true';
    } catch {
      return false;
    }
  });

  const { isConnected, isChecking, recheckNetwork } = useNetworkStatus();

  // شاشة البداية التفاعلية المتحركة: تظهر عند فتح التطبيق لأول مرة في الجلسة
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem('mylawyer_splash_shown');
    } catch {
      return true;
    }
  });

  const handleSplashComplete = useCallback(() => {
    try {
      sessionStorage.setItem('mylawyer_splash_shown', 'true');
    } catch {
      // ignore storage errors
    }
    setShowSplash(false);
  }, []);

  // إخفاء شاشة البداية الأصلية فوراً عند تركيب الواجهة وتهيئة الشاشات في الخلفية
  useEffect(() => {
    SplashScreen.hide({ fadeOutDuration: 0 }).catch(() => {});

    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#FFFFFF' }).catch(() => {});

    // تحميل مسبق صامت للشاشات في الخلفية بعد ظهور صفحة تسجيل الدخول مباشرة
    const preloadTimer = setTimeout(() => {
      loadLocationScreen();
      loadHomeScreen();
      loadOrdersScreen();
      loadWalletScreen();
      loadAccountScreen();
      loadLawyerNowRequestScreen();
      loadMapScreen();
      loadLawyerNowScreen();
    }, 60);

    return () => clearTimeout(preloadTimer);
  }, []);

  // عند انقطاع الشبكة تُعرض واجهة عدم الاتصال كطبقة فوق التطبيق بدلاً من تفكيك الـ Router،
  // حتى لا تضيع الشاشة الحالية وسجل التنقل وبيانات الطلب ويعود المستخدم لتسجيل الدخول.
  return (
    <>
      <RouterProvider initialUser={currentUser} isLocationDone={isLocationDone}>
        <AppNavigationContent
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          userLocation={userLocation}
          setUserLocation={setUserLocation}
          isLocationDone={isLocationDone}
          setIsLocationDone={setIsLocationDone}
        />
      </RouterProvider>

      {!isConnected && (
        <div className="fixed inset-0 z-[10000] overflow-auto">
          <OfflineView onRetry={recheckNetwork} isRetrying={isChecking} />
        </div>
      )}

      {showSplash && (
        <InteractiveSplashScreen onAnimationComplete={handleSplashComplete} />
      )}
    </>
  );
}
