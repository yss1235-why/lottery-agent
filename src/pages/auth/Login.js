// src/pages/auth/Login.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from '../../components/auth/LoginForm';
import '../../assets/styles/Login.css';
import '../../assets/styles/LoadingSpinner.css';

const Login = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (currentUser && !loading) {
      navigate('/dashboard');
    }
  }, [currentUser, loading, navigate]);
  
  if (loading) {
    return (
      <div className="login-loading">
        <div className="loading-spinner large"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }
  
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <h1>Lottery Agent</h1>
          <p>Agent Portal</p>
        </div>
        
        <LoginForm />
        
        <div className="login-footer">
          <p>Agent access only. For assistance, please contact the administrator.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;