// src/components/tickets/BookingForm.js
import React from 'react';
import NormalBookingForm from './NormalBookingForm';
import GameBookingForm from './GameBookingForm';

const BookingForm = ({ lotteryId, lotteryType, ticketNumber, onClose, onSuccess }) => {
  return (
    <div className="booking-form-modal">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>&times;</button>
        
        <h2>Book Ticket #{ticketNumber}</h2>
        
        {lotteryType === 'game' ? (
          <GameBookingForm
            lotteryId={lotteryId}
            ticketNumber={ticketNumber}
            onSuccess={onSuccess}
          />
        ) : (
          <NormalBookingForm
            lotteryId={lotteryId}
            ticketNumber={ticketNumber}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default BookingForm;