// src/App.js
import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';
import './assets/styles/TabView.css';
import './assets/styles/Tickets.css';
import './assets/styles/Lotteries.css';
import './assets/styles/Dashboard.css';
import './assets/styles/Draw.css';
import './assets/styles/DepositModal.css';
import './assets/styles/Buttons.css';
import './assets/styles/Login.css';
import './assets/styles/LoadingSpinner.css';
import './assets/styles/ImageUploader.css';
import './assets/styles/additional.css';
import './assets/styles/global.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;