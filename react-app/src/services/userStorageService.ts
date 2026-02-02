import { UserPortfolioStorage, SavedPortfolio, PortfolioData, RebalanceOptions } from '../types';
import { authService } from './authService';

const STORAGE_VERSION = '1.0';

class UserStorageService {
  private static instance: UserStorageService;

  public static getInstance(): UserStorageService {
    if (!UserStorageService.instance) {
      UserStorageService.instance = new UserStorageService();
    }
    return UserStorageService.instance;
  }

  private getStorageKey(): string {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }
    return `stock-rebalancer-user-${currentUser.id}`;
  }

  private getDefaultStorage(): UserPortfolioStorage {
    return {
      portfolios: {},
      currentPortfolioId: undefined,
      preferences: {
        autoSave: true,
        defaultRebalanceOptions: {
          optimizationStrategy: 'hybrid',
          allowFractionalShares: false,
          minimumTradeAmount: 1,
          tolerancePercentage: 0.1,
          maxIterations: 100
        }
      }
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Load user's portfolio data from localStorage
  loadUserStorage(): UserPortfolioStorage {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        return this.getDefaultStorage();
      }

      const stored = localStorage.getItem(this.getStorageKey());
      if (!stored) {
        return this.getDefaultStorage();
      }

      const parsed = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      Object.values(parsed.portfolios || {}).forEach((portfolio: any) => {
        portfolio.createdAt = new Date(portfolio.createdAt);
        portfolio.updatedAt = new Date(portfolio.updatedAt);
      });

      return {
        ...this.getDefaultStorage(),
        ...parsed
      };
    } catch (error) {
      console.error('Error loading user storage:', error);
      return this.getDefaultStorage();
    }
  }

  // Save user's portfolio data to localStorage
  saveUserStorage(data: UserPortfolioStorage): void {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user');
      }
      localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
    } catch (error) {
      console.error('Error saving user storage:', error);
      throw new Error('Failed to save data. Storage may be full.');
    }
  }

  // Portfolio Management
  savePortfolio(
    name: string, 
    portfolioData: PortfolioData, 
    rebalanceOptions: RebalanceOptions,
    description?: string,
    tags?: string[]
  ): SavedPortfolio {
    const storage = this.loadUserStorage();
    
    const portfolio: SavedPortfolio = {
      id: this.generateId(),
      name,
      description,
      portfolioData: JSON.parse(JSON.stringify(portfolioData)), // Deep clone
      rebalanceOptions: JSON.parse(JSON.stringify(rebalanceOptions)), // Deep clone
      createdAt: new Date(),
      updatedAt: new Date(),
      tags
    };

    storage.portfolios[portfolio.id] = portfolio;
    
    // Set as current portfolio
    storage.currentPortfolioId = portfolio.id;

    this.saveUserStorage(storage);
    return portfolio;
  }

  updatePortfolio(
    portfolioId: string, 
    portfolioData: PortfolioData, 
    rebalanceOptions: RebalanceOptions,
    name?: string,
    description?: string,
    tags?: string[]
  ): SavedPortfolio {
    const storage = this.loadUserStorage();
    const portfolio = storage.portfolios[portfolioId];
    
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    const updatedPortfolio: SavedPortfolio = {
      ...portfolio,
      ...(name && { name }),
      ...(description !== undefined && { description }),
      portfolioData: JSON.parse(JSON.stringify(portfolioData)),
      rebalanceOptions: JSON.parse(JSON.stringify(rebalanceOptions)),
      updatedAt: new Date(),
      ...(tags && { tags })
    };

    storage.portfolios[portfolioId] = updatedPortfolio;
    this.saveUserStorage(storage);
    return updatedPortfolio;
  }

  deletePortfolio(portfolioId: string): void {
    const storage = this.loadUserStorage();
    
    if (!storage.portfolios[portfolioId]) {
      throw new Error('Portfolio not found');
    }

    delete storage.portfolios[portfolioId];

    // Update current portfolio if deleted
    if (storage.currentPortfolioId === portfolioId) {
      const remainingPortfolios = Object.keys(storage.portfolios);
      storage.currentPortfolioId = remainingPortfolios.length > 0 ? remainingPortfolios[0] : undefined;
    }

    this.saveUserStorage(storage);
  }

  duplicatePortfolio(portfolioId: string, newName?: string): SavedPortfolio {
    const storage = this.loadUserStorage();
    const originalPortfolio = storage.portfolios[portfolioId];
    
    if (!originalPortfolio) {
      throw new Error('Portfolio not found');
    }

    return this.savePortfolio(
      newName || `${originalPortfolio.name} (Copy)`,
      originalPortfolio.portfolioData,
      originalPortfolio.rebalanceOptions,
      originalPortfolio.description,
      originalPortfolio.tags
    );
  }

  getPortfolios(): SavedPortfolio[] {
    const storage = this.loadUserStorage();
    return Object.values(storage.portfolios).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  getCurrentPortfolio(): SavedPortfolio | null {
    const storage = this.loadUserStorage();
    return storage.currentPortfolioId ? storage.portfolios[storage.currentPortfolioId] || null : null;
  }

  setCurrentPortfolio(portfolioId: string): void {
    const storage = this.loadUserStorage();
    if (!storage.portfolios[portfolioId]) {
      throw new Error('Portfolio not found');
    }
    storage.currentPortfolioId = portfolioId;
    this.saveUserStorage(storage);
  }

  // Auto-save functionality
  autoSavePortfolio(portfolioData: PortfolioData, rebalanceOptions: RebalanceOptions): void {
    const storage = this.loadUserStorage();
    if (!storage.preferences.autoSave) {
      return;
    }

    const currentPortfolio = this.getCurrentPortfolio();
    if (currentPortfolio) {
      this.updatePortfolio(
        currentPortfolio.id,
        portfolioData,
        rebalanceOptions
      );
    } else {
      // Create auto-save portfolio
      this.savePortfolio(
        'Auto-saved Portfolio',
        portfolioData,
        rebalanceOptions,
        'Automatically saved portfolio'
      );
    }
  }

  // Preferences management
  updatePreferences(preferences: Partial<UserPortfolioStorage['preferences']>): void {
    const storage = this.loadUserStorage();
    storage.preferences = {
      ...storage.preferences,
      ...preferences
    };
    this.saveUserStorage(storage);
  }

  getPreferences(): UserPortfolioStorage['preferences'] {
    const storage = this.loadUserStorage();
    return storage.preferences;
  }

  // Import/Export functionality
  exportData(): string {
    const storage = this.loadUserStorage();
    const currentUser = authService.getCurrentUser();
    return JSON.stringify({
      version: STORAGE_VERSION,
      exportDate: new Date().toISOString(),
      userId: currentUser?.id,
      userName: currentUser?.name,
      data: storage
    }, null, 2);
  }

  importData(jsonData: string): void {
    try {
      const imported = JSON.parse(jsonData);
      
      if (!imported.data) {
        throw new Error('Invalid import format');
      }

      // Validate and merge with existing data
      const currentStorage = this.loadUserStorage();
      const importedStorage = imported.data as UserPortfolioStorage;

      // Convert date strings back to Date objects
      Object.values(importedStorage.portfolios || {}).forEach((portfolio: any) => {
        portfolio.createdAt = new Date(portfolio.createdAt);
        portfolio.updatedAt = new Date(portfolio.updatedAt);
      });

      // Merge portfolios (existing ones take precedence)
      const mergedStorage: UserPortfolioStorage = {
        portfolios: { ...importedStorage.portfolios, ...currentStorage.portfolios },
        currentPortfolioId: currentStorage.currentPortfolioId || importedStorage.currentPortfolioId,
        preferences: { ...importedStorage.preferences, ...currentStorage.preferences }
      };

      this.saveUserStorage(mergedStorage);
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data. Please check the file format.');
    }
  }

  // Clear user's data
  clearUserData(): void {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      localStorage.removeItem(this.getStorageKey());
    }
  }

  // Get storage statistics
  getStorageStats(): {
    portfolioCount: number;
    storageSize: number;
    lastUpdated?: Date;
  } {
    const storage = this.loadUserStorage();
    const portfolios = Object.values(storage.portfolios);
    
    const lastUpdated = portfolios
      .map(portfolio => portfolio.updatedAt)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    return {
      portfolioCount: portfolios.length,
      storageSize: new Blob([JSON.stringify(storage)]).size,
      lastUpdated
    };
  }
}

export const userStorageService = UserStorageService.getInstance();