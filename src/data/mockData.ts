import { OptionsActivity } from '../types/options';

const symbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'SPY', 'QQQ', 'IWM'];
const sentiments = ['bullish', 'bearish', 'neutral'] as const;

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomDate(): string {
  const now = new Date();
  const start = new Date(now.getTime() - 4 * 60 * 60 * 1000); // 4 hours ago
  const randomTime = new Date(start.getTime() + Math.random() * (now.getTime() - start.getTime()));
  return randomTime.toISOString();
}

function getTradeLocation(lastPrice: number, bid: number, ask: number): 'below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask' {
  const midpoint = (bid + ask) / 2;
  const bidThreshold = bid + (ask - bid) * 0.1; // 10% above bid
  const askThreshold = ask - (ask - bid) * 0.1; // 10% below ask
  
  if (lastPrice < bid) return 'below-bid';
  if (lastPrice <= bidThreshold) return 'at-bid';
  if (lastPrice >= askThreshold) return 'at-ask';
  if (lastPrice > ask) return 'above-ask';
  return 'midpoint';
}

function generateExpiration(): string {
  const dates = ['2024-02-16', '2024-02-23', '2024-03-01', '2024-03-15', '2024-04-19', '2024-06-21'];
  return getRandomElement(dates);
}

export function generateMockData(): OptionsActivity[] {
  const data: OptionsActivity[] = [];

  for (let i = 0; i < 50; i++) {
    const symbol = getRandomElement(symbols);
    const type = getRandomElement(['call', 'put']);
    const strike = Math.round((Math.random() * 200 + 50) / 5) * 5; // Round to nearest $5
    const volume = Math.floor(Math.random() * 5000) + 500;
    const lastPrice = Math.random() * 20 + 0.5;
    const bid = lastPrice - 0.05 - Math.random() * 0.1;
    const ask = lastPrice + 0.05 + Math.random() * 0.1;
    const premium = volume * lastPrice * 100; // Premium = Volume * Price * 100 (shares per contract)
    const blockTrade = volume >= 1000 && Math.random() > 0.7;
    const unusual = volume > 1000 || premium > 50000 || Math.random() > 0.6;

    const activity: OptionsActivity = {
      id: `${symbol}-${i}-${Date.now()}`,
      symbol,
      strike,
      expiration: generateExpiration(),
      type,
      volume,
      openInterest: Math.floor(Math.random() * 10000) + 100,
      lastPrice,
      bid,
      ask,
      tradeLocation: getTradeLocation(lastPrice, bid, ask),
      impliedVolatility: Math.random() * 0.8 + 0.2,
      delta: type === 'call' ? Math.random() * 0.8 + 0.1 : -(Math.random() * 0.8 + 0.1),
      gamma: Math.random() * 0.1,
      theta: -(Math.random() * 0.5),
      vega: Math.random() * 0.3,
      premium,
      timestamp: generateRandomDate(),
      unusual,
      blockTrade,
      sentiment: getRandomElement(sentiments),
    };

    data.push(activity);
  }

  return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}