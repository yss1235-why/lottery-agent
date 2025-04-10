// src/components/tabs/TicketsTab.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAgentLotteries } from '../../services/lotteryService';
import { getLotteryTickets, cancelTicket } from '../../services/ticketService';
import TicketGrid from '../tickets/TicketGrid';
import TicketPopup from '../tickets/TicketPopup';
import BookingForm from '../tickets/BookingForm';
import Loading from '../common/Loading';
import Card from '../common/Card';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';

const TicketsTab = () => {
  const { currentUser } = useAuth();
  const [lotteries, setLotteries] = useState([]);
  const [selectedLottery, setSelectedLottery] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [ticketNumberToBook, setTicketNumberToBook] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  useEffect(() => {
    const fetchLotteries = async () => {
      if (!currentUser) return;
      
      try {
        // Fetch all agent lotteries
        const lotteriesData = await getAgentLotteries(currentUser.uid);
        
        // Filter to only include active lotteries
        const activeLotteries = lotteriesData.filter(lottery => 
          lottery.status === 'active' || lottery.status === 'upcoming'
        );
        
        setLotteries(activeLotteries);
        
        // If we have active lotteries, select the first one by default
        if (activeLotteries.length > 0) {
          setSelectedLottery(activeLotteries[0]);
        } else {
          // Clear selection if no active lotteries
          setSelectedLottery(null);
        }
      } catch (error) {
        console.error('Error fetching lotteries:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLotteries();
  }, [currentUser]);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!selectedLottery) {
        setTickets([]);
        return;
      }
      
      setLoading(true);
      try {
        const ticketsData = await getLotteryTickets(selectedLottery.id);
        setTickets(ticketsData);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTickets();
  }, [selectedLottery]);

  const handleLotteryChange = (e) => {
    const lotteryId = e.target.value;
    const lottery = lotteries.find(lottery => lottery.id === lotteryId);
    setSelectedLottery(lottery);
  };

  const handleTicketClick = (ticket) => {
    if (ticket.booked) {
      setSelectedTicket(ticket);
    } else {
      setTicketNumberToBook(ticket.number);
      setShowBookingModal(true);
    }
  };

  const handleClosePopup = () => {
    setSelectedTicket(null);
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setTicketNumberToBook(null);
  };

  const handleTicketBooked = () => {
    setShowBookingModal(false);
    // Refresh tickets after booking
    getLotteryTickets(selectedLottery.id).then(ticketsData => {
      setTickets(ticketsData);
    });
  };

  const handleTicketUpdated = () => {
    setSelectedTicket(null);
    // Refresh tickets after update
    getLotteryTickets(selectedLottery.id).then(ticketsData => {
      setTickets(ticketsData);
    });
  };
  
  const handleCancelTicket = (ticket) => {
    setTicketToCancel(ticket);
    setShowCancelModal(true);
    setCancelError(null);
    setCancelSuccess(false);
  };

  const confirmCancelTicket = async () => {
    if (!ticketToCancel || !currentUser) return;
    
    try {
      await cancelTicket(ticketToCancel.dbId, currentUser.uid);
      setCancelSuccess(true);
      setTimeout(() => {
        setShowCancelModal(false);
        // Refresh tickets after cancellation
        getLotteryTickets(selectedLottery.id).then(ticketsData => {
          setTickets(ticketsData);
        });
      }, 2000);
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      setCancelError(error.message);
    }
  };

  if (loading && !selectedLottery) {
    return <Loading message="Loading tickets..." />;
  }

  if (lotteries.length === 0) {
    return (
      <Card className="empty-state">
        <p>No active lotteries found. Please create a lottery first.</p>
      </Card>
    );
  }

  return (
    <div className="tickets-tab">
      <h1>Tickets</h1>
      
      <div className="lottery-selector">
        <label htmlFor="lottery-select">Select Lottery:</label>
        <select 
          id="lottery-select" 
          value={selectedLottery?.id || ''}
          onChange={handleLotteryChange}
          className="enhanced-select"
        >
          {lotteries.map(lottery => (
            <option key={lottery.id} value={lottery.id}>
              {lottery.name || `Lottery #${lottery.id}`} ({lottery.status})
            </option>
          ))}
        </select>
      </div>
      
      {selectedLottery && (
        <Card className="ticket-grid-container">
          <TicketGrid 
            lottery={selectedLottery}
            tickets={tickets}
            onTicketClick={handleTicketClick}
            onCancelTicket={handleCancelTicket}
          />
        </Card>
      )}
      
      {selectedTicket && (
        <TicketPopup 
          ticket={selectedTicket}
          onClose={handleClosePopup}
          onUpdate={handleTicketUpdated}
          onCancel={() => handleCancelTicket(selectedTicket)}
        />
      )}
      
      {showBookingModal && selectedLottery && (
        <BookingForm 
          lotteryId={selectedLottery.id}
          lotteryType={selectedLottery.type}
          ticketNumber={ticketNumberToBook}
          onClose={handleCloseBookingModal}
          onSuccess={handleTicketBooked}
        />
      )}
      
      {showCancelModal && ticketToCancel && (
        <ConfirmDialog
          title="Cancel Ticket"
          message={
            cancelSuccess 
              ? "Ticket cancelled successfully!" 
              : `Are you sure you want to cancel ticket #${ticketToCancel.number}? This action cannot be undone.`
          }
          confirmText="Cancel Ticket"
          cancelText="Keep Ticket"
          onConfirm={confirmCancelTicket}
          onCancel={() => setShowCancelModal(false)}
          error={cancelError}
          success={cancelSuccess}
          isConfirmDestructive={true}
        />
      )}
    </div>
  );
};

export default TicketsTab;