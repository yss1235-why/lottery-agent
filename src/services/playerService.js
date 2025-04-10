// src/services/playerService.js
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../firebase/config';

/**
 * Get player tickets by game ID
 * @param {string} gameId - Player's game ID
 * @param {string} agentId - Agent ID for filtering
 * @returns {Promise<Array>} Array of ticket objects
 */
export const getPlayerTickets = async (gameId, agentId) => {
  try {
    const ticketsRef = ref(database, 'tickets');
    const agentQuery = query(
      ticketsRef,
      orderByChild('agentId'),
      equalTo(agentId)
    );
    
    const snapshot = await get(agentQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const ticketsData = snapshot.val();
    const playerTickets = [];
    
    // Filter tickets by player's game ID
    Object.keys(ticketsData).forEach(key => {
      const ticket = ticketsData[key];
      if (ticket.player && ticket.player.gameId === gameId) {
        playerTickets.push({
          dbId: key,
          ...ticket
        });
      }
    });
    
    // Sort by creation date (newest first)
    playerTickets.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return playerTickets;
  } catch (error) {
    console.error('Error getting player tickets:', error);
    throw error;
  }
};

/**
 * Search players by name, game ID, or phone number
 * @param {string} searchTerm - Search term
 * @param {string} searchType - Type of search (name, gameId, phoneNumber)
 * @param {string} agentId - Agent ID for filtering
 * @returns {Promise<Array>} Array of player objects
 */
export const searchPlayers = async (searchTerm, searchType, agentId) => {
  try {
    const ticketsRef = ref(database, 'tickets');
    const agentQuery = query(
      ticketsRef,
      orderByChild('agentId'),
      equalTo(agentId)
    );
    
    const snapshot = await get(agentQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const ticketsData = snapshot.val();
    const playersMap = {};
    
    // Extract unique players and match search term
    Object.keys(ticketsData).forEach(key => {
      const ticket = ticketsData[key];
      if (ticket.player) {
        const player = ticket.player;
        const gameId = player.gameId;
        let matches = false;
        
        // Check if player matches search criteria
        if (searchType === 'name' && player.name && player.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          matches = true;
        } else if (searchType === 'gameId' && player.gameId && player.gameId.toLowerCase() === searchTerm.toLowerCase()) {
          matches = true;
        } else if (searchType === 'phoneNumber' && player.phoneNumber && player.phoneNumber.includes(searchTerm)) {
          matches = true;
        }
        
        if (matches) {
          // Add or update player in map
          if (!playersMap[gameId]) {
            playersMap[gameId] = {
              ...player,
              ticketCount: 1,
              lastActivity: ticket.createdAt
            };
          } else {
            playersMap[gameId].ticketCount++;
            
            // Update last activity if this ticket is newer
            if (new Date(ticket.createdAt) > new Date(playersMap[gameId].lastActivity)) {
              playersMap[gameId].lastActivity = ticket.createdAt;
            }
          }
        }
      }
    });
    
    // Convert to array and sort by name
    const players = Object.values(playersMap);
    players.sort((a, b) => a.name.localeCompare(b.name));
    
    return players;
  } catch (error) {
    console.error('Error searching players:', error);
    throw error;
  }
};

/**
 * Get all unique players for an agent
 * @param {string} agentId - Agent ID
 * @returns {Promise<Array>} Array of player objects
 */
export const getAgentPlayers = async (agentId) => {
  try {
    const ticketsRef = ref(database, 'tickets');
    const agentQuery = query(
      ticketsRef,
      orderByChild('agentId'),
      equalTo(agentId)
    );
    
    const snapshot = await get(agentQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const ticketsData = snapshot.val();
    const playersMap = {};
    
    // Extract unique players
    Object.keys(ticketsData).forEach(key => {
      const ticket = ticketsData[key];
      if (ticket.player) {
        const player = ticket.player;
        const gameId = player.gameId;
        
        if (!playersMap[gameId]) {
          playersMap[gameId] = {
            ...player,
            ticketCount: 1,
            lastActivity: ticket.createdAt
          };
        } else {
          playersMap[gameId].ticketCount++;
          
          // Update last activity if this ticket is newer
          if (new Date(ticket.createdAt) > new Date(playersMap[gameId].lastActivity)) {
            playersMap[gameId].lastActivity = ticket.createdAt;
          }
        }
      }
    });
    
    // Convert to array and sort by last activity (most recent first)
    const players = Object.values(playersMap);
    players.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    
    return players;
  } catch (error) {
    console.error('Error getting agent players:', error);
    throw error;
  }
};

/**
 * Get player details by game ID
 * @param {string} gameId - Player's game ID
 * @param {string} agentId - Agent ID for filtering
 * @returns {Promise<Object|null>} Player object or null if not found
 */
export const getPlayerByGameId = async (gameId, agentId) => {
  try {
    const players = await getAgentPlayers(agentId);
    return players.find(player => player.gameId === gameId) || null;
  } catch (error) {
    console.error('Error getting player by game ID:', error);
    throw error;
  }
};