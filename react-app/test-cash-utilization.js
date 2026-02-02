// Standalone test to demonstrate improved cash utilization
// This simulates the improved hybrid rebalancing logic

// Simulate the improved hybrid optimization logic
function simulateImprovedHybridRebalancing() {
  // Test scenario: Portfolio with buying power that should be fully utilized
  const testData = {
    stocks: [
      { name: 'AAPL', currentShares: 10, targetPercent: 40, price: 150 },
      { name: 'GOOGL', currentShares: 5, targetPercent: 30, price: 2500 },
      { name: 'MSFT', currentShares: 8, targetPercent: 30, price: 300 }
    ],
    buyingPower: 5000
  };

  // Calculate current portfolio value
  const currentValue = testData.stocks.reduce((total, stock) => {
    return total + (stock.currentShares * stock.price);
  }, 0);

  const totalCapital = currentValue + testData.buyingPower;

  console.log('=== IMPROVED HYBRID REBALANCING TEST ===');
  console.log(`Current Portfolio Value: $${currentValue.toLocaleString()}`);
  console.log(`Buying Power: $${testData.buyingPower.toLocaleString()}`);
  console.log(`Total Capital: $${totalCapital.toLocaleString()}`);
  console.log('');

  // Calculate target dollar amounts and gaps
  const stocksWithGaps = testData.stocks.map(stock => {
    const currentTotal = stock.currentShares * stock.price;
    const currentPercent = (currentTotal / totalCapital) * 100;
    const targetDollarAmount = (stock.targetPercent / 100) * totalCapital;
    const dollarGap = targetDollarAmount - currentTotal;
    
    return {
      ...stock,
      currentTotal,
      currentPercent,
      targetDollarAmount,
      dollarGap,
      sharesToBuy: 0,
      resultTotal: currentTotal
    };
  });

  console.log('=== BEFORE REBALANCING ===');
  stocksWithGaps.forEach(stock => {
    console.log(`${stock.name}: ${stock.currentPercent.toFixed(2)}% (target: ${stock.targetPercent}%) - Gap: $${stock.dollarGap.toFixed(2)}`);
  });
  console.log('');

  // Simulate the improved hybrid approach
  let remainingBP = testData.buyingPower;

  // Phase 1: Proportional allocation (70% of buying power)
  const phase1Budget = remainingBP * 0.7;
  const totalGap = stocksWithGaps.reduce((sum, stock) => sum + Math.max(0, stock.dollarGap), 0);
  
  console.log('=== PHASE 1: PROPORTIONAL ALLOCATION ===');
  if (totalGap > 0) {
    stocksWithGaps.forEach(stock => {
      if (stock.dollarGap > 0) {
        const proportionalAmount = (stock.dollarGap / totalGap) * phase1Budget;
        const sharesToBuy = Math.floor(proportionalAmount / stock.price);
        const purchaseCost = sharesToBuy * stock.price;
        
        stock.sharesToBuy += sharesToBuy;
        stock.resultTotal += purchaseCost;
        remainingBP -= purchaseCost;
        
        console.log(`${stock.name}: Bought ${sharesToBuy} shares for $${purchaseCost.toFixed(2)}`);
      }
    });
  }
  
  console.log(`Remaining after Phase 1: $${remainingBP.toFixed(2)}`);
  console.log('');

  // Phase 2: Greedy approach for remaining 30% + leftover
  console.log('=== PHASE 2: GREEDY ALLOCATION ===');
  let phase2Purchases = 0;
  while (remainingBP > 1) {
    // Find most underweight affordable stock
    const affordableStocks = stocksWithGaps
      .filter(stock => {
        const currentPercent = (stock.resultTotal / totalCapital) * 100;
        return currentPercent < stock.targetPercent && remainingBP >= stock.price;
      })
      .sort((a, b) => {
        const aPercent = (a.resultTotal / totalCapital) * 100;
        const bPercent = (b.resultTotal / totalCapital) * 100;
        return (a.targetPercent - aPercent) - (b.targetPercent - bPercent);
      });

    if (affordableStocks.length === 0) break;

    const stock = affordableStocks[0];
    const sharesToBuy = Math.floor(remainingBP / stock.price);
    
    if (sharesToBuy > 0) {
      const purchaseCost = sharesToBuy * stock.price;
      stock.sharesToBuy += sharesToBuy;
      stock.resultTotal += purchaseCost;
      remainingBP -= purchaseCost;
      phase2Purchases += purchaseCost;
      
      console.log(`${stock.name}: Bought ${sharesToBuy} more shares for $${purchaseCost.toFixed(2)}`);
    } else {
      break;
    }
  }
  
  console.log(`Phase 2 total purchases: $${phase2Purchases.toFixed(2)}`);
  console.log(`Remaining after Phase 2: $${remainingBP.toFixed(2)}`);
  console.log('');

  // Phase 3: Aggressive cash utilization (NEW!)
  console.log('=== PHASE 3: AGGRESSIVE CASH UTILIZATION ===');
  let phase3Purchases = 0;
  let rounds = 0;
  const maxRounds = 10;

  while (remainingBP > 1 && rounds < maxRounds) {
    let purchaseMade = false;
    
    // Sort by affordability and underweight status
    const sortedStocks = stocksWithGaps
      .filter(stock => {
        const currentPercent = (stock.resultTotal / totalCapital) * 100;
        return currentPercent < stock.targetPercent || stock.dollarGap > 0;
      })
      .sort((a, b) => a.price - b.price); // Cheapest first

    for (const stock of sortedStocks) {
      if (remainingBP >= stock.price) {
        const sharesToBuy = Math.floor(remainingBP / stock.price);
        if (sharesToBuy > 0) {
          const purchaseCost = sharesToBuy * stock.price;
          stock.sharesToBuy += sharesToBuy;
          stock.resultTotal += purchaseCost;
          remainingBP -= purchaseCost;
          phase3Purchases += purchaseCost;
          purchaseMade = true;
          
          console.log(`${stock.name}: Bought ${sharesToBuy} more shares for $${purchaseCost.toFixed(2)}`);
          break;
        }
      }
    }
    
    if (!purchaseMade) break;
    rounds++;
  }
  
  console.log(`Phase 3 total purchases: $${phase3Purchases.toFixed(2)}`);
  console.log(`Final remaining: $${remainingBP.toFixed(2)}`);
  console.log('');

  // Final results
  console.log('=== FINAL RESULTS ===');
  const totalUsed = testData.buyingPower - remainingBP;
  const utilizationRate = (totalUsed / testData.buyingPower) * 100;
  
  console.log(`Total buying power used: $${totalUsed.toFixed(2)} (${utilizationRate.toFixed(2)}%)`);
  console.log(`Remaining buying power: $${remainingBP.toFixed(2)}`);
  console.log('');

  stocksWithGaps.forEach(stock => {
    const finalPercent = (stock.resultTotal / totalCapital) * 100;
    const deviation = Math.abs(stock.targetPercent - finalPercent);
    console.log(`${stock.name}:`);
    console.log(`  Total shares to buy: ${stock.sharesToBuy}`);
    console.log(`  Total purchase cost: $${(stock.sharesToBuy * stock.price).toFixed(2)}`);
    console.log(`  Final allocation: ${finalPercent.toFixed(2)}% (target: ${stock.targetPercent}%)`);
    console.log(`  Deviation: ${deviation.toFixed(2)}%`);
    console.log('');
  });

  return {
    utilizationRate,
    remainingBuyingPower: remainingBP,
    totalPurchases: totalUsed
  };
}

// Run the test
const results = simulateImprovedHybridRebalancing();

console.log('=== SUMMARY ===');
console.log(`✅ Cash Utilization: ${results.utilizationRate.toFixed(2)}%`);
console.log(`✅ Remaining Cash: $${results.remainingBuyingPower.toFixed(2)}`);
console.log(`✅ Total Invested: $${results.totalPurchases.toFixed(2)}`);

if (results.utilizationRate > 95) {
  console.log('🎉 SUCCESS: Hybrid rebalancing now uses almost all available buying power!');
} else {
  console.log('⚠️  Still room for improvement in cash utilization');
}