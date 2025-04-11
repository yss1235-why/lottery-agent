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
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(-1);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [error, setError] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  // Animation phase states
  const [animationPhase, setAnimationPhase] = useState('ready'); // ready, countdown, revealing, complete
  const [revealedChars, setRevealedChars] = useState([]);
  const [revealedPositions, setRevealedPositions] = useState([]);
  const [_currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [_revealSequence, setRevealSequence] = useState([]);
  const [animatingChar, setAnimatingChar] = useState(null);
  const [animatingPosition, setAnimatingPosition] = useState(null);
  const [finalReveal, setFinalReveal] = useState(false);
  const [availableTickets, setAvailableTickets] = useState([]);
  
  // Countdown timer states
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  
  // Character reveal countdown
  const [characterCountdown, setCharacterCountdown] = useState(3);
  const [showCharacterCountdown, setShowCharacterCountdown] = useState(false);
  
  // Animation timing controls (in milliseconds)
  const timings = {
    characterCountdown: 1000,    // 1 second per countdown number
    betweenCharacters: 500,      // Delay between characters
    finalRevealPause: 2000       // 2 seconds pause before showing results
  };
  
  // Timer references to clear them when needed
  const timerRef = useRef(null);
  const characterTimerRef = useRef(null);
  const animationStateRef = useRef({
    ticket: null,
    sequence: [],
    currentIndex: 0,
    revealedPositions: [],
    revealedChars: [],
    active: false
  });

  // Generate a randomized reveal sequence for all characters
  const generateRevealSequence = useCallback((ticketId) => {
    if (!ticketId) return [];
    
    // Create array of all positions (0 to ticketId.length-1)
    const positions = Array.from({ length: ticketId.length }, (_, i) => i);
    
    // Shuffle array randomly (Fisher-Yates algorithm)
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]]; // swap elements
    }
    
    return positions;
  }, []);

  // Complete ticket reveal and prepare for next prize if available
  const completeTicketReveal = useCallback(() => {
    // Deactivate current animation
    animationStateRef.current.active = false;
    
    if (timerRef.current) clearTimeout(timerRef.current);
    
    const { ticket } = animationStateRef.current;
    
    // Guard against null ticket
    if (!ticket) {
      setFinalReveal(true);
      setAnimationPhase('complete');
      setShowResult(true);
      return;
    }
    
    // Short pause before completing the reveal
    timerRef.current = setTimeout(() => {
      // Add the current ticket to selected tickets
      setSelectedTickets(prev => [...prev, {
        ...ticket,
        prizeIndex: currentPrizeIndex,
        prizeName: lottery.prizes && lottery.prizes[currentPrizeIndex] ? lottery.prizes[currentPrizeIndex].name : 'Unknown Prize',
        prizeValue: lottery.prizes && lottery.prizes[currentPrizeIndex] ? lottery.prizes[currentPrizeIndex].value : 0
      }]);
      
      // Remove the selected ticket from available tickets
      setAvailableTickets(prev => prev.filter(t => t.id !== ticket.id));
      
      // Check if we have more prizes to draw
      const nextPrizeIndex = currentPrizeIndex - 1;
      if (nextPrizeIndex >= 0 && lottery.prizes && lottery.prizes[nextPrizeIndex]) {
        // Reset animation for next prize
        setTimeout(() => {
          startPrizeDraw(nextPrizeIndex);
        }, 2000); // Pause between prizes
      } else {
        // No more prizes to draw
        setFinalReveal(true);
        setAnimationPhase('complete');
        setShowResult(true);
      }
    }, timings.finalRevealPause);
  }, [currentPrizeIndex, lottery.prizes, timings.finalRevealPause]);

  // The main character reveal animation driver
  const animateCharacterReveals = useCallback(() => {
    // Stop if animation is no longer active
    if (!animationStateRef.current.active) return;
    
    const { ticket, sequence, currentIndex } = animationStateRef.current;
    
    // If all characters are revealed, move to completion
    if (currentIndex >= sequence.length) {
      completeTicketReveal();
      return;
    }
    
    // Get the position and character to reveal
    const positionToReveal = sequence[currentIndex];
    const charToReveal = ticket.id.charAt(positionToReveal);
    
    // Set the animating character and position
    setAnimatingPosition(positionToReveal);
    setAnimatingChar(charToReveal);
    
    // Start the countdown
    setShowCharacterCountdown(true);
    setCharacterCountdown(3);
    
    // Schedule countdown decrement
    const countdownDriver = (count) => {
      if (!animationStateRef.current.active) return;
      
      if (count > 0) {
        // Continue countdown
        setCharacterCountdown(count - 1);
        
        // Schedule next countdown decrement
        characterTimerRef.current = setTimeout(() => {
          countdownDriver(count - 1);
        }, timings.characterCountdown);
      } else {
        // Countdown complete, reveal the character
        
        // Update revealed characters and positions arrays
        const newRevealedChars = [...animationStateRef.current.revealedChars];
        newRevealedChars[positionToReveal] = charToReveal;
        
        setRevealedChars(newRevealedChars);
        setRevealedPositions(prev => [...prev, positionToReveal]);
        setShowCharacterCountdown(false);
        
        // Update animation state
        animationStateRef.current.revealedChars = newRevealedChars;
        animationStateRef.current.revealedPositions = [...animationStateRef.current.revealedPositions, positionToReveal];
        animationStateRef.current.currentIndex = currentIndex + 1;
        
        // Schedule next character reveal after a delay
        characterTimerRef.current = setTimeout(() => {
          animateCharacterReveals();
        }, timings.betweenCharacters);
      }
    };
    
    // Start countdown
    countdownDriver(3);
  }, [completeTicketReveal, timings.betweenCharacters, timings.characterCountdown]);

  // Start drawing for a specific prize
  const startPrizeDraw = useCallback((prizeIndex) => {
    console.log(`Starting prize draw for index ${prizeIndex}`);
    
    if (!availableTickets || availableTickets.length === 0) {
      setError(`No tickets available for ${lottery.prizes[prizeIndex].name}`);
      return false;
    }
    
    // Select a random ticket for this prize
    const selectedTicket = availableTickets[Math.floor(Math.random() * availableTickets.length)];
    
    // Guard against null tickets
    if (!selectedTicket || !selectedTicket.id) {
      setError('Invalid ticket selected. Please try again.');
      return false;
    }
    
    console.log(`Selected ticket: ${selectedTicket.id}`);
    
    // Generate reveal sequence based on the ticket ID - randomized order for all characters
    const sequence = generateRevealSequence(selectedTicket.id);
    console.log(`Generated sequence: ${sequence.join(', ')}`);
    
    // Reset animation states
    setAnimationPhase('revealing');
    setRevealedChars(Array(selectedTicket.id.length).fill(null));
    setRevealedPositions([]);
    setCurrentRevealIndex(0);
    setAnimatingChar(null);
    setAnimatingPosition(null);
    setShowCharacterCountdown(false);
    
    // Set current ticket and prize index
    setCurrentTicket(selectedTicket);
    setCurrentPrizeIndex(prizeIndex);
    
    // Set the reveal sequence
    setRevealSequence(sequence);
    
    // Update animation state
    animationStateRef.current = {
      ticket: selectedTicket,
      sequence,
      currentIndex: 0,
      revealedPositions: [],
      revealedChars: Array(selectedTicket.id.length).fill(null),
      active: true
    };
    
    // Start the character reveal sequence
    setTimeout(() => {
      animateCharacterReveals();
    }, 500);
    
    return true;
  }, [availableTickets, generateRevealSequence, animateCharacterReveals, lottery.prizes]);

  // Fetch tickets when component mounts
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        // Ensure lottery exists and has an id
        if (!lottery || !lottery.id) {
          setError('Invalid lottery information');
          setLoading(false);
          return;
        }
        
        const ticketsData = await getLotteryTickets(lottery.id);
        const activeTickets = ticketsData.filter(ticket => ticket.booked && ticket.status === 'active');
        setTickets(activeTickets);
        setAvailableTickets(activeTickets);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        setError('Failed to load tickets for this lottery');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTickets();
    
    return () => {
      // Clear any existing timers on unmount
      if (timerRef.current) clearTimeout(timerRef.current);
      if (characterTimerRef.current) clearTimeout(characterTimerRef.current);
      animationStateRef.current.active = false;
    };
  }, [lottery]);

  // Handle countdown animation
  useEffect(() => {
    if (!lottery || !lottery.prizes) return;
    
    if (showCountdown && countdownValue > 0) {
      timerRef.current = setTimeout(() => {
        setCountdownValue(countdownValue - 1);
      }, 1000);
      
      return () => clearTimeout(timerRef.current);
    } else if (showCountdown && countdownValue === 0) {
      setShowCountdown(false);
      
      // Start with the highest prize (first in the array)
      const success = startPrizeDraw(lottery.prizes.length - 1);
      if (!success) {
        setDrawInProgress(false);
      }
    }
  }, [showCountdown, countdownValue, lottery, startPrizeDraw]);

  // Complete the drawing process
  const completeDrawProcess = useCallback(async (winningTickets) => {
    if (!lottery || !lottery.id || winningTickets.length === 0) {
      setError('Invalid lottery or no winners selected');
      return;
    }
    
    try {
      // Extract ticket IDs
      const winningTicketIds = winningTickets.map(ticket => ticket.id);
      
      // Save the draw results to the database
      await drawLottery(lottery.id, winningTicketIds);
      
      // No auto-close - require manual closing
    } catch (error) {
      console.error('Error completing draw:', error);
      setError('Failed to record the lottery draw. The winners have been selected, but there was an error saving the results.');
    }
  }, [lottery]);
  
  // Effect to handle draw completion
  useEffect(() => {
    if (animationPhase === 'complete' && finalReveal && selectedTickets.length > 0) {
      completeDrawProcess(selectedTickets);
    }
  }, [animationPhase, finalReveal, selectedTickets, completeDrawProcess]);

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
        // Character is fully revealed and positioned
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

  // Render different animation stage labels
  const renderAnimationStageLabel = () => {
    switch (animationPhase) {
      case 'revealing':
        return <div className="animation-stage-label">Revealing ticket characters...</div>;
      default:
        return null;
    }
  };

  // Render winners list when done
  const renderWinners = () => {
    if (!selectedTickets || selectedTickets.length === 0) return null;
    
    // Sort winners by
