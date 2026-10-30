import React from 'react';
import './Switch.css';

/**
 * زر التبديل المخصص (Switch) مع تأثيرات الحركة السلسة
 */
export default function Switch({ checked, onChange, id, ariaLabel = 'تبديل التواجد' }) {
  return (
    <div className="presence-switch-wrapper">
      <label className="presence-switch" htmlFor={id}>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          aria-label={ariaLabel}
        />
        <span className="slider" />
      </label>
    </div>
  );
}

