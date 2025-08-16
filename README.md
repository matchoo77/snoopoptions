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

## Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Real-time Data**: Polygon.io WebSocket API
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Payments**: Stripe Integration
- **Deployment**: Bolt Hosting
