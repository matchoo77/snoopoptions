import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
// Fallback for editors/lint that don't pick up the Edge runtime types
// deno-lint-ignore no-explicit-any
declare const Deno: any;

function corsResponse(body: any, status = 200) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  } as Record<string, string>;

  // Per Fetch spec, certain statuses must not include a body
  if (status === 204 || status === 205 || status === 304) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body ?? {}), { status, headers });
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

function getPolygonApiKey(): string {
  return Deno.env.get('POLYGON_API_KEY') ?? '';
}

async function fetchCurrentPrice(ticker: string): Promise<{ price: number } | null> {
  try {
    await rateLimiter.throttle();

    console.log(`Fetching current price for ${ticker}...`);
    const apiKey = getPolygonApiKey();
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apikey=${apiKey}`;

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
    const apiKey = getPolygonApiKey();
    const url = `https://api.polygon.io/v3/reference/tickers/${ticker}?apikey=${apiKey}`;

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
    const apiKey = getPolygonApiKey();

    // Helper to get ratings for a specific date, trying both known paths
    const fetchForDate = async (dateStr: string): Promise<any[]> => {
      await rateLimiter.throttle();
      console.log(`Fetching Benzinga ratings for ${dateStr}...`);
      const base = 'https://api.polygon.io';
      const paths = [
        `/v1/benzinga/ratings?date=${dateStr}&apikey=${apiKey}`,
        `/benzinga/v1/ratings?date=${dateStr}&apikey=${apiKey}`,
      ];

      for (const p of paths) {
        const url = `${base}${p}`;
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`Ratings fetch failed for path ${p}: ${res.status} ${res.statusText}`);
          continue;
        }
        const data = await res.json();
        const results = Array.isArray(data?.results) ? data.results : [];
        if (results.length > 0) {
          const actions = results.map((rating: any, index: number) => ({
            id: `benzinga_${rating.ticker}_${index}_${Date.now()}`,
            ticker: rating.ticker || 'UNKNOWN',
            actionType: rating.action_type || formatActionType(rating),
            analystFirm: rating.firm || 'Unknown Firm',
            actionDate: rating.date || dateStr,
            previousTarget: extractPreviousTarget(rating),
            newTarget: extractNewTarget(rating),
            rating: rating.rating_change || rating.action_type || 'Unknown',
            previousRating: extractPreviousRating(rating),
            newRating: extractNewRating(rating),
            createdAt: new Date().toISOString(),
          }));
          console.log(`Fetched ${actions.length} ratings from ${p}`);
          return actions;
        }
      }
      console.log(`No Benzinga ratings found for ${dateStr}`);
      return [];
    };

    // Try today and then fallback to previous days (up to 4 days back)
    const baseDate = new Date();
    const toISODate = (d: Date) => d.toISOString().split('T')[0];
    for (let i = 0; i < 5; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const dateStr = toISODate(d);
      const actions = await fetchForDate(dateStr);
      if (actions.length > 0) return actions;
    }
    return [];

  } catch (error) {
    console.error('Error fetching Benzinga data:', error);
    return [];
  }
}

function formatActionType(rating: any): string {
  const actionType = rating.action_type?.toLowerCase() || '';
  const firm = rating.firm || 'Unknown Firm';

  if (actionType.includes('upgrade')) {
    return `Upgrade by ${firm}`;
  } else if (actionType.includes('downgrade')) {
    return `Downgrade by ${firm}`;
  } else if (actionType.includes('initiated') || actionType.includes('coverage')) {
    return `Coverage Initiated by ${firm}`;
  } else if (rating.price_target_change) {
    return `Price Target ${rating.price_target_change} by ${firm}`;
  } else if (rating.rating_change) {
    return `Rating ${rating.rating_change} by ${firm}`;
  } else {
    return `${rating.action_type || 'Unknown Action'} by ${firm}`;
  }
}

function extractPreviousTarget(rating: any): number | undefined {
  // Try to extract previous target from price_target_change field
  if (rating.price_target_change) {
    const match = rating.price_target_change.match(/from\s*\$?(\d+(?:\.\d+)?)/i);
    return match ? parseFloat(match[1]) : undefined;
  }
  return undefined;
}

function extractNewTarget(rating: any): number | undefined {
  // Try to extract new target from price_target_change field
  if (rating.price_target_change) {
    const match = rating.price_target_change.match(/to\s*\$?(\d+(?:\.\d+)?)/i);
    return match ? parseFloat(match[1]) : undefined;
  }
  return undefined;
}

function extractPreviousRating(rating: any): string | undefined {
  // Extract previous rating from strings like "Upgraded from Hold to Buy"
  if (rating.rating_change) {
    const match = rating.rating_change.match(/from\s+([A-Za-z\s]+)\s+to\s+/i);
    return match ? match[1].trim() : undefined;
  }
  return undefined;
}

function extractNewRating(rating: any): string | undefined {
  // Extract new rating from strings like "Upgraded from Hold to Buy"
  if (rating.rating_change) {
    const match = rating.rating_change.match(/to\s+([A-Za-z\s]+)$/i);
    return match ? match[1].trim() : undefined;
  }
  return undefined;
}

function getDayBoundsNs(offsetDays: number): { gte: number; lte: number; label: string } {
  // Use a more recent base date that we know had trading activity (December 15, 2024)
  const baseDate = new Date('2024-12-15T00:00:00.000Z');
  const d = new Date(baseDate);
  d.setUTCDate(d.getUTCDate() - offsetDays);
  
  const start = new Date(d);
  const end = new Date(d);
  end.setUTCHours(23, 59, 59, 999);
  
  const gte = start.getTime() * 1_000_000; // ns
  const lte = end.getTime() * 1_000_000; // ns
  const label = start.toISOString().split('T')[0];
  
  console.log(`📅 [benzinga-proxy] Date bounds for offset ${offsetDays}: ${label} (${new Date(gte / 1_000_000).toISOString()} to ${new Date(lte / 1_000_000).toISOString()})`);
  
  return { gte, lte, label };
}

// Try multiple Polygon endpoints for options data
async function fetchOptionsDataMultipleEndpoints(ticker: string, lookbackDays = 7): Promise<any[]> {
  try {
    console.log(`🔍 [benzinga-proxy] Trying multiple endpoints for ${ticker}...`);
    const apiKey = getPolygonApiKey();
    
    // Method 1: Options trades endpoint
    const tradesData = await fetchOptionsTradesEndpoint(ticker, apiKey, lookbackDays);
    if (tradesData.length > 0) {
      console.log(`✅ [benzinga-proxy] Found ${tradesData.length} trades from options trades endpoint`);
      return tradesData;
    }
    
    // Method 2: Options contracts endpoint with recent activity
    const contractsData = await fetchOptionsContractsEndpoint(ticker, apiKey);
    if (contractsData.length > 0) {
      console.log(`✅ [benzinga-proxy] Found ${contractsData.length} contracts from options contracts endpoint`);
      return contractsData;
    }
    
    // Method 3: Snapshot options data
    const snapshotData = await fetchOptionsSnapshotEndpoint(ticker, apiKey);
    if (snapshotData.length > 0) {
      console.log(`✅ [benzinga-proxy] Found ${snapshotData.length} options from snapshot endpoint`);
      return snapshotData;
    }
    
    console.log(`📭 [benzinga-proxy] No options data found from any endpoint for ${ticker}`);
    return [];
    
  } catch (error) {
    console.error(`❌ [benzinga-proxy] Error in fetchOptionsDataMultipleEndpoints:`, error);
    return [];
  }
}

// Method 1: Original options trades endpoint
async function fetchOptionsTradesEndpoint(ticker: string, apiKey: string, lookbackDays: number): Promise<any[]> {
  try {
    console.log(`📡 [benzinga-proxy] Trying options trades endpoint for ${ticker}...`);
    const base = 'https://api.polygon.io/v3/trades/options';
    
    for (let offset = 0; offset <= Math.min(lookbackDays, 5); offset++) {
      await rateLimiter.throttle();
      const { gte, lte, label } = getDayBoundsNs(offset);
      
      const url = `${base}?underlying_ticker=${encodeURIComponent(ticker)}&order=desc&limit=100&timestamp.gte=${gte}&timestamp.lte=${lte}&apikey=${apiKey}`;
      
      console.log(`🔗 [benzinga-proxy] Trades URL (${label}): ${url.substring(0, 100)}...`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`❌ [benzinga-proxy] Trades endpoint failed for ${ticker} (${label}): ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return transformTradesData(data.results, ticker);
      }
    }
    return [];
  } catch (error) {
    console.error(`❌ [benzinga-proxy] Error in options trades endpoint:`, error);
    return [];
  }
}

// Method 2: Options contracts endpoint
async function fetchOptionsContractsEndpoint(ticker: string, apiKey: string): Promise<any[]> {
  try {
    console.log(`📊 [benzinga-proxy] Trying options contracts endpoint for ${ticker}...`);
    await rateLimiter.throttle();
    
    // Get options contracts for the ticker
    const contractsUrl = `https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=${ticker}&limit=50&sort=expiration_date&order=desc&apikey=${apiKey}`;
    
    console.log(`🔗 [benzinga-proxy] Contracts URL: ${contractsUrl.substring(0, 100)}...`);
    const contractsResponse = await fetch(contractsUrl);
    
    if (!contractsResponse.ok) {
      console.warn(`❌ [benzinga-proxy] Contracts endpoint failed: ${contractsResponse.status}`);
      return [];
    }
    
    const contractsData = await contractsResponse.json();
    if (!contractsData.results || contractsData.results.length === 0) {
      console.log(`📭 [benzinga-proxy] No contracts found for ${ticker}`);
      return [];
    }
    
    console.log(`📊 [benzinga-proxy] Found ${contractsData.results.length} contracts for ${ticker}`);
    
    // Get recent trades for first few contracts
    const trades: any[] = [];
    for (let i = 0; i < Math.min(5, contractsData.results.length); i++) {
      const contract = contractsData.results[i];
      await rateLimiter.throttle();
      
      const { gte, lte } = getDayBoundsNs(0); // Today
      const tradesUrl = `https://api.polygon.io/v3/trades/options/${contract.ticker}?limit=20&timestamp.gte=${gte}&timestamp.lte=${lte}&apikey=${apiKey}`;
      
      const tradesResponse = await fetch(tradesUrl);
      if (tradesResponse.ok) {
        const tradesData = await tradesResponse.json();
        if (tradesData.results && tradesData.results.length > 0) {
          trades.push(...tradesData.results.map((trade: any) => ({
            ...trade,
            contract_ticker: contract.ticker,
            underlying_ticker: ticker
          })));
        }
      }
    }
    
    return transformTradesData(trades, ticker);
    
  } catch (error) {
    console.error(`❌ [benzinga-proxy] Error in options contracts endpoint:`, error);
    return [];
  }
}

// Method 3: Options snapshot endpoint
async function fetchOptionsSnapshotEndpoint(ticker: string, apiKey: string): Promise<any[]> {
  try {
    console.log(`📷 [benzinga-proxy] Trying options snapshot endpoint for ${ticker}...`);
    await rateLimiter.throttle();
    
    const snapshotUrl = `https://api.polygon.io/v3/snapshot/options/${ticker}?apikey=${apiKey}`;
    
    console.log(`🔗 [benzinga-proxy] Snapshot URL: ${snapshotUrl}`);
    const response = await fetch(snapshotUrl);
    
    if (!response.ok) {
      console.warn(`❌ [benzinga-proxy] Snapshot endpoint failed: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      console.log(`📭 [benzinga-proxy] No snapshot data for ${ticker}`);
      return [];
    }
    
    console.log(`📊 [benzinga-proxy] Found ${data.results.length} snapshot options for ${ticker}`);
    
    // Transform snapshot data to trades-like format
    return data.results
      .filter((option: any) => option.last_trade && option.last_trade.size > 0)
      .map((option: any, index: number) => {
        const trade = option.last_trade;
        return {
          id: `snapshot_${ticker}_${index}`,
          date: new Date().toISOString().split('T')[0],
          time: new Date(trade.participant_timestamp / 1_000_000).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          }),
          optionType: option.details?.contract_type || 'unknown',
          amount: (trade.size || 0) * (trade.price || 0) * 100,
          tradeLocation: getTradeLocationFromConditions(trade.conditions || []),
          strike: option.details?.strike_price || 0,
          volume: trade.size || 0,
          price: trade.price || 0,
        };
      })
      .filter((trade: any) => trade.amount >= 100); // Only significant trades
      
  } catch (error) {
    console.error(`❌ [benzinga-proxy] Error in options snapshot endpoint:`, error);
    return [];
  }
}

// Transform trades data to standard format
function transformTradesData(trades: any[], ticker: string): any[] {
  return trades
    .map((trade: any, index: number) => {
      const amount = (trade.size || 0) * (trade.price || 0) * 100;
      if (amount < 100) return null; // Filter small trades
      
      const tsNs = trade.participant_timestamp as number;
      const tsMs = typeof tsNs === 'number' && tsNs > 1e12 ? Math.floor(tsNs / 1_000_000) : tsNs;
      
      return {
        id: `${ticker}_${tsMs}_${index}`,
        date: new Date(tsMs).toISOString().split('T')[0],
        time: new Date(tsMs).toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        }),
        optionType: trade.details?.contract_type || 'unknown',
        amount,
        tradeLocation: getTradeLocationFromConditions(trade.conditions || []),
        strike: trade.details?.strike_price || 0,
        volume: trade.size || 0,
        price: trade.price || 0,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.amount - a.amount)
    .slice(0, 20);
}

function getTradeLocationFromConditions(conditions: number[]): string {
  // Map condition codes to trade locations as specified
  if (conditions.includes(1)) return 'At Ask';
  if (conditions.includes(4)) return 'Above Ask';
  if (conditions.includes(2)) return 'At Bid';
  if (conditions.includes(3)) return 'Below Bid';
  return 'Unknown';
}

Deno.serve(async (req) => {
  try {
    const apiKey = getPolygonApiKey();

    if (req.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    const { action, ticker, lookbackDays } = await req.json();
    console.log('[benzinga-proxy] request', { action, ticker, hasKey: !!(apiKey && apiKey.trim()) });

    if (action === 'analyst-actions') {
      if (!apiKey || apiKey.trim() === '') {
        return corsResponse({ actions: [] });
      }
      const actions = await fetchTodaysAnalystActions();
      return corsResponse({ actions });
    }

    if (action === 'test-url' && ticker) {
      const { gte, lte, label } = getDayBoundsNs(0);
      const common = `order=desc&limit=50&timestamp.gte=${gte}&timestamp.lte=${lte}&apikey=${getPolygonApiKey()}`;
      const url = `https://api.polygon.io/v3/trades/options?underlying_ticker=${encodeURIComponent(ticker)}&${common}`;
      return corsResponse({ 
        url,
        dateRange: { gte, lte, label },
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'block-trades' && ticker) {
      if (!apiKey || apiKey.trim() === '') {
        return corsResponse({ blockTrades: [] });
      }
      const lb = typeof lookbackDays === 'number' && lookbackDays >= 0 && lookbackDays <= 10 ? lookbackDays : 7;
      const blockTrades = await fetchOptionsDataMultipleEndpoints(ticker, lb);
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
