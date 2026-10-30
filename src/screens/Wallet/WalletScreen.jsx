import React from 'react';
import { PlusCircle, ArrowDownLeft, ArrowUpRight, ShieldCheck, CreditCard } from 'lucide-react';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import './WalletScreen.css';

const TRANSACTIONS = [
  {
    id: 'TXN-101',
    title: 'دفع مقابل: محاميك حالاً',
    lawyer: 'أ/ كريم الديب',
    amount: -350,
    date: '30 أكتوبر 2026',
    type: 'DEBIT',
  },
  {
    id: 'TXN-100',
    title: 'شحن رصيد المحفظة',
    lawyer: 'بطاقة بنكية •••• 4242',
    amount: +1000,
    date: '27 أكتوبر 2026',
    type: 'CREDIT',
  },
  {
    id: 'TXN-099',
    title: 'دفع مقابل: استشارة هاتفية',
    lawyer: 'أ/ سارة المهدي',
    amount: -200,
    date: '25 أكتوبر 2026',
    type: 'DEBIT',
  },
];

export default function WalletScreen({ activeNavTab = 'wallet', onNavTabChange }) {
  const balance = 450;

  return (
    <div className="wallet-screen-layout">
      <Header title="المحفظة" />

      <main className="wallet-main-content">
        {/* Balance Card */}
        <div className="wallet-balance-card">
          <div className="wallet-balance-top">
            <span className="balance-title">الرصيد المتاح</span>
            <div className="wallet-badge-secure">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>محمي ومؤمن</span>
            </div>
          </div>

          <div className="wallet-balance-amount">
            <span className="amount-number">{balance}</span>
            <span className="amount-currency">ج.م</span>
          </div>

          <div className="wallet-actions-row">
            <button
              type="button"
              className="wallet-action-btn primary"
              onClick={() => alert('إضافة رصيد للمحفظة قريباً')}
            >
              <PlusCircle size={16} />
              <span>شحن رصيد</span>
            </button>
            <button
              type="button"
              className="wallet-action-btn secondary"
              onClick={() => alert('إدارة البطاقات قريباً')}
            >
              <CreditCard size={16} />
              <span>البطاقات المسجلة</span>
            </button>
          </div>
        </div>

        {/* Transactions Section */}
        <section className="wallet-history-section">
          <div className="history-header-line">
            <h4>سجل المعاملات</h4>
            <span className="history-count">آخر 3 عمليات</span>
          </div>

          <div className="transactions-list">
            {TRANSACTIONS.map((txn) => {
              const isCredit = txn.type === 'CREDIT';
              return (
                <div key={txn.id} className="txn-card-item">
                  <div className="txn-icon-wrap">
                    {isCredit ? (
                      <ArrowDownLeft size={18} className="text-emerald-600" />
                    ) : (
                      <ArrowUpRight size={18} className="text-rose-600" />
                    )}
                  </div>

                  <div className="txn-info-box">
                    <h5 className="txn-title">{txn.title}</h5>
                    <span className="txn-sub">{txn.lawyer}</span>
                    <span className="txn-date">{txn.date}</span>
                  </div>

                  <div
                    className={`txn-amount-val ${isCredit ? 'amount-credit' : 'amount-debit'}`}
                  >
                    {isCredit ? `+${txn.amount}` : `${txn.amount}`} ج.م
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <BottomNav activeTab={activeNavTab} onTabChange={onNavTabChange} />
    </div>
  );
}

