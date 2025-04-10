// src/firebase/database.js
import { 
  ref, 
  set, 
  push, 
  get, 
  update, 
  remove, 
  query, 
  orderByChild, 
  equalTo, 
  limitToLast,
  startAt,
  endAt
} from "firebase/database";
import { database } from "./config";

// Generic CRUD functions
export const createRecord = async (path, data) => {
  try {
    const newItemRef = push(ref(database, path));
    await set(newItemRef, {
      ...data,
      id: newItemRef.key,
      createdAt: new Date().toISOString()
    });
    return newItemRef.key;
  } catch (error) {
    throw error;
  }
};

export const createRecordWithId = async (path, id, data) => {
  try {
    const itemRef = ref(database, `${path}/${id}`);
    await set(itemRef, {
      ...data,
      id,
      createdAt: new Date().toISOString()
    });
    return id;
  } catch (error) {
    throw error;
  }
};

export const getRecord = async (path) => {
  try {
    const recordRef = ref(database, path);
    const snapshot = await get(recordRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

export const updateRecord = async (path, updates) => {
  try {
    const recordRef = ref(database, path);
    await update(recordRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    throw error;
  }
};

export const deleteRecord = async (path) => {
  try {
    const recordRef = ref(database, path);
    await remove(recordRef);
    return true;
  } catch (error) {
    throw error;
  }
};

// Query functions
export const queryRecords = async (path, field, value, limit = 100) => {
  try {
    const recordsRef = ref(database, path);
    const recordsQuery = query(
      recordsRef,
      orderByChild(field),
      equalTo(value),
      limitToLast(limit)
    );
    
    const snapshot = await get(recordsQuery);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data);
    } else {
      return [];
    }
  } catch (error) {
    throw error;
  }
};

export const searchRecords = async (path, field, searchTerm, limit = 100) => {
  try {
    const recordsRef = ref(database, path);
    const recordsQuery = query(
      recordsRef,
      orderByChild(field),
      startAt(searchTerm),
      endAt(searchTerm + "\uf8ff"),
      limitToLast(limit)
    );
    
    const snapshot = await get(recordsQuery);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data);
    } else {
      return [];
    }
  } catch (error) {
    throw error;
  }
};

export const getRecords = async (path, limit = 100) => {
  try {
    const recordsRef = ref(database, path);
    const recordsQuery = query(
      recordsRef,
      limitToLast(limit)
    );
    
    const snapshot = await get(recordsQuery);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data);
    } else {
      return [];
    }
  } catch (error) {
    throw error;
  }
};

// Specialized functions for the lottery application
export const getLotteries = async (status = null, limit = 50) => {
  try {
    if (status) {
      return await queryRecords('lotteries', 'status', status, limit);
    } else {
      return await getRecords('lotteries', limit);
    }
  } catch (error) {
    throw error;
  }
};

export const getAgentTickets = async (agentId, status = null, limit = 50) => {
  try {
    if (status) {
      return await queryRecords('tickets', 'agentId', agentId, limit)
        .then(tickets => tickets.filter(ticket => ticket.status === status));
    } else {
      return await queryRecords('tickets', 'agentId', agentId, limit);
    }
  } catch (error) {
    throw error;
  }
};

export const getPlayerTickets = async (gameId, limit = 50) => {
  try {
    const records = await getRecords('tickets', limit);
    return records.filter(ticket => ticket.player && ticket.player.gameId === gameId);
  } catch (error) {
    throw error;
  }
};