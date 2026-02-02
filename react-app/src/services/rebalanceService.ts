import { Stock, StockInput, RebalanceResult } from '../types';

class PriorityQueue {
  private items: Array<{ stock: Stock; priority: number }> = [];

  enqueue(stock: Stock, priority: number): void {
    const item = { stock, priority };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (item.priority > this.items[i].priority) {
        this.items.splice(i, 0, item);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(item);
    }
  }

  dequeue(): Stock | null {
    if (this.items.length === 0) return null;
    const item = this.items.shift();
    return item ? item.stock : null;
  }

  size(): number {
    return this.items.length;
  }
}

export class RebalanceService {
  static calculateRebalance(
    stocks: StockInput[],
    stockPrices: Record<string, number>,
    buyingPower: number,
    totalCapital: number
  ): RebalanceResult {
    // Validate input
    const totalPercentage = stocks.reduce((sum, stock) => sum + stock.stockPercentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Stock percentages must sum to 100%');
    }

    const results: Stock[] = [];
    let remainingBuyingPower = buyingPower;
    const maxHeap = new PriorityQueue();

    // Process each stock and calculate current state
    for (const stockInput of stocks) {
      if (!stockInput.stockName.trim()) continue;

      const stockPrice = stockPrices[stockInput.stockName] || 0;
      if (stockPrice === 0) {
        console.warn(`No price found for ${stockInput.stockName}`);
        continue;
      }

      const currentTotal = stockInput.shareNumbers * stockPrice;
      const currPercentage = (currentTotal / totalCapital) * 100;
      const targetPercentage = stockInput.stockPercentage;
      const diff = targetPercentage - currPercentage;

      const stock: Stock = {
        stockName: stockInput.stockName,
        currentTotal,
        targetPercentage,
        stockPrice,
        currPercentage,
        diff,
        resultPercentage: currPercentage,
        numToBuy: 0,
        resultTotal: currentTotal,
        shareNumbers: stockInput.shareNumbers
      };

      // Add to priority queue (max heap based on difference)
      maxHeap.enqueue(stock, diff);
    }

    // Process rebalancing using priority queue
    remainingBuyingPower = this.processRebalancing(
      maxHeap,
      totalCapital,
      remainingBuyingPower,
      results
    );

    return {
      stocks: results,
      remainingBuyingPower
    };
  }

  private static processRebalancing(
    maxHeap: PriorityQueue,
    totalCapital: number,
    buyingPower: number,
    results: Stock[]
  ): number {
    let remainingBP = buyingPower;

    while (maxHeap.size() > 0) {
      const stock = maxHeap.dequeue();
      if (!stock) break;

      // Calculate how many shares to buy
      const increPercentage = (stock.targetPercentage - stock.currPercentage) / 100;
      let numToBuy = Math.round((increPercentage * totalCapital) / stock.stockPrice);

      // Ensure we don't exceed buying power
      while (remainingBP < numToBuy * stock.stockPrice && numToBuy > 0) {
        numToBuy -= 1;
      }

      // Calculate results
      const purchaseCost = numToBuy * stock.stockPrice;
      const resultTotal = stock.currentTotal + purchaseCost;
      const resultPercentage = (resultTotal / totalCapital) * 100;

      // Update buying power
      if (numToBuy > 0) {
        remainingBP -= purchaseCost;
      }

      // Update stock with results
      stock.numToBuy = numToBuy;
      stock.resultPercentage = resultPercentage;
      stock.resultTotal = resultTotal;

      results.push(stock);
    }

    return remainingBP;
  }

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
      errors.push('Stock percentages must sum to 100%');
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
    });

    return errors;
  }
}