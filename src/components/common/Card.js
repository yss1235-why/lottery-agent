// src/components/common/Card.js
import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  onClick,
  ...props 
}) => {
  return (
    <div 
      className={`card ${className}`} 
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;