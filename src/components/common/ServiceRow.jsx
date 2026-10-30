import React from 'react';
import { ChevronLeft } from 'lucide-react';
import './ServiceRow.css';

export default function ServiceRow({
  icon: Icon,
  imageSrc,
  title,
  desc,
  isHighlighted = false,
  onAction,
}) {
  return (
    <button
      type="button"
      className={`service-row-item ${isHighlighted ? 'service-row-highlight' : ''}`}
      onClick={onAction}
      aria-label={`طلب ${title}`}
    >
      <div className="service-row-lead">
        {imageSrc ? (
          <div className="service-illustration-box">
            <img src={imageSrc} alt={title} className="service-illustration-img" />
          </div>
        ) : (
          <div className={`service-icon-box ${isHighlighted ? 'icon-box-highlight' : ''}`}>
            {Icon && <Icon size={20} />}
          </div>
        )}
        <div className="service-text-group">
          <h4>{title}</h4>
          <p>{desc}</p>
        </div>
      </div>
      <div className={`service-arrow-box ${isHighlighted ? 'arrow-box-highlight' : ''}`}>
        <ChevronLeft size={18} />
      </div>
    </button>
  );
}
