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
            actionType: formatActionType(rating),
            analystFirm: rating.firm || 'Unknown Firm',
            actionDate: rating.date || dateStr,
            previousTarget: extractPreviousTarget(rating),
            newTarget: extractNewTarget(rating),
            rating: rating.rating_change || rating.action_type || 'Unknown',
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

function getDayBoundsNs(offsetDays: number): { gte: number; lte: number; label: string } {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  // apply offset
  d.setUTCDate(d.getUTCDate() - offsetDays);
  const start = new Date(d);
  const end = new Date(d);
  end.setUTCHours(23, 59, 59, 999);
  const gte = start.getTime() * 1_000_000; // ns
  const lte = end.getTime() * 1_000_000; // ns
  const label = start.toISOString().split('T')[0];
  return { gte, lte, label };
}

async function fetchBlockTradesForTicker(ticker: string, lookbackDays = 3): Promise<any[]> {
  try {
    console.log(`Fetching options block trades for ${ticker} with lookback ${lookbackDays}d...`);
    const apiKey = getPolygonApiKey();
    const isOptionContract = ticker.startsWith('O:');
    const base = 'https://api.polygon.io/v3/trades/options';

    for (let offset = 0; offset <= Math.max(0, lookbackDays); offset++) {
      await rateLimiter.throttle();
      const { gte, lte, label } = getDayBoundsNs(offset);
      // Use numeric condition codes: 1=At Ask, 4=Above Ask
      const common = `order=desc&limit=200&conditions=1,4&timestamp.gte=${gte}&timestamp.lte=${lte}&apikey=${apiKey}`;
      const url = isOptionContract
        ? `${base}/${ticker}?${common}`
        : `${base}?underlying_ticker=${encodeURIComponent(ticker)}&${common}`;

      console.log(`Options fetch (${label}) -> ${isOptionContract ? 'contract' : 'underlying'}`);
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to fetch options trades for ${ticker} (${label}): ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        console.log(`No options trades found for ${ticker} on ${label}`);
        continue;
      }

      const blockTrades: any[] = [];

      for (const trade of data.results) {
      // Calculate amount = size * price * 100 as specified
      const amount = trade.size * trade.price * 100;

      // Only include significant trades (you can adjust this threshold)
      if (amount < 1000) continue; // Skip trades under $1,000

      // Determine trade location from conditions
        const tradeLocation = getTradeLocationFromConditions(trade.conditions || []);

        // Convert Polygon ns timestamps to ms if necessary
        const tsNs = trade.participant_timestamp as number;
        const tsMs = typeof tsNs === 'number' && tsNs > 1e12 ? Math.floor(tsNs / 1_000_000) : tsNs; // if already ms, keep

      blockTrades.push({
          id: `${ticker}_${tsMs}`,
          date: new Date(tsMs).toISOString().split('T')[0],
          time: new Date(tsMs).toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        }),
          optionType: trade.details?.contract_type || 'unknown',
        amount,
        tradeLocation,
        strike: trade.details?.strike_price || 0,
        volume: trade.size,
        price: trade.price,
      });
      }

      if (blockTrades.length === 0) {
        console.log(`No qualifying block trades found for ${ticker} on ${label}`);
        continue;
      }

      const sortedTrades = blockTrades
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 15);
      console.log(`Successfully fetched ${sortedTrades.length} options trades for ${ticker} on ${label}`);
      return sortedTrades;
    }

    // Nothing across lookback window
    return [];

  } catch (error) {
    console.error(`Error fetching options trades for ${ticker}:`, error);
    return [];
  }
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

    if (action === 'block-trades' && ticker) {
      if (!apiKey || apiKey.trim() === '') {
        return corsResponse({ blockTrades: [] });
      }
      const lb = typeof lookbackDays === 'number' && lookbackDays >= 0 && lookbackDays <= 10 ? lookbackDays : 3;
      const blockTrades = await fetchBlockTradesForTicker(ticker, lb);
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
