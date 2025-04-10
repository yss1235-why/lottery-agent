// src/components/tabs/BookTicketTab.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAgentLotteries } from '../../services/lotteryService';
import NormalBookingForm from '../tickets/NormalBookingForm';
import GameBookingForm from '../tickets/GameBookingForm';
import Loading from '../common/Loading';
import Card from '../common/Card';

const BookTicketTab = () => {
  const { currentUser } = useAuth();
  const [lotteries, setLotteries] = useState([]);
  const [selectedLottery, setSelectedLottery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLotteries = async () => {
      if (!currentUser) return;
      
      try {
        // Only get active lotteries for booking
        const lotteriesData = await getAgentLotteries(currentUser.uid, 'active');
        setLotteries(lotteriesData);
        
        // Select the first lottery by default if available
        if (lotteriesData.length > 0) {
          setSelectedLottery(lotteriesData[0]);
        }
      } catch (error) {
        console.error('Error fetching lotteries:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLotteries();
  }, [currentUser]);

  const handleLotteryChange = (e) => {
    const lotteryId = e.target.value;
    const lottery = lotteries.find(lottery => lottery.id === lotteryId);
    setSelectedLottery(lottery);
  };

  const handleBookingSuccess = () => {
    // Could add some success feedback here
    console.log('Ticket booked successfully');
  };

  if (loading) {
    return <Loading message="Loading lotteries..." />;
  }

  if (lotteries.length === 0) {
    return (
      <Card className="empty-state">
        <p>No active lotteries found. Please create a lottery first.</p>
      </Card>
    );
  }

  return (
    <div className="book-ticket-tab">
      <h1>Book Ticket</h1>
      
      <div className="lottery-selector">
        <label htmlFor="lottery-select">Select Lottery:</label>
        <select 
          id="lottery-select" 
          value={selectedLottery?.id || ''}
          onChange={handleLotteryChange}
        >
          {lotteries.map(lottery => (
            <option key={lottery.id} value={lottery.id}>
              {lottery.name || `Lottery #${lottery.id}`}
            </option>
          ))}
        </select>
      </div>
      
      {selectedLottery && (
        <div className="booking-form-container">
          {selectedLottery.type === 'game' ? (
            <GameBookingForm 
              lotteryId={selectedLottery.id}
              onSuccess={handleBookingSuccess}
            />
          ) : (
            <NormalBookingForm 
              lotteryId={selectedLottery.id}
              onSuccess={handleBookingSuccess}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default BookTicketTab;