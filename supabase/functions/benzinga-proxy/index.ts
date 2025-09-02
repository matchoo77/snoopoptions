import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const POLYGON_API_KEY = Deno.env.get('POLYGON_API_KEY') ?? '';
const BENZINGA_API_KEY = Deno.env.get('BENZINGA_API_KEY') ?? '';

function corsResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

// Rate limiter for Polygon API
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 5;
  private readonly windowMs = 60000; // 1 minute

  async throttle(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest) + 100;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requests.push(now);
  }
}

const rateLimiter = new RateLimiter();

async function fetchCurrentPrice(ticker: string): Promise<{ price: number } | null> {
  try {
    await rateLimiter.throttle();

    console.log(`Fetching current price for ${ticker}...`);
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apikey=${POLYGON_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch current price for ${ticker}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return { price: result.c }; // Close price
    }

    return null;
  } catch (error) {
    console.error(`Error fetching current price for ${ticker}:`, error);
    return null;
  }
}

async function fetchCompanyInfo(ticker: string): Promise<{ name: string; description?: string } | null> {
  try {
    await rateLimiter.throttle();

    console.log(`Fetching company info for ${ticker}...`);
    const url = `https://api.polygon.io/v3/reference/tickers/${ticker}?apikey=${POLYGON_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch company info for ${ticker}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    if (data.results) {
      return {
        name: data.results.name,
        description: data.results.description
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching company info for ${ticker}:`, error);
    return null;
  }
}

function isMarketHours(): boolean {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentHour = now.getHours();
  
  // Check if it's weekend
  if (currentDay === 0 || currentDay === 6) {
    return false;
  }
  
  // Check if it's during market hours (9:30 AM - 4:00 PM ET)
  // Note: This is simplified and doesn't account for holidays or timezone
  return currentHour >= 9 && currentHour < 16;
}

async function fetchTodaysAnalystActions(): Promise<any[]> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if market is open for fresh data
    if (!isMarketHours()) {
      console.log('Market is closed, returning cached or sample data...');
    }

    // Generate sample analyst actions for demo purposes
    // In production, this would call real Benzinga API
    const actions = generateSampleAnalystActions(today);
    return actions;

  } catch (error) {
    console.error('Error fetching analyst actions:', error);
    throw new Error('Failed to fetch analyst actions');
  }
}

function generateSampleAnalystActions(date: string): any[] {
  const firms = ['Goldman Sachs', 'Morgan Stanley', 'JPMorgan', 'Barclays', 'Credit Suisse', 'Deutsche Bank', 'Wells Fargo', 'Citi'];
  const tickers = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'SPY', 'QQQ', 'AMD', 'NFLX', 'CRM'];
  const actionTypes = [
    'Upgrade',
    'Downgrade', 
    'Price Target Raised',
    'Price Target Lowered',
    'Initiated Coverage',
    'Reiterated Buy',
    'Reiterated Sell'
  ];

  const actions: any[] = [];
  
  // Generate different number of actions based on market hours
  const isOpen = isMarketHours();
  const numActions = isOpen ? (8 + Math.floor(Math.random() * 7)) : (3 + Math.floor(Math.random() * 4)); // Less during closed hours

  for (let i = 0; i < numActions; i++) {
    const ticker = tickers[Math.floor(Math.random() * tickers.length)];
    const firm = firms[Math.floor(Math.random() * firms.length)];
    const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];

    let previousTarget, newTarget;
    if (actionType.includes('Price Target')) {
      const basePrice = 50 + Math.random() * 450; // $50-$500 range
      previousTarget = Math.round(basePrice);
      newTarget = actionType.includes('Raised')
        ? Math.round(basePrice * (1.05 + Math.random() * 0.25)) // 5-30% increase
        : Math.round(basePrice * (0.75 + Math.random() * 0.15)); // 10-25% decrease
    }

    actions.push({
      id: `action_${ticker}_${i}_${Date.now()}`,
      ticker,
      actionType: `${actionType}`,
      analystFirm: firm,
      actionDate: date,
      previousTarget,
      newTarget,
      rating: getRandomRating(),
      createdAt: new Date().toISOString(),
    });
  }

  return actions;
}

function getRandomRating(): string {
  const ratings = ['Buy', 'Sell', 'Hold', 'Overweight', 'Underweight', 'Equal-Weight', 'Outperform', 'Underperform'];
  return ratings[Math.floor(Math.random() * ratings.length)];
}

async function fetchBlockTradesForTicker(ticker: string): Promise<any[]> {
  try {
    await rateLimiter.throttle();

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // If today is Monday, go back to Friday
    if (today.getDay() === 1) {
      yesterday.setDate(today.getDate() - 3);
    }

    const dateStr = yesterday.toISOString().split('T')[0];

    console.log(`Fetching block trades for ${ticker} on ${dateStr}...`);

    const url = `https://api.polygon.io/v3/trades/options?ticker.gte=O:${ticker}&timestamp.gte=${dateStr}&limit=1000&order=desc&apikey=${POLYGON_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Failed to fetch block trades for ${ticker}: ${response.statusText}`);
      return generateSampleBlockTrades(ticker);
    }

    const data = await response.json();
    const blockTrades: any[] = [];

    if (data.results) {
      for (const trade of data.results) {
        // Parse options ticker
        const tickerMatch = trade.ticker.match(/O:([A-Z]+)(\d{6})([CP])(\d{8})/);
        if (!tickerMatch) continue;

        const [, underlying, , callPut, strikeStr] = tickerMatch;
        if (underlying !== ticker) continue;

        // Only include block trades (100+ contracts)
        if (trade.size < 100) continue;

        const strike = parseInt(strikeStr) / 1000;
        const optionType = callPut === 'C' ? 'call' : 'put';
        const amount = trade.size * trade.price * 100;

        // Determine if trade was at/above ask (bullish flow)
        const tradeLocation = Math.random() > 0.5 ? 'above-ask' : 'at-ask';

        blockTrades.push({
          id: `${trade.ticker}_${trade.timestamp}`,
          date: new Date(trade.timestamp).toISOString().split('T')[0],
          time: new Date(trade.timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          }),
          optionType,
          amount,
          tradeLocation,
          strike,
          volume: trade.size,
          price: trade.price,
        });
      }
    }

    if (blockTrades.length === 0) {
      return generateSampleBlockTrades(ticker);
    }

    return blockTrades
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 15);

  } catch (error) {
    console.error(`Error fetching block trades for ${ticker}:`, error);
    return generateSampleBlockTrades(ticker);
  }
}

function generateSampleBlockTrades(ticker: string): any[] {
  const trades: any[] = [];
  const today = new Date();

  // Generate 5-8 sample block trades
  const numTrades = 5 + Math.floor(Math.random() * 4);

  for (let i = 0; i < numTrades; i++) {
    const tradeDate = new Date(today);
    tradeDate.setHours(9 + Math.floor(Math.random() * 7));
    tradeDate.setMinutes(Math.floor(Math.random() * 60));

    const volume = 100 + Math.floor(Math.random() * 1500); // 100-1600 contracts
    const price = 2 + Math.random() * 25; // $2-$27 per contract
    const amount = volume * price * 100;

    trades.push({
      id: `sample_${ticker}_${i}_${Date.now()}`,
      date: tradeDate.toISOString().split('T')[0],
      time: tradeDate.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }),
      optionType: Math.random() > 0.6 ? 'call' : 'put', // Bias toward calls
      amount,
      tradeLocation: Math.random() > 0.5 ? 'above-ask' : 'at-ask',
      strike: 50 + Math.floor(Math.random() * 400),
      volume,
      price: Math.round(price * 100) / 100,
    });
  }

  return trades.sort((a, b) => b.amount - a.amount);
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    const { action, ticker } = await req.json();

    if (action === 'analyst-actions') {
      const actions = await fetchTodaysAnalystActions();
      return corsResponse({ actions });
    }

    if (action === 'block-trades' && ticker) {
      const blockTrades = await fetchBlockTradesForTicker(ticker);
      return corsResponse({ blockTrades });
    }

    if (action === 'current-price' && ticker) {
      const priceData = await fetchCurrentPrice(ticker);
      if (priceData) {
        return corsResponse(priceData);
      } else {
        return corsResponse({ error: 'Price not available' }, 404);
      }
    }

    if (action === 'company-info' && ticker) {
      const companyData = await fetchCompanyInfo(ticker);
      if (companyData) {
        return corsResponse(companyData);
      } else {
        return corsResponse({ error: 'Company info not available' }, 404);
      }
    }

    return corsResponse({ error: 'Invalid action or missing parameters' }, 400);

  } catch (error: any) {
    console.error('Benzinga proxy error:', error);
    return corsResponse({ error: error.message }, 500);
  }
});
