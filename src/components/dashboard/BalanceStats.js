// src/components/dashboard/BalanceStats.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAgentBalance } from '../../services/balanceService';
import { formatCurrency } from '../../utils/currencyFormatter';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import ErrorMessage from '../ui/ErrorMessage';

const BalanceStats = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (currentUser) {
      fetchBalance();
    }
  }, [currentUser]);
  
  const fetchBalance = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const balanceData = await getAgentBalance(currentUser.uid);
      setBalance(balanceData);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to load balance information. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <Loading text="Loading balance stats..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} onRetry={fetchBalance} />;
  }
  
  if (!balance) {
    return null;
  }
  
  // Calculate hosting capacity
  const platformFeeRate = 0.12; // 12%
  const hostingCapacity = balance.amount * (1 - platformFeeRate);
  
  return (
    <div className="balance-stats">
      <div className="stats-grid">
        <Card className="stat-card balance-card">
          <div className="stat-icon balance-icon"></div>
          <div className="stat-content">
            <div className="stat-label">Current Balance</div>
            <div className="stat-value">{formatCurrency(balance.amount)}</div>
          </div>
        </Card>
        
        <Card className="stat-card hosting-card">
          <div className="stat-icon hosting-icon"></div>
          <div className="stat-content">
            <div className="stat-label">Hosting Capacity</div>
            <div className="stat-value">{formatCurrency(hostingCapacity)}</div>
            <div className="stat-description">After 12% platform fee</div>
          </div>
        </Card>
        
        <Card className="stat-card lotteries-card">
          <div className="stat-icon lotteries-icon"></div>
          <div className="stat-content">
            <div className="stat-label">Active Lotteries</div>
            <div className="stat-value">{balance.activeLotteries}</div>
          </div>
        </Card>
      </div>
      
      <div className="balance-actions">
        <Button
          onClick={() => navigate('/balance/deposit')}
          variant="primary"
        >
          Request Deposit
        </Button>
        
        <Button
          onClick={() => navigate('/balance')}
          variant="outline"
        >
          View Transactions
        </Button>
      </div>
    </div>
  );
};

export default BalanceStats;