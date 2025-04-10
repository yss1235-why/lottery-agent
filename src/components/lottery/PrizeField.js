// src/components/lottery/PrizeField.js
import React from 'react';
import Button from '../common/Button';

const PrizeField = ({ prize, index, onChange, onRemove, canRemove, errors }) => {
  return (
    <div className="prize-field">
      <div className="prize-name">
        <input
          type="text"
          value={prize.name}
          onChange={(e) => onChange(index, 'name', e.target.value)}
          placeholder="Prize name (e.g., First Prize)"
          className={errors?.name ? 'error' : ''}
        />
        {errors?.name && <div className="error-text">{errors.name}</div>}
      </div>
      
      <div className="prize-value">
        <input
          type="text" // Changed from number to text to allow descriptive prizes
          value={prize.value}
          onChange={(e) => onChange(index, 'value', e.target.value)}
          placeholder="Prize value or description"
          className={errors?.value ? 'error' : ''}
        />
        {errors?.value && <div className="error-text">{errors.value}</div>}
      </div>
      
      {canRemove && (
        <Button
          type="button"
          onClick={() => onRemove(index)}
          variant="danger"
          className="remove-prize-btn"
        >
          Remove
        </Button>
      )}
    </div>
  );
};

export default PrizeField;