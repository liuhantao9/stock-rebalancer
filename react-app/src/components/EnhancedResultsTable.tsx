import React from 'react';
import { Stock, PortfolioAnalysis } from '../types';

interface EnhancedResultsTableProps {
  results: Stock[];
  remainingBuyingPower: number;
  analysis?: PortfolioAnalysis;
}

export const EnhancedResultsTable: React.FC<EnhancedResultsTableProps> = ({
  results,
  remainingBuyingPower,
  analysis
}) => {
  if (results.length === 0) {
    return (
      <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-500">No rebalancing results to display. Click "Rebalance" to calculate.</p>
      </div>
    );
  }

  const totalInvested = results.reduce((sum, stock) => sum + (stock.numToBuy * stock.stockPrice), 0);
  const totalPortfolioValue = results.reduce((sum, stock) => sum + stock.resultTotal, 0);

  return (
    <div className="mt-8 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Enhanced Rebalancing Results</h3>
      
      {/* Portfolio Analysis Summary */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-900">Total Deviation</div>
            <div className="text-2xl font-bold text-blue-600">{analysis.totalDeviation.toFixed(2)}%</div>
            <div className="text-xs text-blue-700">Sum of all allocation gaps</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-900">Utilization Rate</div>
            <div className="text-2xl font-bold text-green-600">{analysis.utilizationRate.toFixed(1)}%</div>
            <div className="text-xs text-green-700">Buying power efficiency</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-purple-900">Max Deviation</div>
            <div className="text-2xl font-bold text-purple-600">{analysis.maxDeviation.toFixed(2)}%</div>
            <div className="text-xs text-purple-700">Largest single stock gap</div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis && analysis.recommendations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Optimization Recommendations:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {analysis.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Main Results Table */}
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Stock</th>
              <th className="table-header">Price</th>
              <th className="table-header">Current Value</th>
              <th className="table-header">Shares to Buy</th>
              <th className="table-header">Investment</th>
              <th className="table-header">New Value</th>
              <th className="table-header">Current %</th>
              <th className="table-header">Target %</th>
              <th className="table-header">Result %</th>
              <th className="table-header">Gap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {results.map((stock, index) => {
              const investment = stock.numToBuy * stock.stockPrice;
              const gap = stock.targetPercentage - stock.resultPercentage;
              
              return (
                <tr key={`${stock.stockName}-${index}`} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-gray-900">
                    {stock.stockName}
                  </td>
                  <td className="table-cell">
                    ${stock.stockPrice.toFixed(2)}
                  </td>
                  <td className="table-cell">
                    ${stock.currentTotal.toFixed(2)}
                  </td>
                  <td className="table-cell">
                    <span className={`font-medium ${
                      stock.numToBuy > 0 ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {stock.numToBuy}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`font-medium ${
                      investment > 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      ${investment.toFixed(2)}
                    </span>
                  </td>
                  <td className="table-cell">
                    ${stock.resultTotal.toFixed(2)}
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      stock.currPercentage < stock.targetPercentage 
                        ? 'bg-red-100 text-red-800' 
                        : stock.currPercentage > stock.targetPercentage
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {stock.currPercentage.toFixed(2)}%
                    </span>
                  </td>
                  <td className="table-cell font-medium">
                    {stock.targetPercentage.toFixed(2)}%
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      Math.abs(gap) < 0.5
                        ? 'bg-green-100 text-green-800'
                        : Math.abs(gap) < 2
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {stock.resultPercentage.toFixed(2)}%
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`font-medium ${
                      Math.abs(gap) < 0.5 ? 'text-green-600' : 
                      Math.abs(gap) < 2 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {gap > 0 ? '+' : ''}{gap.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">
              Total Investment
            </span>
            <span className="text-lg font-bold text-blue-900">
              ${totalInvested.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-900">
              Portfolio Value
            </span>
            <span className="text-lg font-bold text-green-900">
              ${totalPortfolioValue.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-purple-900">
              Remaining Cash
            </span>
            <span className="text-lg font-bold text-purple-900">
              ${remainingBuyingPower.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};