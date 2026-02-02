import React from 'react';
import { EnhancedResultsTable } from './EnhancedResultsTable';
import { ResultsTable } from './ResultsTable';
import { EnhancedRebalanceResult, RebalanceResult } from '../types';

interface ResultsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  enhancedResult?: EnhancedRebalanceResult | null;
  basicResult?: RebalanceResult | null;
  isAdvancedMode: boolean;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  isOpen,
  onClose,
  enhancedResult,
  basicResult,
  isAdvancedMode
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sliding Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-full max-w-4xl bg-white shadow-2xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isAdvancedMode ? 'Advanced ' : ''}Rebalance Results
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isAdvancedMode ? 'Detailed portfolio analysis and recommendations' : 'Basic rebalancing calculations'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Minimize/Restore Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close panel"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {enhancedResult && isAdvancedMode ? (
            <div className="space-y-6">
              {/* Results Summary */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Strategy:</span>
                    <span className="ml-2 text-blue-900 capitalize">
                      {enhancedResult.options?.optimizationStrategy || 'Hybrid'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Remaining Cash:</span>
                    <span className="ml-2 text-blue-900 font-mono">
                      ${enhancedResult.remainingBuyingPower.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Fractional Shares:</span>
                    <span className="ml-2 text-blue-900">
                      {enhancedResult.options?.allowFractionalShares ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Min Trade:</span>
                    <span className="ml-2 text-blue-900 font-mono">
                      ${enhancedResult.options?.minimumTradeAmount || 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Results Table */}
              <EnhancedResultsTable
                results={enhancedResult.stocks}
                remainingBuyingPower={enhancedResult.remainingBuyingPower}
                analysis={enhancedResult.analysis}
              />
            </div>
          ) : basicResult && !isAdvancedMode ? (
            <div className="space-y-6">
              {/* Basic Results Summary */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Summary</h3>
                <div className="text-sm">
                  <span className="text-green-700 font-medium">Remaining Cash:</span>
                  <span className="ml-2 text-green-900 font-mono">
                    ${basicResult.remainingBuyingPower.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Basic Results Table */}
              <ResultsTable
                results={basicResult.stocks}
                remainingBuyingPower={basicResult.remainingBuyingPower}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-lg font-medium">No Results Available</p>
                <p className="text-sm mt-1">Run a rebalance calculation to see results here</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {enhancedResult || basicResult ? (
                <span>
                  Results calculated at {new Date().toLocaleTimeString()}
                </span>
              ) : (
                <span>Ready to display results</span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="btn-secondary text-sm"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};