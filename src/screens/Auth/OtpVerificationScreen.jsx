import React, { useState, useEffect } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../services/apiClient';
import MessageSentIllustration from '../../assets/undraw_message-sent_iyz6.svg';
import './OtpVerificationScreen.css';

export default function OtpVerificationScreen({ email, onVerified, onBack }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('أدخل رمز التحقق المكون من 6 أرقام كاملاً');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await authApi.verifyOtp(email, fullOtp);
      if (res.success) {
        setSuccessMsg(res.message || 'تم التحقق بنجاح');
        setTimeout(() => {
          onVerified?.(res.data);
        }, 1200);
      } else {
        setErrorMsg(res.error || 'رمز التحقق غير صحيح');
      }
    } catch (err) {
      setErrorMsg(err.message || 'فشل التحقق من الرمز');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMsg('');
    try {
      const res = await authApi.resendOtp(email);
      if (res.success) {
        setSuccessMsg('تم إرسال رمز تحقق جديد بنجاح');
        setResendCooldown(60);
        setOtp(['', '', '', '', '', '']);
      } else {
        setErrorMsg(res.error || 'تعذر إعادة الإرسال');
      }
    } catch (err) {
      setErrorMsg(err.message || 'تعذر إعادة إرسال الرمز');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="otp-screen-layout">
      <div className="otp-illustration-wrap">
        <img
          src={MessageSentIllustration}
          alt="تم إرسال رمز التحقق"
          className="otp-illustration-img"
        />
      </div>

      <div className="otp-intro-box">
        <h1 className="otp-title">تأكيد البريد الإلكتروني</h1>
        <p className="otp-desc">
          تم إرسال رمز التحقق (OTP) إلى بريدك الإلكتروني:
          <br />
          <strong className="text-[#0F172A]">{email}</strong>
        </p>
      </div>

      {errorMsg && <div className="otp-error-bar">{errorMsg}</div>}
      {successMsg && <div className="otp-success-bar">{successMsg}</div>}

      <form onSubmit={handleVerify} className="otp-form">
        <div className="otp-inputs-row" dir="ltr">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-input-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="otp-digit-field"
              autoFocus={idx === 0}
            />
          ))}
        </div>

        <div className="otp-actions-group">
          <Button type="submit" isLoading={isLoading} className="w-full">
            <span>تأكيد الرمز والتفعيل</span>
          </Button>

          {onBack && (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={onBack}
            >
              <ArrowRight size={16} />
              <span>العودة لتعديل البيانات</span>
            </Button>
          )}
        </div>

        {/* Resend Cooldown */}
        <div className="resend-row">
          {resendCooldown > 0 ? (
            <span className="resend-countdown">إعادة إرسال الرمز خلال {resendCooldown} ثانية</span>
          ) : (
            <button
              type="button"
              className="resend-btn"
              onClick={handleResend}
              disabled={isResending}
            >
              <RefreshCw size={14} className={isResending ? 'animate-spin' : ''} />
              <span>إعادة إرسال رمز التحقق</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
