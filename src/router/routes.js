/**
 * نظام تعريف مسارات تطبيق MyLawyer (Route Constants)
 * مسارات داخلية واضحة ومستقلة تناسب تطبيقات الويب وتطبيقات Capacitor الهجينة.
 */

export const ROUTES = {
  // المصادقة والحسابات
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_OTP: '/verify-otp',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  PENDING_APPROVAL: '/pending-approval',
  ACCOUNT_STATUS: '/account-status',

  // واجهة المحامي المعتمد
  LAWYER_DASHBOARD: '/lawyer/dashboard',

  // تحديد الموقع والخريطة التمهيدية
  LOCATION_SETUP: '/location/setup',
  LOCATION_MAP: '/location/map',

  // التبويبات الرئيسية (الموكل)
  HOME: '/',
  ORDERS: '/orders',
  WALLET: '/wallet',
  ACCOUNT: '/account',

  // رحلة خدمة "محاميك حالاً" (On-Demand Lawyer Dispatch)
  LAWYER_NOW_REQUEST: '/lawyer-now/request',
  LAWYER_NOW_MAP: '/lawyer-now/map',
};

// قائمة المسارات الصالحة للتحقق السريع
export const VALID_ROUTES = Object.values(ROUTES);

/**
 * التبويبات الرئيسية في شريط التنقل السفلي
 */
export const BOTTOM_NAV_ROUTES = [
  ROUTES.HOME,
  ROUTES.ORDERS,
  ROUTES.WALLET,
  ROUTES.ACCOUNT,
];

/**
 * فحص ما إذا كان المسار أحد التبويبات الرئيسية
 * @param {string} path
 * @returns {boolean}
 */
export function isBottomNavRoute(path) {
  return BOTTOM_NAV_ROUTES.includes(path);
}

/**
 * دالة مساعدة لتطبيع المسار والتأكد من مطابقته
 * @param {string} path 
 * @returns {string} المسار بعد التهيئة أو '/' كمسار افتراضي
 */
export function normalizePath(path) {
  if (!path || typeof path !== 'string') return ROUTES.HOME;
  const clean = path.trim().toLowerCase().split('?')[0].split('#')[0];
  if (!clean.startsWith('/')) return `/${clean}`;
  return clean || ROUTES.HOME;
}

/**
 * فحص ما إذا كان المسار مساراً صالحاً في التطبيق
 * @param {string} path 
 * @returns {boolean}
 */
export function isValidRoute(path) {
  const normalized = normalizePath(path);
  return VALID_ROUTES.includes(normalized);
}
