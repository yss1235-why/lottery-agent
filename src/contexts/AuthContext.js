// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, database } from '../firebase/config';
import { ref, get, onValue } from 'firebase/database';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login function
  const login = async (email, password) => {
    try {
      // Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user is an agent
      const agentRef = ref(database, `agents/${userCredential.user.uid}`);
      const agentSnapshot = await get(agentRef);
      
      if (!agentSnapshot.exists()) {
        await signOut(auth);
        throw new Error('You are not registered as an agent');
      }
      
      // Check if agent is active
      const agentData = agentSnapshot.val();
      if (!agentData.isActive) {
        await signOut(auth);
        throw new Error('Your account has been deactivated');
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Authentication state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const agentRef = ref(database, `agents/${user.uid}`);
        onValue(agentRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.isActive) {
              setAgentData(data);
              setCurrentUser(user);
            } else {
              // If agent is not active, sign them out
              signOut(auth);
              setCurrentUser(null);
              setAgentData(null);
            }
          } else {
            // If not an agent, sign them out
            signOut(auth);
            setCurrentUser(null);
            setAgentData(null);
          }
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setAgentData(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    agentData,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}