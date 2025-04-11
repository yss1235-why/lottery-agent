// src/components/lottery/LotteryCard.js
import React from 'react';
import { formatDateTime, formatTimeRemaining } from '../../utils/dateFormatter';
import { formatCurrency } from '../../utils/currencyFormatter';

const LotteryCard = ({ lottery, isSelected = false, isExpanded = false }) => {
  if (!lottery) return null;

  // Calculate booking progress percentage
  const progressPercentage = lottery.ticketCapacity > 0 
    ? (lottery.ticketsBooked / lottery.ticketCapacity) * 100
    : 0;

  // Get status class for styling
  const getStatusClass = () => {
    switch (lottery.status) {
      case 'active':
        return 'status-active';
      case 'upcoming':
        return 'status-upcoming';
      case 'drawing':
        return 'status-drawing';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      case 'deleted':
        return 'status-deleted';
      default:
        return '';
    }
  };

  return (
    <div className={`lottery-card ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''} ${lottery.status}`}>
      {lottery.image && (
        <div className="lottery-image">
          <img src={lottery.image} alt={lottery.name || 'Lottery'} />
        </div>
      )}
      
      <div className="lottery-header">
        <h3>{lottery.name || `Lottery #${lottery.id}`}</h3>
        <span className={`status-badge ${getStatusClass()}`}>
          {lottery.status === 'drawing' ? 'Drawing' : lottery.status.charAt(0).toUpperCase() + lottery.status.slice(1)}
        </span>
      </div>
      
      <div className="lottery-details">
        <div className="detail-row">
          <span className="detail-label">Type:</span>
          <span className="detail-value">
            {lottery.type === 'game' ? 'Game Lottery' : 'Regular Lottery'}
          </span>
        </div>
        
        {lottery.type === 'game' && lottery.gameDetails && (
          <div className="detail-row">
            <span className="detail-label">Game:</span>
            <span className="detail-value">{lottery.gameDetails}</span>
          </div>
        )}
        
        <div className="detail-row">
          <span className="detail-label">Prize Pool:</span>
          <span className="detail-value">{formatCurrency(lottery.prizePool)}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Ticket Price:</span>
          <span className="detail-value">{formatCurrency(lottery.ticketPrice)}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Tickets:</span>
          <span className="detail-value">
            {lottery.ticketsBooked} / {lottery.ticketCapacity}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">
            {lottery.status === 'completed' || lottery.status === 'cancelled' ? 'Drawn On:' : 'Draw Time:'}
          </span>
          <span className="detail-value">
            {formatDateTime(lottery.completedAt || lottery.drawTime)}
          </span>
        </div>
        
        {(lottery.status === 'active' || lottery.status === 'drawing') && (
          <div className="detail-row">
            <span className="detail-label">Remaining:</span>
            <span className="detail-value">{formatTimeRemaining(lottery.drawTime)}</span>
          </div>
        )}
      </div>
      
      {lottery.status === 'active' && (
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      )}
      
      {/* Drawing animation indicator */}
      {lottery.status === 'drawing' && (
        <div className="drawing-indicator">
          <div className="drawing-pulse"></div>
          <div className="drawing-text">Drawing in progress...</div>
        </div>
      )}
      
      {/* Display first prize winner or multiple winners summary */}
      {lottery.status === 'completed' && !isExpanded && (
        lottery.winners ? (
          <div className="winners-summary">
            <div className="winner-label">Winners:</div>
            <div className="winner-count">{lottery.winners.length} prizes awarded</div>
          </div>
        ) : lottery.winner ? (
          <div className="winner-summary">
            <div className="winner-label">Winner:</div>
            <div className="winner-name">{lottery.winner.playerName}</div>
          </div>
        ) : null
      )}
      
      {lottery.status === 'deleted' && !isExpanded && (
        <div className="deleted-summary">
          <div className="deleted-label">Tickets Preserved:</div>
          <div className="deleted-count">{lottery.ticketsBooked} tickets</div>
        </div>
      )}
      
      {isExpanded ? (
        <div className="card-action-hint">
          <span>▲ Click to collapse</span>
        </div>
      ) : isSelected ? (
        <div className="card-action-hint">
          <span>✓ Selected</span>
        </div>
      ) : (
        <div className="card-action-hint">
          <span>{lottery.status === 'active' ? 'Click to select' : 'Click to view details'}</span>
        </div>
      )}
    </div>
  );
};

export default LotteryCard;
