import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

import { RouterProvider, useRouter, ROUTES } from './router/index.js';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { safeJsonParse } from './lib/security';
import { tokenStorage, authApi } from './services/apiClient';
import OfflineView from './components/feedback/OfflineView';
import ScreenErrorBoundary from './components/feedback/ScreenErrorBoundary';
import InteractiveSplashScreen from './components/splash/InteractiveSplashScreen';

import LoginScreen from './screens/Auth/LoginScreen';
import RegisterScreen from './screens/Auth/RegisterScreen';
import OtpVerificationScreen from './screens/Auth/OtpVerificationScreen';
import AccountStatusScreen from './screens/Auth/AccountStatusScreen';
import ForgotPasswordScreen from './screens/Auth/ForgotPasswordScreen';
import LawyerDashboardScreen from './screens/Lawyer/LawyerDashboardScreen';

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

  // إيميل التحقق المؤقت
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState('');

  // انتقال فوري وسلس بين الشاشات بدون لودينج خارجي
  const transitionTo = useCallback((toRoute, options = {}) => {
    navigate(toRoute, options);
  }, [navigate]);

  // التحقق من صحة جلسة المستخدم من الخادم عند الإقلاع
  useEffect(() => {
    const checkSession = async () => {
      const token = tokenStorage.getAccessToken();
      if (token) {
        try {
          const res = await authApi.getCurrentUser();
          if (res.success && res.data) {
            setCurrentUser(res.data);
            localStorage.setItem('mylawyer_user', JSON.stringify(res.data));
          }
        } catch {
          // Token expired or invalid
        }
      }
    };
    checkSession();
  }, [setCurrentUser]);

  // استماع لانتهاء الجلسة
  useEffect(() => {
    const handleExpired = () => {
      setCurrentUser(null);
      transitionTo(ROUTES.LOGIN, { replace: true, clearHistory: true });
    };
    window.addEventListener('mylawyer:session-expired', handleExpired);
    return () => window.removeEventListener('mylawyer:session-expired', handleExpired);
  }, [setCurrentUser, transitionTo]);

  // معالجة تسجيل الدخول الناجح
  const handleLoginSuccess = (user) => {
    try {
      localStorage.setItem('mylawyer_user', JSON.stringify(user));
    } catch (e) {
      console.warn(e);
    }
    setCurrentUser(user);

    // توجيه المحامي حسب حالته
    if (user.role === 'lawyer') {
      if (user.status === 'active') {
        transitionTo(ROUTES.LAWYER_DASHBOARD, { replace: true });
      } else if (user.status === 'pending_admin_approval') {
        transitionTo(ROUTES.PENDING_APPROVAL, { replace: true });
      } else {
        transitionTo(ROUTES.ACCOUNT_STATUS, { replace: true });
      }
      return;
    }

    // توجيه الموكل
    const locDone = localStorage.getItem('mylawyer_location_done') === 'true';
    if (locDone) {
      transitionTo(ROUTES.HOME, { replace: true });
    } else {
      transitionTo(ROUTES.LOCATION_SETUP, { replace: true });
    }
  };

  // بعد إتمام التسجيل
  const handleRegisterSuccess = ({ email }) => {
    setPendingVerifyEmail(email);
    transitionTo(ROUTES.VERIFY_OTP);
  };

  // بعد نجاح إدخال رمز التحقق OTP
  const handleOtpVerified = (data) => {
    if (data.role === 'lawyer') {
      transitionTo(ROUTES.PENDING_APPROVAL, { replace: true });
    } else {
      // للموكل: التوجه لشاشة تسجيل الدخول
      transitionTo(ROUTES.LOGIN, { replace: true });
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
      transitionTo(ROUTES.HOME, { replace: true });
    } catch (e) {
      console.warn(e);
    }
  };

  // تخطي تحديد الموقع والمتابعة للرئيسية مباشرة
  const handleLocationSkip = () => {
    try {
      localStorage.setItem('mylawyer_location_done', 'true');
      setIsLocationDone(true);
      transitionTo(ROUTES.HOME, { replace: true });
    } catch (e) {
      console.warn(e);
    }
  };

  // تسجيل الخروج المباشر والآمن
  const handleLogout = async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      await authApi.logout(refreshToken);
    } catch {
      // Ignore network errors on logout
    }
    tokenStorage.clearTokens();
    try {
      localStorage.removeItem('mylawyer_user');
    } catch (e) {
      console.warn(e);
    }
    setCurrentUser(null);
    transitionTo(ROUTES.LOGIN, { replace: true, clearHistory: true });
  };

  // تبديل التبويبات السفلية للموكل
  const handleNavTabChange = (tabId) => {
    switch (tabId) {
      case 'home':
        transitionTo(ROUTES.HOME);
        break;
      case 'orders':
        transitionTo(ROUTES.ORDERS);
        break;
      case 'wallet':
        transitionTo(ROUTES.WALLET);
        break;
      case 'account':
        transitionTo(ROUTES.ACCOUNT);
        break;
      default:
        break;
    }
  };

  // 1. شاشة تسجيل الدخول
  if (currentPath === ROUTES.LOGIN) {
    return (
      <ScreenErrorBoundary onReset={() => transitionTo(ROUTES.LOGIN)}>
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onGuestLogin={() => {
            const guest = { id: 'guest', phone: '01000000000', role: 'client', status: 'active', isGuest: true };
            try {
              localStorage.setItem('mylawyer_user', JSON.stringify(guest));
            } catch (e) {
              console.warn(e);
            }
            setCurrentUser(guest);
            transitionTo(ROUTES.HOME, { replace: true });
          }}
          onLawyerLogin={() => {
            const demoLawyer = {
              id: 'demo_lawyer_01',
              fullName: 'المستشار / أحمد فهمي',
              phone: '01012345678',
              email: 'lawyer.demo@mylawyer.eg',
              role: 'lawyer',
              status: 'active',
              isDemo: true,
              rating: 4.95,
              casesCount: 142,
              specialties: ['جنائي', 'مدني', 'شركات'],
              officeAddress: 'شارع جامعة الدول العربية، المهندسين، الجيزة',
            };
            try {
              localStorage.setItem('mylawyer_user', JSON.stringify(demoLawyer));
            } catch (e) {
              console.warn(e);
            }
            setCurrentUser(demoLawyer);
            transitionTo(ROUTES.LAWYER_DASHBOARD, { replace: true });
          }}
          onNavigateRegister={() => transitionTo(ROUTES.REGISTER)}
          onNavigateForgot={() => transitionTo(ROUTES.FORGOT_PASSWORD)}
        />
      </ScreenErrorBoundary>
    );
  }

  // 2. شاشة إنشاء حساب جديد
  if (currentPath === ROUTES.REGISTER) {
    return (
      <ScreenErrorBoundary onReset={() => transitionTo(ROUTES.LOGIN)}>
        <RegisterScreen
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateLogin={() => transitionTo(ROUTES.LOGIN)}
        />
      </ScreenErrorBoundary>
    );
  }

  // 3. شاشة تأكيد البريد OTP
  if (currentPath === ROUTES.VERIFY_OTP) {
    return (
      <ScreenErrorBoundary onReset={() => transitionTo(ROUTES.LOGIN)}>
        <OtpVerificationScreen
          email={pendingVerifyEmail || currentUser?.email || ''}
          onVerified={handleOtpVerified}
          onBack={() => transitionTo(ROUTES.REGISTER)}
        />
      </ScreenErrorBoundary>
    );
  }

  // 4. شاشة نسيت كلمة المرور
  if (currentPath === ROUTES.FORGOT_PASSWORD) {
    return (
      <ScreenErrorBoundary onReset={() => transitionTo(ROUTES.LOGIN)}>
        <ForgotPasswordScreen
          onNavigateLogin={() => transitionTo(ROUTES.LOGIN)}
        />
      </ScreenErrorBoundary>
    );
  }

  // 5. شاشة انتظار موافقة الإدارة أو الحساب المعلق للمحامي
  if (
    currentPath === ROUTES.PENDING_APPROVAL ||
    currentPath === ROUTES.ACCOUNT_STATUS ||
    (currentUser?.role === 'lawyer' && currentUser?.status !== 'active')
  ) {
    return (
      <ScreenErrorBoundary onReset={() => transitionTo(ROUTES.LOGIN)}>
        <AccountStatusScreen
          user={currentUser}
          onLogout={handleLogout}
        />
      </ScreenErrorBoundary>
    );
  }

  // 6. لوحة المحامي المعتمد
  if (currentPath === ROUTES.LAWYER_DASHBOARD || (currentUser?.role === 'lawyer' && currentUser?.status === 'active')) {
    return (
      <ScreenErrorBoundary onReset={() => transitionTo(ROUTES.LAWYER_DASHBOARD)}>
        <LawyerDashboardScreen
          user={currentUser}
          onLogout={handleLogout}
        />
      </ScreenErrorBoundary>
    );
  }

  // 7. شاشات تحديد الموقع
  if (currentPath === ROUTES.LOCATION_SETUP) {
    if (isLocationDone) {
      transitionTo(ROUTES.HOME, { replace: true });
      return null;
    }
    return (
      <Suspense fallback={null}>
        <ScreenErrorBoundary onReset={() => transitionTo(ROUTES.LOGIN)}>
          <LocationScreen
            onLocationSelect={(coords, address) => {
              setPendingLocation({ coords, address });
              transitionTo(ROUTES.LOCATION_MAP);
            }}
            onViewOnMap={(coords, address) => {
              setPendingLocation({ coords, address });
              transitionTo(ROUTES.LOCATION_MAP);
            }}
            onLocationConfirmed={(coords, address) => {
              handleLocationSave(coords, address);
            }}
            onSkip={handleLocationSkip}
          />
        </ScreenErrorBoundary>
      </Suspense>
    );
  }

  if (currentPath === ROUTES.LOCATION_MAP) {
    return (
      <Suspense fallback={null}>
        <ScreenErrorBoundary onReset={() => transitionTo(ROUTES.HOME)}>
          <MapScreen
            userCoords={pendingLocation?.coords || userLocation?.coords}
            initialCoords={pendingLocation?.coords || userLocation?.coords}
            addressTitle={pendingLocation?.address || userLocation?.address}
            initialAddress={pendingLocation?.address || userLocation?.address}
            onConfirmLocation={(coords, address) => {
              handleLocationSave(coords, address);
            }}
            onBack={() => transitionTo(ROUTES.HOME)}
          />
        </ScreenErrorBoundary>
      </Suspense>
    );
  }

  // 8. رحلة "محاميك حالاً"
  if (currentPath === ROUTES.LAWYER_NOW_REQUEST) {
    return (
      <Suspense fallback={null}>
        <ScreenErrorBoundary onReset={() => transitionTo(ROUTES.HOME)}>
          <LawyerNowRequestScreen
            key={`lawyer-req-${requestSessionId}`}
            initialDetails={lawyerNowRequestDetails}
            onBack={() => transitionTo(ROUTES.HOME)}
            onProceedToMap={(details) => {
              setLawyerNowRequestDetails(details);
              transitionTo(ROUTES.LAWYER_NOW_MAP);
            }}
            onSubmitDetails={(details) => {
              setLawyerNowRequestDetails(details);
              transitionTo(ROUTES.LAWYER_NOW_MAP);
            }}
          />
        </ScreenErrorBoundary>
      </Suspense>
    );
  }

  if (currentPath === ROUTES.LAWYER_NOW_MAP) {
    return (
      <Suspense fallback={null}>
        <ScreenErrorBoundary onReset={() => transitionTo(ROUTES.HOME)}>
          <LawyerNowScreen
            key={`lawyer-map-${requestSessionId}`}
            userCoords={userLocation?.coords}
            userAddress={userLocation?.address}
            requestDetails={lawyerNowRequestDetails}
            onBack={() => transitionTo(ROUTES.LAWYER_NOW_REQUEST)}
            onModalStateChange={(isOpen, dismissFn) => {
              if (isOpen && dismissFn) {
                registerModalDismiss?.(dismissFn);
              } else {
                unregisterModalDismiss?.();
              }
            }}
            registerModalDismiss={registerModalDismiss}
            unregisterModalDismiss={unregisterModalDismiss}
          />
        </ScreenErrorBoundary>
      </Suspense>
    );
  }

  // 9. التبويبات الرئيسية (الطلبات، المحفظة، الحساب، الرئيسية)
  if (currentPath === ROUTES.ORDERS) {
    return (
      <Suspense fallback={null}>
        <ScreenErrorBoundary onReset={() => transitionTo(ROUTES.HOME)}>
          <OrdersScreen
            activeNavTab="orders"
            onNavTabChange={handleNavTabChange}
          />
        </ScreenErrorBoundary>
      </Suspense>
    );
  }

  if (currentPath === ROUTES.WALLET) {
    return (
      <Suspense fallback={null}>
        <ScreenErrorBoundary onReset={() => transitionTo(ROUTES.HOME)}>
          <WalletScreen
            activeNavTab="wallet"
            onNavTabChange={handleNavTabChange}
          />
        </ScreenErrorBoundary>
      </Suspense>
    );
  }

  if (currentPath === ROUTES.ACCOUNT) {
    return (
      <Suspense fallback={null}>
        <ScreenErrorBoundary onReset={() => transitionTo(ROUTES.HOME)}>
          <AccountScreen
            currentUser={currentUser}
            userLocation={userLocation}
            onLogout={handleLogout}
            activeNavTab="account"
            onNavTabChange={handleNavTabChange}
          />
        </ScreenErrorBoundary>
      </Suspense>
    );
  }

  // الافتراضي: الشاشة الرئيسية للموكل
  return (
    <Suspense fallback={null}>
      <ScreenErrorBoundary onReset={() => transitionTo(ROUTES.HOME)}>
        <HomeScreen
          userLocation={userLocation}
          onChangeLocation={() => {
            setPendingLocation(userLocation);
            transitionTo(ROUTES.LOCATION_MAP);
          }}
          onOpenLiveMap={() => {
            setRequestSessionId((prev) => prev + 1);
            setLawyerNowRequestDetails(null);
            transitionTo(ROUTES.LAWYER_NOW_REQUEST);
          }}
          activeNavTab="home"
          onNavTabChange={handleNavTabChange}
        />
      </ScreenErrorBoundary>
    </Suspense>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('mylawyer_user');
      if (savedUser) {
        return safeJsonParse(savedUser, null);
      }
    } catch {
      // ignore
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
      // ignore
    }
    setShowSplash(false);
  }, []);

  useEffect(() => {
    SplashScreen.hide({ fadeOutDuration: 0 }).catch(() => {});
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#FFFFFF' }).catch(() => {});

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
