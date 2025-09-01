import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// Simple proxy for Polygon.io requests via Supabase Edge Functions
// Secures your Polygon API key on the server side.

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

    const { url } = await req.json();
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
