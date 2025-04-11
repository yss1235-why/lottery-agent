// src/services/lotteryService.js
import { ref, push, get, update, query, orderByChild, equalTo, set, remove } from 'firebase/database';
import { database } from '../firebase/config';
import { updateAgentBalance } from './balanceService';
import { getLotteryTickets, cancelTicketsForLottery } from './ticketService';

/**
 * Create a new lottery
 * @param {Object} lotteryData - Lottery data
 * @returns {Promise<Object>} Created lottery
 */
export const createLottery = async (lotteryData) => {
  try {
    const { agentId, prizePool } = lotteryData;
    
    // Get a new lottery reference
    const lotteriesRef = ref(database, 'lotteries');
    const newLotteryRef = push(lotteriesRef);
    const lotteryId = newLotteryRef.key;
    
    // Deduct balance from agent
    await updateAgentBalance(agentId, -prizePool, `Created lottery ${lotteryId}`);
    
    // Format lottery data
    const drawTime = new Date(lotteryData.drawTime).toISOString();
    const createdAt = new Date().toISOString();
    
    const lottery = {
      id: lotteryId,
      name: lotteryData.name,
      type: lotteryData.type,
      description: lotteryData.description || '',
      prizePool: lotteryData.prizePool,
      ticketPrice: lotteryData.ticketPrice,
      ticketCapacity: lotteryData.ticketCapacity,
      ticketsBooked: 0,
      prizes: lotteryData.prizes || [],
      drawTime,
      agentId,
      status: 'active',
      createdAt,
      updatedAt: createdAt,
      image: lotteryData.image || null, // Handle image
      gameDetails: lotteryData.gameDetails || '' // Handle game details
    };
    
    // Save lottery to database
    await set(newLotteryRef, lottery);
    
    return { ...lottery, id: lotteryId };
  } catch (error) {
    console.error('Error creating lottery:', error);
    throw error;
  }
};

/**
 * Update lottery status
 * @param {string} lotteryId - Lottery ID
 * @param {string} status - New status
 * @returns {Promise<boolean>} Success status
 */
export const updateLotteryStatus = async (lotteryId, status) => {
  try {
    const lotteryRef = ref(database, `lotteries/${lotteryId}`);
    await update(lotteryRef, {
      status: status,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error(`Error updating lottery status to ${status}:`, error);
    throw error;
  }
};

/**
 * Get active lotteries
 * @param {number} limit - Maximum number of lotteries to return
 * @returns {Promise<Array>} Array of lottery objects
 */
export const getActiveLotteries = async (limit = 10) => {
  try {
    const lotteriesRef = ref(database, 'lotteries');
    const activeQuery = query(
      lotteriesRef,
      orderByChild('status'),
      equalTo('active')
    );
    
    const upcomingQuery = query(
      lotteriesRef,
      orderByChild('status'),
      equalTo('upcoming')
    );
    
    // Add a query for drawing lotteries
    const drawingQuery = query(
      lotteriesRef,
      orderByChild('status'),
      equalTo('drawing')
    );
    
    // Fetch active, upcoming, and drawing lotteries
    const [activeSnapshot, upcomingSnapshot, drawingSnapshot] = await Promise.all([
      get(activeQuery),
      get(upcomingQuery),
      get(drawingQuery)
    ]);
    
    const activeLotteries = [];
    
    // Process active lotteries
    if (activeSnapshot.exists()) {
      const activeData = activeSnapshot.val();
      Object.keys(activeData).forEach(key => {
        activeLotteries.push({
          id: key,
          ...activeData[key]
        });
      });
    }
    
    // Process upcoming lotteries
    if (upcomingSnapshot.exists()) {
      const upcomingData = upcomingSnapshot.val();
      Object.keys(upcomingData).forEach(key => {
        activeLotteries.push({
          id: key,
          ...upcomingData[key]
        });
      });
    }
    
    // Process drawing lotteries
    if (drawingSnapshot.exists()) {
      const drawingData = drawingSnapshot.val();
      Object.keys(drawingData).forEach(key => {
        activeLotteries.push({
          id: key,
          ...drawingData[key]
        });
      });
    }
    
    // Sort by draw time (ascending)
    activeLotteries.sort((a, b) => {
      return new Date(a.drawTime) - new Date(b.drawTime);
    });
    
    // Limit the number of results
    return activeLotteries.slice(0, limit);
  } catch (error) {
    console.error('Error fetching active lotteries:', error);
    throw error;
  }
};

/**
 * Get lotteries for a specific agent
 * @param {string} agentId - Agent ID
 * @param {string} status - Filter by status (optional)
 * @returns {Promise<Array>} Array of lottery objects
 */
export const getAgentLotteries = async (agentId, status = null) => {
  try {
    const lotteriesRef = ref(database, 'lotteries');
    const agentQuery = query(
      lotteriesRef,
      orderByChild('agentId'),
      equalTo(agentId)
    );
    
    const snapshot = await get(agentQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const lotteriesData = snapshot.val();
    let lotteries = Object.keys(lotteriesData)
      .map(key => ({
        id: key,
        ...lotteriesData[key]
      }));
    
    // Filter by status if provided
    if (status) {
      lotteries = lotteries.filter(lottery => lottery.status === status);
    }
    
    // Sort by creation date (newest first)
    lotteries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return lotteries;
  } catch (error) {
    console.error('Error fetching agent lotteries:', error);
    throw error;
  }
};

/**
 * Get lottery by ID
 * @param {string} lotteryId - Lottery ID
 * @returns {Promise<Object>} Lottery object
 */
export const getLotteryById = async (lotteryId) => {
  try {
    const lotteryRef = ref(database, `lotteries/${lotteryId}`);
    const snapshot = await get(lotteryRef);
    
    if (!snapshot.exists()) {
      throw new Error('Lottery not found');
    }
    
    const lotteryData = snapshot.val();
    return { id: lotteryId, ...lotteryData };
  } catch (error) {
    console.error('Error fetching lottery:', error);
    throw error;
  }
};

/**
 * Draw a lottery to select winners
 * @param {string} lotteryId - Lottery ID
 * @param {Array|Object} winningTicketIds - IDs of the winning tickets
 * @returns {Promise<Object>} Updated lottery with winners
 */
export const drawLottery = async (lotteryId, winningTicketIds) => {
  try {
    // Get lottery data
    const lottery = await getLotteryById(lotteryId);
    
    if (lottery.status !== 'drawing') {
      throw new Error('Only lotteries in drawing state can be completed');
    }
    
    // Get all tickets for this lottery
    const tickets = await getLotteryTickets(lotteryId);
    const bookedTickets = tickets.filter(ticket => ticket.booked && ticket.status === 'active');
    
    if (bookedTickets.length === 0) {
      throw new Error('No tickets available for drawing');
    }
    
    // Ensure we have prize information
    if (!lottery.prizes || lottery.prizes.length === 0) {
      throw new Error('No prizes defined for this lottery');
    }
    
    // Process winners
    const winners = [];
    
    // Ensure winningTicketIds is an array
    const ticketIdsArray = Array.isArray(winningTicketIds) 
      ? winningTicketIds 
      : Object.values(winningTicketIds);
    
    // Validate that we have at least one winning ticket
    if (!ticketIdsArray || ticketIdsArray.length === 0) {
      throw new Error('No winning tickets provided');
    }
    
    // Match prizes with winners - start with highest prize (index 0)
    const prizesToAward = Math.min(lottery.prizes.length, ticketIdsArray.length);
    
    for (let i = 0; i < prizesToAward; i++) {
      const ticketId = ticketIdsArray[i];
      const winningTicket = bookedTickets.find(ticket => ticket.id === ticketId);
      
      if (!winningTicket) {
        console.warn(`Winning ticket ${ticketId} not found in booked tickets`);
        continue; // Skip invalid ticket IDs
      }
      
      // Build winner info object
      const winnerInfo = {
        id: winningTicket.id,
        number: winningTicket.number,
        playerName: winningTicket.playerName || 'Unknown Player',
        phoneNumber: winningTicket.phoneNumber || 'Unknown',
        prizeIndex: i,
        prizeName: lottery.prizes[i].name,
        prizeValue: lottery.prizes[i].value
      };
      
      // Only add gameId and serverId if they exist
      if (winningTicket.gameId) {
        winnerInfo.gameId = winningTicket.gameId;
      }
      
      if (winningTicket.serverId) {
        winnerInfo.serverId = winningTicket.serverId;
      }
      
      winners.push(winnerInfo);
    }
    
    // Update lottery with winners info
    const lotteryRef = ref(database, `lotteries/${lotteryId}`);
    const updatedLottery = {
      ...lottery,
      status: 'completed', // Change from "drawing" to "completed"
      winners: winners,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await update(lotteryRef, updatedLottery);
    
    return updatedLottery;
  } catch (error) {
    console.error('Error drawing lottery:', error);
    throw error;
  }
};

/**
 * Cancel a lottery
 * @param {string} lotteryId - Lottery ID
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Cancelled lottery
 */
export const cancelLottery = async (lotteryId, agentId) => {
  try {
    // Get lottery data
    const lottery = await getLotteryById(lotteryId);
    
    // Verify agent ownership
    if (lottery.agentId !== agentId) {
      throw new Error('You do not have permission to cancel this lottery');
    }
    
    // Check if lottery can be cancelled
    if (lottery.status !== 'active' && lottery.status !== 'drawing') {
      throw new Error(`Cannot cancel lottery with status: ${lottery.status}`);
    }
    
    // Cancel all associated tickets
    await cancelTicketsForLottery(lotteryId);
    
    // Refund prize pool to agent balance
    // Note: You might want to implement a fee or partial refund policy
    await updateAgentBalance(agentId, lottery.prizePool, `Refund for cancelled lottery ${lotteryId}`);
    
    // Update lottery status
    const lotteryRef = ref(database, `lotteries/${lotteryId}`);
    const updatedLottery = {
      ...lottery,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await update(lotteryRef, updatedLottery);
    
    return updatedLottery;
  } catch (error) {
    console.error('Error cancelling lottery:', error);
    throw error;
  }
};

/**
 * Update an existing lottery
 * @param {string} lotteryId - Lottery ID
 * @param {Object} updatedData - Updated lottery data
 * @param {string} agentId - Agent ID for verification
 * @returns {Promise<Object>} Updated lottery
 */
export const updateLottery = async (lotteryId, updatedData, agentId) => {
  try {
    // Get lottery data
    const lottery = await getLotteryById(lotteryId);
    
    // Verify agent ownership
    if (lottery.agentId !== agentId) {
      throw new Error('You do not have permission to update this lottery');
    }
    
    // Check if lottery can be updated
    if (lottery.status !== 'active') {
      throw new Error(`Cannot update lottery with status: ${lottery.status}`);
    }
    
    // Handle prize pool updates if needed
    let balanceAdjustment = 0;
    if (updatedData.prizePool && updatedData.prizePool !== lottery.prizePool) {
      balanceAdjustment = lottery.prizePool - updatedData.prizePool;
      
      // If increasing prize pool, check balance
      if (balanceAdjustment < 0) {
        // If prize pool is increased, we need to deduct from agent balance
        await updateAgentBalance(agentId, balanceAdjustment, `Updated prize pool for lottery ${lotteryId}`);
      } else if (balanceAdjustment > 0) {
        // If prize pool is decreased, we need to credit agent balance
        await updateAgentBalance(agentId, balanceAdjustment, `Refund for updated prize pool of lottery ${lotteryId}`);
      }
    }
    
    // Update lottery data
    const lotteryRef = ref(database, `lotteries/${lotteryId}`);
    const updated = {
      ...lottery,
      name: updatedData.name || lottery.name,
      description: updatedData.description || lottery.description,
      prizePool: updatedData.prizePool || lottery.prizePool,
      ticketPrice: updatedData.ticketPrice || lottery.ticketPrice,
      ticketCapacity: updatedData.ticketCapacity || lottery.ticketCapacity,
      drawTime: updatedData.drawTime || lottery.drawTime,
      prizes: updatedData.prizes || lottery.prizes,
      image: updatedData.image !== undefined ? updatedData.image : lottery.image, // Handle image updates
      gameDetails: updatedData.gameDetails || lottery.gameDetails, // Handle game details updates
      updatedAt: new Date().toISOString()
    };
    
    // Don't allow reducing ticket capacity below the number of tickets already booked
    if (updated.ticketCapacity < lottery.ticketsBooked) {
      throw new Error(`Cannot reduce ticket capacity below the number of tickets already booked (${lottery.ticketsBooked})`);
    }
    
    await update(lotteryRef, updated);
    
    return { ...updated, id: lotteryId };
  } catch (error) {
    console.error('Error updating lottery:', error);
    throw error;
  }
};

/**
 * Delete a lottery (complete removal from database)
 * @param {string} lotteryId - Lottery ID
 * @param {string} agentId - Agent ID for verification
 * @returns {Promise<boolean>} Success status
 */
export const deleteLottery = async (lotteryId, agentId) => {
  try {
    // Get lottery data
    const lottery = await getLotteryById(lotteryId);
    
    // Verify agent ownership
    if (lottery.agentId !== agentId) {
      throw new Error('You do not have permission to delete this lottery');
    }
    
    // Check if lottery can be deleted (only if no tickets are booked)
    if (lottery.ticketsBooked > 0) {
      throw new Error('Cannot delete lottery with booked tickets. Cancel the lottery instead.');
    }
    
    // Refund prize pool to agent
    await updateAgentBalance(agentId, lottery.prizePool, `Refund for deleted lottery ${lotteryId}`);
    
    // Delete the lottery
    const lotteryRef = ref(database, `lotteries/${lotteryId}`);
    await remove(lotteryRef);
    
    return true;
  } catch (error) {
    console.error('Error deleting lottery:', error);
    throw error;
  }
};
