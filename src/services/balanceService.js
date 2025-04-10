// src/services/balanceService.js
import { ref, get, update, push, set, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../firebase/config';

/**
 * Get agent balance information
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Balance data
 */
export const getAgentBalance = async (agentId) => {
  try {
    const agentRef = ref(database, `agents/${agentId}`);
    const snapshot = await get(agentRef);
    
    if (!snapshot.exists()) {
      throw new Error('Agent not found');
    }
    
    const agentData = snapshot.val();
    
    // If balance doesn't exist, return default values
    if (!agentData.balance) {
      return {
        amount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    return agentData.balance;
  } catch (error) {
    console.error('Error fetching agent balance:', error);
    throw error;
  }
};

/**
 * Record a transaction for an agent
 * @param {string} agentId - Agent ID
 * @param {Object} transactionData - Transaction details
 * @returns {Promise<Object>} Created transaction
 */
export const recordAgentTransaction = async (agentId, transactionData) => {
  try {
    const transactionRef = ref(database, `agentTransactions/${agentId}`);
    const newTransactionRef = push(transactionRef);
    
    const transaction = {
      ...transactionData,
      id: newTransactionRef.key,
      agentId,
      createdAt: transactionData.createdAt || new Date().toISOString()
    };
    
    await set(newTransactionRef, transaction);
    
    return { ...transaction, id: newTransactionRef.key };
  } catch (error) {
    console.error('Error recording agent transaction:', error);
    throw error;
  }
};

/**
 * Get recent transactions for an agent
 * @param {string} agentId - Agent ID
 * @param {number} limit - Maximum number of transactions to return
 * @returns {Promise<Array>} Array of transaction objects
 */
export const getRecentTransactions = async (agentId, limit = 5) => {
  try {
    const transactionsRef = ref(database, `agentTransactions/${agentId}`);
    const snapshot = await get(transactionsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const transactionsData = snapshot.val();
    const transactions = Object.keys(transactionsData)
      .map(key => ({
        id: key,
        ...transactionsData[key]
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
    
    return transactions;
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    throw error;
  }
};

/**
 * Get payment details for deposits
 * @returns {Promise<Object>} Payment configuration
 */
export const getPaymentDetails = async () => {
  try {
    const configRef = ref(database, 'paymentConfig');
    const snapshot = await get(configRef);
    
    if (!snapshot.exists()) {
      return {
        upiId: 'default@upi',
        upiPhone: '9999999999',
        usdtAddress: 'TRC20Address',
        usdtRate: 85
      };
    }
    
    return snapshot.val();
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
};

/**
 * Update agent balance 
 * @param {string} agentId - Agent ID
 * @param {number} amount - Amount to add (positive) or deduct (negative)
 * @param {string} description - Transaction description
 * @returns {Promise<Object>} Updated balance
 */
export const updateAgentBalance = async (agentId, amount, description) => {
  try {
    const agentRef = ref(database, `agents/${agentId}`);
    const snapshot = await get(agentRef);
    
    if (!snapshot.exists()) {
      throw new Error('Agent not found');
    }
    
    const agentData = snapshot.val();
    
    // Initialize balance if it doesn't exist
    if (!agentData.balance) {
      agentData.balance = {
        amount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    // Check if agent has enough balance for deductions
    if (amount < 0 && agentData.balance.amount < Math.abs(amount)) {
      throw new Error('Insufficient balance');
    }
    
    // Update balance
    const updatedBalance = {
      ...agentData.balance,
      amount: agentData.balance.amount + amount, // Add or subtract based on amount sign
      updatedAt: new Date().toISOString()
    };
    
    await update(agentRef, { balance: updatedBalance });
    
    // Record transaction
    await recordAgentTransaction(agentId, {
      amount: amount,
      balance: updatedBalance.amount,
      description: description,
      type: amount > 0 ? 'credit' : 'debit',
      createdAt: new Date().toISOString()
    });
    
    return updatedBalance;
  } catch (error) {
    console.error('Error updating agent balance:', error);
    throw error;
  }
};

/**
 * Get transaction history for an agent
 * @param {string} agentId - Agent ID
 * @param {string} period - Time period (all, month, week, day)
 * @param {string} type - Transaction type (all, credit, debit, deposit_request)
 * @returns {Promise<Array>} Array of transaction objects
 */
export const getTransactionHistory = async (agentId, period = 'all', type = 'all') => {
  try {
    const transactionsRef = ref(database, `agentTransactions/${agentId}`);
    const snapshot = await get(transactionsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    let transactions = Object.keys(snapshot.val()).map(key => ({
      id: key,
      ...snapshot.val()[key]
    }));
    
    // Filter by transaction type
    if (type !== 'all') {
      transactions = transactions.filter(transaction => transaction.type === type);
    }
    
    // Filter by time period
    if (period !== 'all') {
      const now = new Date();
      let cutoffDate;
      
      switch (period) {
        case 'day':
          cutoffDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          cutoffDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          cutoffDate = new Date(0); // Beginning of time
      }
      
      transactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        return transactionDate >= cutoffDate;
      });
    }
    
    // Sort by creation date (newest first)
    transactions.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return transactions;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
};