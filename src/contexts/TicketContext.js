// src/contexts/TicketContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  getAgentTickets, 
  getTicketById, 
  confirmTicketPayment, 
  cancelTicket,
  createTicket
} from '../services/ticketService';
import { getLotteryById } from '../services/lotteryService';
import { sendTicketToWhatsApp } from '../services/whatsappService';
import { useAuth } from '../hooks/useAuth';

const TicketContext = createContext();

export const TicketProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get tickets for the current agent
  const getTickets = useCallback(async (status = null, limit = 50) => {
    if (!currentUser) return { tickets: [], error: 'No authenticated user' };
    
    setLoading(true);
    setError(null);
    
    try {
      const tickets = await getAgentTickets(currentUser.uid, status, limit);
      setLoading(false);
      return { tickets };
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets. Please try again.');
      setLoading(false);
      return { tickets: [], error: err.message };
    }
  }, [currentUser]);
  
  // Get ticket by ID
  const getTicket = useCallback(async (ticketId) => {
    if (!currentUser || !ticketId) return { ticket: null, error: 'Invalid parameters' };
    
    setLoading(true);
    setError(null);
    
    try {
      const ticket = await getTicketById(ticketId);
      
      // Verify agent ownership
      if (ticket.agentId !== currentUser.uid) {
        setError('You do not have permission to view this ticket');
        setLoading(false);
        return { ticket: null, error: 'Permission denied' };
      }
      
      setLoading(false);
      return { ticket };
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setError('Failed to load ticket. Please try again.');
      setLoading(false);
      return { ticket: null, error: err.message };
    }
  }, [currentUser]);
  
  // Get lottery for a ticket
  const getTicketLottery = useCallback(async (lotteryId) => {
    if (!lotteryId) return { lottery: null, error: 'Invalid lottery ID' };
    
    try {
      const lottery = await getLotteryById(lotteryId);
      return { lottery };
    } catch (err) {
      console.error('Error fetching lottery:', err);
      return { lottery: null, error: err.message };
    }
  }, []);
  
  // Confirm ticket payment
  const confirmPayment = useCallback(async (ticketId) => {
    if (!currentUser || !ticketId) return { success: false, error: 'Invalid parameters' };
    
    setLoading(true);
    setError(null);
    
    try {
      await confirmTicketPayment(ticketId, currentUser.uid);
      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error('Error confirming payment:', err);
      setError('Failed to confirm payment. Please try again.');
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [currentUser]);
  
  // Cancel ticket
  const cancelTicketById = useCallback(async (ticketId) => {
    if (!currentUser || !ticketId) return { success: false, error: 'Invalid parameters' };
    
    setLoading(true);
    setError(null);
    
    try {
      await cancelTicket(ticketId, currentUser.uid);
      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error('Error cancelling ticket:', err);
      setError('Failed to cancel ticket. Please try again.');
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [currentUser]);
  
  // Book new ticket
  const bookTicket = useCallback(async (ticketData) => {
    if (!currentUser) return { success: false, error: 'No authenticated user' };
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await createTicket({
        ...ticketData,
        agentId: currentUser.uid
      });
      setLoading(false);
      return { success: true, ticketId: result.ticketId, dbId: result.dbId };
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Failed to create ticket. Please try again.');
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [currentUser]);
  
  // Send ticket via WhatsApp
  const sendToWhatsApp = useCallback(async (ticket) => {
    if (!ticket) return { success: false, error: 'Invalid ticket' };
    
    try {
      const whatsappUrl = await sendTicketToWhatsApp(ticket);
      window.open(whatsappUrl, '_blank');
      return { success: true };
    } catch (err) {
      console.error('Error sending to WhatsApp:', err);
      return { success: false, error: 'Failed to send ticket via WhatsApp. Please try again.' };
    }
  }, []);
  
  const value = {
    getTickets,
    getTicket,
    getTicketLottery,
    confirmPayment,
    cancelTicketById,
    bookTicket,
    sendToWhatsApp,
    loading,
    error,
    setError
  };
  
  return (
    <TicketContext.Provider value={value}>
      {children}
    </TicketContext.Provider>
  );
};

export const useTickets = () => useContext(TicketContext);