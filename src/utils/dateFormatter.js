// src/utils/dateFormatter.js
import { format, formatDistance, formatRelative, isValid } from 'date-fns';

/**
 * Format a date as a readable date and time string
 * @param {string|Date} dateString - Date to format
 * @param {string} formatStr - Format string (default: 'dd MMM yyyy, hh:mm a')
 * @returns {string} Formatted date string
 */
export const formatDateTime = (dateString, formatStr = 'dd MMM yyyy, hh:mm a') => {
  if (!dateString) return 'Not set';
  
  const date = new Date(dateString);
  
  if (!isValid(date)) {
    return 'Invalid date';
  }
  
  return format(date, formatStr);
};

/**
 * Format a date as time remaining (e.g., "2 days remaining")
 * @param {string|Date} dateString - Date to format
 * @returns {string} Time remaining string
 */
export const formatTimeRemaining = (dateString) => {
  if (!dateString) return 'No time set';
  
  const date = new Date(dateString);
  
  if (!isValid(date)) {
    return 'Invalid date';
  }
  
  const now = new Date();
  
  // If date is in the past
  if (date < now) {
    return 'Expired';
  }
  
  // Calculate time difference
  return formatDistance(date, now, { addSuffix: false }) + ' remaining';
};

/**
 * Format a date relative to now (e.g., "yesterday", "2 days ago")
 * @param {string|Date} dateString - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Not set';
  
  const date = new Date(dateString);
  
  if (!isValid(date)) {
    return 'Invalid date';
  }
  
  return formatRelative(date, new Date());
};

/**
 * Format a date as a short date string
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export const formatShortDate = (dateString) => {
  if (!dateString) return 'Not set';
  
  const date = new Date(dateString);
  
  if (!isValid(date)) {
    return 'Invalid date';
  }
  
  return format(date, 'dd/MM/yyyy');
};