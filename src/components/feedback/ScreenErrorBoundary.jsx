import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import './OfflineView.css';

/**
 * حاجز أخطاء لكل شاشة (Error Boundary)
 * أي خطأ أثناء عرض شاشة واحدة كان يفكّك شجرة React بالكامل ويترك WebView أبيض فارغاً.
 * هذا الحاجز يحصر الخطأ داخل الشاشة الحالية ويعرض واجهة بنفس تصميم التطبيق
 * مع زر للعودة للرئيسية دون إعادة تحميل WebView.
 * يُعاد ضبطه تلقائياً عند تغيّر المسار عبر `resetKey`.
 */
export default class ScreenErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorKey: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  static getDerivedStateFromProps(props, state) {
    if (state.hasError && state.errorKey !== null && props.resetKey !== state.errorKey) {
      return { hasError: false, errorKey: null };
    }
    if (state.hasError && state.errorKey === null) {
      return { errorKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error) {
    console.warn('[ScreenErrorBoundary] Screen render failed:', error?.message);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="offline-screen">
        <div className="offline-box">
          <AlertCircle size={44} color="#DC2626" className="offline-icon" />
          <h2 className="offline-title">تعذر عرض هذه الصفحة</h2>
          <p className="offline-desc">حدث خطأ غير متوقع أثناء فتح الصفحة، يمكنك العودة للرئيسية والمتابعة.</p>
          <button
            type="button"
            className="btn-retry"
            onClick={() => {
              this.setState({ hasError: false, errorKey: null });
              this.props.onRecover?.();
            }}
          >
            <RefreshCw size={17} />
            <span>العودة للرئيسية</span>
          </button>
        </div>
      </div>
    );
  }
}

