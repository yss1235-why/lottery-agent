// src/components/tickets/TicketPopup.js
import React, { useState } from 'react';
import { updateTicket } from '../../services/ticketService';
import Button from '../common/Button';
import Input from '../common/Input';
import ErrorMessage from '../common/ErrorMessage';

const TicketPopup = ({ ticket, onClose, onUpdate, onCancel }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    playerName: ticket.playerName,
    phoneNumber: ticket.phoneNumber,
    gameId: ticket.gameId || '',
    serverId: ticket.serverId || ''
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.playerName || !formData.phoneNumber) {
      setError('Player name and phone number are required');
      return;
    }
    
    if (ticket.type === 'game' && (!formData.gameId || !formData.serverId)) {
      setError('Game ID and Server ID are required for game lotteries');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Use the ticket's dbId instead of id for the update
      await updateTicket(ticket.dbId, formData);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating ticket:', error);
      setError('Failed to update ticket: ' + error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ticket-popup">
      <div className="popup-content">
        <button className="close-button" onClick={onClose}>&times;</button>
        
        <h2>Ticket Details</h2>
        
        <div className="ticket-info">
          <div className="info-row">
            <span className="info-label">Ticket ID:</span>
            <span className="info-value">{ticket.id}</span>
          </div>
          
          <div className="info-row">
            <span className="info-label">Ticket Number:</span>
            <span className="info-value">{ticket.number}</span>
          </div>
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            {error && <ErrorMessage message={error} />}
            
            <div className="form-group">
              <label htmlFor="playerName">Player Name *</label>
              <Input
                id="playerName"
                name="playerName"
                value={formData.playerName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number *</label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>
            
            {ticket.type === 'game' && (
              <>
                <div className="form-group">
                  <label htmlFor="gameId">Game ID *</label>
                  <Input
                    id="gameId"
                    name="gameId"
                    value={formData.gameId}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="serverId">Server ID *</label>
                  <Input
                    id="serverId"
                    name="serverId"
                    value={formData.serverId}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}
            
            <div className="form-actions">
              <Button
                type="button"
                onClick={() => setIsEditing(false)}
                variant="secondary"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="player-details">
              <div className="info-row">
                <span className="info-label">Player Name:</span>
                <span className="info-value">{ticket.playerName}</span>
              </div>
              
              <div className="info-row">
                <span className="info-label">Phone Number:</span>
                <span className="info-value">{ticket.phoneNumber}</span>
              </div>
              
              {ticket.type === 'game' && (
                <>
                  <div className="info-row">
                    <span className="info-label">Game ID:</span>
                    <span className="info-value">{ticket.gameId}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Server ID:</span>
                    <span className="info-value">{ticket.serverId}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="form-actions">
              <Button onClick={() => setIsEditing(true)}>
                Edit Details
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TicketPopup;