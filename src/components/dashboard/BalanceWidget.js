// src/components/dashboard/BalanceWidget.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAgentBalance } from '../../services/balanceService';
import { formatCurrency } from '../../utils/currencyFormatter';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Loading from '../ui/Loading';

const BalanceWidget = () => {
  const { currentUser } = useAuth();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (currentUser) {
      fetchBalance();
    }
  }, [currentUser]);
  
  const fetchBalance = async () => {
    try {
      setLoading(true);
      const balanceData = await getAgentBalance(currentUser.uid);
      setBalance(balanceData);
      setError(null);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Could not load balance information');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Card className="balance-widget">
        <Loading text="Loading balance..." />
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="balance-widget">
        <div className="balance-error">
          <p>{error}</p>
          <Button onClick={fetchBalance} variant="outline" size="small">Retry</Button>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="balance-widget">
      <div className="balance-header">
        <h3>Current Balance</h3>
      </div>
      
      <div className="balance-content">
        <div className="balance-amount">
          <div className="amount-value">{formatCurrency(balance?.amount || 0)}</div>
          <div className="amount-label">Available Balance</div>
        </div>
        
        <div className="balance-details">
          <div className="detail-item">
            <div className="detail-label">Active Lotteries:</div>
            <div className="detail-value">{balance?.activeLotteries || 0}</div>
          </div>
        </div>
      </div>
      
      <div className="balance-actions">
        <Button 
          as={Link} 
          to="/balance" 
          variant="primary"
        >
          Manage Balance
        </Button>
      </div>
    </Card>
  );
};

export default BalanceWidget;