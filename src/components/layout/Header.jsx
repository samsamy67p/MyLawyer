import React, { useContext } from 'react';
import { Search, Bell, ChevronRight } from 'lucide-react';
import { RouterContext } from '../../router/context.js';
import { ROUTES } from '../../router/routes.js';
import './Header.css';

/**
 * خريطة العناوين الافتراضية للمسارات
 */
const ROUTE_TITLES = {
  [ROUTES.HOME]: 'الرئيسية',
  [ROUTES.ORDERS]: 'الطلبات',
  [ROUTES.WALLET]: 'المحفظة',
  [ROUTES.ACCOUNT]: 'الحساب',
  [ROUTES.LOCATION_SETUP]: 'تحديد الموقع',
  [ROUTES.LOCATION_MAP]: 'موقعك على الخريطة',
  [ROUTES.LAWYER_NOW_REQUEST]: 'محاميك حالاً',
  [ROUTES.LAWYER_NOW_MAP]: 'محاميك حالاً',
  [ROUTES.LAWYER_DASHBOARD]: 'لوحة المحامي',
};

/**
 * المسارات الرئيسية المرتبطة بشريط التنقل السفلي
 */
const MAIN_NAV_ROUTES = new Set([
  ROUTES.HOME,
  ROUTES.ORDERS,
  ROUTES.WALLET,
  ROUTES.ACCOUNT,
  ROUTES.LAWYER_DASHBOARD,
]);

export default function Header({
  title,
  showBack,
  onBack,
  onSearchClick,
  onNotificationClick,
}) {
  const router = useContext(RouterContext);
  const currentPath = router?.currentPath;

  // تحديد ما إذا كانت الصفحة فرعية داخلية بناءً على المسار الحالي
  const isSubRoute = Boolean(
    currentPath && !MAIN_NAV_ROUTES.has(currentPath)
  );

  // إذا تم تمرير showBack صراحة يُعتمد، وإلا يتم الكشف تلقائياً
  const shouldShowBack = showBack !== undefined ? showBack : isSubRoute;

  // إجراء الرجوع: إما الدالة الممررة أو goBack من نظام التنقل
  const handleBack = onBack || router?.goBack;

  // عنوان الهيدر: إما العنوان الممرر أو المشتق من المسار الحالي أو الافتراضي 'الرئيسية'
  const displayTitle = title || (currentPath ? ROUTE_TITLES[currentPath] : 'الرئيسية') || 'الرئيسية';

  return (
    <header className="app-header-clean">
      {/* Right side: Back button (for internal sub-screens) or Search (for main nav tabs) */}
      {shouldShowBack ? (
        <button
          type="button"
          className="header-action-btn"
          onClick={handleBack}
          aria-label="رجوع"
        >
          <ChevronRight size={22} />
        </button>
      ) : (
        <button
          type="button"
          className="header-action-btn"
          onClick={onSearchClick}
          aria-label="بحث"
        >
          <Search size={21} />
        </button>
      )}

      {/* Title in Center: Dynamic Page Title */}
      <div className="header-title-box">
        <span className="app-name-center page-title-arabic">
          {displayTitle}
        </span>
      </div>

      {/* Bell on Left (in RTL left is last) */}
      <button
        type="button"
        className="header-action-btn"
        onClick={onNotificationClick}
        aria-label="التنبيهات"
      >
        <Bell size={21} />
      </button>
    </header>
  );
}

