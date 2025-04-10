// src/components/lottery/PaymentMethod.js
import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';

const PaymentMethod = ({ method, details }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };
  
  if (!details) {
    return <p>Payment details not available</p>;
  }
  
  return (
    <Card className="payment-method-details">
      {method === 'UPI' ? (
        <div className="upi-details">
          <h3>UPI Payment Details</h3>
          <div className="detail-row">
            <span className="detail-label">Phone Number:</span>
            <span className="detail-value">{details.upiPhone}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">UPI ID:</span>
            <span className="detail-value">{details.upiId}</span>
            <Button 
              onClick={() => handleCopy(details.upiId)} 
              variant="secondary"
              className="copy-button"
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <p className="fee-note">
            Note: A platform fee of 12% will be added to your deposit amount.
          </p>
        </div>
      ) : (
        <div className="usdt-details">
          <h3>USDT TRC20 Payment Details</h3>
          <div className="detail-row">
            <span className="detail-label">Wallet Address:</span>
            <span className="detail-value address">{details.usdtAddress}</span>
            <Button 
              onClick={() => handleCopy(details.usdtAddress)} 
              variant="secondary"
              className="copy-button"
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <div className="usdt-warning">
            <h4>Important Notice:</h4>
            <ul>
              <li>Only send USDT via TRC20 network</li>
              <li>Current exchange rate: 1 USDT = ₹{details.usdtRate || 85}</li>
              <li>Platform fee: 10%</li>
              <li>Minimum deposit: 10 USDT</li>
              <li>Transaction may take up to 30 minutes to confirm</li>
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PaymentMethod;