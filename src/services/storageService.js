// src/services/storageService.js
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

/**
 * Upload a payment screenshot to Firebase Storage
 * @param {string} agentId - Agent ID
 * @param {File} file - Screenshot file
 * @param {string} filename - Filename to use
 * @returns {Promise<string>} Download URL of the uploaded file
 */
export const uploadPaymentScreenshot = async (agentId, file, filename) => {
  try {
    // Generate a reference path for the file
    const fileExtension = file.name.split('.').pop();
    const storagePath = `deposits/${agentId}/${filename}.${fileExtension}`;
    const storageRef = ref(storage, storagePath);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get and return the download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    throw error;
  }
};

/**
 * Upload a profile picture to Firebase Storage
 * @param {string} agentId - Agent ID
 * @param {File} file - Profile picture file
 * @returns {Promise<string>} Download URL of the uploaded file
 */
export const uploadProfilePicture = async (agentId, file) => {
  try {
    // Generate a reference path for the file
    const fileExtension = file.name.split('.').pop();
    const storagePath = `profiles/${agentId}/profile.${fileExtension}`;
    const storageRef = ref(storage, storagePath);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get and return the download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};