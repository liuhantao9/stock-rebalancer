import React from 'react';
import { StockInput as StockInputType } from '../types';

interface StockInputProps {
  stock: StockInputType;
  index: number;
  onUpdate: (index: number, field: keyof StockInputType, value: string | number) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export const StockInput: React.FC<StockInputProps> = ({
  stock,
  index,
  onUpdate,
  onRemove,
  canRemove
}) => {
  const handleInputChange = (field: keyof StockInputType, value: string) => {
    if (field === 'stockName') {
      onUpdate(index, field, value.toUpperCase());
    } else {
      const numValue = parseFloat(value) || 0;
      onUpdate(index, field, numValue);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Stock Symbol
        </label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g., AAPL"
          value={stock.stockName}
          onChange={(e) => handleInputChange('stockName', e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Shares Owned
        </label>
        <input
          type="number"
          className="form-input"
          placeholder="0"
          min="0"
          step="1"
          value={stock.shareNumbers || ''}
          onChange={(e) => handleInputChange('shareNumbers', e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Current Value ($)
        </label>
        <input
          type="number"
          className="form-input bg-gray-50"
          placeholder="Calculated"
          value={stock.currentTotal.toFixed(2)}
          disabled
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Target %
        </label>
        <input
          type="number"
          className="form-input"
          placeholder="0"
          min="0"
          max="100"
          step="0.1"
          value={stock.stockPercentage || ''}
          onChange={(e) => handleInputChange('stockPercentage', e.target.value)}
        />
      </div>

      <div className="flex items-end">
        {canRemove && (
          <button
            type="button"
            className="btn-danger w-full"
            onClick={() => onRemove(index)}
            title="Remove Stock"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
};