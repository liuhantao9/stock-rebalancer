import { useState, useCallback } from 'react';
import { stockApiService } from '../services/stockApiService';
import { ApiStockPrice } from '../types';

interface UseStockPricesReturn {
  stockPrices: Record<string, number>;
  loading: boolean;
  error: string | null;
  fetchPrices: (symbols: string[]) => Promise<Record<string, number>>;
  clearPrices: () => void;
}

export const useStockPrices = (): UseStockPricesReturn => {
  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async (symbols: string[]): Promise<Record<string, number>> => {
    if (symbols.length === 0) return {};

    setLoading(true);
    setError(null);

    try {
      const uniqueSymbols = Array.from(new Set(symbols.filter(s => s.trim())));
      
      // Always try to fetch real data first, fallback to mock data if needed
      const results = await stockApiService.getMultipleStockPrices(uniqueSymbols);

      const priceMap: Record<string, number> = {};
      const errors: string[] = [];

      results.forEach(result => {
        if (result.error) {
          errors.push(`${result.symbol}: ${result.error}`);
        } else {
          priceMap[result.symbol] = result.price;
        }
      });

      setStockPrices(priceMap);

      if (errors.length > 0) {
        setError(`Some prices could not be fetched: ${errors.join(', ')}`);
      }

      return priceMap;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stock prices';
      setError(errorMessage);
      console.error('Error fetching stock prices:', err);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPrices = useCallback(() => {
    setStockPrices({});
    setError(null);
  }, []);

  return {
    stockPrices,
    loading,
    error,
    fetchPrices,
    clearPrices
  };
};