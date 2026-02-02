import React, { useState, useEffect } from 'react';
import { stockApiService } from '../services/stockApiService';

interface ApiDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiDebugPanel: React.FC<ApiDebugPanelProps> = ({ isOpen, onClose }) => {
  const [cacheStats, setCacheStats] = useState<{
    size: number;
    entries: Array<{ symbol: string; price: number; age: number; source: string }>;
  }>({ size: 0, entries: [] });

  const [testResults, setTestResults] = useState<Array<{
    symbol: string;
    price: number;
    source: string;
    timestamp: string;
    success: boolean;
    error?: string;
  }>>([]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      updateCacheStats();
    }
  }, [isOpen]);

  const updateCacheStats = () => {
    const stats = stockApiService.getCacheStats();
    setCacheStats(stats);
  };

  const testApiSources = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    // First test API connection
    console.log('🔍 Testing Finnhub API connection...');
    const connectionTest = await stockApiService.testConnection();
    
    if (!connectionTest.success) {
      setTestResults([{
        symbol: 'CONNECTION_TEST',
        price: 0,
        source: 'Finnhub Connection',
        timestamp: new Date().toLocaleTimeString(),
        success: false,
        error: connectionTest.message
      }]);
      setIsLoading(false);
      return;
    }
    
    // Test with multiple symbols
    const testSymbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA'];
    const results: Array<{
      symbol: string;
      price: number;
      source: string;
      timestamp: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const symbol of testSymbols) {
      try {
        console.log(`🔄 Testing ${symbol}...`);
        const result = await stockApiService.getStockPrice(symbol);
        const cacheEntry = stockApiService.getCacheStats().entries.find(e => e.symbol === symbol);
        
        results.push({
          symbol,
          price: result.price,
          source: cacheEntry?.source || 'Finnhub',
          timestamp: new Date().toLocaleTimeString(),
          success: result.price > 0
        });
      } catch (error) {
        results.push({
          symbol,
          price: 0,
          source: 'Failed',
          timestamp: new Date().toLocaleTimeString(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      setTestResults([...results]);
      // Delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsLoading(false);
    updateCacheStats();
  };

  const clearCache = () => {
    stockApiService.clearCache();
    updateCacheStats();
    setTestResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">API Debug Panel</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Control Buttons */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={testApiSources}
              disabled={isLoading}
              className={`btn-primary ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="loading-spinner mr-2"></div>
                  Testing Finnhub API...
                </div>
              ) : (
                'Test Finnhub API'
              )}
            </button>
            
            <button
              onClick={clearCache}
              className="btn-secondary"
            >
              Clear Cache
            </button>
            
            <button
              onClick={updateCacheStats}
              className="btn-secondary"
            >
              Refresh Stats
            </button>
          </div>

          {/* Cache Statistics */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Cache Statistics</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Cache Size:</strong> {cacheStats.size} entries
              </p>
              
              {cacheStats.entries.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Symbol</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Price</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Source</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Age (seconds)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cacheStats.entries.map((entry, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 px-3 font-mono">{entry.symbol}</td>
                          <td className="py-2 px-3 font-mono">${entry.price.toFixed(2)}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              entry.source.includes('Mock') 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {entry.source}
                            </span>
                          </td>
                          <td className="py-2 px-3">{entry.age}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Finnhub API Test Results</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Symbol</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Status</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Price</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Source</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testResults.map((result, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 px-3 font-mono">{result.symbol}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              result.success 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.success ? 'Success' : 'Failed'}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono">
                            {result.success ? `$${result.price.toFixed(2)}` : 'N/A'}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              result.source.includes('Mock') 
                                ? 'bg-yellow-100 text-yellow-800'
                                : result.source === 'Failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {result.source}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-600">{result.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* API Information */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">API Configuration</h4>
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-medium text-green-900">🎯 Finnhub API (Only Source)</h5>
                <p className="text-sm text-green-700 mt-1">
                  Professional stock market data with your real API key
                </p>
                <div className="mt-2 text-xs text-green-600 space-y-1">
                  <div>• <strong>Endpoint:</strong> https://finnhub.io/api/v1/quote</div>
                  <div>• <strong>Rate Limit:</strong> 60 calls/minute</div>
                  <div>• <strong>Data:</strong> Real-time stock prices</div>
                  <div>• <strong>Authentication:</strong> API Token in URL parameter</div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h5 className="font-medium text-blue-900">📋 Caching Strategy</h5>
                <p className="text-sm text-blue-700">
                  5-minute cache per symbol to optimize API usage and respect rate limits
                </p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h5 className="font-medium text-red-900">❌ No Fallback APIs</h5>
                <p className="text-sm text-red-700">
                  If Finnhub fails, returns "N/A" - clean and simple monitoring
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export {};