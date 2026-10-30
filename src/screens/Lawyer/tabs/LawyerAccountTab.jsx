import React from 'react';
import {
  UserCheck,
  FileText,
  MapPin,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronLeft,
} from 'lucide-react';

export default function LawyerAccountTab({ user, onLogout }) {
  return (
    <main className="account-main-content">
      <div className="account-profile-card">
        <div className="account-avatar-wrap">
          {user?.profilePhotoPath ? (
            <img src={user.profilePhotoPath} alt="الصورة الشخصية" className="w-full h-full object-cover rounded-full" />
          ) : (
            <UserCheck size={26} className="text-[#1D4ED8]" />
          )}
        </div>

        <div className="account-user-details">
          <h3 className="account-user-name">
            {user?.fullName || 'المستشار / أحمد فهمي'}
          </h3>
          <span className="account-user-phone">
            {user?.phone || '01012345678'}
          </span>
          <span className="account-user-loc">
            نقابة المحامين • قيد رقم 482910 (استئناف عالي)
          </span>
        </div>
      </div>

      <div className="account-menu-list">
        <button type="button" className="account-menu-row">
          <div className="account-menu-icon-box">
            <FileText size={18} />
          </div>
          <span className="account-menu-title">بيانات القيد والدرجة القضائية المعتمدة</span>
          <ChevronLeft size={18} className="text-slate-400" />
        </button>

        <button type="button" className="account-menu-row">
          <div className="account-menu-icon-box">
            <MapPin size={18} />
          </div>
          <span className="account-menu-title">عنوان المكتب ومواعيد المقابلات</span>
          <ChevronLeft size={18} className="text-slate-400" />
        </button>

        <button type="button" className="account-menu-row">
          <div className="account-menu-icon-box">
            <Bell size={18} />
          </div>
          <span className="account-menu-title">إعدادات تنبيهات خدمة «محاميك حالاً»</span>
          <ChevronLeft size={18} className="text-slate-400" />
        </button>

        <button type="button" className="account-menu-row">
          <div className="account-menu-icon-box">
            <Shield size={18} />
          </div>
          <span className="account-menu-title">ميثاق العمل والسرية المهنية</span>
          <ChevronLeft size={18} className="text-slate-400" />
        </button>

        <button type="button" className="account-menu-row">
          <div className="account-menu-icon-box">
            <HelpCircle size={18} />
          </div>
          <span className="account-menu-title">الدعم الفني المخصص للمحامين</span>
          <ChevronLeft size={18} className="text-slate-400" />
        </button>
      </div>

      <button type="button" className="account-logout-btn" onClick={onLogout}>
        <LogOut size={18} />
        <span>تسجيل الخروج من الحساب</span>
      </button>
    </main>
  );
}

