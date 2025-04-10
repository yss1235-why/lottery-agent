// src/hooks/useAuth.js
import { useAuth as useAuthContext } from '../contexts/AuthContext';

// Re-export the useAuth hook from the AuthContext
// This allows us to change the implementation later if needed
export const useAuth = () => {
  return useAuthContext();
};