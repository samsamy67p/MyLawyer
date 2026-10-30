import React from 'react';
import { Home, ClipboardList, Wallet, User } from 'lucide-react';
import { ROUTES } from '../../router/routes.js';
import './BottomNav.css';

const NAV_TABS = [
  { id: 'home', route: ROUTES.HOME, label: 'الرئيسية', icon: Home },
  { id: 'orders', route: ROUTES.ORDERS, label: 'الطلبات', icon: ClipboardList },
  { id: 'wallet', route: ROUTES.WALLET, label: 'المحفظة', icon: Wallet },
  { id: 'account', route: ROUTES.ACCOUNT, label: 'الحساب', icon: User },
];

export default function BottomNav({ activeTab = 'home', onTabChange }) {
  return (
    <nav className="bottom-nav-bar" aria-label="شريط التنقل السفلي">
      {NAV_TABS.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id || activeTab === tab.route;
        return (
          <button
            key={tab.id}
            type="button"
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange?.(tab.id, tab.route)}
            aria-selected={isActive}
          >
            <div className="bottom-nav-icon-wrap">
              <IconComponent size={22} strokeWidth={isActive ? 2.3 : 1.9} />
            </div>
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
