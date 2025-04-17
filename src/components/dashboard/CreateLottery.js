// src/components/dashboard/CreateLottery.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAgentBalance } from '../../services/balanceService';
import { createLottery } from '../../services/lotteryService';
import { formatCurrency } from '../../utils/currencyFormatter';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import ErrorMessage from '../ui/ErrorMessage';
import SuccessMessage from '../ui/SuccessMessage';
import LotteryForm from '../lotteries/LotteryForm';
import PageHeader from '../layout/PageHeader';

const CreateLottery = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [createdLotteryId, setCreatedLotteryId] = useState(null);
  
  useEffect(() => {
    fetchBalance();
  }, []);
  
  const fetchBalance = async () => {
    try {
      setLoading(true);
      const balanceData = await getAgentBalance(currentUser.uid);
      setBalance(balanceData);
      setError(null);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to load your account balance. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (formData) => {
    // Check balance
    if (balance.amount < formData.prizePool) {
      setError(`Insufficient balance. You need ${formatCurrency(formData.prizePool)} but you have ${formatCurrency(balance.amount)}`);
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const result = await createLottery(currentUser.uid, formData);
      
      setCreatedLotteryId(result.lotteryId);
      setSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate(`/lotteries/${result.lotteryId}`);
      }, 3000);
    } catch (err) {
      console.error('Error creating lottery:', err);
      setError(err.message || 'Failed to create lottery. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Calculate max prize pool - no platform fee calculation needed
  const maxPrizePool = balance ? balance.amount : 0;
  
  if (loading) {
    return (
      <div className="create-lottery-page">
        <PageHeader 
          title="Create New Lottery" 
          showBack
          backUrl="/lotteries"
        />
        <Loading text="Loading your balance information..." />
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="create-lottery-page">
        <PageHeader 
          title="Create New Lottery" 
          showBack
          backUrl="/lotteries"
        />
        <Card className="success-card">
          <SuccessMessage message="Lottery created successfully!" />
          <p>Your lottery has been created and is now available for booking.</p>
          <p>Lottery ID: {createdLotteryId}</p>
          <p>You will be redirected to the lottery details page shortly...</p>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="create-lottery-page">
      <PageHeader 
        title="Create New Lottery" 
        showBack
        backUrl="/lotteries"
      />
      
      {error && <ErrorMessage message={error} />}
      
      <Card className="balance-info-card">
        <div className="balance-info">
          <div className="info-item">
            <div className="info-label">Your Balance:</div>
            <div className="info-value">{formatCurrency(balance?.amount || 0)}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Maximum Prize Pool:</div>
            <div className="info-value">{formatCurrency(maxPrizePool)}</div>
          </div>
        </div>
      </Card>
      
      <LotteryForm 
        onSubmit={handleSubmit}
        maxPrizePool={maxPrizePool}
        isSubmitting={submitting}
      />
    </div>
  );
};

export default CreateLottery;
