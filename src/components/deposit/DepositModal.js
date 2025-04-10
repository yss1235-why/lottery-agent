// src/components/deposit/DepositModal.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getPaymentDetails } from '../../services/balanceService';
import { createDepositRequest } from '../../services/depositService';
import { formatCurrency } from '../../utils/currencyFormatter';
import { generateWhatsAppUrl } from '../../services/whatsappService';
import Button from '../common/Button';
import Card from '../common/Card';
import Loading from '../common/Loading';
import ImageUploader from '../common/ImageUploader';

const DepositModal = ({ isOpen, onClose }) => {
  const { currentUser, agentData } = useAuth();
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'UPI',
    referenceId: '',
    notes: '',
    screenshot: null
  });
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [adminContact, setAdminContact] = useState('');
  
  // Platform fee rate
  const platformFeeRate = 0.12; // 12%
  
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const details = await getPaymentDetails();
        setPaymentDetails(details);
        setAdminContact(details.adminWhatsApp || details.upiPhone);
      } catch (err) {
        console.error('Error fetching payment details:', err);
        setError('Failed to load payment details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      fetchPaymentDetails();
    }
  }, [isOpen]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleScreenshotUpload = (base64Image) => {
    setFormData(prev => ({
      ...prev,
      screenshot: base64Image
    }));
  };
  
  const calculateTotalAmount = () => {
    if (!formData.amount || isNaN(formData.amount)) return 0;
    
    const amount = parseFloat(formData.amount);
    const platformFee = amount * platformFeeRate;
    return amount + platformFee;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!formData.referenceId) {
      setError('Reference ID is required');
      return;
    }
    
    if (!formData.screenshot) {
      setError('Payment screenshot is required');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const amount = parseFloat(formData.amount);
      const platformFee = amount * platformFeeRate;
      const totalAmount = amount + platformFee;
      
      await createDepositRequest({
        agentId: currentUser.uid,
        agentName: agentData?.name || currentUser.email,
        amount,
        platformFee,
        totalAmount,
        paymentMethod: formData.paymentMethod,
        referenceId: formData.referenceId,
        notes: formData.notes,
        screenshot: formData.screenshot
      });
      
      setSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          amount: '',
          paymentMethod: 'UPI',
          referenceId: '',
          notes: '',
          screenshot: null
        });
        setSuccess(false);
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Error creating deposit request:', err);
      setError(err.message || 'Failed to submit deposit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleWhatsAppSubmit = () => {
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!formData.referenceId) {
      setError('Reference ID is required');
      return;
    }
    
    if (!formData.screenshot) {
      setError('Payment screenshot is required');
      return;
    }
    
    if (!adminContact) {
      setError('Admin contact information is missing. Please contact support.');
      return;
    }
    
    // Format message for WhatsApp
    const amount = parseFloat(formData.amount);
    const platformFee = amount * platformFeeRate;
    const totalAmount = amount + platformFee;
    
    const message = `
*DEPOSIT REQUEST*
-----------------
Agent: ${agentData?.name || currentUser.email}
Agent ID: ${currentUser.uid}
Amount: ${formatCurrency(amount)}
Platform Fee: ${formatCurrency(platformFee)}
Total: ${formatCurrency(totalAmount)}
Payment Method: ${formData.paymentMethod}
Reference ID: ${formData.referenceId}
${formData.notes ? `Notes: ${formData.notes}` : ''}

I have attached the payment screenshot in this chat.
`;
    
    const whatsappUrl = generateWhatsAppUrl(adminContact, message);
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <Card className="deposit-modal-card">
          <div className="modal-header">
            <h2>Deposit Funds</h2>
            <button className="close-button" onClick={onClose}>&times;</button>
          </div>
          
          {loading ? (
            <Loading message="Loading payment details..." />
          ) : (
            <div className="modal-content">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">Deposit request submitted successfully!</div>}
              
              <form onSubmit={handleSubmit} className="deposit-form">
                <div className="form-group">
                  <label htmlFor="amount">Deposit Amount (₹) *</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="Enter amount"
                    min="100"
                    disabled={submitting || success}
                    required
                  />
                  <div className="input-help">Minimum deposit amount: ₹100</div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="paymentMethod">Payment Method *</label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    disabled={submitting || success}
                    required
                  >
                    <option value="UPI">UPI</option>
                    <option value="USDT">USDT (TRC20)</option>
                  </select>
                </div>
                
                {formData.amount && !isNaN(formData.amount) && parseFloat(formData.amount) > 0 && (
                  <div className="cost-summary">
                    <div className="cost-item">
                      <div className="cost-label">Deposit Amount:</div>
                      <div className="cost-value">{formatCurrency(parseFloat(formData.amount))}</div>
                    </div>
                    <div className="cost-item">
                      <div className="cost-label">Platform Fee (12%):</div>
                      <div className="cost-value">{formatCurrency(parseFloat(formData.amount) * platformFeeRate)}</div>
                    </div>
                    <div className="cost-item total">
                      <div className="cost-label">Total to Pay:</div>
                      <div className="cost-value">{formatCurrency(calculateTotalAmount())}</div>
                    </div>
                  </div>
                )}
                
                <div className="payment-instructions">
                  <h3>Payment Instructions</h3>
                  {formData.paymentMethod === 'UPI' ? (
                    <>
                      <p>Please make the payment to the following UPI ID:</p>
                      <div className="instruction-details">
                        <div><strong>UPI ID:</strong> {paymentDetails?.upiId || 'default@upi'}</div>
                        <div><strong>Phone Number:</strong> {paymentDetails?.upiPhone || '9999999999'}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>Please send USDT to the following TRC20 address:</p>
                      <div className="instruction-details">
                        <div><strong>TRC20 Address:</strong> {paymentDetails?.usdtAddress || 'TRC20Address'}</div>
                        <div><strong>Exchange Rate:</strong> 1 USDT = ₹{paymentDetails?.usdtRate || 85}</div>
                      </div>
                    </>
                  )}
                  <div className="instruction-highlight">
                    After payment, take a screenshot as proof and upload it below.
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="screenshot">Payment Screenshot *</label>
                  <ImageUploader
                    onImageSelect={handleScreenshotUpload}
                    initialImage={formData.screenshot}
                    label="Upload Payment Screenshot"
                    required={true}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="referenceId">Transaction Reference ID *</label>
                  <input
                    type="text"
                    id="referenceId"
                    name="referenceId"
                    value={formData.referenceId}
                    onChange={handleChange}
                    placeholder="Enter UPI/USDT transaction reference"
                    disabled={submitting || success}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="notes">Notes (Optional)</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any additional information"
                    rows="3"
                    disabled={submitting || success}
                  ></textarea>
                </div>
                
                <div className="form-actions">
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="outline"
                    disabled={submitting || success}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={submitting || success || !formData.screenshot || !formData.referenceId}
                    isLoading={submitting}
                  >
                    Submit Deposit Request
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={handleWhatsAppSubmit}
                    disabled={submitting || success || !formData.screenshot || !formData.referenceId}
                    variant="primary"
                  >
                    Send via WhatsApp
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DepositModal;