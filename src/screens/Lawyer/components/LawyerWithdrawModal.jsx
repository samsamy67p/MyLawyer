import React, { useState } from 'react';
import { Wallet, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export default function LawyerWithdrawModal({
  isOpen,
  onClose,
  availableBalance,
  onConfirmWithdrawal,
}) {
  const [withdrawMethod, setWithdrawMethod] = useState('instapay'); // 'instapay' | 'vodafone_cash' | 'bank'
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || amountNum <= 0 || amountNum > availableBalance) return;

    onConfirmWithdrawal?.(amountNum, { method: withdrawMethod, account: withdrawAccount });
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      setWithdrawAmount('');
      setWithdrawAccount('');
    }, 1800);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-[12px] sm:rounded-[7px] max-w-[480px] w-full p-5 flex flex-col gap-3 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Wallet size={20} className="text-[#1D4ED8]" />
            <h3 className="text-sm font-bold text-slate-900 m-0">طلب سحب الأتعاب</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer text-lg p-1"
          >
            ✕
          </button>
        </div>

        {isSuccess ? (
          <div className="py-6 text-center">
            <CheckCircle2 size={44} className="text-emerald-600 mx-auto mb-2 animate-bounce" />
            <h4 className="text-sm font-bold text-emerald-900 mb-1">تم إرسال طلب السحب بنجاح!</h4>
            <p className="text-xs text-emerald-700 m-0">
              سيتم تحويل المبلغ إلى حسابك المحدد في غضون دقائق معدودة.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="text-xs text-slate-600">
              الرصيد المتاح للسحب: <strong className="text-emerald-600 font-bold">{availableBalance} ج.م</strong>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">وسيلة التحويل:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setWithdrawMethod('instapay')}
                  className={`p-2 text-xs font-bold rounded-[6px] border text-center transition-all ${
                    withdrawMethod === 'instapay'
                      ? 'bg-blue-50 border-blue-600 text-[#1D4ED8]'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  إنستاباي (IPA)
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawMethod('vodafone_cash')}
                  className={`p-2 text-xs font-bold rounded-[6px] border text-center transition-all ${
                    withdrawMethod === 'vodafone_cash'
                      ? 'bg-blue-50 border-blue-600 text-[#1D4ED8]'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  محفظة كاش
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawMethod('bank')}
                  className={`p-2 text-xs font-bold rounded-[6px] border text-center transition-all ${
                    withdrawMethod === 'bank'
                      ? 'bg-blue-50 border-blue-600 text-[#1D4ED8]'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  حساب بنكي (IBAN)
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">
                {withdrawMethod === 'instapay'
                  ? 'عنوان الدفع اللحظي (IPA / رقم الهاتف):'
                  : withdrawMethod === 'vodafone_cash'
                  ? 'رقم المحفظة الإلكترونية:'
                  : 'رقم الآيبان (IBAN) البنكي:'}
              </label>
              <input
                type="text"
                required
                placeholder={
                  withdrawMethod === 'instapay'
                    ? 'username@instapay'
                    : withdrawMethod === 'vodafone_cash'
                    ? '010XXXXXXXX'
                    : 'EGXXXXXXXXXXXXXXXXXXXX'
                }
                value={withdrawAccount}
                onChange={(e) => setWithdrawAccount(e.target.value)}
                className="h-10 px-3 text-xs border border-slate-300 rounded-[6px] focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">المبلغ المطلوب (ج.م):</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  min="50"
                  max={availableBalance}
                  placeholder="أدخل المبلغ"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="flex-1 h-10 px-3 text-xs border border-slate-300 rounded-[6px] focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(String(availableBalance))}
                  className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-[6px] border border-slate-300"
                >
                  الكل
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 text-xs font-bold mt-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white"
            >
              تأكيد وسحب المبلغ فوراً
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
