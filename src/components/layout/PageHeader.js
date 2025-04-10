// src/components/layout/PageHeader.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Page header component with title, back button, and actions
 * 
 * @param {string} title - Page title
 * @param {boolean} showBack - Whether to show back button
 * @param {string} backUrl - URL to navigate to when back button is clicked
 * @param {React.ReactNode} actions - Action buttons to show in header
 */
const PageHeader = ({ 
  title, 
  showBack = false,
  backUrl = '',
  actions
}) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };
  
  return (
    <div className="page-header">
      <div className="header-left">
        {showBack && (
          <button 
            className="back-button"
            onClick={handleBack}
            aria-label="Go back"
          >
            <span className="back-icon"></span>
          </button>
        )}
        
        <h1 className="page-title">{title}</h1>
      </div>
      
      {actions && (
        <div className="header-actions">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;