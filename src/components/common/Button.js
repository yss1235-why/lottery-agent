// src/components/common/Button.js
import React from 'react';

/**
 * Reusable Button component
 * 
 * @param {string} variant - Button style variant (primary, secondary, danger, success)
 * @param {string} size - Button size (small, medium, large)
 * @param {boolean} isLoading - Whether the button is in loading state
 * @param {boolean} disabled - Whether the button is disabled
 * @param {function} onClick - Click handler function
 * @param {string} type - Button type (button, submit, reset)
 * @param {React.ReactNode} children - Button content
 */
const Button = ({ 
  variant = 'primary', 
  size = 'medium', 
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  children,
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'btn-primary';
      case 'secondary':
        return 'btn-secondary';
      case 'danger':
        return 'btn-danger';
      case 'success':
        return 'btn-success';
      case 'outline':
        return 'btn-outline';
      default:
        return 'btn-primary';
    }
  };
  
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'btn-small';
      case 'medium':
        return '';
      case 'large':
        return 'btn-large';
      default:
        return '';
    }
  };
  
  return (
    <button
      type={type}
      className={`btn ${getVariantClass()} ${getSizeClass()} ${isLoading ? 'loading' : ''} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      variant={variant} // Add variant as an attribute for CSS targeting
      {...props}
    >
      {isLoading ? (
        <>
          <span className="loading-spinner"></span>
          <span className="loading-text">Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;