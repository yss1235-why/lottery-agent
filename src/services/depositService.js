// src/services/depositService.js
import { ref, get, set, push, update, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../firebase/config';
import { recordAgentTransaction } from './balanceService';

/**
 * Get deposit requests for an agent
 * @param {string} agentId - Agent ID
 * @param {string} status - Filter by status (optional)
 * @returns {Promise<Array>} Array of deposit request objects
 */
export const getAgentDepositRequests = async (agentId, status = null) => {
  try {
    const requestsRef = ref(database, 'depositRequests');
    let requestsQuery;
    
    if (status) {
      requestsQuery = query(
        requestsRef,
        orderByChild('agentId'),
        equalTo(agentId)
      );
    } else {
      requestsQuery = query(
        requestsRef,
        orderByChild('agentId'),
        equalTo(agentId)
      );
    }
    
    const snapshot = await get(requestsQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const requestsData = snapshot.val();
    let requests = Object.keys(requestsData).map(key => ({
      id: key,
      ...requestsData[key]
    }));
    
    // Filter by status if provided
    if (status) {
      requests = requests.filter(request => request.status === status);
    }
    
    // Sort by createdAt (newest first)
    requests.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return requests;
  } catch (error) {
    console.error('Error fetching deposit requests:', error);
    throw error;
  }
};

/**
 * Get deposit request by ID
 * @param {string} requestId - Deposit request ID
 * @returns {Promise<Object>} Deposit request object
 */
export const getDepositRequestById = async (requestId) => {
  try {
    const requestRef = ref(database, `depositRequests/${requestId}`);
    const snapshot = await get(requestRef);
    
    if (!snapshot.exists()) {
      throw new Error('Deposit request not found');
    }
    
    return {
      id: requestId,
      ...snapshot.val()
    };
  } catch (error) {
    console.error('Error fetching deposit request:', error);
    throw error;
  }
};

/**
 * Create a new deposit request
 * @param {Object} requestData - Deposit request data
 * @returns {Promise<Object>} Created deposit request
 */
export const createDepositRequest = async (requestData) => {
  try {
    // Get a new deposit request reference
    const requestsRef = ref(database, 'depositRequests');
    const newRequestRef = push(requestsRef);
    const requestId = newRequestRef.key;
    
    // Format request data
    const request = {
      id: requestId,
      agentId: requestData.agentId,
      agentName: requestData.agentName,
      amount: requestData.amount,
      platformFee: requestData.platformFee,
      totalAmount: requestData.totalAmount,
      paymentMethod: requestData.paymentMethod,
      referenceId: requestData.referenceId,
      notes: requestData.notes || '',
      status: 'pending',
      screenshot: requestData.screenshot || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save request to database
    await set(newRequestRef, request);
    
    // Also record this as a transaction in the agent's transaction history
    await recordAgentTransaction(requestData.agentId, {
      amount: 0, // The actual amount will be added after admin approval
      balance: null, // Balance will be updated after admin approval
      description: `Deposit request (${requestData.paymentMethod}): ${requestData.referenceId}`,
      type: 'deposit_request',
      status: 'pending',
      requestId: requestId,
      referenceId: requestData.referenceId,
      totalAmount: requestData.totalAmount,
      createdAt: new Date().toISOString()
    });
    
    return { ...request, id: requestId };
  } catch (error) {
    console.error('Error creating deposit request:', error);
    throw error;
  }
};

/**
 * Cancel a deposit request
 * @param {string} requestId - Deposit request ID
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Updated request
 */
export const cancelDepositRequest = async (requestId, agentId) => {
  try {
    const requestRef = ref(database, `depositRequests/${requestId}`);
    const snapshot = await get(requestRef);
    
    if (!snapshot.exists()) {
      throw new Error('Deposit request not found');
    }
    
    const request = snapshot.val();
    
    // Verify agent ownership
    if (request.agentId !== agentId) {
      throw new Error('You do not have permission to cancel this request');
    }
    
    // Verify request status is pending
    if (request.status !== 'pending') {
      throw new Error(`This request is already ${request.status}`);
    }
    
    const updatedRequest = {
      ...request,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await update(requestRef, updatedRequest);
    
    // Also update the transaction status
    await recordAgentTransaction(agentId, {
      amount: 0,
      balance: null,
      description: `Deposit request cancelled: ${request.referenceId}`,
      type: 'deposit_cancelled',
      requestId: requestId,
      relatedToRequestId: requestId,
      status: 'cancelled',
      createdAt: new Date().toISOString()
    });
    
    return {
      id: requestId,
      ...updatedRequest
    };
  } catch (error) {
    console.error('Error cancelling deposit request:', error);
    throw error;
  }
};

/**
 * Get deposit transaction history
 * @param {string} agentId - Agent ID
 * @param {number} limit - Maximum number of transactions to return
 * @returns {Promise<Array>} Array of deposit transaction objects
 */
export const getDepositTransactions = async (agentId, limit = 10) => {
  try {
    const transactionsRef = ref(database, 'depositTransactions');
    const agentQuery = query(
      transactionsRef,
      orderByChild('agentId'),
      equalTo(agentId)
    );
    
    const snapshot = await get(agentQuery);
    
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
    console.error('Error fetching deposit transactions:', error);
    throw error;
  }
};