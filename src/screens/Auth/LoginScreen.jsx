import React, { useState } from 'react';
import { Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { sanitizeText, isValidPhoneNumber } from '../../lib/security';
import SafeIllustration from '../../assets/illustrations/auth-safe.svg';
import './LoginScreen.css';

export default function LoginScreen({ onLoginSuccess, onGuestLogin }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = sanitizeText(phone, 20);
    if (!cleanPhone || !isValidPhoneNumber(cleanPhone)) {
      setErrorMsg('أدخل رقم هاتف صحيح');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('كلمة المرور لا تقل عن 6 أحرف');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess({ phone: cleanPhone, isGuest: false });
      }
    }, 300);
  };

  const handleGuestClick = () => {
    setIsGuestLoading(true);
    setTimeout(() => {
      setIsGuestLoading(false);
      onGuestLogin?.();
    }, 250);
  };

  return (
    <div className="login-screen-clean">
      {/* Top Illustration */}
      <div className="auth-illustration-wrap">
        <img
          src={SafeIllustration}
          alt="الأمان والسرية القانونية"
          decoding="sync"
          fetchPriority="high"
          className="auth-svg-img"
        />
      </div>

      {/* Title */}
      <div className="login-intro">
        <h1 className="main-title">تسجيل الدخول</h1>
        <p className="sub-title">أهلاً بك، سجل الدخول لمتابعة خدماتك بأمان</p>
      </div>

      {errorMsg && <div className="error-bar">{errorMsg}</div>}

      <form onSubmit={handleSubmit} className="clean-form">
        {/* Phone Input with Phone Icon */}
        <Input
          type="tel"
          placeholder="رقم الهاتف"
          icon={Phone}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        {/* Password Input with Lock Icon */}
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="كلمة المرور"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          leftElement={
            <button
              type="button"
              className="text-[#94A3B8] hover:text-[#0F172A] transition-colors p-1"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="إظهار كلمة المرور"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        {/* Remember me & forgot */}
        <div className="extra-actions">
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="check-box"></span>
            <span>تذكرني</span>
          </label>
          <button type="button" className="forgot-btn">نسيت كلمة المرور؟</button>
        </div>

        {/* Main Submit - Arrow Removed */}
        <Button type="submit" isLoading={isLoading} className="w-full">
          <span>دخول</span>
        </Button>

        {/* Guest Action */}
        <Button
          type="button"
          variant="secondary"
          isLoading={isGuestLoading}
          disabled={isLoading || isGuestLoading}
          className="w-full"
          onClick={handleGuestClick}
        >
          الدخول كزائر
        </Button>

        {/* Register */}
        <div className="register-row">
          <span>ليس لديك حساب؟</span>
          <button type="button" className="register-btn">إنشاء حساب جديد</button>
        </div>
      </form>
    </div>
  );
}
