import React from 'react';
import {
  User,
  Phone,
  Shield,
  FileText,
  HelpCircle,
  LogOut,
  ChevronLeft,
  Bell,
  MapPin,
} from 'lucide-react';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import './AccountScreen.css';

export default function AccountScreen({
  currentUser,
  userLocation,
  onLogout,
  activeNavTab = 'account',
  onNavTabChange,
}) {
  const userName = currentUser?.name || 'مستخدم MyLawyer';
  const userPhone = currentUser?.phone || '010XXXXXXXX';

  const ACCOUNT_MENU_ITEMS = [
    { id: 'notifications', title: 'إعدادات الإشعارات والتنبيهات', icon: Bell },
    { id: 'addresses', title: 'عناويني ومواقعي المحفوظة', icon: MapPin },
    { id: 'privacy', title: 'سياسة الخصوصية وشروط الاستخدام', icon: Shield },
    { id: 'terms', title: 'عقود الاستشارات والوثائق القانونية', icon: FileText },
    { id: 'support', title: 'المساعدة والدعم الفني', icon: HelpCircle },
  ];

  return (
    <div className="account-screen-layout">
      <Header title="الحساب الشخصي" />

      <main className="account-main-content">
        {/* User Profile Card */}
        <div className="account-profile-card">
          <div className="account-avatar-wrap">
            <User size={32} className="text-[#1D4ED8]" />
          </div>

          <div className="account-user-details">
            <h3 className="account-user-name">{userName}</h3>
            <div className="account-user-phone">
              <Phone size={13} />
              <span>{userPhone}</span>
            </div>
            {userLocation?.address && (
              <div className="account-user-loc">
                <MapPin size={13} />
                <span>{userLocation.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items List */}
        <div className="account-menu-list">
          {ACCOUNT_MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className="account-menu-row"
                onClick={() => alert(`قريباً: ${item.title}`)}
              >
                <div className="account-menu-icon-box">
                  <Icon size={18} />
                </div>
                <span className="account-menu-title">{item.title}</span>
                <ChevronLeft size={16} className="text-[#94A3B8]" />
              </button>
            );
          })}
        </div>

        {/* Logout Button */}
        <button
          type="button"
          className="account-logout-btn"
          onClick={() => onLogout?.()}
        >
          <LogOut size={18} />
          <span>تسجيل الخروج من الحساب</span>
        </button>
      </main>

      <BottomNav activeTab={activeNavTab} onTabChange={onNavTabChange} />
    </div>
  );
}

