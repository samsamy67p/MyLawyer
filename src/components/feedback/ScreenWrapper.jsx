import React, { Suspense } from 'react';
import ScreenErrorBoundary from './ScreenErrorBoundary';

/**
 * شاشة تحميل ناعمة متوافقة بصرياً مع تصميم التطبيق (تمنع الفراغ الأبيض أثناء الانتقال)
 */
function DefaultScreenLoadingFallback() {
  return (
    <div
      className="w-full min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center select-none"
      dir="rtl"
      aria-label="جاري التحميل"
    >
      <div className="w-9 h-9 border-3 border-blue-600/25 border-t-[#1D4ED8] rounded-full animate-spin mb-3"></div>
      <span className="text-xs font-bold text-slate-500 tracking-wide">
        جاري تحميل الصفحة...
      </span>
    </div>
  );
}

/**
 * غلاف موحد وآمن للشاشات يحتوي على Suspense و Error Boundary
 */
export default function ScreenWrapper({
  onReset,
  children,
  fallback = <DefaultScreenLoadingFallback />,
}) {
  return (
    <Suspense fallback={fallback}>
      <ScreenErrorBoundary onReset={onReset}>
        <div className="page-transition-wrapper">
          {children}
        </div>
      </ScreenErrorBoundary>
    </Suspense>
  );
}

