import React, { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { App as CapApp } from '@capacitor/app';
import { RouterContext } from './context.js';
import { ROUTES, normalizePath, isValidRoute } from './routes.js';

/**
 * استخراج المسار الابتدائي الحالي من window.location
 * مع دعم مسارات Hash أو مسارات Pathname لتوافق Capacitor WebView الكامل.
 */
function getInitialRoute() {
  if (typeof window === 'undefined') return ROUTES.HOME;

  // فحص Hash أولاً (مثال: #/orders) إن وجد
  const hash = window.location.hash;
  if (hash && hash.startsWith('#/')) {
    const candidate = normalizePath(hash.substring(1));
    if (isValidRoute(candidate)) return candidate;
  }

  // فحص Pathname ثانياً
  const pathname = normalizePath(window.location.pathname);
  if (isValidRoute(pathname) && pathname !== '/index.html') {
    return pathname;
  }

  return ROUTES.HOME;
}

/**
 * موفر نظام التوجيه والتنقل الداخلي (Router Provider)
 * يدير سجل التنقل (History)، الرابط الحالي (currentPath)، زر الرجوع، وإغلاق النوافذ المنبثقة
 */
export function RouterProvider({ children, initialUser, isLocationDone }) {
  const [currentPath, setCurrentPath] = useState(() => {
    const initial = getInitialRoute();

    // حماية المسارات: إذا لم يكن المستخدم مسجلاً، يبدأ بـ /login
    if (!initialUser) return ROUTES.LOGIN;

    // إذا كان المستخدم مسجلاً ولكن لم يكمل إعداد الموقع
    if (initialUser && !isLocationDone) {
      if (initial === ROUTES.LOCATION_MAP) return ROUTES.LOCATION_MAP;
      return ROUTES.LOCATION_SETUP;
    }

    // إذا كان مسار تسجيل الدخول والمستخدم مسجل بالفعل -> الرئيسية
    if (initial === ROUTES.LOGIN && initialUser) {
      return ROUTES.HOME;
    }

    return initial;
  });

  // حالة تتبع إمكانية الرجوع برمجياً في الواجهة
  const [canGoBackState, setCanGoBackState] = useState(false);

  // سجل التنقل الداخلي (Stack) لضمان دقة الرجوع ومنع الانتقالات العشوائية
  const historyStackRef = useRef([currentPath]);

  // مرجع لحالة تسجيل الدخول لمنع الرجوع للشاشات المحمية بعد تسجيل الخروج
  const isAuthenticatedRef = useRef(Boolean(initialUser));
  useEffect(() => {
    isAuthenticatedRef.current = Boolean(initialUser);
  }, [initialUser]);

  // مرجع لتسجيل دوال إغلاق الطبقات والنوافذ المنبثقة (Active Modal Dismiss)
  const activeModalDismissRef = useRef(null);

  // إشعار النقر المزدوج للخروج
  const [exitToastNotice, setExitToastNotice] = useState(false);

  // مرجع لتتبع آخر ضغطة على زر الرجوع لتفادي الرجوع المزدوج
  const lastBackPressTimeRef = useRef(0);
  const toastTimeoutRef = useRef(null);

  // مزامنة عنوان URL في المتصفح أو WebView دون إعادة تحميل الصفحة
  const syncBrowserUrl = useCallback((path, replace = false) => {
    if (typeof window === 'undefined') return;
    try {
      const url = `#${path}`;
      if (replace) {
        window.history.replaceState({ path }, '', url);
      } else {
        window.history.pushState({ path }, '', url);
      }
    } catch (e) {
      console.warn('URL sync error:', e);
    }
  }, []);

  /**
   * الانتقال إلى مسار جديد
   * @param {string} toPath المسار المستهدف
   * @param {Object} options خيارات التنقل (replace, state)
   */
  const navigate = useCallback((toPath, options = {}) => {
    const { replace = false } = options;
    const target = normalizePath(toPath);

    if (!isValidRoute(target)) {
      console.warn(`[Router] مسار غير صالح: ${toPath}، تم التوجيه للرئيسية.`);
      setCurrentPath(ROUTES.HOME);
      syncBrowserUrl(ROUTES.HOME, true);
      historyStackRef.current = [ROUTES.HOME];
      setCanGoBackState(false);
      return;
    }

    // تحديث السجل خارج دالة setState لأن React (StrictMode) قد يستدعي دوال التحديث مرتين،
    // مما كان يضاعف إدخالات السجل ويجعل زر الرجوع يحتاج ضغطتين.
    if (target === ROUTES.LOGIN) {
      isAuthenticatedRef.current = false;
      activeModalDismissRef.current = null;
      historyStackRef.current = [ROUTES.LOGIN];
      syncBrowserUrl(ROUTES.LOGIN, true);
    } else {
      const stack = historyStackRef.current;
      if (stack[stack.length - 1] === target) return; // تفادي التكرار

      if (replace) {
        // استبدال المسار الأخير في السجل
        if (stack.length > 0) {
          stack[stack.length - 1] = target;
        } else {
          historyStackRef.current = [target];
        }
        syncBrowserUrl(target, true);
      } else {
        // إضافة مسار جديد للسجل
        stack.push(target);
        syncBrowserUrl(target, false);
      }
    }

    // الانتقال كـ Transition: يبقي React الشاشة الحالية ظاهرة حتى تجهز الشاشة التالية
    // (بما فيها الشاشات المحمّلة كسولاً) بدلاً من عرض فراغ أبيض.
    startTransition(() => {
      setCurrentPath(historyStackRef.current[historyStackRef.current.length - 1]);
      setCanGoBackState(historyStackRef.current.length > 1);
    });
  }, [syncBrowserUrl]);

  /**
   * الرجوع للخلف في سجل التنقل خطوة بخطوة
   */
  const goBack = useCallback(() => {
    // 1. الأولوية الأولى: إغلاق النوافذ والبطاقات المفتوحة أولاً إن وجدت
    if (activeModalDismissRef.current) {
      const dismissFn = activeModalDismissRef.current;
      activeModalDismissRef.current = null;
      dismissFn();
      return true;
    }

    // إذا كان المستخدم في صفحة تسجيل الدخول أو غير مسجل، لا يُسمح بالرجوع لأي شاشة سابقة
    if (currentPath === ROUTES.LOGIN || !isAuthenticatedRef.current) {
      historyStackRef.current = [ROUTES.LOGIN];
      setCanGoBackState(false);
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2000) {
        CapApp.exitApp();
      } else {
        lastBackPressTimeRef.current = now;
        setExitToastNotice(true);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => {
          setExitToastNotice(false);
        }, 2000);
      }
      return false;
    }

    const stack = historyStackRef.current;

    // 2. إذا كان السجل يحتوي على أكثر من شاشة، نرجع للشاشة السابقة
    if (stack.length > 1) {
      stack.pop(); // حذف الشاشة الحالية
      const previousPath = stack[stack.length - 1];
      syncBrowserUrl(previousPath, true);
      startTransition(() => {
        setCurrentPath(previousPath);
        setCanGoBackState(stack.length > 1);
      });
      return true;
    }

    // 3. مسارات فرعية تعود للرئيسية تلقائياً إذا فُتحت مباشرة
    if (currentPath !== ROUTES.HOME && currentPath !== ROUTES.LOGIN) {
      historyStackRef.current = [ROUTES.HOME];
      syncBrowserUrl(ROUTES.HOME, true);
      startTransition(() => {
        setCurrentPath(ROUTES.HOME);
        setCanGoBackState(false);
      });
      return true;
    }

    // 4. وصلنا للجذر (Root): ضغطتان خلال ثانيتين للخروج من التطبيق
    const now = Date.now();
    if (now - lastBackPressTimeRef.current < 2000) {
      CapApp.exitApp();
    } else {
      lastBackPressTimeRef.current = now;
      setExitToastNotice(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setExitToastNotice(false);
      }, 2000);
    }

    return false;
  }, [currentPath, syncBrowserUrl]);

  // مرجع ثابت لأحدث نسخة من goBack حتى يُسجَّل مستمع زر الرجوع مرة واحدة فقط
  // (إعادة تسجيله مع كل تنقل كانت تترك مستمعات مكررة بسبب addListener غير المتزامن).
  const goBackRef = useRef(goBack);
  useEffect(() => {
    goBackRef.current = goBack;
  }, [goBack]);

  /**
   * تسجيل دالة لإغلاق نافذة أو بطاقة نشطة
   */
  const registerModalDismiss = useCallback((dismissFn) => {
    activeModalDismissRef.current = dismissFn;
  }, []);

  const unregisterModalDismiss = useCallback(() => {
    activeModalDismissRef.current = null;
  }, []);

  // الاستماع لزر الرجوع الفعلي للهاتف عبر Capacitor (تسجيل واحد طوال عمر التطبيق)
  useEffect(() => {
    let isDisposed = false;
    let backListener = null;

    CapApp.addListener('backButton', () => {
      goBackRef.current();
    })
      .then((handle) => {
        if (isDisposed) {
          handle.remove();
        } else {
          backListener = handle;
        }
      })
      .catch((err) => {
        console.warn('Capacitor backButton setup error:', err);
      });

    // الاستماع لحدث popstate في المتصفح
    const handlePopState = (event) => {
      if (!isAuthenticatedRef.current) {
        historyStackRef.current = [ROUTES.LOGIN];
        syncBrowserUrl(ROUTES.LOGIN, true);
        startTransition(() => {
          setCurrentPath(ROUTES.LOGIN);
          setCanGoBackState(false);
        });
        return;
      }

      const statePath = event.state?.path;
      if (statePath && isValidRoute(statePath) && statePath !== ROUTES.LOGIN) {
        // مزامنة السجل
        if (historyStackRef.current.length > 1) {
          historyStackRef.current.pop();
        }
        startTransition(() => {
          setCurrentPath(statePath);
          setCanGoBackState(historyStackRef.current.length > 1);
        });
      } else {
        goBackRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      isDisposed = true;
      if (backListener) {
        backListener.remove();
      }
      window.removeEventListener('popstate', handlePopState);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [syncBrowserUrl]);

  return (
    <RouterContext.Provider
      value={{
        currentPath,
        navigate,
        goBack,
        registerModalDismiss,
        unregisterModalDismiss,
        canGoBack: canGoBackState,
      }}
    >
      {children}

      {/* Floating Exit Notification Pill */}
      {exitToastNotice && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[9999] bg-[#0F172A]/95 text-white text-[15px] font-semibold px-6 py-3 rounded-[7px] shadow-2xl backdrop-blur-md pointer-events-none transition-all duration-200 border border-slate-700/50 text-center whitespace-nowrap min-w-[280px]">
          اضغط مرة أخرى للخروج من التطبيق
        </div>
      )}
    </RouterContext.Provider>
  );
}
