import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// Simple proxy for Polygon.io requests via Supabase Edge Functions
// Secures your Polygon API key on the server side.

declare const Deno: any;

const ALLOWED_PREFIXES = [
  'https://api.polygon.io/v2/aggs/ticker/',
  'https://api.polygon.io/v3/reference/options/contracts',
  'https://api.polygon.io/v3/snapshot/options/',
];

function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (status === 204) return new Response(null, { status, headers });

  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

// Market status checking function
function getMarketStatus() {
  const now = new Date();
  const eastern = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  
  const easternParts = eastern.formatToParts(now);
  const weekday = easternParts.find(p => p.type === 'weekday')?.value;
  const hour = parseInt(easternParts.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(easternParts.find(p => p.type === 'minute')?.value || '0');
  const currentTime = hour * 60 + minute; // Convert to minutes since midnight
  
  // Weekend check
  if (weekday === 'Sat' || weekday === 'Sun') {
    return { currentPeriod: 'closed', isMarketOpen: false };
  }
  
  // Market hours in minutes since midnight (ET)
  const preMarketStart = 4 * 60; // 4:00 AM
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM
  const afterHoursEnd = 20 * 60; // 8:00 PM
  
  if (currentTime >= marketOpen && currentTime < marketClose) {
    return { currentPeriod: 'market-hours', isMarketOpen: true };
  } else if (currentTime >= preMarketStart && currentTime < marketOpen) {
    return { currentPeriod: 'premarket', isMarketOpen: false };
  } else if (currentTime >= marketClose && currentTime < afterHoursEnd) {
    return { currentPeriod: 'after-hours', isMarketOpen: false };
  } else {
    return { currentPeriod: 'closed', isMarketOpen: false };
  }
}

function isAllowedUrl(url: string) {
  try {
    const u = new URL(url);
    return u.origin === 'https://api.polygon.io' && ALLOWED_PREFIXES.some(p => url.startsWith(p));
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    // Check market status first
    const marketStatus = getMarketStatus();
    console.log('[Polygon Proxy] Market status:', marketStatus);

    // If market is completely closed, return empty data instead of making API calls
    if (marketStatus.currentPeriod === 'closed') {
      console.log('[Polygon Proxy] Market is closed, returning empty data');
      return corsResponse({
        status: 'OK',
        results: [],
        count: 0,
        market_status: marketStatus,
        message: 'Market is closed - no data available'
      });
    }

    const { action, symbol, limit = 50, url } = await req.json();

    if (action === 'options-snapshot' && symbol) {
      const serverKey = Deno.env.get('POLYGON_API_KEY');
      const apiUrl = `https://api.polygon.io/v3/snapshot/options/${symbol}?apikey=${serverKey}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return corsResponse(data);
    }

    if (action === 'stock-snapshots') {
      const serverKey = Deno.env.get('POLYGON_API_KEY');
      const apiUrl = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?apikey=${serverKey}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return corsResponse(data);
    }

    if (!url || typeof url !== 'string') {
      return corsResponse({ error: 'Missing url' }, 400);
    }
    if (!isAllowedUrl(url)) {
      return corsResponse({ error: 'URL not allowed' }, 400);
    }

    // Read secret Polygon key from Supabase secrets
    const serverKey = Deno.env.get('POLYGON_API_KEY');
    if (!serverKey) {
      return corsResponse({ error: 'POLYGON_API_KEY not configured on server' }, 500);
    }

    // Ensure our key is used (remove any client-provided apikey and add ours)
    const u = new URL(url);
    u.searchParams.delete('apikey');
    u.searchParams.set('apikey', serverKey);

    console.log('[Polygon Proxy] Making request to:', u.toString().replace(serverKey, 'API_KEY_HIDDEN'));

    const upstream = await fetch(u.toString());
    const text = await upstream.text();
    
    console.log('[Polygon Proxy] Response status:', upstream.status);
    console.log('[Polygon Proxy] Response preview:', text.substring(0, 200));
    
    return corsResponse(text, upstream.status);
  } catch (e: any) {
    console.error('polygon-proxy error:', e);
    return corsResponse({ error: e?.message || 'Unexpected error' }, 500);
  }
});