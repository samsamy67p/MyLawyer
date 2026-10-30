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
          className="btn-retry"
          onClick={onRetry}
          disabled={isRetrying}
        >
          <RefreshCw size={17} className={isRetrying ? 'spin-icon' : ''} />
          <span>{isRetrying ? 'جاري الفحص...' : 'إعادة المحاولة'}</span>
        </button>
      </div>
    </div>
  );
}

