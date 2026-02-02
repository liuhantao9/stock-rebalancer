import React from 'react';
import { RebalanceOptions } from '../types';

interface RebalanceOptionsProps {
  options: RebalanceOptions;
  onOptionsChange: (options: RebalanceOptions) => void;
}

export const RebalanceOptionsComponent: React.FC<RebalanceOptionsProps> = ({
  options,
  onOptionsChange
}) => {
  const handleOptionChange = (key: keyof RebalanceOptions, value: any) => {
    onOptionsChange({
      ...options,
      [key]: value
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Rebalancing Options</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Optimization Strategy */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Optimization Strategy
          </label>
          <select
            className="form-input"
            value={options.optimizationStrategy || 'hybrid'}
            onChange={(e) => handleOptionChange('optimizationStrategy', e.target.value)}
          >
            <option value="hybrid">Hybrid (Recommended)</option>
            <option value="greedy">Greedy (Prioritize Gaps)</option>
            <option value="proportional">Proportional (Balanced)</option>
          </select>
          <p className="text-xs text-gray-500">
            {options.optimizationStrategy === 'greedy' && 'Focuses on largest percentage gaps first'}
            {options.optimizationStrategy === 'proportional' && 'Distributes buying power proportionally'}
            {(options.optimizationStrategy === 'hybrid' || !options.optimizationStrategy) && 'Combines both strategies for optimal results'}
          </p>
        </div>

        {/* Fractional Shares */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={options.allowFractionalShares || false}
              onChange={(e) => handleOptionChange('allowFractionalShares', e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">Allow Fractional Shares</span>
          </label>
          <p className="text-xs text-gray-500">
            Enable purchasing partial shares for more precise allocation
          </p>
        </div>

        {/* Minimum Trade Amount */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Minimum Trade Amount ($)
          </label>
          <input
            type="number"
            className="form-input"
            min="0"
            step="0.01"
            value={options.minimumTradeAmount || 1}
            onChange={(e) => handleOptionChange('minimumTradeAmount', parseFloat(e.target.value) || 1)}
          />
          <p className="text-xs text-gray-500">
            Skip trades below this amount to reduce transaction costs
          </p>
        </div>

        {/* Tolerance Percentage */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tolerance (%)
          </label>
          <input
            type="number"
            className="form-input"
            min="0"
            max="5"
            step="0.1"
            value={options.tolerancePercentage || 0.1}
            onChange={(e) => handleOptionChange('tolerancePercentage', parseFloat(e.target.value) || 0.1)}
          />
          <p className="text-xs text-gray-500">
            Acceptable deviation from target allocation
          </p>
        </div>

        {/* Max Iterations */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Max Iterations
          </label>
          <input
            type="number"
            className="form-input"
            min="10"
            max="1000"
            step="10"
            value={options.maxIterations || 100}
            onChange={(e) => handleOptionChange('maxIterations', parseInt(e.target.value) || 100)}
          />
          <p className="text-xs text-gray-500">
            Maximum optimization cycles for complex portfolios
          </p>
        </div>
      </div>

      {/* Strategy Descriptions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Strategy Guide:</h4>
        <div className="text-xs text-blue-800 space-y-1">
          <div><strong>Hybrid:</strong> Best overall performance - uses proportional allocation for major gaps, then greedy optimization for remaining funds</div>
          <div><strong>Greedy:</strong> Prioritizes stocks with largest percentage gaps - good for aggressive rebalancing</div>
          <div><strong>Proportional:</strong> Distributes buying power based on gap sizes - good for gradual rebalancing</div>
        </div>
      </div>
    </div>
  );
};