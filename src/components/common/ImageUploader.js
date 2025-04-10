// src/components/common/ImageUploader.js
import React, { useState, useRef } from 'react';
import { fileToBase64, getReadableFileSize, compressImage } from '../../utils/imageUtils';
import Button from './Button';

/**
 * Reusable image uploader component with preview
 * 
 * @param {function} onImageSelect - Callback when image is selected/processed
 * @param {string} initialImage - Initial image (base64) if available
 * @param {string} label - Label for the upload button
 * @param {boolean} required - Whether the image is required
 * @param {boolean} compress - Whether to compress the image
 */
const ImageUploader = ({ 
  onImageSelect,
  initialImage = null,
  label = 'Upload Image',
  required = false,
  compress = true
}) => {
  const [image, setImage] = useState(initialImage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const fileInputRef = useRef(null);
  
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      
      // Compress if needed
      const processedImage = compress ? await compressImage(base64) : base64;
      
      // Calculate size reduction
      const originalSize = file.size;
      const processedSize = processedImage.length * 0.75; // Approximate size in bytes
      
      setFileInfo({
        name: file.name,
        originalSize: getReadableFileSize(originalSize),
        processedSize: compress ? getReadableFileSize(processedSize) : null,
        reduction: compress ? Math.round((1 - (processedSize / originalSize)) * 100) : null
      });
      
      setImage(processedImage);
      onImageSelect && onImageSelect(processedImage);
    } catch (err) {
      console.error('Error processing image:', err);
      setError(err.message || 'Error processing image');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveImage = () => {
    setImage(null);
    setFileInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageSelect && onImageSelect(null);
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="image-uploader">
      <input
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
      
      {!image ? (
        <div className="upload-container">
          <Button 
            onClick={triggerFileInput} 
            disabled={loading}
            isLoading={loading}
            variant="outline"
          >
            {label} {required && <span className="required-mark">*</span>}
          </Button>
          {error && <div className="error-text">{error}</div>}
        </div>
      ) : (
        <div className="image-preview-container">
          <div className="image-preview">
            <img src={image} alt="Preview" />
          </div>
          
          <div className="image-info">
            {fileInfo && (
              <div className="file-info">
                <div>{fileInfo.name}</div>
                <div>Original: {fileInfo.originalSize}</div>
                {compress && (
                  <>
                    <div>Compressed: {fileInfo.processedSize}</div>
                    <div>Reduced by {fileInfo.reduction}%</div>
                  </>
                )}
              </div>
            )}
            
            <Button
              onClick={handleRemoveImage}
              variant="outline"
              size="small"
            >
              Remove Image
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;