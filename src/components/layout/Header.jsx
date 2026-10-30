import React from 'react';
import { Search, Bell, ChevronRight } from 'lucide-react';
import './Header.css';

export default function Header({
  title,
  showBack = false,
  onBack,
  onSearchClick,
  onNotificationClick,
}) {
  return (
    <header className="app-header-clean">
      {/* Right side: Back button (if enabled) or Search */}
      {showBack ? (
        <button
          type="button"
          className="header-action-btn"
          onClick={onBack}
          aria-label="رجوع"
        >
          <ChevronRight size={22} />
        </button>
      ) : (
        <button
          type="button"
          className="header-action-btn"
          onClick={onSearchClick}
          aria-label="بحث"
        >
          <Search size={21} />
        </button>
      )}

      {/* Title in Center: Dynamic Page Title or App Name */}
      <div className="header-title-box">
        <span className={`app-name-center ${title ? 'page-title-arabic' : ''}`}>
          {title || 'MyLawyer'}
        </span>
      </div>

      {/* Bell on Left (in RTL left is last) */}
      <button
        type="button"
        className="header-action-btn"
        onClick={onNotificationClick}
        aria-label="التنبيهات"
      >
        <Bell size={21} />
      </button>
    </header>
  );
}

