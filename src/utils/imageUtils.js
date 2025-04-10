// src/utils/imageUtils.js

/**
 * Convert an image file to base64 string
 * @param {File} file - The image file to convert
 * @returns {Promise<string>} A promise that resolves to the base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      reject(new Error('File is not an image'));
      return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('File size exceeds 5MB limit'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = () => {
      resolve(reader.result);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Get the file size in readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Human-readable file size
 */
export const getReadableFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Compress an image to reduce file size
 * @param {string} base64 - Base64 string of the image
 * @param {number} quality - Image quality (0 to 1)
 * @returns {Promise<string>} A promise that resolves to the compressed base64 string
 */
export const compressImage = (base64, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions (maintain aspect ratio)
      let width = img.width;
      let height = img.height;
      
      // If image is larger than 1200px in any dimension, scale it down
      const maxDimension = 1200;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        } else {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert canvas to base64
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    
    img.onerror = () => {
      reject(new Error('Error loading image'));
    };
  });
};