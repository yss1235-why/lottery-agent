// src/components/tickets/NormalBookingForm.js
import React, { useState } from 'react';
import { bookTicket } from '../../services/ticketService';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import Input from '../common/Input';
import ErrorMessage from '../common/ErrorMessage';

const NormalBookingForm = ({ lotteryId, ticketNumber, onSuccess }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    playerName: '',
    phoneNumber: ''
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
      setError('All fields are required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await bookTicket({
        ...formData,
        number: ticketNumber,
        lotteryId,
        type: 'normal',
        agentId: currentUser.uid
      });
      
      onSuccess?.();
    } catch (error) {
      console.error('Error booking ticket:', error);
      setError('Failed to book ticket: ' + error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="booking-form">
      {error && <ErrorMessage message={error} />}
      
      <div className="form-group">
        <label htmlFor="playerName">Player Name *</label>
        <Input
          id="playerName"
          name="playerName"
          value={formData.playerName}
          onChange={handleChange}
          placeholder="Enter player name"
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
          placeholder="Enter phone number"
          required
        />
      </div>
      
      <div className="form-actions">
        <Button
          type="submit"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          Book Ticket
        </Button>
      </div>
    </form>
  );
};

export default NormalBookingForm;