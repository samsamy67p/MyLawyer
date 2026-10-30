import React, { useState, useRef } from 'react';
import { Phone, Mail, Lock, User, ShieldCheck, Camera, FileText, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { sanitizeText, isValidPhoneNumber } from '../../lib/security';
import { authApi } from '../../services/apiClient';
import './RegisterScreen.css';

export default function RegisterScreen({ onRegisterSuccess, onNavigateLogin }) {
  const [role, setRole] = useState('client'); // 'client' | 'lawyer'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Lawyer specific fields
  const [fullName, setFullName] = useState('');
  const [syndicateNumber, setSyndicateNumber] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [syndicateCard, setSyndicateCard] = useState(null);
  const [syndicateCardPreview, setSyndicateCardPreview] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const photoInputRef = useRef(null);
  const cardInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('حجم الصورة الشخصية يجب ألا يتجاوز 5 ميجابايت');
        return;
      }
      setProfilePhoto(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const handleCardChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('حجم صورة الكارنيه يجب ألا يتجاوز 10 ميجابايت');
        return;
      }
      setSyndicateCard(file);
      setSyndicateCardPreview(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = sanitizeText(phone, 20);
    const cleanEmail = sanitizeText(email, 100).toLowerCase();

    if (!cleanPhone || !isValidPhoneNumber(cleanPhone)) {
      setErrorMsg('أدخل رقم هاتف مصري صحيح (11 رقم)');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('أدخل بريد إلكتروني صحيح');
      return;
    }
    if (!password || password.length < 8) {
      setErrorMsg('كلمة المرور يجب ألا تقل عن 8 أحرف وأرقام');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('يجب الموافقة على الشروط والأحكام للمتابعة');
      return;
    }

    if (role === 'lawyer') {
      if (!fullName.trim()) {
        setErrorMsg('يرجى إدخال اسم المحامي كاملاً كما هو مدون بالكارنيه');
        return;
      }
      if (!syndicateCard) {
        setErrorMsg('صورة كارنيه المحاماة إلزامية لتوثيق الحساب');
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = {
        phone: cleanPhone,
        email: cleanEmail,
        password,
        confirmPassword,
        role,
        agreeTerms,
        fullName: role === 'lawyer' ? fullName.trim() : undefined,
        syndicateNumber: role === 'lawyer' ? syndicateNumber.trim() : undefined,
      };

      const res = await authApi.register(payload);

      if (res.success) {
        // If lawyer has uploaded files, upload them
        if (role === 'lawyer') {
          // Temporarily store files or send via verification
          if (profilePhoto) {
            sessionStorage.setItem('pending_lawyer_photo', 'true');
          }
        }
        if (onRegisterSuccess) {
          onRegisterSuccess({ email: cleanEmail, role });
        }
      } else {
        setErrorMsg(res.error || 'فشل التسجيل');
      }
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-screen-layout">
      <div className="register-header-box">
        <h1 className="register-main-title">إنشاء حساب جديد</h1>
        <p className="register-subtitle">انضم إلى شبكة MyLawyer القانونية الموثوقة</p>
      </div>

      {/* Role Selector Tabs */}
      <div className="role-selector-wrap">
        <button
          type="button"
          className={`role-tab-btn ${role === 'client' ? 'active' : ''}`}
          onClick={() => { setRole('client'); setErrorMsg(''); }}
        >
          <User size={18} />
          <span>حساب موكل</span>
        </button>
        <button
          type="button"
          className={`role-tab-btn ${role === 'lawyer' ? 'active' : ''}`}
          onClick={() => { setRole('lawyer'); setErrorMsg(''); }}
        >
          <ShieldCheck size={18} />
          <span>حساب محامٍ</span>
        </button>
      </div>

      {errorMsg && <div className="register-error-bar">{errorMsg}</div>}

      <form onSubmit={handleSubmit} className="register-form">
        {/* Lawyer Full Name */}
        {role === 'lawyer' && (
          <Input
            type="text"
            placeholder="الاسم الكامل للمحامي (كما بالكارنيه)"
            icon={User}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        )}

        {/* Phone */}
        <Input
          type="tel"
          placeholder="رقم الهاتف (مثال: 010XXXXXXXX)"
          icon={Phone}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        {/* Email */}
        <Input
          type="email"
          placeholder="البريد الإلكتروني"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Password */}
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="كلمة المرور (8 أحرف وأرقام على الأقل)"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          leftElement={
            <button
              type="button"
              className="text-[#94A3B8] hover:text-[#0F172A] p-1"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        {/* Confirm Password */}
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="تأكيد كلمة المرور"
          icon={Lock}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {/* Lawyer Specific Uploads */}
        {role === 'lawyer' && (
          <div className="lawyer-uploads-section">
            <h4 className="section-title">بيانات ومستندات التوثيق المهني</h4>

            {/* Syndicate Number */}
            <Input
              type="text"
              placeholder="رقم القيد بنقابة المحامين (اختياري)"
              icon={FileText}
              value={syndicateNumber}
              onChange={(e) => setSyndicateNumber(e.target.value)}
            />

            {/* Profile Photo */}
            <div className="upload-box-wrapper">
              <span className="upload-label">الصورة الشخصية للحساب (اختياري)</span>
              <input
                type="file"
                ref={photoInputRef}
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
              <div
                className="upload-dropzone"
                onClick={() => photoInputRef.current?.click()}
              >
                {profilePhotoPreview ? (
                  <div className="preview-wrap">
                    <img src={profilePhotoPreview} alt="معاينة الصورة" className="preview-img avatar" />
                    <span className="change-hint">اضغط لتغيير الصورة</span>
                  </div>
                ) : (
                  <div className="empty-upload-state">
                    <Camera size={24} className="text-[#1D4ED8]" />
                    <span>اختر صورة شخصية رسمية</span>
                  </div>
                )}
              </div>
            </div>

            {/* Syndicate Card Photo (MANDATORY) */}
            <div className="upload-box-wrapper">
              <span className="upload-label">صورة كارنيه المحاماة الساري (إلزامي للتوثيق) *</span>
              <input
                type="file"
                ref={cardInputRef}
                accept="image/*,application/pdf"
                onChange={handleCardChange}
                style={{ display: 'none' }}
              />
              <div
                className="upload-dropzone highlight"
                onClick={() => cardInputRef.current?.click()}
              >
                {syndicateCardPreview ? (
                  <div className="preview-wrap">
                    <img src={syndicateCardPreview} alt="معاينة الكارنيه" className="preview-img card" />
                    <span className="change-hint">اضغط لإعادة اختيار الملف</span>
                  </div>
                ) : (
                  <div className="empty-upload-state">
                    <FileText size={24} className="text-[#1D4ED8]" />
                    <span>رفع صورة واضحة لوجه الكارنيه الساري</span>
                  </div>
                )}
              </div>
              <p className="privacy-note">
                <ShieldCheck size={14} className="inline text-[#1D4ED8] ml-1 align-text-bottom" />
                <span>مستندات الكارنيه سرية ومحمية ولا تظهر للعامة نهائياً.</span>
              </p>
            </div>
          </div>
        )}

        {/* Terms Checkbox */}
        <div className="terms-checkbox-wrap">
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <span className="check-box"></span>
            <span>أوافق على الشروط والأحكام وسياسة الخصوصية لمنصة MyLawyer</span>
          </label>
        </div>

        {/* Action Buttons Group - Identical Symmetrical Sizes */}
        <div className="register-actions-group">
          <Button type="submit" isLoading={isLoading} className="w-full">
            <span>إنشاء الحساب ومتابعة التحقق</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onNavigateLogin}
            className="w-full"
          >
            <span>لديك حساب بالفعل؟ تسجيل الدخول</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
