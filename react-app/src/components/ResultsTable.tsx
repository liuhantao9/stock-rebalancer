import React from 'react';
import { Stock } from '../types';

interface ResultsTableProps {
  results: Stock[];
  remainingBuyingPower: number;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  results,
  remainingBuyingPower
}) => {
  if (results.length === 0) {
    return (
      <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-500">No rebalancing results to display. Click "Rebalance" to calculate.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Rebalancing Results</h3>
      
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Stock</th>
              <th className="table-header">Price</th>
              <th className="table-header">Current Value</th>
              <th className="table-header">Result Value</th>
              <th className="table-header">Current %</th>
              <th className="table-header">Target %</th>
              <th className="table-header">Difference</th>
              <th className="table-header">Result %</th>
              <th className="table-header">Shares to Buy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {results.map((stock, index) => (
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
                <td className="table-cell">
                  {stock.targetPercentage.toFixed(2)}%
                </td>
                <td className="table-cell">
                  <span className={`font-medium ${
                    stock.diff > 0 ? 'text-red-600' : stock.diff < 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {stock.diff > 0 ? '+' : ''}{stock.diff.toFixed(2)}%
                  </span>
                </td>
                <td className="table-cell">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    Math.abs(stock.resultPercentage - stock.targetPercentage) < 1
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {stock.resultPercentage.toFixed(2)}%
                  </span>
                </td>
                <td className="table-cell">
                  <span className={`font-medium ${
                    stock.numToBuy > 0 ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {stock.numToBuy}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-blue-900">
            Remaining Buying Power:
          </span>
          <span className="text-lg font-bold text-blue-900">
            ${remainingBuyingPower.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};