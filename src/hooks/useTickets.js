// src/hooks/useTickets.js
import { useState, useEffect } from 'react';
import { ref, get, query, orderByChild, equalTo, limitToLast, startAt, endAt } from 'firebase/database';
import { database } from '../firebase/config';
import { useAuth } from './useAuth';

// Hook to fetch tickets for the current agent
export const useAgentTickets = (status = null, limit = 50) => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const ticketsRef = ref(database, 'tickets');
        let ticketsQuery;
        
        if (status) {
          // Query by agent ID and status
          // Note: Firebase doesn't support multiple orderByChild queries,
          // so we filter by agent ID first, then filter by status in JavaScript
          ticketsQuery = query(
            ticketsRef,
            orderByChild('agentId'),
            equalTo(currentUser.uid),
            limitToLast(limit * 2) // Fetch more to account for status filtering
          );
        } else {
          // Query by agent ID only
          ticketsQuery = query(
            ticketsRef,
            orderByChild('agentId'),
            equalTo(currentUser.uid),
            limitToLast(limit)
          );
        }
        
        const snapshot = await get(ticketsQuery);
        
        if (snapshot.exists()) {
          const ticketsData = snapshot.val();
          let ticketsArray = Object.keys(ticketsData).map(key => ({
            id: key,
            ...ticketsData[key]
          }));
          
          // Apply status filter if provided
          if (status) {
            ticketsArray = ticketsArray.filter(ticket => ticket.status === status);
            // Re-apply limit after filtering
            ticketsArray = ticketsArray.slice(0, limit);
          }
          
          // Sort by createdAt (descending)
          ticketsArray.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          
          setTickets(ticketsArray);
        } else {
          setTickets([]);
        }
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [currentUser, status, limit]);

  return { tickets, loading, error };
};

// Hook to fetch a specific ticket by ID
export const useTicket = (ticketId) => {
  const { currentUser } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!currentUser || !ticketId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const ticketRef = ref(database, `tickets/${ticketId}`);
        const snapshot = await get(ticketRef);

        if (snapshot.exists()) {
          const ticketData = snapshot.val();
          
          // Verify this ticket belongs to the current agent
          if (ticketData.agentId !== currentUser.uid) {
            setError('You do not have permission to view this ticket');
            setTicket(null);
            return;
          }
          
          setTicket({
            id: ticketId,
            ...ticketData
          });
        } else {
          setError('Ticket not found');
        }
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [currentUser, ticketId]);

  return { ticket, loading, error };
};

// Hook to fetch player tickets by game ID
export const usePlayerTickets = (gameId, limit = 50) => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayerTickets = async () => {
      if (!currentUser || !gameId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Since Firebase doesn't support querying nested objects directly,
        // we'll fetch all tickets for the agent and filter by gameId in JavaScript
        const ticketsRef = ref(database, 'tickets');
        const agentQuery = query(
          ticketsRef,
          orderByChild('agentId'),
          equalTo(currentUser.uid),
          limitToLast(limit * 2) // Fetch more to account for filtering
        );
        
        const snapshot = await get(agentQuery);
        
        if (snapshot.exists()) {
          const ticketsData = snapshot.val();
          const ticketsArray = Object.keys(ticketsData)
            .map(key => ({
              id: key,
              ...ticketsData[key]
            }))
            .filter(ticket => 
              ticket.player && ticket.player.gameId === gameId
            )
            .slice(0, limit); // Apply limit after filtering
          
          // Sort by createdAt (descending)
          ticketsArray.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          
          setTickets(ticketsArray);
        } else {
          setTickets([]);
        }
      } catch (err) {
        console.error('Error fetching player tickets:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerTickets();
  }, [currentUser, gameId, limit]);

  return { tickets, loading, error };
};