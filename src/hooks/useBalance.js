// src/hooks/useBalance.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getAgentBalance, getTransactionHistory } from '../services/balanceService';

export const useBalance = () => {
  const { currentUser } = useAuth();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchBalance = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const balanceData = await getAgentBalance(currentUser.uid);
      setBalance(balanceData);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to load balance. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);
  
  const fetchTransactions = useCallback(async (period = 'month', type = null) => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const transactionsData = await getTransactionHistory(currentUser.uid, period, type);
      setTransactions(transactionsData);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);
  
  // Initialize balance data
  useEffect(() => {
    if (currentUser) {
      fetchBalance();
    }
  }, [currentUser, fetchBalance]);
  
  return {
    balance,
    transactions,
    loading,
    error,
    fetchBalance,
    fetchTransactions
  };
};