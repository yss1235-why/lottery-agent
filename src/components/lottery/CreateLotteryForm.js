// src/components/lottery/CreateLotteryForm.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createLottery } from '../../services/lotteryService';
import { getAgentBalance } from '../../services/balanceService';
import PrizeField from './PrizeField';
import Card from '../common/Card';
import Button from '../common/Button';
import ImageUploader from '../common/ImageUploader';
import { formatCurrency } from '../../utils/currencyFormatter';
import '../../assets/styles/ImageUploader.css';

const CreateLotteryForm = ({ onSuccess }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    type: 'normal',
    description: '',
    prizePool: '',
    ticketPrice: '',
    ticketCapacity: '',
    drawTime: '',
    prizes: [{ name: 'First Prize', value: '' }],
    image: null,
    gameDetails: ''  // For game-specific details
  });
  
  const [balance, setBalance] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [totalPrizeValue, setTotalPrizeValue] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!currentUser) return;
      
      try {
        const balanceData = await getAgentBalance(currentUser.uid);
        setBalance(balanceData.amount);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };
    
    fetchBalance();
  }, [currentUser]);

  // Calculate total prize value whenever prizes change
  useEffect(() => {
    let total = 0;
    let allMonetary = true;
    
    formData.prizes.forEach(prize => {
      if (prize.value && !isNaN(Number(prize.value))) {
        total += Number(prize.value);
      } else if (prize.value) {
        allMonetary = false;
      }
    });
    
    if (allMonetary) {
      setTotalPrizeValue(total);
    } else {
      setTotalPrizeValue(null); // Non-monetary prizes exist
    }
    
  }, [formData.prizes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handlePrizeChange = (index, name, value) => {
    const updatedPrizes = [...formData.prizes];
    updatedPrizes[index] = {
      ...updatedPrizes[index],
      [name]: value
    };
    
    setFormData(prevData => ({
      ...prevData,
      prizes: updatedPrizes
    }));
  };

  const addPrize = () => {
    setFormData(prevData => ({
      ...prevData,
      prizes: [...prevData.prizes, { name: `Prize ${prevData.prizes.length + 1}`, value: '' }]
    }));
  };

  const removePrize = (index) => {
    setFormData(prevData => ({
      ...prevData,
      prizes: prevData.prizes.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (base64Image) => {
    setPreviewImage(base64Image);
    setFormData(prev => ({
      ...prev,
      image: base64Image
    }));
  };

  // Helper function to auto-set prize pool based on prizes
  const autoSetPrizePool = () => {
    if (totalPrizeValue && totalPrizeValue > 0) {
      setFormData(prev => ({
        ...prev,
        prizePool: totalPrizeValue.toString()
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Lottery name is required';
    }
    
    if (!formData.prizePool || isNaN(Number(formData.prizePool)) || Number(formData.prizePool) <= 0) {
      newErrors.prizePool = 'Valid prize pool amount is required';
    } else if (Number(formData.prizePool) > balance) {
      newErrors.prizePool = `Prize pool exceeds available balance of ${formatCurrency(balance)}`;
    }
    
    if (!formData.ticketPrice || isNaN(Number(formData.ticketPrice)) || Number(formData.ticketPrice) <= 0) {
      newErrors.ticketPrice = 'Valid ticket price is required';
    }
    
    if (!formData.ticketCapacity || isNaN(Number(formData.ticketCapacity)) || Number(formData.ticketCapacity) <= 0) {
      newErrors.ticketCapacity = 'Valid ticket capacity is required';
    }
    
    if (!formData.drawTime) {
      newErrors.drawTime = 'Draw time is required';
    } else if (new Date(formData.drawTime) <= new Date()) {
      newErrors.drawTime = 'Draw time must be in the future';
    }
    
    // Validate prizes
    let hasEmptyPrize = false;
    let hasNonMonetaryPrize = false;
    
    formData.prizes.forEach((prize, index) => {
      if (!prize.name.trim()) {
        newErrors[`prize_${index}_name`] = 'Prize name is required';
      }
      
      if (!prize.value || prize.value.trim() === '') {
        newErrors[`prize_${index}_value`] = 'Prize value is required';
        hasEmptyPrize = true;
      } else if (isNaN(Number(prize.value))) {
        hasNonMonetaryPrize = true;
      }
    });
    
    // Only check prize pool total if all prizes are monetary and no empty prizes
    if (totalPrizeValue !== null && !hasEmptyPrize && totalPrizeValue > Number(formData.prizePool)) {
      newErrors.prizes = `Total prize value (${formatCurrency(totalPrizeValue)}) exceeds prize pool (${formatCurrency(Number(formData.prizePool))})`;
    }
    
    if (formData.type === 'game' && !formData.gameDetails.trim()) {
      newErrors.gameDetails = 'Game details are required for game lotteries';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // Process form data
      const lotteryData = {
        ...formData,
        prizePool: Number(formData.prizePool),
        ticketPrice: Number(formData.ticketPrice),
        ticketCapacity: Number(formData.ticketCapacity),
        prizes: formData.prizes.map(prize => ({
          ...prize,
          value: !isNaN(Number(prize.value)) ? Number(prize.value) : prize.value
        })),
        agentId: currentUser.uid
      };
      
      // Create lottery
      await createLottery(lotteryData);
      
      // Call success callback
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Error creating lottery:', error);
      setErrors({ form: error.message || 'Failed to create lottery. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-lottery-form">
      <Card>
        <h2>Create New Lottery</h2>
        
        {errors.form && <div className="error-message">{errors.form}</div>}
        
        <div className="balance-info">
          <div className="info-item">
            <div className="info-label">Your Balance:</div>
            <div className="info-value">{formatCurrency(balance)}</div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Lottery Name *</label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter lottery name"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <div className="error-text">{errors.name}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="type">Lottery Type *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={errors.type ? 'error' : ''}
            >
              <option value="normal">Regular Lottery</option>
              <option value="game">Game Based Lottery</option>
            </select>
            {errors.type && <div className="error-text">{errors.type}</div>}
          </div>
          
          {formData.type === 'game' && (
            <div className="form-group">
              <label htmlFor="gameDetails">Game Details *</label>
              <textarea
                id="gameDetails"
                name="gameDetails"
                value={formData.gameDetails}
                onChange={handleChange}
                placeholder="Enter game details (name, platform, etc.)"
                rows="3"
                className={errors.gameDetails ? 'error' : ''}
              ></textarea>
              {errors.gameDetails && <div className="error-text">{errors.gameDetails}</div>}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter lottery description"
              rows="3"
              className={errors.description ? 'error' : ''}
            ></textarea>
            {errors.description && <div className="error-text">{errors.description}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="image">Lottery Image (Optional)</label>
            <ImageUploader
              onImageSelect={handleImageUpload}
              initialImage={previewImage}
              label="Upload Lottery Image"
              compress={true}
            />
            <div className="input-help">Upload an image to make your lottery more attractive (Max: 5MB)</div>
          </div>
          
          <div className="form-group">
            <label>Prizes *</label>
            {errors.prizes && <div className="error-text">{errors.prizes}</div>}
            
            <div className="prizes-container">
              {formData.prizes.map((prize, index) => (
                <PrizeField
                  key={index}
                  prize={prize}
                  index={index}
                  onChange={handlePrizeChange}
                  onRemove={removePrize}
                  canRemove={formData.prizes.length > 1}
                  errors={{
                    name: errors[`prize_${index}_name`],
                    value: errors[`prize_${index}_value`]
                  }}
                />
              ))}
            </div>
            
            <Button 
              type="button" 
              onClick={addPrize}
              variant="secondary"
            >
              Add Prize
            </Button>
            
            {totalPrizeValue !== null && (
              <div className="prize-total-info">
                <span>Total Prize Value: {formatCurrency(totalPrizeValue)}</span>
                <Button
                  type="button"
                  onClick={autoSetPrizePool}
                  variant="outline"
                  size="small"
                >
                  Set as Prize Pool
                </Button>
              </div>
            )}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="prizePool">Prize Pool (₹) *</label>
              <input
                type="number"
                id="prizePool"
                name="prizePool"
                value={formData.prizePool}
                onChange={handleChange}
                placeholder="Enter total prize amount"
                min="1"
                className={errors.prizePool ? 'error' : ''}
              />
              {errors.prizePool && <div className="error-text">{errors.prizePool}</div>}
              <div className="input-help">
                Total pool must be greater than or equal to the sum of all prize values.
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="ticketPrice">Ticket Price (₹) *</label>
              <input
                type="number"
                id="ticketPrice"
                name="ticketPrice"
                value={formData.ticketPrice}
                onChange={handleChange}
                placeholder="Price per ticket"
                min="1"
                className={errors.ticketPrice ? 'error' : ''}
              />
              {errors.ticketPrice && <div className="error-text">{errors.ticketPrice}</div>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ticketCapacity">Ticket Capacity *</label>
              <input
                type="number"
                id="ticketCapacity"
                name="ticketCapacity"
                value={formData.ticketCapacity}
                onChange={handleChange}
                placeholder="Number of tickets"
                min="1"
                className={errors.ticketCapacity ? 'error' : ''}
              />
              {errors.ticketCapacity && <div className="error-text">{errors.ticketCapacity}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="drawTime">Draw Time *</label>
              <input
                type="datetime-local"
                id="drawTime"
                name="drawTime"
                value={formData.drawTime}
                onChange={handleChange}
                className={errors.drawTime ? 'error' : ''}
              />
              {errors.drawTime && <div className="error-text">{errors.drawTime}</div>}
            </div>
          </div>
          
          <div className="form-actions">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Create Lottery
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateLotteryForm;