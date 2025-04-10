// src/components/common/Input.js
import React from 'react';

const Input = ({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  error, 
  className = '',
  ...props 
}) => {
  return (
    <div className="input-container">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && <div className="input-error-message">{error}</div>}
    </div>
  );
};

export default Input;