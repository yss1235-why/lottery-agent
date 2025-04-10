// src/components/tickets/TicketCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../../utils/dateFormatter';
import { formatCurrency } from '../../utils/currencyFormatter';
import Card from '../common/Card';
import Button from '../common/Button';

const TicketCard = ({ ticket, onConfirm, onCancel, onWhatsApp }) => {
  if (!ticket) return null;

  const getStatusClass = () => {
    switch (ticket.status) {
      case 'pending':
        return 'status-pending';
      case 'active':
        return 'status-confirmed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  return (
    <Card className={`ticket-card ${getStatusClass()}`}>
      <div className="ticket-header">
        <div className="ticket-id">{ticket.id}</div>
        <div className={`ticket-status ${getStatusClass()}`}>
          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
        </div>
      </div>
      
      <div className="ticket-body">
        <div className="player-info">
          <div className="info-row">
            <span className="info-label">Player:</span>
            <span className="info-value">{ticket.playerName}</span>
          </div>
          
          {ticket.gameId && (
            <div className="info-row">
              <span className="info-label">Game ID:</span>
              <span className="info-value">{ticket.gameId}</span>
            </div>
          )}
          
          {ticket.serverId && (
            <div className="info-row">
              <span className="info-label">Server ID:</span>
              <span className="info-value">{ticket.serverId}</span>
            </div>
          )}
        </div>
        
        <div className="ticket-details">
          <div className="info-row">
            <span className="info-label">Lottery:</span>
            <span className="info-value">{ticket.lotteryName || 'Unknown Lottery'}</span>
          </div>
          
          <div className="info-row">
            <span className="info-label">Price:</span>
            <span className="info-value">{formatCurrency(ticket.price)}</span>
          </div>
          
          <div className="info-row">
            <span className="info-label">Created:</span>
            <span className="info-value">{formatDateTime(ticket.createdAt)}</span>
          </div>
          
          {ticket.status === 'active' && ticket.bookedAt && (
            <div className="info-row">
              <span className="info-label">Booked:</span>
              <span className="info-value">{formatDateTime(ticket.bookedAt)}</span>
            </div>
          )}
          
          {ticket.status === 'cancelled' && ticket.cancelledAt && (
            <div className="info-row">
              <span className="info-label">Cancelled:</span>
              <span className="info-value">{formatDateTime(ticket.cancelledAt)}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="ticket-actions">
        {ticket.status === 'active' && onCancel && (
          <Button 
            onClick={() => onCancel(ticket.dbId)}
            variant="danger"
          >
            Cancel
          </Button>
        )}
        
        <Button 
          as={Link}
          to={`/tickets/${ticket.dbId}`}
          variant={ticket.status === 'active' ? 'outline' : 'primary'}
        >
          View
        </Button>
        
        {onWhatsApp && (
          <Button 
            onClick={() => onWhatsApp(ticket)}
            variant="outline"
            className="whatsapp-button"
          >
            WhatsApp
          </Button>
        )}
      </div>
    </Card>
  );
};

export default TicketCard;