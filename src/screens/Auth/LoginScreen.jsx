import React, { useState } from 'react';
import { Lock, Eye, EyeOff, User, Scale } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { sanitizeText } from '../../lib/security';
import { authApi, tokenStorage } from '../../services/apiClient';
import SafeIllustration from '../../assets/illustrations/auth-safe.svg';
import './LoginScreen.css';

export default function LoginScreen({
  onLoginSuccess,
  onGuestLogin,
  onLawyerLogin,
  onNavigateRegister,
  onNavigateForgot,
}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isLawyerLoading, setIsLawyerLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanIdentifier = sanitizeText(identifier, 100);
    if (!cleanIdentifier) {
      setErrorMsg('أدخل رقم الهاتف أو البريد الإلكتروني');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('كلمة المرور لا تقل عن 6 أحرف');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.login(cleanIdentifier, password, rememberMe);
      if (res.success && res.data) {
        tokenStorage.setAccessToken(res.data.accessToken);
        tokenStorage.setRefreshToken(res.data.refreshToken);
        if (onLoginSuccess) {
          onLoginSuccess(res.data.user);
        }
      } else {
        setErrorMsg(res.error || 'فشل تسجيل الدخول');
      }
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestClick = () => {
    setIsGuestLoading(true);
    setTimeout(() => {
      setIsGuestLoading(false);
      onGuestLogin?.();
    }, 250);
  };

  const handleLawyerClick = () => {
    setIsLawyerLoading(true);
    setTimeout(() => {
      setIsLawyerLoading(false);
      onLawyerLogin?.();
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
        {/* Identifier Input */}
        <Input
          type="text"
          placeholder="رقم الهاتف أو البريد الإلكتروني"
          icon={User}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
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
          <button 
            type="button" 
            className="forgot-btn"
            onClick={onNavigateForgot}
          >
            نسيت كلمة المرور؟
          </button>
        </div>

        {/* Main Submit */}
        <Button type="submit" isLoading={isLoading} className="w-full">
          <span>دخول</span>
        </Button>

        {/* Guest Action */}
        <Button
          type="button"
          variant="secondary"
          isLoading={isGuestLoading}
          disabled={isLoading || isGuestLoading || isLawyerLoading}
          className="w-full"
          onClick={handleGuestClick}
        >
          الدخول كزائر
        </Button>

        {/* Lawyer Demo Action */}
        <Button
          type="button"
          variant="secondary"
          isLoading={isLawyerLoading}
          disabled={isLoading || isGuestLoading || isLawyerLoading}
          className="w-full flex items-center justify-center gap-2 border border-blue-200 text-[#1D4ED8] bg-blue-50/60 hover:bg-blue-100/60 font-bold"
          onClick={handleLawyerClick}
        >
          <Scale size={17} className="text-[#1D4ED8]" />
          <span>دخول كمحامي</span>
        </Button>

        {/* Register */}
        <div className="register-row">
          <span>ليس لديك حساب؟</span>
          <button 
            type="button" 
            className="register-btn"
            onClick={onNavigateRegister}
          >
            إنشاء حساب جديد
          </button>
        </div>
      </form>
    </div>
  );
}
