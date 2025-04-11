// src/components/lottery/DrawLottery.js

// Add this import if not already present
import { updateLotteryStatus } from '../../services/lotteryService';

// Modify the startDraw function
const startDraw = async () => {
  if (!tickets || tickets.length === 0) {
    setError('No tickets available for drawing');
    return;
  }
  
  if (!lottery || !lottery.prizes || lottery.prizes.length === 0) {
    setError('No prizes defined for this lottery');
    return;
  }

  // Update lottery status to "drawing" in the database
  try {
    await updateLotteryStatus(lottery.id, 'drawing');
  } catch (error) {
    console.error('Error updating lottery status to drawing:', error);
    setError('Failed to update lottery status. Please try again.');
    return;
  }

  setDrawInProgress(true);
  setSelectedTickets([]);
  setError(null);
  setShowResult(false);
  setFinalReveal(false);
  setAnimationPhase('countdown');
  
  // Reset animation state
  animationStateRef.current = {
    ticket: null,
    sequence: [],
    currentIndex: 0,
    revealedPositions: [],
    revealedChars: [],
    active: false
  };
  
  // Start the countdown animation
  setShowCountdown(true);
  setCountdownValue(3);
};

// Modify the completeDrawProcess function
const completeDrawProcess = async (winningTickets) => {
  if (!lottery || !lottery.id || winningTickets.length === 0) {
    setError('Invalid lottery or no winners selected');
    return;
  }
  
  try {
    // Extract ticket IDs
    const winningTicketIds = winningTickets.map(ticket => ticket.id);
    
    // Save the draw results to the database
    // The drawLottery function should be updated to change status from "drawing" to "completed"
    await drawLottery(lottery.id, winningTicketIds);
    
    // No auto-close - require manual closing
  } catch (error) {
    console.error('Error completing draw:', error);
    setError('Failed to record the lottery draw. The winners have been selected, but there was an error saving the results.');
  }
};
