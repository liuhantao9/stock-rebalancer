import { useState, useEffect, useCallback } from 'react';
import { userStorageService } from '../services/userStorageService';
import { SavedPortfolio, PortfolioData, RebalanceOptions, UserPortfolioStorage } from '../types';

interface UseUserStorageReturn {
  // Portfolio management
  currentPortfolio: SavedPortfolio | null;
  portfolios: SavedPortfolio[];
  savePortfolio: (name: string, portfolioData: PortfolioData, rebalanceOptions: RebalanceOptions, description?: string, tags?: string[]) => Promise<SavedPortfolio>;
  updatePortfolio: (portfolioId: string, portfolioData: PortfolioData, rebalanceOptions: RebalanceOptions, name?: string, description?: string, tags?: string[]) => Promise<SavedPortfolio>;
  deletePortfolio: (portfolioId: string) => Promise<void>;
  duplicatePortfolio: (portfolioId: string, newName?: string) => Promise<SavedPortfolio>;
  loadPortfolio: (portfolioId: string) => Promise<void>;
  
  // Auto-save
  autoSave: (portfolioData: PortfolioData, rebalanceOptions: RebalanceOptions) => void;
  
  // Preferences
  preferences: UserPortfolioStorage['preferences'];
  updatePreferences: (preferences: Partial<UserPortfolioStorage['preferences']>) => Promise<void>;
  
  // Import/Export
  exportData: () => string;
  importData: (jsonData: string) => Promise<void>;
  
  // Utility
  clearUserData: () => Promise<void>;
  storageStats: {
    portfolioCount: number;
    storageSize: number;
    lastUpdated?: Date;
  };
  
  // Loading states
  loading: boolean;
  error: string | null;
}

export const useUserStorage = (): UseUserStorageReturn => {
  const [currentPortfolio, setCurrentPortfolio] = useState<SavedPortfolio | null>(null);
  const [portfolios, setPortfolios] = useState<SavedPortfolio[]>([]);
  const [preferences, setPreferences] = useState<UserPortfolioStorage['preferences']>({
    autoSave: true,
    defaultRebalanceOptions: {
      optimizationStrategy: 'hybrid',
      allowFractionalShares: false,
      minimumTradeAmount: 1,
      tolerancePercentage: 0.1,
      maxIterations: 100
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState({
    portfolioCount: 0,
    storageSize: 0
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = useCallback(() => {
    try {
      const loadedPortfolios = userStorageService.getPortfolios();
      const loadedCurrentPortfolio = userStorageService.getCurrentPortfolio();
      const loadedPreferences = userStorageService.getPreferences();
      const stats = userStorageService.getStorageStats();

      setPortfolios(loadedPortfolios);
      setCurrentPortfolio(loadedCurrentPortfolio);
      setPreferences(loadedPreferences);
      setStorageStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
  }, []);

  // Portfolio management
  const savePortfolio = useCallback(async (
    name: string, 
    portfolioData: PortfolioData, 
    rebalanceOptions: RebalanceOptions,
    description?: string,
    tags?: string[]
  ): Promise<SavedPortfolio> => {
    setLoading(true);
    setError(null);
    
    try {
      const portfolio = userStorageService.savePortfolio(name, portfolioData, rebalanceOptions, description, tags);
      setPortfolios(userStorageService.getPortfolios());
      setCurrentPortfolio(portfolio);
      setStorageStats(userStorageService.getStorageStats());
      return portfolio;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save portfolio';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePortfolio = useCallback(async (
    portfolioId: string,
    portfolioData: PortfolioData,
    rebalanceOptions: RebalanceOptions,
    name?: string,
    description?: string,
    tags?: string[]
  ): Promise<SavedPortfolio> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedPortfolio = userStorageService.updatePortfolio(portfolioId, portfolioData, rebalanceOptions, name, description, tags);
      setPortfolios(userStorageService.getPortfolios());
      if (currentPortfolio?.id === portfolioId) {
        setCurrentPortfolio(updatedPortfolio);
      }
      setStorageStats(userStorageService.getStorageStats());
      return updatedPortfolio;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update portfolio';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPortfolio]);

  const deletePortfolio = useCallback(async (portfolioId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      userStorageService.deletePortfolio(portfolioId);
      setPortfolios(userStorageService.getPortfolios());
      setCurrentPortfolio(userStorageService.getCurrentPortfolio());
      setStorageStats(userStorageService.getStorageStats());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete portfolio';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const duplicatePortfolio = useCallback(async (portfolioId: string, newName?: string): Promise<SavedPortfolio> => {
    setLoading(true);
    setError(null);
    
    try {
      const duplicatedPortfolio = userStorageService.duplicatePortfolio(portfolioId, newName);
      setPortfolios(userStorageService.getPortfolios());
      setCurrentPortfolio(duplicatedPortfolio);
      setStorageStats(userStorageService.getStorageStats());
      return duplicatedPortfolio;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate portfolio';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPortfolio = useCallback(async (portfolioId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      userStorageService.setCurrentPortfolio(portfolioId);
      setCurrentPortfolio(userStorageService.getCurrentPortfolio());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load portfolio';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-save
  const autoSave = useCallback((portfolioData: PortfolioData, rebalanceOptions: RebalanceOptions) => {
    try {
      userStorageService.autoSavePortfolio(portfolioData, rebalanceOptions);
      // Update state silently for auto-save
      setCurrentPortfolio(userStorageService.getCurrentPortfolio());
      setPortfolios(userStorageService.getPortfolios());
    } catch (err) {
      console.warn('Auto-save failed:', err);
    }
  }, []);

  // Preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<UserPortfolioStorage['preferences']>): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      userStorageService.updatePreferences(newPreferences);
      setPreferences(userStorageService.getPreferences());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Import/Export
  const exportData = useCallback((): string => {
    return userStorageService.exportData();
  }, []);

  const importData = useCallback(async (jsonData: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      userStorageService.importData(jsonData);
      loadInitialData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import data';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadInitialData]);

  // Clear all data
  const clearUserData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      userStorageService.clearUserData();
      setPortfolios([]);
      setCurrentPortfolio(null);
      setPreferences({
        autoSave: true,
        defaultRebalanceOptions: {
          optimizationStrategy: 'hybrid',
          allowFractionalShares: false,
          minimumTradeAmount: 1,
          tolerancePercentage: 0.1,
          maxIterations: 100
        }
      });
      setStorageStats({ portfolioCount: 0, storageSize: 0 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear data';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Portfolio management
    currentPortfolio,
    portfolios,
    savePortfolio,
    updatePortfolio,
    deletePortfolio,
    duplicatePortfolio,
    loadPortfolio,
    
    // Auto-save
    autoSave,
    
    // Preferences
    preferences,
    updatePreferences,
    
    // Import/Export
    exportData,
    importData,
    
    // Utility
    clearUserData,
    storageStats,
    
    // Loading states
    loading,
    error
  };
};