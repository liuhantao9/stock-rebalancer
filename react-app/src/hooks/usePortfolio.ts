import { useState, useCallback, useMemo, useEffect } from 'react';
import { StockInput, PortfolioData, RebalanceResult, RebalanceOptions, EnhancedRebalanceResult, SavedPortfolio } from '../types';
import { RebalanceService } from '../services/rebalanceService';
import { AdvancedRebalanceService } from '../services/advancedRebalanceService';
import { useUserStorage } from './useUserStorage';

const EMPTY_STOCK: StockInput = { stockName: '', shareNumbers: 0, currentTotal: 0, stockPercentage: 0 };

interface UsePortfolioReturn {
  portfolioData: PortfolioData;
  validationErrors: string[];
  updateBuyingPower: (value: number) => void;
  updateStock: (index: number, field: keyof StockInput, value: string | number) => void;
  updateStockPrices: (stockPrices: Record<string, number>) => void;
  addStock: () => void;
  removeStock: (index: number) => void;
  calculateRebalance: (stockPrices: Record<string, number>) => RebalanceResult | null;
  calculateAdvancedRebalance: (stockPrices: Record<string, number>, options?: RebalanceOptions) => EnhancedRebalanceResult | null;
  resetToDefaults: () => void;
  loadPortfolioData: (portfolio: SavedPortfolio) => void;
  hasUnsavedChanges: boolean;
  currentPortfolioName: string | null;
  currentStockPrices: Record<string, number>;
}

export const usePortfolio = (): UsePortfolioReturn => {
  const [buyingPower, setBuyingPower] = useState<number>(0);
  const [stocks, setStocks] = useState<StockInput[]>([EMPTY_STOCK]);
  const [currentStockPrices, setCurrentStockPrices] = useState<Record<string, number>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastSavedState, setLastSavedState] = useState<string>('');

  const { currentPortfolio, autoSave, preferences } = useUserStorage();

  // Auto-calculate current stock value from prices and shares
  const currentStockValue = useMemo(() => {
    return stocks.reduce((total, stock) => {
      const price = currentStockPrices[stock.stockName];
      // Only include stocks with valid prices (not 0 or undefined)
      if (price && price > 0) {
        const value = price * stock.shareNumbers;
        return total + value;
      }
      return total;
    }, 0);
  }, [stocks, currentStockPrices]);

  // Update individual stock currentTotal values when prices change
  const updatedStocks = useMemo(() => {
    return stocks.map(stock => {
      const price = currentStockPrices[stock.stockName];
      return {
        ...stock,
        currentTotal: (price && price > 0) ? price * stock.shareNumbers : 0
      };
    });
  }, [stocks, currentStockPrices]);

  const portfolioData: PortfolioData = useMemo(() => ({
    totalCapital: currentStockValue + buyingPower,
    currentStockValue,
    buyingPower,
    stocks: updatedStocks
  }), [currentStockValue, buyingPower, updatedStocks]);

  // Track changes for auto-save
  const currentStateString = useMemo(() => {
    return JSON.stringify({ buyingPower, stocks, currentStockPrices });
  }, [buyingPower, stocks, currentStockPrices]);

  // Load portfolio data from storage on mount
  useEffect(() => {
    if (currentPortfolio && !lastSavedState) {
      loadPortfolioData(currentPortfolio);
    }
  }, [currentPortfolio]);

  // Track unsaved changes
  useEffect(() => {
    if (lastSavedState && currentStateString !== lastSavedState) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [currentStateString, lastSavedState]);

  // Auto-save functionality
  useEffect(() => {
    if (preferences.autoSave && hasUnsavedChanges && lastSavedState) {
      const timeoutId = setTimeout(() => {
        autoSave(portfolioData, preferences.defaultRebalanceOptions);
        setLastSavedState(currentStateString);
        setHasUnsavedChanges(false);
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [hasUnsavedChanges, currentStateString, portfolioData, autoSave, preferences, lastSavedState]);

  const validationErrors = useMemo(() => {
    return AdvancedRebalanceService.validatePortfolioInputs(
      currentStockValue,
      buyingPower,
      stocks
    );
  }, [currentStockValue, buyingPower, stocks]);

  const updateBuyingPower = useCallback((value: number) => {
    setBuyingPower(Math.max(0, value));
  }, []);

  const updateStockPrices = useCallback((stockPrices: Record<string, number>) => {
    setCurrentStockPrices(stockPrices);
  }, []);

  const updateStock = useCallback((index: number, field: keyof StockInput, value: string | number) => {
    setStocks(prevStocks => {
      const newStocks = [...prevStocks];
      if (index >= 0 && index < newStocks.length) {
        newStocks[index] = {
          ...newStocks[index],
          [field]: value
        };
        // Don't allow manual editing of currentTotal - it's auto-calculated
        if (field !== 'currentTotal') {
          newStocks[index] = {
            ...newStocks[index],
            [field]: value
          };
        }
      }
      return newStocks;
    });
  }, []);

  const addStock = useCallback(() => {
    const newStock: StockInput = {
      stockName: '',
      shareNumbers: 0,
      currentTotal: 0,
      stockPercentage: 0
    };
    setStocks(prevStocks => [...prevStocks, newStock]);
  }, []);

  const removeStock = useCallback((index: number) => {
    setStocks(prevStocks => {
      if (prevStocks.length <= 1) return prevStocks; // Keep at least one stock
      return prevStocks.filter((_, i) => i !== index);
    });
  }, []);

  const calculateRebalance = useCallback((stockPrices: Record<string, number>): RebalanceResult | null => {
    try {
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Update stock prices for auto-calculation
      setCurrentStockPrices(stockPrices);

      // Calculate current stock value with the new prices
      const newCurrentStockValue = stocks.reduce((total, stock) => {
        const price = stockPrices[stock.stockName];
        if (price && price > 0) {
          return total + (price * stock.shareNumbers);
        }
        return total;
      }, 0);

      // Calculate total capital with updated stock value
      const newTotalCapital = newCurrentStockValue + buyingPower;

      // Update stocks with current totals based on new prices
      const stocksWithUpdatedTotals = stocks.map(stock => {
        const price = stockPrices[stock.stockName];
        return {
          ...stock,
          currentTotal: (price && price > 0) ? price * stock.shareNumbers : 0
        };
      });

      return RebalanceService.calculateRebalance(
        stocksWithUpdatedTotals,
        stockPrices,
        buyingPower,
        newTotalCapital
      );
    } catch (error) {
      console.error('Rebalance calculation error:', error);
      return null;
    }
  }, [stocks, buyingPower, validationErrors]);

  const calculateAdvancedRebalance = useCallback((stockPrices: Record<string, number>, options?: RebalanceOptions): EnhancedRebalanceResult | null => {
    try {
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Update stock prices for auto-calculation
      setCurrentStockPrices(stockPrices);

      // Calculate current stock value with the new prices
      const newCurrentStockValue = stocks.reduce((total, stock) => {
        const price = stockPrices[stock.stockName];
        if (price && price > 0) {
          return total + (price * stock.shareNumbers);
        }
        return total;
      }, 0);

      // Calculate total capital with updated stock value
      const newTotalCapital = newCurrentStockValue + buyingPower;

      // Update stocks with current totals based on new prices
      const stocksWithUpdatedTotals = stocks.map(stock => {
        const price = stockPrices[stock.stockName];
        return {
          ...stock,
          currentTotal: (price && price > 0) ? price * stock.shareNumbers : 0
        };
      });

      const result = AdvancedRebalanceService.calculateRebalance(
        stocksWithUpdatedTotals,
        stockPrices,
        buyingPower,
        newTotalCapital,
        options
      );

      const analysis = AdvancedRebalanceService.analyzePortfolioEfficiency(result);

      return {
        ...result,
        analysis,
        options
      };
    } catch (error) {
      console.error('Advanced rebalance calculation error:', error);
      return null;
    }
  }, [stocks, buyingPower, validationErrors]);

  const resetToDefaults = useCallback(() => {
    setBuyingPower(0);
    setStocks([EMPTY_STOCK]);
    setCurrentStockPrices({});
    setLastSavedState('');
    setHasUnsavedChanges(false);
  }, []);

  const loadPortfolioData = useCallback((portfolio: SavedPortfolio) => {
    setBuyingPower(portfolio.portfolioData.buyingPower);
    setStocks(portfolio.portfolioData.stocks);
    // Reset stock prices when loading - they'll be fetched fresh
    setCurrentStockPrices({});
    
    const newStateString = JSON.stringify({
      buyingPower: portfolio.portfolioData.buyingPower,
      stocks: portfolio.portfolioData.stocks,
      currentStockPrices: {}
    });
    setLastSavedState(newStateString);
    setHasUnsavedChanges(false);
  }, []);

  return {
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
    currentPortfolioName: currentPortfolio?.name || null,
    currentStockPrices
  };
};