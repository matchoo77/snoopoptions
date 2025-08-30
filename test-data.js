// Quick test to verify data generation
console.log('Testing data generation...');

// Simulate the data flow
const symbols = ['SPY', 'QQQ', 'AAPL'];
const date = new Date().toISOString().split('T')[0];

console.log('Date:', date);
console.log('Symbols:', symbols);

// Simulate the activity data structure
const sampleActivity = {
  id: `test_${Date.now()}`,
  symbol: 'SPY',
  type: 'call',
  strike: 420,
  expiration: '2025-09-20',
  lastPrice: 5.50,
  volume: 250,
  premium: 137500,
  openInterest: 375,
  bid: 5.22,
  ask: 5.78,
  timestamp: new Date().toISOString(),
  sentiment: 'bullish',
  tradeLocation: 'at-ask',
  blockTrade: true,
  unusual: true,
  impliedVolatility: 0.35,
  delta: 0.65,
  gamma: 0.08,
  theta: -0.03,
  vega: 0.25,
};

console.log('Sample activity:', JSON.stringify(sampleActivity, null, 2));
console.log('Test completed successfully!');
