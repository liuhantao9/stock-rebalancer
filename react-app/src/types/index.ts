export interface Stock {
  stockName: string;
  targetPercentage: number;
  stockPrice: number;
  currentTotal: number;
  diff: number;
  currPercentage: number;
  numToBuy: number;
  resultPercentage: number;
  resultTotal: number;
  shareNumbers?: number;
}

export interface StockInput {
  stockName: string;
  shareNumbers: number;
  currentTotal: number;
  stockPercentage: number;
}

export interface PortfolioData {
  totalCapital: number;
  currentStockValue: number;
  buyingPower: number;
  stocks: StockInput[];
}

export interface RebalanceResult {
  stocks: Stock[];
  remainingBuyingPower: number;
}

export interface ApiStockPrice {
  symbol: string;
  price: number;
  error?: string;
}

export interface PriorityQueueItem {
  stock: Stock;
  priority: number;
}

export interface RebalanceOptions {
  allowFractionalShares?: boolean;
  minimumTradeAmount?: number;
  maxIterations?: number;
  tolerancePercentage?: number;
  optimizationStrategy?: 'greedy' | 'proportional' | 'hybrid';
}

export interface PortfolioAnalysis {
  totalDeviation: number;
  maxDeviation: number;
  utilizationRate: number;
  recommendations: string[];
}

export interface EnhancedRebalanceResult extends RebalanceResult {
  analysis?: PortfolioAnalysis;
  options?: RebalanceOptions;
}

export interface SavedPortfolio {
  id: string;
  name: string;
  description?: string;
  portfolioData: PortfolioData;
  rebalanceOptions: RebalanceOptions;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface UserPortfolioStorage {
  portfolios: Record<string, SavedPortfolio>;
  currentPortfolioId?: string;
  preferences: {
    autoSave: boolean;
    defaultRebalanceOptions: RebalanceOptions;
  };
}

// Authentication interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

export interface AuthStorage {
  users: Record<string, {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    createdAt: Date;
    lastLoginAt: Date;
  }>;
  currentUserId?: string;
  sessions: Record<string, {
    userId: string;
    createdAt: Date;
    expiresAt: Date;
  }>;
}