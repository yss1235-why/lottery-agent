// src/contexts/ErrorContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';

const ErrorContext = createContext();

export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState({});
  const [successMessages, setSuccessMessages] = useState({});
  
  const setError = useCallback((key, message) => {
    setErrors(prev => ({
      ...prev,
      [key]: message
    }));
    
    // Clear error after 5 seconds
    setTimeout(() => {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }, 5000);
  }, []);
  
  const clearError = useCallback((key) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }, []);
  
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);
  
  const setSuccess = useCallback((key, message) => {
    setSuccessMessages(prev => ({
      ...prev,
      [key]: message
    }));
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[key];
        return newMessages;
      });
    }, 5000);
  }, []);
  
  const clearSuccess = useCallback((key) => {
    setSuccessMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[key];
      return newMessages;
    });
  }, []);
  
  const clearAllSuccess = useCallback(() => {
    setSuccessMessages({});
  }, []);
  
  const value = {
    errors,
    successMessages,
    setError,
    clearError,
    clearAllErrors,
    setSuccess,
    clearSuccess,
    clearAllSuccess
  };
  
  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => useContext(ErrorContext);