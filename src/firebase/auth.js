// src/firebase/auth.js
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword
} from "firebase/auth";
import { ref, get, update } from "firebase/database";
import { auth, database } from "./config";

// Sign in with email and password
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if the user is an agent
    const agentRef = ref(database, `agents/${user.uid}`);
    const agentSnapshot = await get(agentRef);
    
    if (!agentSnapshot.exists()) {
      await signOut(auth);
      throw new Error("You are not registered as an agent");
    }
    
    // Check if agent is active
    const agentData = agentSnapshot.val();
    if (!agentData.isActive) {
      await signOut(auth);
      throw new Error("Your account has been deactivated");
    }
    
    // Update last login timestamp
    await update(agentRef, {
      lastLogin: new Date().toISOString()
    });
    
    return { 
      user,
      agentData
    };
  } catch (error) {
    throw error;
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    throw error;
  }
};

// Get current authenticated user
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, 
      async (user) => {
        unsubscribe();
        if (user) {
          try {
            // Check if user is an agent
            const agentRef = ref(database, `agents/${user.uid}`);
            const agentSnapshot = await get(agentRef);
            
            if (agentSnapshot.exists()) {
              const agentData = agentSnapshot.val();
              if (agentData.isActive) {
                resolve({ user, agentData });
              } else {
                await signOut(auth);
                resolve(null);
              }
            } else {
              await signOut(auth);
              resolve(null);
            }
          } catch (error) {
            reject(error);
          }
        } else {
          resolve(null);
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
};

// Update user profile
export const updateUserProfile = async (displayName, photoURL) => {
  try {
    await updateProfile(auth.currentUser, {
      displayName,
      photoURL
    });
    return true;
  } catch (error) {
    throw error;
  }
};

// Update agent profile in database
export const updateAgentProfile = async (agentId, profileData) => {
  try {
    const agentRef = ref(database, `agents/${agentId}`);
    await update(agentRef, profileData);
    return true;
  } catch (error) {
    throw error;
  }
};