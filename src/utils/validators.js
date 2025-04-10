// src/utils/validators.js

/**
 * Validate an email address
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate a phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether the phone number is valid
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  
  // Allow international format with + and numbers
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate a WhatsApp number (international format)
 * @param {string} whatsapp - WhatsApp number to validate
 * @returns {boolean} Whether the WhatsApp number is valid
 */
export const isValidWhatsApp = (whatsapp) => {
  if (!whatsapp) return false;
  
  // Must be in international format with + and country code
  const whatsappRegex = /^\+[0-9]{10,15}$/;
  return whatsappRegex.test(whatsapp);
};

/**
 * Validate a password
 * @param {string} password - Password to validate
 * @returns {boolean} Whether the password is valid
 */
export const isValidPassword = (password) => {
  if (!password) return false;
  
  // Minimum 8 characters, at least one letter and one number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate a game ID
 * @param {string} gameId - Game ID to validate
 * @returns {boolean} Whether the game ID is valid
 */
export const isValidGameId = (gameId) => {
  if (!gameId) return false;
  
  // Alphanumeric, minimum 4 characters
  const gameIdRegex = /^[A-Za-z0-9]{4,}$/;
  return gameIdRegex.test(gameId);
};

/**
 * Validate a server ID
 * @param {string} serverId - Server ID to validate
 * @returns {boolean} Whether the server ID is valid
 */
export const isValidServerId = (serverId) => {
  if (!serverId) return false;
  
  // Alphanumeric, minimum 2 characters
  const serverIdRegex = /^[A-Za-z0-9]{2,}$/;
  return serverIdRegex.test(serverId);
};

/**
 * Validate a ticket price
 * @param {number|string} price - Ticket price to validate
 * @returns {boolean} Whether the price is valid
 */
export const isValidPrice = (price) => {
  if (price === null || price === undefined) return false;
  
  // Must be a positive number
  const numericPrice = Number(price);
  return !isNaN(numericPrice) && numericPrice > 0;
};

/**
 * Check if a string is empty or only contains whitespace
 * @param {string} str - String to check
 * @returns {boolean} Whether the string is empty
 */
export const isEmpty = (str) => {
  if (str === null || str === undefined) return true;
  
  return str.trim() === '';
};

/**
 * Create validation error message for a form field
 * @param {string} fieldName - Name of the field
 * @param {string} errorType - Type of error
 * @returns {string} Error message
 */
export const getValidationErrorMessage = (fieldName, errorType) => {
  const errorMessages = {
    required: `${fieldName} is required`,
    email: 'Please enter a valid email address',
    phone: 'Please enter a valid phone number',
    whatsapp: 'Please enter a valid WhatsApp number in international format (+123456789)',
    password: 'Password must be at least 8 characters with at least one letter and one number',
    gameId: 'Game ID must be at least 4 alphanumeric characters',
    serverId: 'Server ID must be at least 2 alphanumeric characters',
    price: 'Please enter a valid price greater than zero',
    min: `${fieldName} is too short`,
    max: `${fieldName} is too long`,
    pattern: `${fieldName} has invalid format`
  };
  
  return errorMessages[errorType] || `Invalid ${fieldName}`;
};