import { Stock, StockInput, RebalanceResult } from '../types';

interface RebalanceOptions {
  allowFractionalShares?: boolean;
  minimumTradeAmount?: number;
  maxIterations?: number;
  tolerancePercentage?: number;
  optimizationStrategy?: 'greedy' | 'proportional' | 'hybrid';
}

interface OptimizedStock extends Stock {
  targetDollarAmount: number;
  dollarGap: number;
  efficiency: number; // Dollar gap per dollar invested
  priority: number;
}

class AdvancedPriorityQueue {
  private items: Array<{ stock: OptimizedStock; priority: number }> = [];

  enqueue(stock: OptimizedStock, priority: number): void {
    const item = { stock, priority };
    
    // Binary search insertion for better performance
    let left = 0;
    let right = this.items.length;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.items[mid].priority < priority) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }
    
    this.items.splice(left, 0, item);
  }

  dequeue(): OptimizedStock | null {
    const item = this.items.shift();
    return item ? item.stock : null;
  }

  peek(): OptimizedStock | null {
    return this.items.length > 0 ? this.items[0].stock : null;
  }

  size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  // Re-prioritize all items (useful for dynamic rebalancing)
  reprioritize(): void {
    this.items.sort((a, b) => b.priority - a.priority);
  }
}

export class AdvancedRebalanceService {
  private static readonly DEFAULT_OPTIONS: Required<RebalanceOptions> = {
    allowFractionalShares: false,
    minimumTradeAmount: 1,
    maxIterations: 100,
    tolerancePercentage: 0.1,
    optimizationStrategy: 'hybrid'
  };

  static calculateRebalance(
    stocks: StockInput[],
    stockPrices: Record<string, number>,
    buyingPower: number,
    totalCapital: number,
    options: RebalanceOptions = {}
  ): RebalanceResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Validate input
    this.validateInputs(stocks, buyingPower, totalCapital);

    // Initialize optimized stocks
    const optimizedStocks = this.initializeOptimizedStocks(
      stocks, 
      stockPrices, 
      totalCapital
    );

    // Choose optimization strategy
    switch (opts.optimizationStrategy) {
      case 'greedy':
        return this.greedyOptimization(optimizedStocks, buyingPower, totalCapital, opts);
      case 'proportional':
        return this.proportionalOptimization(optimizedStocks, buyingPower, totalCapital, opts);
      case 'hybrid':
      default:
        return this.hybridOptimization(optimizedStocks, buyingPower, totalCapital, opts);
    }
  }

  private static validateInputs(
    stocks: StockInput[],
    buyingPower: number,
    totalCapital: number
  ): void {
    const totalPercentage = stocks.reduce((sum, stock) => sum + stock.stockPercentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Stock percentages must sum to 100%');
    }

    if (buyingPower < 0 || totalCapital <= 0) {
      throw new Error('Invalid financial parameters');
    }
  }

  private static initializeOptimizedStocks(
    stocks: StockInput[],
    stockPrices: Record<string, number>,
    totalCapital: number
  ): OptimizedStock[] {
    return stocks
      .filter(stock => stock.stockName.trim() && stockPrices[stock.stockName] > 0)
      .map(stockInput => {
        const stockPrice = stockPrices[stockInput.stockName];
        const currentTotal = stockInput.shareNumbers * stockPrice;
        const currPercentage = (currentTotal / totalCapital) * 100;
        const targetPercentage = stockInput.stockPercentage;
        const targetDollarAmount = (targetPercentage / 100) * totalCapital;
        const dollarGap = targetDollarAmount - currentTotal;
        const diff = targetPercentage - currPercentage;

        return {
          stockName: stockInput.stockName,
          currentTotal,
          targetPercentage,
          stockPrice,
          currPercentage,
          diff,
          resultPercentage: currPercentage,
          numToBuy: 0,
          resultTotal: currentTotal,
          shareNumbers: stockInput.shareNumbers,
          targetDollarAmount,
          dollarGap,
          efficiency: dollarGap > 0 ? dollarGap / stockPrice : 0,
          priority: this.calculatePriority(diff, dollarGap, stockPrice, targetPercentage)
        };
      });
  }

  private static calculatePriority(
    percentageDiff: number,
    dollarGap: number,
    stockPrice: number,
    targetPercentage: number
  ): number {
    // Multi-factor priority calculation
    const percentageWeight = Math.abs(percentageDiff) * 10;
    const dollarWeight = Math.max(0, dollarGap) / 1000;
    const affordabilityWeight = dollarGap > 0 ? Math.min(10, dollarGap / stockPrice) : 0;
    const importanceWeight = targetPercentage / 10;
    
    return percentageWeight + dollarWeight + affordabilityWeight + importanceWeight;
  }

  // Greedy Strategy: Always buy the most underweight stock first
  private static greedyOptimization(
    stocks: OptimizedStock[],
    buyingPower: number,
    totalCapital: number,
    options: Required<RebalanceOptions>
  ): RebalanceResult {
    const results: Stock[] = [];
    let remainingBP = buyingPower;
    const queue = new AdvancedPriorityQueue();

    // Add underweight stocks to queue
    stocks
      .filter(stock => stock.dollarGap > 0)
      .forEach(stock => queue.enqueue(stock, stock.priority));

    let iterations = 0;
    while (!queue.isEmpty() && remainingBP > options.minimumTradeAmount && iterations < options.maxIterations) {
      const stock = queue.dequeue();
      if (!stock) break;

      const sharesToBuy = this.calculateOptimalShares(
        stock,
        remainingBP,
        options.allowFractionalShares
      );

      if (sharesToBuy > 0) {
        const purchaseCost = sharesToBuy * stock.stockPrice;
        stock.numToBuy += sharesToBuy;
        stock.resultTotal += purchaseCost;
        stock.resultPercentage = (stock.resultTotal / totalCapital) * 100;
        remainingBP -= purchaseCost;

        // Recalculate and re-queue if still underweight
        stock.dollarGap = stock.targetDollarAmount - stock.resultTotal;
        if (stock.dollarGap > stock.stockPrice && remainingBP > stock.stockPrice) {
          stock.priority = this.calculatePriority(
            stock.targetPercentage - stock.resultPercentage,
            stock.dollarGap,
            stock.stockPrice,
            stock.targetPercentage
          );
          queue.enqueue(stock, stock.priority);
        }
      }

      if (!results.find(r => r.stockName === stock.stockName)) {
        results.push(stock);
      }
      iterations++;
    }

    // Add remaining stocks that weren't processed
    stocks.forEach(stock => {
      if (!results.find(r => r.stockName === stock.stockName)) {
        results.push(stock);
      }
    });

    return { stocks: results, remainingBuyingPower: remainingBP };
  }

  // Proportional Strategy: Distribute buying power proportionally to gaps with aggressive utilization
  private static proportionalOptimization(
    stocks: OptimizedStock[],
    buyingPower: number,
    totalCapital: number,
    options: Required<RebalanceOptions>
  ): RebalanceResult {
    const results: Stock[] = [];
    let remainingBP = buyingPower;

    const underweightStocks = stocks.filter(stock => stock.dollarGap > 0);
    const totalGap = underweightStocks.reduce((sum, stock) => sum + stock.dollarGap, 0);

    if (totalGap > 0) {
      // First pass: proportional allocation
      for (const stock of underweightStocks) {
        const proportionalAmount = (stock.dollarGap / totalGap) * buyingPower;
        const maxAffordableAmount = Math.min(proportionalAmount, remainingBP);
        
        const sharesToBuy = this.calculateOptimalShares(
          { ...stock, dollarGap: maxAffordableAmount },
          maxAffordableAmount,
          options.allowFractionalShares
        );

        if (sharesToBuy > 0) {
          const purchaseCost = sharesToBuy * stock.stockPrice;
          stock.numToBuy = sharesToBuy;
          stock.resultTotal = stock.currentTotal + purchaseCost;
          stock.resultPercentage = (stock.resultTotal / totalCapital) * 100;
          remainingBP -= purchaseCost;
        }

        results.push(stock);
      }

      // Second pass: use any remaining buying power on the most underweight affordable stocks
      while (remainingBP > options.minimumTradeAmount) {
        const affordableStocks = results
          .filter(stock =>
            stock.resultPercentage < stock.targetPercentage &&
            remainingBP >= stock.stockPrice
          )
          .sort((a, b) => (a.targetPercentage - a.resultPercentage) - (b.targetPercentage - b.resultPercentage));

        if (affordableStocks.length === 0) break;

        const stock = affordableStocks[0];
        const additionalShares = Math.floor(remainingBP / stock.stockPrice);
        
        if (additionalShares > 0) {
          const purchaseCost = additionalShares * stock.stockPrice;
          stock.numToBuy += additionalShares;
          stock.resultTotal += purchaseCost;
          stock.resultPercentage = (stock.resultTotal / totalCapital) * 100;
          remainingBP -= purchaseCost;
        } else {
          break;
        }
      }
    }

    // Add stocks that don't need rebalancing
    stocks
      .filter(stock => stock.dollarGap <= 0)
      .forEach(stock => results.push(stock));

    return { stocks: results, remainingBuyingPower: remainingBP };
  }

  // Hybrid Strategy: Combines greedy and proportional approaches with aggressive cash utilization
  private static hybridOptimization(
    stocks: OptimizedStock[],
    buyingPower: number,
    totalCapital: number,
    options: Required<RebalanceOptions>
  ): RebalanceResult {
    // Phase 1: Proportional allocation for major gaps
    const majorGapThreshold = totalCapital * 0.02; // 2% of total capital
    const majorGapStocks = stocks.filter(stock => stock.dollarGap > majorGapThreshold);
    
    let remainingBP = buyingPower;
    const results: Stock[] = [];

    if (majorGapStocks.length > 0) {
      const proportionalResult = this.proportionalOptimization(
        majorGapStocks,
        remainingBP * 0.7, // Use 70% of buying power for proportional
        totalCapital,
        options
      );
      
      remainingBP = proportionalResult.remainingBuyingPower + (remainingBP * 0.3);
      results.push(...proportionalResult.stocks);
    }

    // Phase 2: Greedy approach for remaining buying power
    const remainingStocks = stocks.filter(stock =>
      !results.find(r => r.stockName === stock.stockName) && stock.dollarGap > 0
    );

    if (remainingStocks.length > 0 && remainingBP > options.minimumTradeAmount) {
      const greedyResult = this.greedyOptimization(
        remainingStocks,
        remainingBP,
        totalCapital,
        options
      );
      
      // Merge results
      greedyResult.stocks.forEach(greedyStock => {
        const existingStock = results.find(r => r.stockName === greedyStock.stockName);
        if (existingStock) {
          existingStock.numToBuy += greedyStock.numToBuy;
          existingStock.resultTotal += greedyStock.numToBuy * greedyStock.stockPrice;
          existingStock.resultPercentage = (existingStock.resultTotal / totalCapital) * 100;
        } else {
          results.push(greedyStock);
        }
      });
      
      remainingBP = greedyResult.remainingBuyingPower;
    }

    // Phase 3: Aggressive cash utilization - use remaining buying power on any underweight stock
    if (remainingBP > options.minimumTradeAmount) {
      remainingBP = this.aggressiveCashUtilization(results, remainingBP, totalCapital, options);
    }

    // Add any remaining stocks
    stocks.forEach(stock => {
      if (!results.find(r => r.stockName === stock.stockName)) {
        results.push(stock);
      }
    });

    return { stocks: results, remainingBuyingPower: remainingBP };
  }

  // Phase 3: Aggressive cash utilization - use all remaining buying power
  private static aggressiveCashUtilization(
    results: Stock[],
    remainingBP: number,
    totalCapital: number,
    options: Required<RebalanceOptions>
  ): number {
    let currentBP = remainingBP;
    const maxRounds = 10; // Prevent infinite loops
    let round = 0;

    while (currentBP > options.minimumTradeAmount && round < maxRounds) {
      let purchaseMade = false;
      
      // Sort stocks by priority: underweight stocks first, then by affordability
      const sortedStocks = results
        .filter(stock => {
          const targetDollarAmount = (stock.targetPercentage / 100) * totalCapital;
          const dollarGap = targetDollarAmount - stock.resultTotal;
          return dollarGap > 0 || stock.resultPercentage < stock.targetPercentage;
        })
        .sort((a, b) => {
          // Prioritize stocks that are still underweight
          const aUnderweight = a.resultPercentage < a.targetPercentage;
          const bUnderweight = b.resultPercentage < b.targetPercentage;
          
          if (aUnderweight && !bUnderweight) return -1;
          if (!aUnderweight && bUnderweight) return 1;
          
          // If both are underweight or both are not, sort by affordability
          return a.stockPrice - b.stockPrice;
        });

      // Try to buy at least one share of the most affordable underweight stock
      for (const stock of sortedStocks) {
        if (currentBP >= stock.stockPrice) {
          const sharesToBuy = Math.floor(currentBP / stock.stockPrice);
          if (sharesToBuy > 0) {
            const purchaseCost = sharesToBuy * stock.stockPrice;
            stock.numToBuy += sharesToBuy;
            stock.resultTotal += purchaseCost;
            stock.resultPercentage = (stock.resultTotal / totalCapital) * 100;
            
            currentBP -= purchaseCost;
            purchaseMade = true;
            break; // Buy from one stock at a time for better distribution
          }
        }
      }

      // If no purchase was made, try to buy fractional shares if allowed
      if (!purchaseMade && options.allowFractionalShares) {
        const cheapestAffordableStock = sortedStocks.find(stock => currentBP >= stock.stockPrice * 0.01);
        if (cheapestAffordableStock) {
          const fractionalShares = currentBP / cheapestAffordableStock.stockPrice;
          cheapestAffordableStock.numToBuy += fractionalShares;
          cheapestAffordableStock.resultTotal += currentBP;
          cheapestAffordableStock.resultPercentage = (cheapestAffordableStock.resultTotal / totalCapital) * 100;
          currentBP = 0; // All money used
          purchaseMade = true;
        }
      }

      // If still no purchase was made, break to avoid infinite loop
      if (!purchaseMade) {
        break;
      }
      
      round++;
    }

    return currentBP;
  }

  private static calculateOptimalShares(
    stock: OptimizedStock,
    availableFunds: number,
    allowFractional: boolean
  ): number {
    const maxSharesByFunds = availableFunds / stock.stockPrice;
    const maxSharesByGap = stock.dollarGap / stock.stockPrice;
    const maxShares = Math.min(maxSharesByFunds, maxSharesByGap);

    if (allowFractional) {
      return Math.max(0, maxShares);
    } else {
      return Math.max(0, Math.floor(maxShares));
    }
  }

  // Enhanced validation with more sophisticated checks
  static validatePortfolioInputs(
    currentStockValue: number,
    buyingPower: number,
    stocks: StockInput[]
  ): string[] {
    const errors: string[] = [];

    if (currentStockValue < 0) {
      errors.push('Current stock value cannot be negative');
    }

    if (buyingPower < 0) {
      errors.push('Buying power cannot be negative');
    }

    if (stocks.length === 0) {
      errors.push('At least one stock must be added');
    }

    const totalPercentage = stocks.reduce((sum, stock) => sum + stock.stockPercentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      errors.push(`Stock percentages must sum to 100% (currently ${totalPercentage.toFixed(2)}%)`);
    }

    // Check for duplicate stocks
    const stockNames = stocks.map(s => s.stockName.trim().toUpperCase()).filter(name => name);
    const duplicates = stockNames.filter((name, index) => stockNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate stocks found: ${Array.from(new Set(duplicates)).join(', ')}`);
    }

    stocks.forEach((stock, index) => {
      if (!stock.stockName.trim()) {
        errors.push(`Stock ${index + 1}: Stock name is required`);
      }
      if (stock.shareNumbers < 0) {
        errors.push(`Stock ${index + 1}: Share numbers cannot be negative`);
      }
      if (stock.stockPercentage < 0 || stock.stockPercentage > 100) {
        errors.push(`Stock ${index + 1}: Percentage must be between 0 and 100`);
      }
      if (stock.stockPercentage > 0 && stock.stockPercentage < 0.01) {
        errors.push(`Stock ${index + 1}: Percentage too small (minimum 0.01%)`);
      }
    });

    return errors;
  }

  // Utility method to analyze portfolio efficiency
  static analyzePortfolioEfficiency(result: RebalanceResult): {
    totalDeviation: number;
    maxDeviation: number;
    utilizationRate: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let totalDeviation = 0;
    let maxDeviation = 0;

    result.stocks.forEach(stock => {
      const deviation = Math.abs(stock.targetPercentage - stock.resultPercentage);
      totalDeviation += deviation;
      maxDeviation = Math.max(maxDeviation, deviation);

      if (deviation > 1) {
        recommendations.push(
          `${stock.stockName}: ${deviation.toFixed(2)}% deviation from target`
        );
      }
    });

    const utilizationRate = result.remainingBuyingPower > 0 
      ? ((result.stocks.reduce((sum, s) => sum + (s.numToBuy * s.stockPrice), 0)) / 
         (result.stocks.reduce((sum, s) => sum + (s.numToBuy * s.stockPrice), 0) + result.remainingBuyingPower)) * 100
      : 100;

    if (utilizationRate < 95) {
      recommendations.push(`Low buying power utilization: ${utilizationRate.toFixed(1)}%`);
    }

    return {
      totalDeviation,
      maxDeviation,
      utilizationRate,
      recommendations
    };
  }
}