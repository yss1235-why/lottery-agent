// src/services/authService.js
import { 
  signInWithEmailAndPassword, 
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "firebase/auth";
import { ref, get, update } from "firebase/database";
import { auth, database } from "../firebase/config";

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<UserCredential>} Firebase user credential
 */
export const loginWithEmailAndPassword = async (email, password) => {
  try {
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
    
    // Update last login timestamp
    await update(agentRef, {
      lastLogin: new Date().toISOString()
    });
    
    return userCredential;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export const logoutUser = () => {
  return signOut(auth);
};

/**
 * Get agent data for the current user
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Agent data
 */
export const getAgentData = async (agentId) => {
  try {
    const agentRef = ref(database, `agents/${agentId}`);
    const agentSnapshot = await get(agentRef);
    
    if (!agentSnapshot.exists()) {
      throw new Error('Agent not found');
    }
    
    return agentSnapshot.val();
  } catch (error) {
    console.error('Error getting agent data:', error);
    throw error;
  }
};

/**
 * Update agent profile data
 * @param {string} agentId - Agent ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<boolean>} Success status
 */
export const updateAgentProfile = async (agentId, profileData) => {
  try {
    const agentRef = ref(database, `agents/${agentId}`);
    await update(agentRef, {
      ...profileData,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating agent profile:', error);
    throw error;
  }
};

/**
 * Update user password
 * @param {string} email - User email
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} Success status
 */
export const updateUserPassword = async (email, currentPassword, newPassword) => {
  try {
    // Re-authenticate user
    const credential = EmailAuthProvider.credential(email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    
    // Update password
    await updatePassword(auth.currentUser, newPassword);
    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};