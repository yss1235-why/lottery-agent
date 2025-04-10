// src/pages/lotteries/CreateLottery.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAgentBalance } from '../../services/balanceService';
import { createLottery } from '../../services/lotteryService';
import { formatCurrency } from '../../utils/currencyFormatter';
import PageHeader from '../../components/layout/PageHeader';
import LotteryForm from '../../components/lotteries/LotteryForm';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loading from '../../components/ui/Loading';
import ErrorMessage from '../../components/ui/ErrorMessage';
import SuccessMessage from '../../components/ui/SuccessMessage';

const CreateLottery = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [createdLotteryId, setCreatedLotteryId] = useState(null);
  
  // Platform fee rate
  const platformFeeRate = 0.12; // 12%
  
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
    // Calculate total cost including platform fee
    const prizePool = formData.prizePool;
    const platformFee = prizePool * platformFeeRate;
    const totalCost = prizePool + platformFee;
    
    // Check balance
    if (balance.amount < totalCost) {
      setError(`Insufficient balance. You need ${formatCurrency(totalCost)} but you have ${formatCurrency(balance.amount)}`);
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const lotteryData = {
        ...formData,
        platformFeeRate
      };
      
      const result = await createLottery(currentUser.uid, lotteryData);
      
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
  
  // Calculate max prize pool
  const maxPrizePool = balance ? Math.floor(balance.amount / (1 + platformFeeRate)) : 0;
  
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
            <div className="info-note">After 12% platform fee</div>
          </div>
        </div>
      </Card>
      
      {maxPrizePool < 100 ? (
        <Card className="insufficient-balance-card">
          <div className="warning-message">
            <h3>Insufficient Balance</h3>
            <p>Your current balance is too low to create a lottery. The minimum prize pool is $100.</p>
            <p>You need at least {formatCurrency(100 * (1 + platformFeeRate))} in your account to create a lottery.</p>
            <Button 
              variant="primary"
              onClick={() => navigate('/dashboard')}
            >
              Return to Dashboard
            </Button>
          </div>
        </Card>
      ) : (
        <LotteryForm 
          onSubmit={handleSubmit}
          maxPrizePool={maxPrizePool}
          isSubmitting={submitting}
        />
      )}
    </div>
  );
};

export default CreateLottery;