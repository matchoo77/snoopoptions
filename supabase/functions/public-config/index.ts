import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

/**
 * Public config function: returns SUPABASE_URL and SUPABASE_ANON_KEY to the browser via CORS.
 * Only include safe, public keys here (ANON KEY is safe to expose).
 */
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (status === 204) return new Response(null, { status, headers });

  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return corsResponse({}, 204);
    if (req.method !== 'GET') return corsResponse({ error: 'Method not allowed' }, 405);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !anonKey) {
      return corsResponse({ error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY on server' }, 500);
    }

    return corsResponse({ supabaseUrl, supabaseAnonKey: anonKey });
  } catch (e: any) {
    console.error('public-config error:', e);
    return corsResponse({ error: e?.message || 'Unexpected error' }, 500);
  }
});
