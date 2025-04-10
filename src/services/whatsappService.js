// src/services/whatsappService.js
/**
 * Generate WhatsApp URL with predefined message
 * @param {string} phoneNumber - Phone number to send message to
 * @param {string} message - Message to send
 * @returns {string} WhatsApp URL
 */
export const generateWhatsAppUrl = (phoneNumber, message) => {
  if (!phoneNumber) {
    throw new Error('Phone number is required');
  }
  
  // Format phone number (remove non-numeric characters except leading +)
  let formattedPhone = phoneNumber;
  if (phoneNumber.startsWith('+')) {
    formattedPhone = '+' + phoneNumber.substring(1).replace(/\D/g, '');
  } else {
    formattedPhone = phoneNumber.replace(/\D/g, '');
  }
  
  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

/**
 * Send ticket details to player via WhatsApp
 * @param {Object} ticket - Ticket object
 * @returns {string} WhatsApp URL
 */
export const sendTicketToWhatsApp = async (ticket) => {
  try {
    if (!ticket || !ticket.phoneNumber) {
      throw new Error('Valid ticket with phone number is required');
    }
    
    // Format message
    const message = `
🎟️ *LOTTERY TICKET CONFIRMATION* 🎟️
===============================
Ticket ID: ${ticket.id}
Player: ${ticket.playerName}
${ticket.type === 'game' ? `Game ID: ${ticket.gameId}
Server ID: ${ticket.serverId}` : ''}
Lottery: ${ticket.lotteryName || 'Lottery'}
Status: ${ticket.status.toUpperCase()}
===============================
Thank you for booking your ticket!
`;
    
    // Generate WhatsApp URL
    return generateWhatsAppUrl(ticket.phoneNumber, message);
  } catch (error) {
    console.error('Error generating WhatsApp link:', error);
    throw error;
  }
};