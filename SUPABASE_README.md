Supabase setup for Polygon proxy

1) Set the server-side secret in Supabase:
   - POLYGON_API_KEY = your Polygon key

2) Deploy the edge function:
   - supabase functions deploy polygon-proxy

3) Add to your frontend .env:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_POLYGON_API_KEY (optional; proxy uses server key)

The app auto-detects VITE_SUPABASE_URL and sends Polygon requests via the proxy when configured.