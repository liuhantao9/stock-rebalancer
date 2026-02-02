import React, { useState, useMemo } from 'react';
import { StockInput } from './components/StockInput';
import { RebalanceOptionsComponent } from './components/RebalanceOptions';
import { PortfolioManager } from './components/PortfolioManager';
import { ResultsPanel } from './components/ResultsPanel';
import { ApiDebugPanel } from './components/ApiDebugPanel';
import { AuthForm } from './components/AuthForm';
import { usePortfolio } from './hooks/usePortfolio';
import { useStockPrices } from './hooks/useStockPrices';
import { useUserStorage } from './hooks/useUserStorage';
import { useAuth } from './hooks/useAuth';
import { RebalanceResult, EnhancedRebalanceResult, RebalanceOptions, SavedPortfolio, LoginCredentials, SignUpCredentials } from './types';

// Cache entry type
interface CacheEntry {
  enhancedResult?: EnhancedRebalanceResult;
  basicResult?: RebalanceResult;
  timestamp: number;
  prices: Record<string, number>;
}

function App() {
  // Authentication state
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
    signIn,
    signUp,
    signOut,
    clearError
  } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const {
    portfolioData,
    validationErrors,
    updateBuyingPower,
    updateStock,
    updateStockPrices,
    addStock,
    removeStock,
    calculateRebalance,
    calculateAdvancedRebalance,
    resetToDefaults,
    loadPortfolioData,
    hasUnsavedChanges,
    currentPortfolioName,
    currentStockPrices
  } = usePortfolio();

  const {
    savePortfolio: savePortfolioToStorage,
    updatePortfolio: updatePortfolioInStorage,
    currentPortfolio
  } = useUserStorage();

  const {
    loading,
    error: priceError,
    fetchPrices,
    clearPrices
  } = useStockPrices();

  const [rebalanceResult, setRebalanceResult] = useState<RebalanceResult | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<EnhancedRebalanceResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [useAdvancedMode, setUseAdvancedMode] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [showPortfolioManager, setShowPortfolioManager] = useState(false);
  const [showResultsPanel, setShowResultsPanel] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showApiDebug, setShowApiDebug] = useState(false);
  const [saveDialogName, setSaveDialogName] = useState('');
  const [saveDialogDescription, setSaveDialogDescription] = useState('');
  const [rebalanceOptions, setRebalanceOptions] = useState<RebalanceOptions>({
    optimizationStrategy: 'hybrid',
    allowFractionalShares: false,
    minimumTradeAmount: 1,
    tolerancePercentage: 0.1,
    maxIterations: 100
  });

  // Smart caching: Create a cache key based on portfolio data and options
  const cacheKey = useMemo(() => {
    const portfolioHash = JSON.stringify({
      stocks: portfolioData.stocks,
      currentStockValue: portfolioData.currentStockValue,
      buyingPower: portfolioData.buyingPower,
      options: rebalanceOptions
    });
    return btoa(portfolioHash).slice(0, 16); // Short hash for cache key
  }, [portfolioData, rebalanceOptions]);

  // Cache for results to avoid unnecessary recalculations
  const [resultsCache, setResultsCache] = useState<Map<string, CacheEntry>>(new Map());

  const handleRebalance = async () => {
    setIsCalculating(true);
    
    try {
      // Get unique stock symbols
      const symbols = portfolioData.stocks
        .map(stock => stock.stockName.trim())
        .filter(name => name.length > 0);

      if (symbols.length === 0) {
        alert('Please add at least one stock symbol');
        setIsCalculating(false);
        return;
      }

      // Check cache first (cache valid for 5 minutes)
      const cachedResult = resultsCache.get(cacheKey);
      const now = Date.now();
      const cacheValidDuration = 5 * 60 * 1000; // 5 minutes

      if (cachedResult && (now - cachedResult.timestamp) < cacheValidDuration) {
        console.log('Using cached results');
        if (useAdvancedMode && cachedResult.enhancedResult) {
          setEnhancedResult(cachedResult.enhancedResult);
          setRebalanceResult(null);
        } else if (!useAdvancedMode && cachedResult.basicResult) {
          setRebalanceResult(cachedResult.basicResult);
          setEnhancedResult(null);
        }
        setShowResultsPanel(true);
        setIsCalculating(false);
        return;
      }

      // Fetch current prices and get them directly
      const fetchedPrices = await fetchPrices(symbols);
      console.log('Fetched prices:', fetchedPrices);
      
      // Update stock prices in portfolio hook for auto-calculation
      updateStockPrices(fetchedPrices);
      
      // Calculate rebalance using the fetched prices directly
      let newCacheEntry: CacheEntry = {
        timestamp: now,
        prices: fetchedPrices
      };

      if (useAdvancedMode) {
        const result = calculateAdvancedRebalance(fetchedPrices, rebalanceOptions);
        if (result) {
          setEnhancedResult(result);
          setRebalanceResult(null);
          newCacheEntry.enhancedResult = result;
          setShowResultsPanel(true);
          
          // Auto-save portfolio when using advanced rebalance
          try {
            await handleSavePortfolio();
          } catch (error) {
            console.warn('Auto-save failed:', error);
          }
        } else {
          alert('Failed to calculate advanced rebalance. Please check your inputs.');
        }
      } else {
        const result = calculateRebalance(fetchedPrices);
        if (result) {
          setRebalanceResult(result);
          setEnhancedResult(null);
          newCacheEntry.basicResult = result;
          setShowResultsPanel(true);
        } else {
          alert('Failed to calculate rebalance. Please check your inputs.');
        }
      }

      // Update cache
      setResultsCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, newCacheEntry);
        // Keep only last 10 cache entries to prevent memory bloat
        if (newCache.size > 10) {
          const firstKey = newCache.keys().next().value;
          if (firstKey) {
            newCache.delete(firstKey);
          }
        }
        return newCache;
      });
      
    } catch (error) {
      console.error('Rebalance error:', error);
      alert('An error occurred during rebalancing. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    resetToDefaults();
    setRebalanceResult(null);
    setEnhancedResult(null);
    setShowResultsPanel(false);
    clearPrices();
    // Clear cache when resetting
    setResultsCache(new Map());
  };

  const handleModeToggle = () => {
    setUseAdvancedMode(!useAdvancedMode);
    // Check if we have cached results for the new mode
    const cachedResult = resultsCache.get(cacheKey);
    if (cachedResult) {
      if (!useAdvancedMode && cachedResult.enhancedResult) {
        setEnhancedResult(cachedResult.enhancedResult);
        setRebalanceResult(null);
      } else if (useAdvancedMode && cachedResult.basicResult) {
        setRebalanceResult(cachedResult.basicResult);
        setEnhancedResult(null);
      }
    } else {
      setRebalanceResult(null);
      setEnhancedResult(null);
    }
  };

  // Function to show results panel with existing results
  const handleShowResults = () => {
    if (enhancedResult || rebalanceResult) {
      setShowResultsPanel(true);
    }
  };

  // Authentication handlers
  const handleAuthSubmit = async (credentials: LoginCredentials | SignUpCredentials) => {
    clearError();
    try {
      if (authMode === 'signin') {
        await signIn(credentials as LoginCredentials);
      } else {
        await signUp(credentials as SignUpCredentials);
      }
    } catch (error) {
      // Error is handled by useAuth hook
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSavePortfolio = async () => {
    if (currentPortfolio) {
      // Update existing portfolio
      try {
        await updatePortfolioInStorage(
          currentPortfolio.id,
          portfolioData,
          rebalanceOptions
        );
        alert('Portfolio updated successfully!');
      } catch (error) {
        alert('Failed to update portfolio: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } else {
      // Save as new portfolio
      setShowSaveDialog(true);
    }
  };

  const handleSaveAsNew = async () => {
    if (!saveDialogName.trim()) return;

    try {
      await savePortfolioToStorage(
        saveDialogName.trim(),
        portfolioData,
        rebalanceOptions,
        saveDialogDescription.trim() || undefined
      );
      setSaveDialogName('');
      setSaveDialogDescription('');
      setShowSaveDialog(false);
      alert('Portfolio saved successfully!');
    } catch (error) {
      alert('Failed to save portfolio: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handlePortfolioLoad = (portfolio: SavedPortfolio) => {
    loadPortfolioData(portfolio);
    // Update rebalance options from loaded portfolio
    setRebalanceOptions(portfolio.rebalanceOptions);
    // Clear any existing results and cache
    setRebalanceResult(null);
    setEnhancedResult(null);
    setShowResultsPanel(false);
    setResultsCache(new Map());
  };


  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication form if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthForm
        mode={authMode}
        onSubmit={handleAuthSubmit}
        onModeChange={setAuthMode}
        loading={authLoading}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Advanced Stock Portfolio Rebalancer</h1>
              <p className="mt-2 text-gray-600">
                Calculate optimal stock purchases using advanced algorithms to rebalance your portfolio according to target percentages.
              </p>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Welcome, {user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>

              {/* Portfolio Actions */}
              <div className="flex space-x-2">
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={() => setShowPortfolioManager(true)}
                >
                  Manage Portfolios
                </button>
                
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={() => setShowApiDebug(true)}
                  title="Debug API performance and test data sources"
                >
                  API Debug
                </button>

                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Current Portfolio Info */}
          {currentPortfolioName && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-blue-900">
                    Portfolio: {currentPortfolioName}
                    {hasUnsavedChanges && <span className="text-orange-600 ml-2">• Unsaved changes</span>}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Mode Toggle */}
          <div className="mt-4 flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={useAdvancedMode}
                onChange={handleModeToggle}
              />
              <span className="text-sm font-medium text-gray-700">
                Use Advanced Rebalancing Algorithm
              </span>
            </label>
            
            {useAdvancedMode && (
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => setShowOptions(!showOptions)}
              >
                {showOptions ? 'Hide Options' : 'Show Advanced Options'}
              </button>
            )}
          </div>
        </div>

        {/* Advanced Options */}
        {useAdvancedMode && showOptions && (
          <RebalanceOptionsComponent
            options={rebalanceOptions}
            onOptionsChange={setRebalanceOptions}
          />
        )}

        {/* Portfolio Inputs */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Portfolio Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock Value ($)
                <span className="text-xs text-gray-500 ml-1">(Auto-calculated)</span>
              </label>
              <input
                type="number"
                className="form-input bg-gray-50"
                value={portfolioData.currentStockValue.toFixed(2)}
                disabled
                title="Automatically calculated from stock prices and shares owned"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buying Power ($)
              </label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                min="0"
                step="0.01"
                value={portfolioData.buyingPower || ''}
                onChange={(e) => updateBuyingPower(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Capital ($)
                <span className="text-xs text-gray-500 ml-1">(Auto-calculated)</span>
              </label>
              <input
                type="number"
                className="form-input bg-gray-50"
                value={portfolioData.totalCapital.toFixed(2)}
                disabled
                title="Current Stock Value + Buying Power"
              />
            </div>
          </div>

          {/* Stock Prices Info */}
          {Object.keys(currentStockPrices).length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Current Stock Prices:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {Object.entries(currentStockPrices).map(([symbol, price]) => (
                  <div key={symbol} className={price > 0 ? "text-green-700" : "text-orange-700"}>
                    <span className="font-medium">{symbol}:</span> {price > 0 ? `$${price.toFixed(2)}` : 'N/A'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Price Fetch Error */}
          {priceError && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">{priceError}</p>
            </div>
          )}
        </div>

        {/* Stock Inputs */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Stock Holdings</h2>
            <div className="space-x-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={addStock}
              >
                Add Stock
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReset}
              >
                Reset to Defaults
              </button>
            </div>
          </div>

          {/* Fetch Prices Button */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-800">Stock Price Fetching</h4>
                <p className="text-xs text-blue-600 mt-1">
                  Fetch current market prices to auto-calculate portfolio values
                </p>
              </div>
              <button
                type="button"
                className={`btn-primary text-sm ${
                  loading || portfolioData.stocks.every(s => !s.stockName.trim())
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                onClick={async () => {
                  const symbols = portfolioData.stocks
                    .map(stock => stock.stockName.trim())
                    .filter(name => name.length > 0);
                  
                  if (symbols.length > 0) {
                    const prices = await fetchPrices(symbols);
                    updateStockPrices(prices);
                  }
                }}
                disabled={loading || portfolioData.stocks.every(s => !s.stockName.trim())}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="loading-spinner mr-2"></div>
                    Fetching...
                  </div>
                ) : (
                  'Fetch Current Prices'
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {portfolioData.stocks.map((stock, index) => (
              <StockInput
                key={index}
                stock={stock}
                index={index}
                onUpdate={updateStock}
                onRemove={removeStock}
                canRemove={portfolioData.stocks.length > 1}
              />
            ))}
          </div>

          <div className="mt-6 flex justify-center space-x-4">
            <button
              type="button"
              className={`btn-primary px-8 py-3 text-lg ${
                (loading || isCalculating || validationErrors.length > 0)
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              onClick={handleRebalance}
              disabled={loading || isCalculating || validationErrors.length > 0}
            >
              {loading || isCalculating ? (
                <div className="flex items-center">
                  <div className="loading-spinner mr-2"></div>
                  {loading ? 'Fetching Prices...' : 'Calculating...'}
                </div>
              ) : (
                `${useAdvancedMode ? 'Advanced ' : ''}Rebalance Portfolio`
              )}
            </button>

            {/* Show Results Button */}
            {(enhancedResult || rebalanceResult) && (
              <button
                type="button"
                className="btn-secondary px-6 py-3 text-lg flex items-center"
                onClick={handleShowResults}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Results
              </button>
            )}
          </div>

          {/* Algorithm Info */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Current Mode:</strong> {useAdvancedMode ? 'Advanced Algorithm' : 'Basic Algorithm'}
              {useAdvancedMode && (
                <span> - Strategy: {rebalanceOptions.optimizationStrategy ?
                  rebalanceOptions.optimizationStrategy.charAt(0).toUpperCase() + rebalanceOptions.optimizationStrategy.slice(1) :
                  'Hybrid'}</span>
              )}
            </p>
          </div>
        </div>

        {/* Results Panel */}
        <ResultsPanel
          isOpen={showResultsPanel}
          onClose={() => setShowResultsPanel(false)}
          enhancedResult={enhancedResult}
          basicResult={rebalanceResult}
          isAdvancedMode={useAdvancedMode}
        />

        {/* API Debug Panel */}
        <ApiDebugPanel
          isOpen={showApiDebug}
          onClose={() => setShowApiDebug(false)}
        />

        {/* Portfolio Manager Modal */}
        {showPortfolioManager && (
          <PortfolioManager
            onPortfolioLoad={handlePortfolioLoad}
            onClose={() => setShowPortfolioManager(false)}
          />
        )}

        {/* Save Portfolio Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Portfolio</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Portfolio Name *
                    </label>
                    <input
                      type="text"
                      className="form-input w-full"
                      placeholder="My Portfolio"
                      value={saveDialogName}
                      onChange={(e) => setSaveDialogName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      className="form-input w-full h-20"
                      placeholder="Portfolio description..."
                      value={saveDialogDescription}
                      onChange={(e) => setSaveDialogDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleSaveAsNew}
                    className="btn-primary flex-1"
                    disabled={!saveDialogName.trim()}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;