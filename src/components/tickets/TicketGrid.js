// src/components/tickets/TicketGrid.js
import React from 'react';
import Button from '../common/Button';

const TicketGrid = ({ lottery, tickets, onTicketClick, onCancelTicket }) => {
  if (!lottery) return null;
  
  // Create an array of all possible ticket numbers
  const allTickets = [];
  for (let i = 1; i <= lottery.ticketCapacity; i++) {
    // Find if this ticket number is booked
    const existingTicket = tickets.find(t => t.number === i);
    
    allTickets.push({
      number: i,
      booked: !!existingTicket,
      ...existingTicket
    });
  }

  return (
    <div className="ticket-grid">
      <div className="ticket-header">
        <h3>Tickets: {tickets.filter(t => t.booked && t.status !== 'cancelled').length} / {lottery.ticketCapacity} booked</h3>
      </div>
      
      <div className="grid-container">
        {allTickets.map(ticket => (
          <div
            key={ticket.number}
            className={`grid-item ${ticket.booked ? (ticket.status === 'cancelled' ? 'cancelled' : 'booked') : 'unbooked'}`}
            onClick={() => onTicketClick(ticket)}
          >
            <span className="ticket-number">{ticket.number}</span>
            {ticket.booked && (
              <>
                <span className="ticket-id">{ticket.id}</span>
                <span className="player-name">{ticket.playerName}</span>
                {ticket.status === 'active' && ticket.booked && (
                  <Button 
                    variant="danger"
                    className="btn-small cancel-ticket-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancelTicket(ticket);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketGrid;