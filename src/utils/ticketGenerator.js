// src/utils/ticketGenerator.js

/**
 * Generate a base character set for a batch of lottery tickets
 * All tickets in a batch will use permutations of this character set
 * @returns {string} Base character set (e.g., "ABC123")
 */
const generateBaseCharacterSet = () => {
  // Select 3 random letters from the alphabet
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed similar looking chars
  const selectedLetters = Array(3).fill()
    .map(() => letters.charAt(Math.floor(Math.random() * letters.length)))
    .join('');
  
  // Select 3 random digits
  const digits = '23456789'; // Removed 0 and 1 to avoid confusion with O and I
  const selectedDigits = Array(3).fill()
    .map(() => digits.charAt(Math.floor(Math.random() * digits.length)))
    .join('');
  
  // Return combined set
  return selectedLetters + selectedDigits;
};

// Store the base character set in a module-level variable
// This ensures all tickets generated in one session use the same characters
let currentBaseSet = '';

/**
 * Generate a ticket ID using permutation of the base character set
 * @returns {string} Ticket ID (permutation of the base set)
 */
export const generateTicketId = () => {
  // Generate a base set if we don't have one yet
  if (!currentBaseSet) {
    currentBaseSet = generateBaseCharacterSet();
  }
  
  // Convert to array for permutation
  const characters = currentBaseSet.split('');
  
  // Generate a random permutation through shuffling
  for (let i = characters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [characters[i], characters[j]] = [characters[j], characters[i]];
  }
  
  // Return the permuted characters as a string
  return characters.join('');
};

/**
 * Check if a ticket ID already exists
 * @param {string} ticketId - Ticket ID to check
 * @param {Array} existingIds - Array of existing ticket IDs
 * @returns {boolean} True if exists, false otherwise
 */
export const isTicketIdUnique = (ticketId, existingIds) => {
  return !existingIds.includes(ticketId);
};

/**
 * Reset the base character set (for testing or between lottery batches)
 * Call this when starting a new lottery to ensure new tickets have a different set
 */
export const resetBaseCharacterSet = () => {
  currentBaseSet = generateBaseCharacterSet();
  return currentBaseSet;
};

/**
 * Get the current base character set
 * @returns {string} The current base character set
 */
export const getBaseCharacterSet = () => {
  if (!currentBaseSet) {
    currentBaseSet = generateBaseCharacterSet();
  }
  return currentBaseSet;
};