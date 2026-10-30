import React from 'react';
import {
  ChevronRight,
  CreditCard,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import transferMoneySvg from '../../../assets/illustrations/undraw_transfer-money_5wd8.svg';
import confirmedSvg from '../../../assets/illustrations/undraw_confirmed_c5lo.svg';
import { PAYMENT_STATUS } from '../../../hooks/useLawyerNowOrderFlow';

/**
 * Dedicated Payment & Confirmation Screen Overlay for "محاميك حالاً".
 * - Uses `undraw_transfer-money_5wd8.svg` in the pre-confirmation payment stage (`تأكيد الطلب والدفع`).
 * - Displays a clear loading state while the payment is being processed and blocks duplicate taps.
 * - Transitions to the "تم الدفع" confirmation view using `undraw_confirmed_c5lo.svg` only after actual success.
 * - Both stages use pre-calculated fixed illustration slots (`Zero Layout Shift`) with smooth entrance animation.
 * - Formats payment details in a clean table with a 5-second countdown before advancing to the next step.
 */
export default function LawyerNowPaymentOverlay({
  bookedLawyer,
  evaluatedPrice = 350,
  selectedPaymentMethod = 'card',
  paymentStatus = PAYMENT_STATUS.IDLE,
  paymentError = '',
  paymentReceipt = null,
  confirmationCountdown = 5,
  onSelectPaymentMethod,
  onBack,
  onConfirmPayment,
  onContinueAfterConfirmation,
}) {
  if (!bookedLawyer) return null;

  const isProcessing = paymentStatus === PAYMENT_STATUS.PROCESSING;
  const isConfirmed =
    paymentStatus === PAYMENT_STATUS.CONFIRMED && Boolean(paymentReceipt);
  const isFailed = paymentStatus === PAYMENT_STATUS.FAILED;

  const paymentMethodLabel =
    (paymentReceipt?.paymentMethod || selectedPaymentMethod) === 'wallet'
      ? 'محفظة إلكترونية'
      : 'بطاقة بنكية';

  return (
    <div className="payment-screen-overlay">
      <header className="payment-top-bar">
        <button
          type="button"
          className="lawyer-now-back-btn"
          disabled={isProcessing}
          onClick={() => onBack?.(bookedLawyer)}
          aria-label="رجوع"
        >
          <ChevronRight size={22} />
        </button>
        <h3 className="payment-top-title">
          {isConfirmed ? 'تم الدفع' : 'تأكيد الطلب والدفع'}
        </h3>
        <div className="w-[36px]"></div>
      </header>

      {isConfirmed ? (
        <main className="payment-content-body payment-confirmed-body stage-fade-in">
          <div className="payment-confirmed-center">
            <div className="payment-confirmed-illustration-slot">
              <img
                src={confirmedSvg}
                alt="تم الدفع بنجاح"
                width="136"
                height="136"
                decoding="sync"
                className="payment-confirmed-illustration"
              />
            </div>
            <h2 className="payment-confirmed-title">تم الدفع بنجاح</h2>
            <p className="payment-confirmed-sub">
              تم تأكيد الدفع والمحامي في طريقه إليك الآن
            </p>

            {/* Payment Details Table */}
            <table className="payment-receipt-table">
              <tbody>
                <tr>
                  <th>المبلغ المدفوع</th>
                  <td className="text-[#1D4ED8] font-bold">
                    {paymentReceipt?.amount || evaluatedPrice} ج.م
                  </td>
                </tr>
                <tr>
                  <th>المحامي</th>
                  <td>{bookedLawyer.name}</td>
                </tr>
                <tr>
                  <th>وسيلة الدفع</th>
                  <td>{paymentMethodLabel}</td>
                </tr>
                {paymentReceipt?.transactionId && (
                  <tr>
                    <th>رقم العملية</th>
                    <td dir="ltr">{paymentReceipt.transactionId}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* 5-Second Countdown Text */}
            <p className="payment-countdown-note">
              سيتم الانتقال للخطوة التالية خلال{' '}
              <strong>{confirmationCountdown}</strong> ثوانٍ...
            </p>
          </div>
        </main>
      ) : (
        <main className="payment-content-body">
          {/* Payment Stage Hero Illustration (Pre-calculated Fixed Slot + Smooth Animation) */}
          <div className="payment-hero-box">
            <div className="payment-hero-illustration-slot">
              <img
                src={transferMoneySvg}
                alt="تأكيد الطلب والدفع"
                width="165"
                height="125"
                decoding="sync"
                className="payment-hero-illustration"
              />
            </div>
          </div>

          {/* Selected Lawyer Summary Row */}
          <div className="payment-lawyer-summary">
            <img
              src={bookedLawyer.avatar}
              alt={bookedLawyer.name}
              className="payment-lawyer-avatar"
            />
            <div className="payment-lawyer-info">
              <h4>{bookedLawyer.name}</h4>
              <p>{bookedLawyer.specialty}</p>
              <div className="payment-lawyer-meta">
                <span>
                  يبعد {bookedLawyer.formattedDistanceKm || bookedLawyer.distanceKm} كم
                </span>
                <span>•</span>
                <span>
                  يصل خلال ~{bookedLawyer.formattedDurationMins || '12'} دقيقة
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Options */}
          <div className="payment-methods-list">
            {[
              {
                id: 'card',
                title: 'بطاقة بنكية (فيزا / ميزة / ماستركارد)',
                sub: 'دفع إلكتروني فوري آمن',
              },
              {
                id: 'wallet',
                title: 'محفظة إلكترونية (فودافون كاش / انستاباي)',
                sub: 'تحويل سريع بالمحفظة',
              },
            ].map((method) => (
              <button
                key={method.id}
                type="button"
                disabled={isProcessing}
                className={`payment-method-item ${
                  selectedPaymentMethod === method.id ? 'method-selected' : ''
                }`}
                onClick={() => onSelectPaymentMethod?.(method.id)}
              >
                <div className="payment-method-icon">
                  <CreditCard size={18} className="text-[#1D4ED8]" />
                </div>
                <div className="payment-method-texts">
                  <h5>{method.title}</h5>
                  <p>{method.sub}</p>
                </div>
                <div
                  className={`payment-radio-dot ${
                    selectedPaymentMethod === method.id ? 'radio-checked' : ''
                  }`}
                ></div>
              </button>
            ))}
          </div>

          {/* Fee Summary */}
          <div className="payment-summary-rows">
            <div className="payment-row">
              <span>رسوم الخدمة والانتقال الفوري</span>
              <strong>{evaluatedPrice} ج.م</strong>
            </div>
            <div className="payment-divider"></div>
            <div className="payment-row payment-total-row">
              <span>الإجمالي المستحق</span>
              <strong className="text-[#1D4ED8]">{evaluatedPrice} ج.م</strong>
            </div>
          </div>

          {/* Payment Error State (if payment failed) */}
          {isFailed && (
            <div className="payment-error-notice" role="alert">
              <AlertCircle size={17} className="text-red-600 shrink-0" />
              <span>
                {paymentError || 'تعذر إتمام عملية الدفع. يرجى المحاولة مرة أخرى.'}
              </span>
            </div>
          )}
        </main>
      )}

      <footer className="payment-bottom-bar">
        {isConfirmed ? (
          <button
            type="button"
            className="payment-confirm-btn"
            onClick={() => onContinueAfterConfirmation?.(bookedLawyer)}
          >
            <CheckCircle2 size={19} />
            <span>متابعة الآن ({confirmationCountdown}ث)</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={isProcessing}
            className="payment-confirm-btn"
            onClick={() => onConfirmPayment?.(bookedLawyer)}
          >
            {isProcessing ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                <span>جاري معالجة وتأكيد الدفع...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={19} />
                <span>{isFailed ? 'إعادة محاولة الدفع' : 'إتمام الدفع'}</span>
              </>
            )}
          </button>
        )}
      </footer>
    </div>
  );
}
