// src/services/ticketService.js
import { ref, push, get, set, update, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../firebase/config';
import { generateTicketId } from '../utils/ticketGenerator';

/**
 * Book a new ticket
 * @param {Object} ticketData - Ticket data
 * @returns {Promise<Object>} Created ticket
 */
export const bookTicket = async (ticketData) => {
  try {
    const { lotteryId, number, agentId } = ticketData;
    
    // Validate lottery exists and is active
    const lotteryRef = ref(database, `lotteries/${lotteryId}`);
    const lotterySnapshot = await get(lotteryRef);
    
    if (!lotterySnapshot.exists()) {
      throw new Error('Lottery not found');
    }
    
    const lottery = lotterySnapshot.val();
    
    if (lottery.status !== 'active') {
      throw new Error('Lottery is not active');
    }
    
    if (lottery.ticketsBooked >= lottery.ticketCapacity) {
      throw new Error('Lottery is fully booked');
    }
    
    // Check if ticket number is already booked
    const existingTicketsQuery = query(
      ref(database, 'tickets'),
      orderByChild('lotteryId'),
      equalTo(lotteryId)
    );
    
    const existingTicketsSnapshot = await get(existingTicketsQuery);
    
    if (existingTicketsSnapshot.exists()) {
      const existingTickets = existingTicketsSnapshot.val();
      const ticketExists = Object.values(existingTickets).some(
        ticket => ticket.number === number && ticket.lotteryId === lotteryId
      );
      
      if (ticketExists) {
        throw new Error('This ticket number is already booked');
      }
    }
    
    // Generate unique ticket ID
    const ticketId = generateTicketId();
    
    // Create new ticket
    const ticketsRef = ref(database, 'tickets');
    const newTicketRef = push(ticketsRef);
    
    const ticket = {
      id: ticketId,
      number,
      lotteryId,
      agentId,
      playerName: ticketData.playerName,
      phoneNumber: ticketData.phoneNumber,
      gameId: ticketData.gameId || null,
      serverId: ticketData.serverId || null,
      type: ticketData.type || 'normal',
      booked: true,
      status: 'active',
      bookedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    await set(newTicketRef, ticket);
    
    // Update lottery ticket count
    await update(lotteryRef, {
      ticketsBooked: lottery.ticketsBooked + 1,
      updatedAt: new Date().toISOString()
    });
    
    return { ...ticket, dbId: newTicketRef.key };
  } catch (error) {
    console.error('Error booking ticket:', error);
    throw error;
  }
};

/**
 * Update ticket information
 * @param {string} ticketId - Ticket ID
 * @param {Object} ticketData - Updated ticket data
 * @returns {Promise<Object>} Updated ticket
 */
export const updateTicket = async (ticketId, ticketData) => {
  try {
    const ticketRef = ref(database, `tickets/${ticketId}`);
    const snapshot = await get(ticketRef);
    
    if (!snapshot.exists()) {
      throw new Error('Ticket not found');
    }
    
    const currentTicket = snapshot.val();
    
    const updatedTicket = {
      ...currentTicket,
      playerName: ticketData.playerName,
      phoneNumber: ticketData.phoneNumber,
      gameId: ticketData.gameId || currentTicket.gameId,
      serverId: ticketData.serverId || currentTicket.serverId,
      updatedAt: new Date().toISOString()
    };
    
    await update(ticketRef, updatedTicket);
    
    return { ...updatedTicket, id: ticketId };
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
};

/**
 * Get tickets for a specific lottery
 * @param {string} lotteryId - Lottery ID
 * @returns {Promise<Array>} Array of ticket objects
 */
export const getLotteryTickets = async (lotteryId) => {
  try {
    const ticketsRef = ref(database, 'tickets');
    const ticketsQuery = query(
      ticketsRef,
      orderByChild('lotteryId'),
      equalTo(lotteryId)
    );
    
    const snapshot = await get(ticketsQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const ticketsData = snapshot.val();
    const tickets = Object.keys(ticketsData).map(key => ({
      ...ticketsData[key],
      dbId: key
    }));
    
    return tickets;
  } catch (error) {
    console.error('Error fetching lottery tickets:', error);
    throw error;
  }
};

/**
 * Get a ticket by ID
 * @param {string} ticketId - Ticket ID
 * @returns {Promise<Object>} Ticket object
 */
export const getTicketById = async (ticketId) => {
  try {
    const ticketRef = ref(database, `tickets/${ticketId}`);
    const snapshot = await get(ticketRef);
    
    if (!snapshot.exists()) {
      throw new Error('Ticket not found');
    }
    
    return { ...snapshot.val(), dbId: ticketId };
  } catch (error) {
    console.error('Error fetching ticket:', error);
    throw error;
  }
};

/**
 * Cancel a ticket
 * @param {string} ticketId - Ticket database ID
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Cancelled ticket
 */
export const cancelTicket = async (ticketId, agentId) => {
  try {
    const ticketRef = ref(database, `tickets/${ticketId}`);
    const snapshot = await get(ticketRef);
    
    if (!snapshot.exists()) {
      throw new Error('Ticket not found');
    }
    
    const ticket = snapshot.val();
    
    // Verify agent ownership
    if (ticket.agentId !== agentId) {
      throw new Error('You do not have permission to cancel this ticket');
    }
    
    // Update lottery ticket count
    const lotteryRef = ref(database, `lotteries/${ticket.lotteryId}`);
    const lotterySnapshot = await get(lotteryRef);
    
    if (lotterySnapshot.exists()) {
      const lottery = lotterySnapshot.val();
      
      await update(lotteryRef, {
        ticketsBooked: Math.max(0, lottery.ticketsBooked - 1),
        updatedAt: new Date().toISOString()
      });
    }
    
    // Update ticket status
    const updatedTicket = {
      ...ticket,
      status: 'cancelled',
      booked: false,
      cancelledAt: new Date().toISOString()
    };
    
    await update(ticketRef, updatedTicket);
    
    return { ...updatedTicket, dbId: ticketId };
  } catch (error) {
    console.error('Error cancelling ticket:', error);
    throw error;
  }
};

/**
 * Cancel all tickets for a lottery
 * @param {string} lotteryId - Lottery ID
 * @returns {Promise<number>} Number of tickets cancelled
 */
export const cancelTicketsForLottery = async (lotteryId) => {
  try {
    const tickets = await getLotteryTickets(lotteryId);
    const activeTickets = tickets.filter(ticket => ticket.status === 'active');
    
    const cancelPromises = activeTickets.map(ticket => {
      const ticketRef = ref(database, `tickets/${ticket.dbId}`);
      const updatedTicket = {
        ...ticket,
        status: 'cancelled',
        booked: false,
        cancelledAt: new Date().toISOString()
      };
      
      // Remove dbId from the data to store
      delete updatedTicket.dbId;
      
      return update(ticketRef, updatedTicket);
    });
    
    await Promise.all(cancelPromises);
    
    return activeTickets.length;
  } catch (error) {
    console.error('Error cancelling tickets for lottery:', error);
    throw error;
  }
};