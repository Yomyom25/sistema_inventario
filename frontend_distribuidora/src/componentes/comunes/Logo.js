import React from 'react';
import './Logo.css';

const Logo = () => {
  return (
    <div className="logo-container">
      <div className="logo-truck-detailed">
        <div className="truck-cab">🚛</div>
        <div className="truck-trailer">
          <div className="trailer-content">
            <span className="logo-dm">DM</span>
          </div>
        </div>
      </div>
      <h1 className="logo-title">DISTRIBUIDORA</h1>
      <h2 className="logo-subtitle">MARTIN</h2>
    </div>
  );
};

export default Logo;