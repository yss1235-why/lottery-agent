// src/components/dashboard/PendingTickets.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAgentTickets } from '../../services/ticketService';
import { formatDateTime } from '../../utils/dateFormatter';
import { formatCurrency } from '../../utils/currencyFormatter';
import { useAuth } from '../../hooks/useAuth';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import ErrorMessage from '../ui/ErrorMessage';

const PendingTickets = ({ limit = 5 }) => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendingTickets = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const ticketsData = await getAgentTickets(currentUser.uid, 'pending', limit);
        setTickets(ticketsData);
      } catch (err) {
        console.error('Error fetching pending tickets:', err);
        setError('Failed to load pending tickets. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPendingTickets();
  }, [currentUser, limit]);

  if (loading) {
    return <Loading text="Loading pending tickets..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  if (tickets.length === 0) {
    return (
      <Card className="pending-tickets-empty">
        <div className="empty-state">
          <p>No pending tickets to confirm.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="pending-tickets">
      {tickets.map(ticket => (
        <Card key={ticket.dbId} className="ticket-card">
          <div className="ticket-info">
            <div className="ticket-header">
              <div className="ticket-id">{ticket.id}</div>
              <div className="ticket-status pending">Pending</div>
            </div>
            
            <div className="ticket-details">
              <div className="player-info">
                <div className="player-name">{ticket.player.name}</div>
                <div className="player-game-id">Game ID: {ticket.player.gameId}</div>
              </div>
              
              <div className="ticket-meta">
                <div className="ticket-date">Created: {formatDateTime(ticket.createdAt)}</div>
                <div className="ticket-price">Price: {formatCurrency(ticket.price)}</div>
              </div>
            </div>
          </div>
          
          <div className="ticket-actions">
            <Button 
              as={Link}
              to={`/tickets/confirm/${ticket.dbId}`}
              variant="success"
            >
              Confirm
            </Button>
            
            <Button 
              as={Link}
              to={`/tickets/${ticket.dbId}`}
              variant="outline"
            >
              View
            </Button>
          </div>
        </Card>
      ))}
      
      <div className="view-all">
        <Link to="/tickets/manage?status=pending">View All Pending Tickets</Link>
      </div>
    </div>
  );
};

export default PendingTickets;