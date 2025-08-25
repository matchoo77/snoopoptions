# SnoopFlow

A real-time unusual options activity scanner that helps traders identify significant market movements and institutional trading patterns.

## Features

- **Real-time Options Scanning**: Live unusual options activity detection
- **Smart Alerts**: Customizable notifications for high-volume trades
- **Block Trade Detection**: Identify institutional trading activity
- **Advanced Filtering**: Filter by volume, premium, sentiment, and more
- **Personal Watchlist**: Track your favorite symbols
- **Market Overview**: Live market data and top movers
- **Favorites System**: Save and annotate interesting alerts

## Setup

1. Get a free API key from [Polygon.io](https://polygon.io/pricing)
2. Add it to your `.env` file as `VITE_POLYGON_API_KEY`
3. Connect to Supabase for user authentication and data storage
4. Run `npm run dev` to start the development server

### Hosting on Bolt.new with Supabase

- Frontend env (Vite):
	- VITE_POLYGON_API_KEY=your_real_polygon_key
	- VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
	- VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

- Server (Supabase) secrets:
	- POLYGON_API_KEY=your_real_polygon_key

- Deploy the Edge Function proxy:
	- supabase functions deploy polygon-proxy

With VITE_SUPABASE_URL set, the app routes Polygon requests via the proxy; otherwise it uses the browser key.

### Alternate Supabase config sources

You can provide Supabase URL and ANON KEY in multiple ways (precedence order):
1) Window globals: set `window.__SUPABASE_URL__` and `window.__SUPABASE_ANON_KEY__` before the app loads.
2) localStorage: set `SUPABASE_URL` and `SUPABASE_ANON_KEY` keys.
3) Vite env: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4) Hardcoded fallbacks in `src/lib/supabase.ts` (edit `HARDCODED_SUPABASE_URL` and `HARDCODED_SUPABASE_ANON_KEY`).

Optionally, deploy the `public-config` Edge Function and set `window.__SUPABASE_FUNCTIONS_URL__` (or hardcode `HARDCODED_FUNCTIONS_URL`) so the app can fetch Supabase URL/ANON KEY from server secrets at runtime.
## Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Real-time Data**: Polygon.io WebSocket API
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Payments**: Stripe Integration
- **Deployment**: Bolt Hosting
