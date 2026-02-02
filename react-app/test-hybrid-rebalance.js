// Test script to verify improved hybrid rebalancing cash utilization
const { AdvancedRebalanceService } = require('./src/services/advancedRebalanceService.ts');

// Test data - simulate a portfolio with buying power that should be fully utilized
const testStocks = [
  { stockName: 'AAPL', shareNumbers: 10, stockPercentage: 40, currentTotal: 0 },
  { stockName: 'GOOGL', shareNumbers: 5, stockPercentage: 30, currentTotal: 0 },
  { stockName: 'MSFT', shareNumbers: 8, stockPercentage: 30, currentTotal: 0 }
];

const stockPrices = {
  'AAPL': 150,   // $150 per share
  'GOOGL': 2500, // $2500 per share  
  'MSFT': 300    // $300 per share
};

const buyingPower = 5000; // $5000 to invest

// Calculate current portfolio value
const currentValue = testStocks.reduce((total, stock) => {
  return total + (stock.shareNumbers * stockPrices[stock.stockName]);
}, 0);

const totalCapital = currentValue + buyingPower;

console.log('=== Hybrid Rebalancing Test ===');
console.log(`Current Portfolio Value: $${currentValue.toLocaleString()}`);
console.log(`Buying Power: $${buyingPower.toLocaleString()}`);
console.log(`Total Capital: $${totalCapital.toLocaleString()}`);
console.log('');

// Test with hybrid strategy
const hybridOptions = {
  optimizationStrategy: 'hybrid',
  allowFractionalShares: false,
  minimumTradeAmount: 1,
  maxIterations: 100,
  tolerancePercentage: 0.1
};

try {
  const result = AdvancedRebalanceService.calculateRebalance(
    testStocks,
    stockPrices,
    buyingPower,
    totalCapital,
    hybridOptions
  );

  console.log('=== HYBRID STRATEGY RESULTS ===');
  console.log(`Remaining Buying Power: $${result.remainingBuyingPower.toFixed(2)}`);
  console.log(`Cash Utilization: ${(((buyingPower - result.remainingBuyingPower) / buyingPower) * 100).toFixed(2)}%`);
  console.log('');

  result.stocks.forEach(stock => {
    const purchaseCost = stock.numToBuy * stock.stockPrice;
    console.log(`${stock.stockName}:`);
    console.log(`  Shares to buy: ${stock.numToBuy}`);
    console.log(`  Purchase cost: $${purchaseCost.toFixed(2)}`);
    console.log(`  Target %: ${stock.targetPercentage}%`);
    console.log(`  Result %: ${stock.resultPercentage.toFixed(2)}%`);
    console.log('');
  });

  // Test efficiency analysis
  const analysis = AdvancedRebalanceService.analyzePortfolioEfficiency(result);
  console.log('=== EFFICIENCY ANALYSIS ===');
  console.log(`Utilization Rate: ${analysis.utilizationRate.toFixed(2)}%`);
  console.log(`Total Deviation: ${analysis.totalDeviation.toFixed(2)}%`);
  console.log(`Max Deviation: ${analysis.maxDeviation.toFixed(2)}%`);
  
  if (analysis.recommendations.length > 0) {
    console.log('Recommendations:');
    analysis.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }

} catch (error) {
  console.error('Test failed:', error.message);
}