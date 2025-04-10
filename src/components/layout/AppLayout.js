// src/components/layout/AppLayout.js
import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../hooks/useAuth';
import { getAgentBalance } from '../../services/balanceService';
import { formatCurrency } from '../../utils/currencyFormatter';
import Sidebar from './Sidebar';
import SidebarToggle from './SidebarToggle';
import NotificationAlert from '../notifications/NotificationAlert';

const AppLayout = () => {
  const { notifications, markAsRead } = useNotifications();
  const { currentUser } = useAuth();
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [balance, setBalance] = useState(null);
  
  // Handle sidebar toggle for mobile
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarOpen && !e.target.closest('.sidebar') && !e.target.closest('.sidebar-toggle')) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sidebarOpen]);
  
  // Track new notifications
  useEffect(() => {
    // Check for new unread notifications
    const newUnread = notifications.filter(
      notification => !notification.isRead && 
      !activeNotifications.some(active => active.id === notification.id)
    );
    
    if (newUnread.length > 0) {
      setActiveNotifications(prev => [...prev, ...newUnread]);
    }
  }, [notifications]);
  
  // Fetch balance
  useEffect(() => {
    if (currentUser) {
      const fetchBalance = async () => {
        try {
          const balanceData = await getAgentBalance(currentUser.uid);
          setBalance(balanceData);
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      };
      
      fetchBalance();
      
      // Refresh balance every minute
      const intervalId = setInterval(fetchBalance, 60000);
      return () => clearInterval(intervalId);
    }
  }, [currentUser]);
  
  // Handle notification dismissal
  const handleDismiss = (notificationId) => {
    setActiveNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };
  
  // Handle marking notification as read
  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
    handleDismiss(notificationId);
  };
  
  return (
    <div className="app-layout">
      <Sidebar className={sidebarOpen ? 'open' : ''} />
      <SidebarToggle isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      {/* Top header with balance */}
      <div className="top-header">
        <div className="balance-display">
          <Link to="/balance" className="balance-link">
            <span className="balance-label">Available Balance:</span>
            <span className="balance-value">{formatCurrency(balance?.amount || 0)}</span>
          </Link>
        </div>
      </div>
      
      <div className="main-content">
        <Outlet />
      </div>
      
      <div className="notification-alerts">
        {activeNotifications.map(notification => (
          <NotificationAlert
            key={notification.id}
            notification={notification}
            onDismiss={handleDismiss}
            onMarkAsRead={handleMarkAsRead}
          />
        ))}
      </div>
    </div>
  );
};

export default AppLayout;