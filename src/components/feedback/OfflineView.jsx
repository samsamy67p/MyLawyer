import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import './OfflineView.css';

export default function OfflineView({ onRetry, isRetrying }) {
  return (
    <div className="offline-screen">
      <div className="offline-box">
        <WifiOff size={44} color="#DC2626" className="offline-icon" />
        <h2 className="offline-title">لا يوجد اتصال بالإنترنت</h2>
        <p className="offline-desc">
          يرجى التأكد من تشغيل الواي فاي أو بيانات الهاتف لمتابعة استخدام التطبيق.
        </p>
        <button
          type="button"
          className="btn-retry relative"
          onClick={onRetry}
          disabled={isRetrying}
          aria-busy={isRetrying ? 'true' : undefined}
        >
          {isRetrying && (
            <span
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              aria-hidden="true"
            >
              <RefreshCw size={17} className="spin-icon" />
              <span className="sr-only">جاري الفحص...</span>
            </span>
          )}
          <span
            className={
              isRetrying
                ? 'invisible opacity-0 select-none pointer-events-none inline-flex items-center justify-center gap-2'
                : 'inline-flex items-center justify-center gap-2'
            }
            aria-hidden={isRetrying ? 'true' : undefined}
          >
            <RefreshCw size={17} />
            <span>إعادة المحاولة</span>
          </span>
        </button>
      </div>
    </div>
  );
}

