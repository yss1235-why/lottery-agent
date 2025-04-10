// src/components/dashboard/RecentTransactions.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getRecentTransactions } from '../../services/balanceService';
import { formatDateTime } from '../../utils/dateFormatter';
import { formatCurrency } from '../../utils/currencyFormatter';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import Loading from '../common/Loading';
import ErrorMessage from '../common/ErrorMessage';

const RecentTransactions = ({ limit = 10 }) => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const transactionsData = await getRecentTransactions(currentUser.uid, limit);
      setTransactions(transactionsData);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, limit]);

  useEffect(() => {
    fetchTransactions();
    
    // Set up a refresh interval (every 30 seconds)
    const refreshInterval = setInterval(fetchTransactions, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchTransactions]);

  // Function to determine transaction status badge
  const getStatusBadge = (transaction) => {
    if (!transaction.status) return null;
    
    switch (transaction.status) {
      case 'pending':
        return <span className="status-badge status-pending">Pending</span>;
      case 'approved':
        return <span className="status-badge status-confirmed">Approved</span>;
      case 'cancelled':
        return <span className="status-badge status-cancelled">Cancelled</span>;
      case 'rejected':
        return <span className="status-badge status-cancelled">Rejected</span>;
      default:
        return null;
    }
  };

  // Function to format transaction amount
  const formatAmount = (transaction) => {
    // For regular transactions
    if (transaction.amount !== undefined && transaction.amount !== null) {
      return formatCurrency(transaction.amount);
    }
    
    // For deposit requests
    if (transaction.type === 'deposit_request' && transaction.totalAmount) {
      return `${formatCurrency(transaction.totalAmount)} (Pending)`;
    }
    
    return formatCurrency(0);
  };
  
  // Function to format transaction description
  const formatDescription = (transaction) => {
    // For deposit request transactions, show reference ID
    if (transaction.type === 'deposit_request') {
      return `Deposit Request: ${transaction.referenceId}`;
    }
    
    // For deposit cancelled transactions
    if (transaction.type === 'deposit_cancelled') {
      return `Deposit Cancelled: ${transaction.referenceId || ''}`;
    }
    
    // Default case
    return transaction.description || 'Transaction';
  };

  if (loading) {
    return <Loading text="Loading transactions..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} onRetry={fetchTransactions} />;
  }
  
  if (transactions.length === 0) {
    return (
      <Card className="transactions-empty">
        <div className="empty-state">
          <p>No recent transactions found.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="recent-transactions">
      <Card>
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction.id} className={transaction.type}>
                <td className="transaction-description">
                  {formatDescription(transaction)}
                </td>
                <td className={`transaction-amount ${transaction.type === 'credit' ? 'credit' : transaction.type === 'debit' ? 'debit' : ''}`}>
                  {formatAmount(transaction)}
                </td>
                <td className="transaction-date">
                  {formatDateTime(transaction.createdAt)}
                </td>
                <td className="transaction-status">
                  {getStatusBadge(transaction)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="card-footer">
          <Link to="/balance" className="view-all">
            View All Transactions
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default RecentTransactions;