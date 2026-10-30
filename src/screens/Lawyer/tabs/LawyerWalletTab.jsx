import React from 'react';
import { ShieldCheck, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function LawyerWalletTab({
  availableBalance,
  onOpenWithdraw,
}) {
  return (
    <main className="wallet-main-content">
      <div className="wallet-page-header">
        <h2>محفظة المحامي</h2>
        <p>رصيدك من الأتعاب المحصلة وسحب الأموال لحسابك</p>
      </div>

      {/* Balance Card matching WalletScreen 1:1 */}
      <div className="wallet-balance-card">
        <div className="wallet-balance-top">
          <span className="balance-title">رصيد الأتعاب القابل للسحب</span>
          <span className="wallet-badge-secure">
            <ShieldCheck size={14} />
            <span>محفظة معتمدة ومحمية</span>
          </span>
        </div>

        <div className="wallet-balance-amount">
          <span className="amount-number">{availableBalance.toLocaleString()}</span>
          <span className="amount-currency">جنيه مصري</span>
        </div>

        <div className="wallet-actions-row">
          <button
            type="button"
            className="wallet-action-btn primary"
            onClick={onOpenWithdraw}
          >
            <ArrowUpRight size={17} />
            <span>طلب سحب الأرباح الآن</span>
          </button>
        </div>
      </div>

      {/* History Section matching WalletScreen 1:1 */}
      <section className="wallet-history-section">
        <div className="history-header-line">
          <h4>سجل تحصيل الأتعاب</h4>
          <span className="history-count">آخر 3 عمليات</span>
        </div>

        <div className="transactions-list">
          <div className="txn-card-item">
            <div className="txn-icon-wrap">
              <ArrowDownLeft size={18} className="text-emerald-600" />
            </div>
            <div className="txn-info-box">
              <h5 className="txn-title">أتعاب: حضور تحقيق نيابة العجوزة</h5>
              <span className="txn-sub">الموكل: أ/ طارق عبد الرحمن</span>
              <span className="txn-date">أمس، 2:15 م</span>
            </div>
            <div className="txn-amount-val amount-credit">+600 ج.م</div>
          </div>

          <div className="txn-card-item">
            <div className="txn-icon-wrap">
              <ArrowDownLeft size={18} className="text-emerald-600" />
            </div>
            <div className="txn-info-box">
              <h5 className="txn-title">أتعاب: استشارة قانونية عاجلة (محاميك حالاً)</h5>
              <span className="txn-sub">الموكل: أ/ كمال محمود</span>
              <span className="txn-date">28 أكتوبر 2026</span>
            </div>
            <div className="txn-amount-val amount-credit">+350 ج.م</div>
          </div>

          <div className="txn-card-item">
            <div className="txn-icon-wrap">
              <ArrowDownLeft size={18} className="text-emerald-600" />
            </div>
            <div className="txn-info-box">
              <h5 className="txn-title">أتعاب: صياغة وتوثيق عقد إيجار مقهى تجاري</h5>
              <span className="txn-sub">شركة النور للمقاولات</span>
              <span className="txn-date">25 أكتوبر 2026</span>
            </div>
            <div className="txn-amount-val amount-credit">+900 ج.م</div>
          </div>
        </div>
      </section>
    </main>
  );
}

