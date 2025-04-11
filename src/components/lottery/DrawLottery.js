// src/components/lottery/DrawLottery.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { drawLottery, updateLotteryStatus } from '../../services/lotteryService';
import { getLotteryTickets } from '../../services/ticketService';
import Button from '../common/Button';
import Loading from '../common/Loading';
import './DrawLottery.css';

const DrawLottery = ({ lottery, onClose, onDrawComplete }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawInProgress, setDrawInProgress] = useState(false);
  const [error, setError] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  // Pre-determined draw results for all prizes
  const [preSelectedWinners, setPreSelectedWinners] = useState([]);
  
  // Current draw state
  const [currentDrawIndex, setCurrentDrawIndex] = useState(-1);
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(-1);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [allWinners, setAllWinners] = useState([]);
  
  // Animation states
  const [animationPhase, setAnimationPhase] = useState('ready'); // ready, countdown, revealing, complete
  const [revealedChars, setRevealedChars] = useState([]);
  const [revealedPositions, setRevealedPositions] = useState([]);
  const [animatingChar, setAnimatingChar] = useState(null);
  const [animatingPosition, setAnimatingPosition] = useState(null);
  const [showCharacterCountdown, setShowCharacterCountdown] = useState(false);
  const [characterCountdown, setCharacterCountdown] = useState(3);
  
  // Countdown timer states
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  
  // Timer references
  const timerRef = useRef(null);
  const characterTimerRef = useRef(null);
  const drawSequenceTimerRef = useRef(null);
  
  // Animation timing controls (in milliseconds)
  const timings = {
    characterCountdown: 1000,    // 1 second per countdown number
    betweenCharacters: 500,      // Delay between characters
    finalRevealPause: 2000,      // 2 seconds pause before showing results
    betweenPrizes: 2000,         // 2 seconds pause between prize draws
  };
  
  // Debug counter to track character revelations
  const charRevealCountRef = useRef(0);
  
  // Animation state tracking
  const animationStateRef = useRef({
    sequence: [],
    currentIndex: 0,
    active: false,
    currentCharIndex: 0,
    ticket: null,
    currentDrawIndex: -1, // Store the current draw index here as well
    preSelectedWinners: [] // Store pre-selected winners to avoid stale closures
  });

  // Fetch tickets when component mounts
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        if (!lottery || !lottery.id) {
          setError('Invalid lottery information');
          setLoading(false);
          return;
        }
        
        const ticketsData = await getLotteryTickets(lottery.id);
        const activeTickets = ticketsData.filter(ticket => ticket.booked && ticket.status === 'active');
        setTickets(activeTickets);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        setError('Failed to load tickets for this lottery');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTickets();
  }, [lottery]);

  // Clean up function that runs on unmount
  useEffect(() => {
    return () => {
      // Clean up all timers
      if (timerRef.current) clearTimeout(timerRef.current);
      if (characterTimerRef.current) clearTimeout(characterTimerRef.current);
      if (drawSequenceTimerRef.current) clearTimeout(drawSequenceTimerRef.current);
      
      // Mark animation as inactive to prevent further updates
      animationStateRef.current.active = false;
    };
  }, []);

  // Pre-select all winners at the start of the draw
  const preSelectAllWinners = useCallback(() => {
    if (!lottery || !lottery.prizes || !tickets || tickets.length === 0) {
      console.error("Cannot select winners: invalid lottery data or no tickets");
      return false;
    }
    
    console.log(`Pre-selecting winners for ${lottery.prizes.length} prizes from ${tickets.length} tickets`);
    
    // Create a copy of tickets to work with
    const availableTickets = [...tickets];
    const selectedWinners = [];
    
    // Select winners for each prize, starting from the last prize (highest index)
    for (let i = lottery.prizes.length - 1; i >= 0; i--) {
      // Stop if no more tickets are available
      if (availableTickets.length === 0) {
        console.warn(`Ran out of tickets after selecting ${selectedWinners.length} winners`);
        break;
      }
      
      // Randomly select a ticket
      const randomIndex = Math.floor(Math.random() * availableTickets.length);
      const selectedTicket = availableTickets[randomIndex];
      
      if (!selectedTicket || !selectedTicket.id) {
        console.error(`Invalid ticket selected at index ${randomIndex}`);
        continue;
      }
      
      // Remove the selected ticket from available tickets
      availableTickets.splice(randomIndex, 1);
      
      // Add to winners with prize information
      selectedWinners.push({
        ticket: selectedTicket,
        prizeIndex: i,
        prizeName: lottery.prizes[i].name,
        prizeValue: lottery.prizes[i].value
      });
      
      console.log(`Pre-selected ticket ${selectedTicket.id} for prize index ${i}`);
    }
    
    // Sort winners by prize index (descending, so highest prize is first)
    selectedWinners.sort((a, b) => b.prizeIndex - a.prizeIndex);
    
    console.log(`Final selected winners count: ${selectedWinners.length}`);
    
    // Set the pre-selected winners - use a callback to ensure we're using the latest state
    setPreSelectedWinners(selectedWinners);
    
    // Also store in a ref to avoid stale closure issues
    animationStateRef.current.preSelectedWinners = selectedWinners;
    
    return selectedWinners.length > 0;
  }, [lottery, tickets]);

  // Generate a randomized reveal sequence for characters
  const generateRevealSequence = useCallback((ticketId) => {
    if (!ticketId) return [];
    
    // Create array of all positions (0 to ticketId.length-1)
    const positions = Array.from({ length: ticketId.length }, (_, i) => i);
    
    // Shuffle array randomly (Fisher-Yates algorithm)
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]]; // swap elements
    }
    
    console.log(`Generated reveal sequence for ${ticketId}: ${positions.join(',')}`);
    return positions;
  }, []);

  // Start the prize reveal sequence
  const startPrizeRevealSequence = useCallback(() => {
    // Use winners from both state and ref to ensure we have the latest
    const winners = preSelectedWinners.length > 0 ? 
                   preSelectedWinners : 
                   animationStateRef.current.preSelectedWinners;
    
    // Begin with the first winner in the pre-selected list (highest prize)
    if (!winners || winners.length === 0) {
      console.error("No pre-selected winners available for prize reveal sequence");
      setAnimationPhase('complete');
      setShowResult(true);
      return;
    }
    
    console.log(`Starting prize reveal sequence with ${winners.length} winners`);
    // Store the initial draw index in both state and ref
    const initialIndex = 0;
    setCurrentDrawIndex(initialIndex);
    // Also store in the ref for immediate access
    animationStateRef.current.currentDrawIndex = initialIndex;
    
    revealNextPrize(initialIndex);
  }, [preSelectedWinners]);

  // Reveal the next prize in the sequence
  const revealNextPrize = useCallback((index) => {
    // Use the winners from both state and ref to ensure we have the latest
    const winners = preSelectedWinners.length > 0 ? 
                   preSelectedWinners : 
                   animationStateRef.current.preSelectedWinners;
    
    console.log(`Starting to reveal prize at index ${index}, total winners: ${winners.length}`);
    
    // Check if we've reached the end of the winners
    if (index >= winners.length) {
      console.log("All prizes revealed, showing final results");
      setAnimationPhase('complete');
      setShowResult(true);
      return;
    }
    
    const currentWinner = winners[index];
    
    if (!currentWinner || !currentWinner.ticket) {
      console.error(`Invalid winner at index ${index}`);
      setAnimationPhase('complete');
      setShowResult(true);
      return;
    }
    
    const ticket = currentWinner.ticket;
    const prizeIndex = currentWinner.prizeIndex;
    
    console.log(`Revealing prize ${prizeIndex}: ${currentWinner.prizeName} for ticket ${ticket.id}`);
    
    // Set current prize and ticket
    setCurrentPrizeIndex(prizeIndex);
    setCurrentTicket(ticket);
    
    // Generate character reveal sequence
    const sequence = generateRevealSequence(ticket.id);
    
    // Reset reveal state
    setRevealedChars(Array(ticket.id.length).fill(null));
    setRevealedPositions([]);
    setAnimatingChar(null);
    setAnimatingPosition(null);
    setShowCharacterCountdown(false);
    
    // Reset character reveal counter
    charRevealCountRef.current = 0;
    
    // Set animation phase
    setAnimationPhase('revealing');
    
    // Update animation state reference
    animationStateRef.current = {
      sequence,
      currentIndex: 0,
      active: true,
      currentCharIndex: 0,
      ticket: ticket,
      currentDrawIndex: index, // Store the current draw index in the ref
      preSelectedWinners: winners // Keep a copy of winners
    };
    
    // Start character reveal
    setTimeout(() => {
      console.log(`Starting character reveal for ticket ${ticket.id}`);
      revealNextCharacter();
    }, 500);
  }, [preSelectedWinners, generateRevealSequence]);

  // Reveal the next character in the ticket ID
  const revealNextCharacter = useCallback(() => {
    const { sequence, currentCharIndex, ticket } = animationStateRef.current;
    
    // Check if we've finished revealing all characters
    if (currentCharIndex >= sequence.length || !animationStateRef.current.active) {
      console.log(`All ${currentCharIndex} characters revealed for ticket ${ticket?.id}, finishing prize reveal`);
      finishPrizeReveal();
      return;
    }
    
    // Get the position and character to reveal
    const positionToReveal = sequence[currentCharIndex];
    const charToReveal = ticket.id.charAt(positionToReveal);
    
    console.log(`Revealing character at position ${positionToReveal}: ${charToReveal} (${currentCharIndex+1}/${sequence.length})`);
    
    // Set the character being animated
    setAnimatingPosition(positionToReveal);
    setAnimatingChar(charToReveal);
    
    // Start the countdown
    setShowCharacterCountdown(true);
    setCharacterCountdown(3);
    
    // Countdown function
    const runCountdown = (count) => {
      if (!animationStateRef.current.active) return;
      
      if (count > 0) {
        // Continue countdown
        setCharacterCountdown(count - 1);
        
        // Schedule next countdown
        characterTimerRef.current = setTimeout(() => {
          runCountdown(count - 1);
        }, timings.characterCountdown);
      } else {
        // Reveal the character
        setRevealedChars(prev => {
          const updated = [...prev];
          updated[positionToReveal] = charToReveal;
          return updated;
        });
        
        setRevealedPositions(prev => [...prev, positionToReveal]);
        setShowCharacterCountdown(false);
        
        // Increment character reveal counter
        charRevealCountRef.current += 1;
        
        // Update current character index
        animationStateRef.current.currentCharIndex = currentCharIndex + 1;
        
        // Move to next character
        characterTimerRef.current = setTimeout(() => {
          revealNextCharacter();
        }, timings.betweenCharacters);
      }
    };
    
    // Start countdown
    runCountdown(3);
  }, [timings.betweenCharacters, timings.characterCountdown]);

  // Finish revealing the current prize and prepare for the next one
  const finishPrizeReveal = useCallback(() => {
    // Safety check to prevent function from running after component unmounts
    if (!animationStateRef.current.active) {
      console.log("Animation is no longer active, skipping finishPrizeReveal");
      return;
    }
    
    // Get the draw index from the animation state ref instead of using currentDrawIndex state
    const drawIndex = animationStateRef.current.currentDrawIndex;
    
    // Use winners from both state and ref to ensure we have the latest
    const winners = preSelectedWinners.length > 0 ? 
                   preSelectedWinners : 
                   animationStateRef.current.preSelectedWinners;
    
    console.log(`Finishing prize reveal for draw index ${drawIndex}`);
    console.log(`Current preSelectedWinners length: ${winners.length}`);
    
    // Guard against empty winners array
    if (!winners || winners.length === 0) {
      console.error(`No winners available - cannot finish prize reveal`);
      setAnimationPhase('complete');
      setShowResult(true);
      return;
    }
    
    if (drawIndex < 0 || drawIndex >= winners.length) {
      console.error(`Invalid draw index: ${drawIndex}, winners length: ${winners.length}`);
      // Handle the error gracefully by moving to completion
      setAnimationPhase('complete');
      setShowResult(true);
      return;
    }
    
    // Get current winner
    const currentWinner = winners[drawIndex];
    if (!currentWinner) {
      console.error(`No winner found at index ${drawIndex}`);
      setAnimationPhase('complete');
      setShowResult(true);
      return;
    }
    
    const ticket = currentWinner.ticket;
    if (!ticket) {
      console.error(`Winner at index ${drawIndex} has no ticket`);
      setAnimationPhase('complete');
      setShowResult(true);
      return;
    }
    
    console.log(`Adding winner to results: Ticket ${ticket.id} for prize ${currentWinner.prizeName}`);
    
    // Add to the completed winners list - using a callback to ensure we're working with the latest state
    setAllWinners(prev => {
      const newWinner = {
        id: ticket.id,
        number: ticket.number,
        playerName: ticket.playerName || 'Unknown Player',
        phoneNumber: ticket.phoneNumber || 'Unknown',
        prizeIndex: currentWinner.prizeIndex,
        prizeName: currentWinner.prizeName || 'Prize',
        prizeValue: currentWinner.prizeValue
      };
      
      // If the ticket has gameId or serverId, add them
      if (ticket.gameId) newWinner.gameId = ticket.gameId;
      if (ticket.serverId) newWinner.serverId = ticket.serverId;
      
      const updated = [...prev, newWinner];
      console.log(`Updated winners list, now contains ${updated.length} winners`);
      return updated;
    });
    
    // Pause before moving to the next prize
    console.log(`Scheduling next prize reveal after ${timings.betweenPrizes}ms`);
    
    // Clear any existing timer
    if (drawSequenceTimerRef.current) {
      clearTimeout(drawSequenceTimerRef.current);
    }
    
    // Create a local copy of the winners and current index to use in timeout
    const currentDrawIndexCopy = drawIndex;
    const winnersCopy = [...winners];
    
    drawSequenceTimerRef.current = setTimeout(() => {
      // Verify component is still mounted and animation is active
      if (!animationStateRef.current.active) {
        console.log("Animation is no longer active, skipping next prize reveal");
        return;
      }
      
      const nextIndex = currentDrawIndexCopy + 1;
      console.log(`Moving to next prize at index ${nextIndex}`);
      
      if (nextIndex < winnersCopy.length) {
        try {
          // Move to the next prize - update both the React state and our ref
          setCurrentDrawIndex(nextIndex);
          animationStateRef.current.currentDrawIndex = nextIndex;
          revealNextPrize(nextIndex);
        } catch (error) {
          console.error("Error advancing to next prize:", error);
          setAnimationPhase('complete');
          setShowResult(true);
        }
      } else {
        // End of prizes
        console.log("No more prizes to reveal, completing the draw");
        setAnimationPhase('complete');
        setShowResult(true);
      }
    }, timings.betweenPrizes);
  }, [preSelectedWinners, timings.betweenPrizes, revealNextPrize]);

  // Handle countdown animation for draw start
  useEffect(() => {
    if (!lottery || !lottery.prizes) return;
    
    if (showCountdown && countdownValue > 0) {
      timerRef.current = setTimeout(() => {
        setCountdownValue(countdownValue - 1);
      }, 1000);
      
      return () => clearTimeout(timerRef.current);
    } else if (showCountdown && countdownValue === 0) {
      setShowCountdown(false);
      startPrizeRevealSequence();
    }
  }, [showCountdown, countdownValue, lottery, startPrizeRevealSequence]);

  // Complete the drawing process
  const completeDrawProcess = useCallback(async (winningTickets) => {
    if (!lottery || !lottery.id) {
      setError('Invalid lottery data');
      return;
    }
    
    if (!winningTickets || !Array.isArray(winningTickets) || winningTickets.length === 0) {
      setError('No winners selected');
      return;
    }
    
    try {
      // Extract ticket IDs - make this more robust
      const winningTicketIds = winningTickets.map(ticket => {
        // Check if ticket is valid and has an id
        if (!ticket || !ticket.id) {
          console.error('Invalid winning ticket:', ticket);
          return null;
        }
        return ticket.id;
      }).filter(id => id !== null); // Remove any null entries
      
      if (winningTicketIds.length === 0) {
        setError('No valid winning ticket IDs found');
        return;
      }
      
      console.log(`Saving winners to database: ${winningTicketIds.join(', ')}`);
      
      // Save the draw results to the database
      await drawLottery(lottery.id, winningTicketIds);
    } catch (error) {
      console.error('Error completing draw:', error);
      setError('Failed to record the lottery draw. The winners have been selected, but there was an error saving the results.');
    }
  }, [lottery]);
  
  // Handle draw completion when all winners are revealed
  useEffect(() => {
    if (animationPhase === 'complete' && showResult && allWinners.length > 0) {
      console.log(`Completing draw process with ${allWinners.length} winners`);
      completeDrawProcess(allWinners);
    }
  }, [animationPhase, showResult, allWinners, completeDrawProcess]);

  // Main draw function
  const startDraw = async () => {
    if (!tickets || tickets.length === 0) {
      setError('No tickets available for drawing');
      return;
    }
    
    if (!lottery || !lottery.prizes || lottery.prizes.length === 0) {
      setError('No prizes defined for this lottery');
      return;
    }
    
    // Check if we have enough tickets for prizes
    if (tickets.length < lottery.prizes.length) {
      setError(`Not enough tickets for all prizes. You have ${tickets.length} tickets but need at least ${lottery.prizes.length}.`);
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
    
    // Reset state
    setDrawInProgress(true);
    setAllWinners([]);
    setCurrentDrawIndex(-1);
    setCurrentPrizeIndex(-1);
    setCurrentTicket(null);
    setError(null);
    setShowResult(false);
    setAnimationPhase('countdown');
    
    // Reset the animation state ref
    animationStateRef.current = {
      sequence: [],
      currentIndex: 0,
      active: false,
      currentCharIndex: 0,
      ticket: null,
      currentDrawIndex: -1,
      preSelectedWinners: []
    };
    
    // Clear any existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (characterTimerRef.current) clearTimeout(characterTimerRef.current);
    if (drawSequenceTimerRef.current) clearTimeout(drawSequenceTimerRef.current);
    
    // Pre-determine all winners
    const success = preSelectAllWinners();
    if (!success) {
      setError('Failed to select winners. Please try again.');
      setDrawInProgress(false);
      return;
    }
    
    // Start the countdown animation
    setShowCountdown(true);
    setCountdownValue(3);
  };

  // Function to display the characters during the draw
  const renderDrawingChars = () => {
    if (!currentTicket || !currentTicket.id) return null;
    
    const result = [];
    const ticketId = currentTicket.id;
    
    // For each position in the ticket ID
    for (let i = 0; i < ticketId.length; i++) {
      const isRevealed = revealedPositions.includes(i);
      const isAnimating = animatingPosition === i;
      
      if (isRevealed) {
        // Character is fully revealed
        result.push(
          <div key={i} className="char-box revealed">
            {revealedChars[i]}
          </div>
        );
      } else if (isAnimating) {
        // Character is being animated
        result.push(
          <div key={i} className="char-box animating">
            {showCharacterCountdown ? '?' : animatingChar}
          </div>
        );
      } else {
        // Not yet revealed
        result.push(
          <div key={i} className="char-box">
            ?
          </div>
        );
      }
    }
    
    return result;
  };

  // Render character countdown
  const renderCharacterCountdown = () => {
    if (showCharacterCountdown && animationPhase === 'revealing') {
      return (
        <div className="character-countdown">
          <div className="countdown-number">{characterCountdown}</div>
        </div>
      );
    }
    return null;
  };

  // Render countdown timer
  const renderCountdown = () => {
    return (
      <div className="countdown-container">
        <div className="countdown-label">Drawing starts in</div>
        <div className="countdown-value">{countdownValue}</div>
        <div className="countdown-progress">
          <div 
            className="countdown-progress-fill" 
            style={{ 
              width: `${((3 - countdownValue) / 3) * 100}%`,
              transition: 'width 1s linear'
            }}
          ></div>
        </div>
      </div>
    );
  };

  // Render animation stage label
  const renderAnimationStageLabel = () => {
    switch (animationPhase) {
      case 'revealing':
        return <div className="animation-stage-label">Revealing ticket characters...</div>;
      default:
        return null;
    }
  };

  // Render winners list
  const renderWinners = () => {
    if (!allWinners || allWinners.length === 0) return null;
    
    // Sort winners by prize index (ascending - bigger prizes first)
    const sortedWinners = [...allWinners].sort((a, b) => a.prizeIndex - b.prizeIndex);
    
    return (
      <div className="winners-list">
        <h3>🏆 Winners Announced! 🏆</h3>
        {sortedWinners.map((winner, index) => (
          <div key={index} className="winner-details">
            <div className="winner-prize">
              <div className="prize-label">{winner.prizeName}</div>
              <div className="prize-value">
                {typeof winner.prizeValue === 'number' ? `₹${winner.prizeValue}` : winner.prizeValue}
              </div>
            </div>
            <div className="winner-ticket-id">
              <div className="ticket-label">Winning Ticket ID</div>
              <div className="ticket-value">{winner.id}</div>
            </div>
            <p className="winner-ticket-number">Ticket #{winner.number}</p>
            <p className="winner-name">Player: {winner.playerName}</p>
            {winner.gameId && (
              <p className="winner-game-id">Game ID: {winner.gameId}</p>
            )}
            <p className="winner-contact">Contact: {winner.phoneNumber}</p>
          </div>
        ))}
        
        <button className="results-close-button" onClick={onDrawComplete}>
          Close
        </button>
      </div>
    );
  };

  // Render current prize
  const renderCurrentPrize = () => {
    if (currentPrizeIndex === -1 || !lottery || !lottery.prizes) return null;
    
    // Guard against invalid prize index
    if (currentPrizeIndex >= lottery.prizes.length) return null;
    
    const prize = lottery.prizes[currentPrizeIndex];
    return (
      <div className="current-prize">
        <h3>Drawing: {prize.name}</h3>
        <div className="prize-value">{typeof prize.value === 'number' ? `₹${prize.value}` : prize.value}</div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="draw-lottery-modal">
        <div className="modal-content">
          <div className="draw-header">
            <h2>Loading Lottery</h2>
          </div>
          <div className="modal-body">
            <Loading message="Loading tickets..." />
          </div>
        </div>
      </div>
    );
  }

  // Invalid lottery
  if (!lottery) {
    return (
      <div className="draw-lottery-modal">
        <div className="modal-content">
          <div className="draw-header">
            <h2>Invalid Lottery</h2>
            <button className="close-button" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="error-message">Invalid lottery data provided</div>
            <div className="draw-actions">
              <Button onClick={onClose} variant="primary">Close</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="draw-lottery-modal">
      <div className="modal-content">
        <div className="draw-header">
          <h2>Draw: {lottery.name || `Lottery #${lottery.id}`}</h2>
          {!drawInProgress && (
            <button className="close-button" onClick={onClose}>&times;</button>
          )}
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          {tickets.length === 0 ? (
            <div className="no-tickets-message">
              <p>No tickets available for drawing.</p>
              <Button onClick={onClose} variant="primary">Close</Button>
            </div>
          ) : drawInProgress ? (
            <div className="draw-animation">
              {showCountdown ? (
                // Countdown animation before draw starts
                renderCountdown()
              ) : !showResult ? (
                <div className="drawing-stage">
                  {renderCurrentPrize()}
                  {renderAnimationStageLabel()}
                  
                  <div className="ticket-id-container">
                    {renderDrawingChars()}
                    {renderCharacterCountdown()}
                  </div>
                </div>
              ) : (
                <div className="draw-result">
                  {renderWinners()}
                </div>
              )}
            </div>
          ) : (
            <div className="draw-intro">
              <p>Ready to draw winners for this lottery?</p>
              <div className="lottery-summary">
                <div className="summary-item">
                  <span className="summary-label">Prize Pool:</span>
                  <span className="summary-value">₹{lottery.prizePool.toLocaleString()}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Tickets:</span>
                  <span className="summary-value">{tickets.length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Number of Prizes:</span>
                  <span className="summary-value">{lottery.prizes ? lottery.prizes.length : 0}</span>
                </div>
              </div>
              
              {lottery.prizes && (
                <div className="prizes-list">
                  <h4>Prizes to be Drawn:</h4>
                  {lottery.prizes.map((prize, index) => (
                    <div key={index} className="prize-item">
                      <span className="prize-name">{prize.name}</span>
                      <span className="prize-value">
                        {typeof prize.value === 'number' ? `₹${prize.value.toLocaleString()}` : prize.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="draw-info-box">
                <h4>Draw Information</h4>
                <p>Each character will be revealed randomly with a 3-second countdown</p>
                <p>All characters will be revealed one-by-one in random order</p>
                <p>Prizes will be drawn in sequence, starting with the highest prize</p>
              </div>
              
              <div className="draw-actions">
                <Button onClick={startDraw} variant="primary">
                  Start Drawing
                </Button>
                <Button onClick={onClose} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrawLottery;
