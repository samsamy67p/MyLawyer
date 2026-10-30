import React from 'react';
import './ScreenLoader.css';

export default function ScreenLoader({ message = '' }) {
  return (
    <div className="screen-loader-overlay">
      <div className="dots-loader">
        <span className="dot dot-1"></span>
        <span className="dot dot-2"></span>
        <span className="dot dot-3"></span>
      </div>
      {message && <p className="loader-text">{message}</p>}
    </div>
  );
}
