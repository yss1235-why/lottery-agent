// src/components/common/Loading.js
import React from 'react';
import '../../assets/styles/LoadingSpinner.css';

/**
 * Enhanced Loading component with size variants and message
 * 
 * @param {string} message - Optional loading message
 * @param {string} size - Optional size (small, medium, large)
 * @param {boolean} fullPage - Whether to show a full page overlay
 */
const Loading = ({ 
  message = 'Loading...', 
  size = 'medium',
  fullPage = false 
}) => {
  // Full page overlay
  if (fullPage) {
    return (
      <div className="full-page-loading">
        <div className={`loading-spinner ${size}`}></div>
        <p className="loading-message">{message}</p>
      </div>
    );
  }
  
  // Logo style loading
  if (size === 'logo') {
    return (
      <div className="loading-container">
        <div className="logo-loading">
          <h1>Lottery Agent</h1>
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>
        <p className="loading-message">{message}</p>
      </div>
    );
  }

  // Default loading spinner
  return (
    <div className="loading-container">
      <div className={`loading-spinner ${size}`}></div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default Loading;