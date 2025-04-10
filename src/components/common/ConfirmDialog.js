// src/components/common/ConfirmDialog.js
import React from 'react';
import Button from './Button';

const ConfirmDialog = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  error,
  success,
  isConfirmDestructive = false
}) => {
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <div className="confirm-dialog-header">
          <h3>{title}</h3>
        </div>
        
        <div className="confirm-dialog-content">
          <p>{message}</p>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {success && (
            <div className="success-message">
              Success!
            </div>
          )}
        </div>
        
        <div className="confirm-dialog-actions">
          {!success && (
            <>
              <Button 
                onClick={onCancel}
                variant="outline"
              >
                {cancelText}
              </Button>
              
              <Button 
                onClick={onConfirm}
                variant={isConfirmDestructive ? 'danger' : 'primary'}
                disabled={success}
              >
                {confirmText}
              </Button>
            </>
          )}
          
          {success && (
            <Button onClick={onCancel}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;