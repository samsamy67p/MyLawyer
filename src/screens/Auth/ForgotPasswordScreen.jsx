import React, { useState } from 'react';
import { Mail, Lock, KeyRound, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../services/apiClient';

export default function ForgotPasswordScreen({ onNavigateLogin }) {
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP & new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('أدخل بريد إلكتروني صحيح');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await authApi.forgotPassword(email);
      setSuccessMsg(res.message);
      setStep(2);
    } catch (err) {
      setErrorMsg(err.message || 'فشل إرسال رمز التحقق');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMsg('رمز التحقق يجب أن يتكون من 6 أرقام');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('كلمة المرور وتأكيدها غير متطابقين');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await authApi.resetPassword({
        email,
        otp,
        newPassword,
        confirmPassword
      });
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onNavigateLogin?.();
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(err.message || 'فشل تغيير كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-6 max-w-[440px] mx-auto justify-center" dir="rtl">
      <div className="text-right mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">استعادة كلمة المرور</h1>
        <p className="text-sm text-slate-600">
          {step === 1 ? 'أدخل بريدك الإلكتروني المسجل وسنرسل لك رمز استعادة كلمة المرور' : 'أدخل رمز التحقق وكلمة المرور الجديدة'}
        </p>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded-[7px] text-xs mb-4">{errorMsg}</div>}
      {successMsg && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-[7px] text-xs mb-4">{successMsg}</div>}

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="البريد الإلكتروني"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" isLoading={isLoading} className="w-full">
            <span>إرسال رمز التحقق</span>
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
          <Input
            type="text"
            placeholder="رمز التحقق (6 أرقام)"
            icon={KeyRound}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
          />
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="كلمة المرور الجديدة"
            icon={Lock}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            leftElement={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 p-1">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="تأكيد كلمة المرور الجديدة"
            icon={Lock}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" isLoading={isLoading} className="w-full">
            <span>تحديث كلمة المرور والدخول</span>
          </Button>
        </form>
      )}

      <button
        type="button"
        className="mt-6 flex items-center justify-center gap-2 text-sm text-blue-700 font-semibold bg-transparent border-none cursor-pointer"
        onClick={onNavigateLogin}
      >
        <ArrowRight size={16} />
        <span>العودة لتسجيل الدخول</span>
      </button>
    </div>
  );
}

