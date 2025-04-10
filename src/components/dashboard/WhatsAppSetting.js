// src/components/dashboard/WhatsAppSetting.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateAgentProfile } from '../../services/authService';
import Card from '../common/Card';
import Button from '../common/Button';

const WhatsAppSetting = () => {
  const { currentUser, agentData } = useAuth();
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (agentData && agentData.whatsappNumber) {
      setWhatsappNumber(agentData.whatsappNumber);
    }
  }, [agentData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone number
    if (!whatsappNumber) {
      setError('Please enter your WhatsApp number');
      return;
    }
    
    // Basic phone number validation
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(whatsappNumber)) {
      setError('Please enter a valid WhatsApp number (10-15 digits, can start with +)');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      await updateAgentProfile(currentUser.uid, {
        whatsappNumber: whatsappNumber
      });
      
      setSuccess('WhatsApp number updated successfully!');
    } catch (err) {
      console.error('Error updating WhatsApp number:', err);
      setError('Failed to update WhatsApp number. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <h2>WhatsApp Number Setting</h2>
      <p className="form-description">
        Set your WhatsApp number so players can contact you to book tickets. 
        This number will be provided to players when they view your lotteries.
      </p>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="whatsappNumber">WhatsApp Number</label>
          <div className="form-hint">Include country code (e.g., +91 for India)</div>
          <input
            type="tel"
            id="whatsappNumber"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="e.g., +910123456789"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-actions">
          <Button
            type="submit"
            disabled={isSubmitting}
            className={isSubmitting ? 'btn-primary loading' : 'btn-primary'}
          >
            {isSubmitting ? 'Updating...' : 'Update WhatsApp Number'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default WhatsAppSetting;