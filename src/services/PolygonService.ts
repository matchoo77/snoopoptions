import { OptionsActivity, TopMover } from '../types/options';
import { marketDataService } from '../lib/marketDataService';

// Polygon API Response Types based on the documentation
export interface PolygonOptionsChainSnapshot {
  underlying_ticker: string;
  results?: PolygonOptionContract[];
}

export interface PolygonOptionContract {
  details: {
    ticker: string;
    contract_type: 'call' | 'put';
    strike_price: number;
    expiration_date: string;
  };
  day: {
    volume: number;
    open: number;
    close: number;
    high: number;
    low: number;
    change: number;
    change_percent: number;
  };
  last_trade?: {
    price: number;
    size: number;
    timestamp: number;
  };
  last_quote?: {
    bid: number;
    ask: number;
    bid_size: number;
    ask_size: number;
  };
  open_interest: number;
  implied_volatility?: number;
  greeks?: {
    delta?: number;
    gamma?: number;
    theta?: number;
    vega?: number;
  };
}

export interface PolygonStockSnapshotResponse {
  tickers: PolygonStockTicker[];
}

export interface PolygonStockTicker {
  ticker: string;
  todaysChangePerc: number;
  todaysChange: number;
  day: {
    c: number; // close
    h: number; // high
    l: number; // low
    o: number; // open
    v: number; // volume
  };
  prevDay: {
    c: number;
  };
}

export class PolygonService {
  private apiKey: string;
  private baseUrl = 'https://api.polygon.io';
  private useProxy: boolean;

  constructor() {
    this.apiKey = 'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X';
    // Use proxy if Supabase URL is configured
    this.useProxy = !!import.meta.env.VITE_SUPABASE_URL;
  }

  private isMarketClosed(): boolean {
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const currentHour = easternTime.getHours();
    const currentMinute = easternTime.getMinutes();
    const currentDay = easternTime.getDay(); // 0 = Sunday, 6 = Saturday
    
    const isWeekday = currentDay >= 1 && currentDay <= 5;
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Market periods in minutes from midnight
    const preMarketStart = 4 * 60; // 4:00 AM
    const afterHoursEnd = 20 * 60; // 8:00 PM
    
    // Market is closed if it's weekend or outside 4 AM - 8 PM ET
    return !isWeekday || currentTimeInMinutes < preMarketStart || currentTimeInMinutes >= afterHoursEnd;
  }

  private async makeRequest(url: string): Promise<any> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error('[PolygonService] Request failed:', error);
      throw error;
    }
  }

  // Get unusual options activity using the snapshot endpoint
  async getUnusualOptionsActivity(symbol: string): Promise<OptionsActivity[]> {
    // Early return if market is closed
    if (this.isMarketClosed()) {
      console.log('[PolygonService] Market is closed, returning empty activities for', symbol);
      return [];
    }

    try {
      // Always use the market data service proxy to avoid CORS issues
      const data = await marketDataService.getOptionsSnapshot(symbol);

      // Check if the response indicates market is closed
      if (data.market_status && data.market_status.currentPeriod === 'closed') {
        console.log('[PolygonService] Market is closed, returning empty activities for', symbol);
        return [];
      }

      if (!data.results || data.results.length === 0) {
        return []; // no fallback sample data
      }

      const activities: OptionsActivity[] = [];
      let callCount = 0;
      let putCount = 0;

      for (const contract of data.results) {
        // Count call vs put distribution
        if (contract.details.contract_type === 'call') callCount++;
        if (contract.details.contract_type === 'put') putCount++;

        // Filter for unusual activity: volume > 1.5x open interest OR significant volume OR price movement
        const isUnusual = (contract.day.volume > 1.5 * contract.open_interest) || 
                          (contract.day.volume > 50) ||
                          (contract.day.change_percent > 15);

        if (!isUnusual) continue;

        const lastPrice = contract.last_trade?.price || contract.day.close || 0;
        const volume = contract.day.volume;
        const premium = volume * lastPrice * 100; // Total premium

        const activity: OptionsActivity = {
          id: `${contract.details.ticker}_${Date.now()}`,
          symbol: symbol,
          type: contract.details.contract_type,
          strike: contract.details.strike_price,
          expiration: contract.details.expiration_date,
          lastPrice: lastPrice,
          volume: volume,
          premium: premium,
          openInterest: contract.open_interest,
          bid: contract.last_quote?.bid || lastPrice * 0.95,
          ask: contract.last_quote?.ask || lastPrice * 1.05,
          tradeLocation: this.determineTradeLocation(contract.last_quote?.bid || 0, contract.last_quote?.ask || 0, lastPrice),
          impliedVolatility: contract.implied_volatility || 0,
          delta: contract.greeks?.delta || 0,
          gamma: contract.greeks?.gamma || 0,
          theta: contract.greeks?.theta || 0,
          vega: contract.greeks?.vega || 0,
          timestamp: new Date(contract.last_trade?.timestamp || Date.now()).toISOString(),
          unusual: true,
          blockTrade: volume > 500,
          sentiment: this.calculateSentiment(contract.details.contract_type, contract.greeks?.delta || 0),
        };

        activities.push(activity);
      }

  return activities.sort((a, b) => b.premium - a.premium).slice(0, 20);

    } catch (error) {
      console.error(`[PolygonService] Error fetching unusual options for ${symbol}:`, error);
  return []; // on error return empty
    }
  }

  // Get top movers using multiple endpoints for better data
  async getTopMovers(): Promise<TopMover[]> {
    // Early return if market is closed
    if (this.isMarketClosed()) {
      console.log('[PolygonService] Market is closed, returning empty top movers');
      return [];
    }

    try {
      // Always use the market data service proxy to avoid CORS issues
      const data = await marketDataService.getStockSnapshots();

      // Check if the response indicates market is closed
      if (data.market_status && data.market_status.currentPeriod === 'closed') {
        console.log('[PolygonService] Market is closed, returning empty top movers');
        return [];
      }

      if (!data.tickers || data.tickers.length === 0) {
        console.log('[PolygonService] No tickers data received');
        return [];
      }

      console.log('[PolygonService] Received', data.tickers.length, 'tickers');
      console.log('[PolygonService] Sample ticker:', data.tickers[0]);

      // Process all tickers and find ones with meaningful data
      const movers = data.tickers
        .filter(ticker => {
          // Include stocks that have current trading data OR previous day data
          const hasCurrentPrice = ticker.day?.c && ticker.day.c > 0;
          const hasPrevPrice = ticker.prevDay?.c && ticker.prevDay.c > 0;
          const hasChange = ticker.todaysChangePerc && ticker.todaysChangePerc !== 0;
          const hasVolume = (ticker.day?.v && ticker.day.v > 0) || (ticker.prevDay?.v && ticker.prevDay.v > 0);
          
          return (hasCurrentPrice || hasPrevPrice) && (hasChange || hasVolume);
        })
        .map(ticker => {
          // Use current day data if available, otherwise use previous day
          let price = ticker.day?.c && ticker.day.c > 0 ? ticker.day.c : ticker.prevDay?.c || 0;
          let change = ticker.todaysChange || 0;
          let changePercent = ticker.todaysChangePerc || 0;
          let volume = ticker.day?.v && ticker.day.v > 0 ? ticker.day.v : ticker.prevDay?.v || 0;
          
          // If no today's change but we have prices, calculate it
          if (changePercent === 0 && ticker.day?.c && ticker.prevDay?.c && ticker.day.c > 0 && ticker.prevDay.c > 0) {
            change = ticker.day.c - ticker.prevDay.c;
            changePercent = ((change / ticker.prevDay.c) * 100);
            price = ticker.day.c;
          }
          
          return {
            symbol: ticker.ticker,
            price: price,
            change: change,
            changePercent: changePercent,
            volume: volume
          };
        })
        .filter(mover => mover.price > 0 && (Math.abs(mover.changePercent) > 0 || mover.volume > 0))
        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
        .slice(0, 20);

      console.log('[PolygonService] Final movers count:', movers.length);
      console.log('[PolygonService] Sample movers:', movers.slice(0, 5));
  return movers;

    } catch (error) {
      console.error('[PolygonService] Error fetching top movers:', error);
  return [];
    }
  }

  // Get unusual activity for multiple symbols
  async getMultiSymbolUnusualActivity(symbols: string[]): Promise<OptionsActivity[]> {
    // Early return if market is closed
    if (this.isMarketClosed()) {
      console.log('[PolygonService] Market is closed, returning empty multi-symbol activities');
      return [];
    }

    try {
  const allActivities: OptionsActivity[] = [];

  // Process symbols in batches to avoid rate limiting. Batch size adaptive to list length.
  const batchSize = symbols.length > 30 ? 8 : symbols.length > 15 ? 5 : 3;
      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);

        const batchPromises = batch.map(symbol =>
          this.getUnusualOptionsActivity(symbol).catch(err => {
            console.warn(`Failed to fetch data for ${symbol}:`, err);
            return [];
          })
        );

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(activities => allActivities.push(...activities));

        // Small delay between batches
        if (i + batchSize < symbols.length) {
          // Slightly longer delay for large universes to ease pressure on API
            const delay = symbols.length > 30 ? 900 : 500;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // Sort by timestamp descending (newest first) and premium; allow larger result set
  return allActivities
        .sort((a, b) => {
          // First sort by timestamp (newest first)
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          if (timeB !== timeA) return timeB - timeA;
          // Then by premium (highest first)
          return b.premium - a.premium;
        })
        .slice(0, 250); // increased cap

    } catch (error) {
      console.error('[PolygonService] Error in multi-symbol unusual activity:', error);
  return [];
    }
  }

  private determineTradeLocation(bid: number, ask: number, lastPrice: number): 'below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask' {
    if (!bid || !ask || !lastPrice) return 'midpoint';
    
    const midpoint = (bid + ask) / 2;
    const tolerance = (ask - bid) * 0.1; // 10% tolerance
    
    if (lastPrice < bid - tolerance) return 'below-bid';
    if (Math.abs(lastPrice - bid) <= tolerance) return 'at-bid';
    if (Math.abs(lastPrice - midpoint) <= tolerance) return 'midpoint';
    if (Math.abs(lastPrice - ask) <= tolerance) return 'at-ask';
    if (lastPrice > ask + tolerance) return 'above-ask';
    
    return 'midpoint';
  }

  private calculateSentiment(type: 'call' | 'put', delta: number): 'bullish' | 'bearish' | 'neutral' {
    if (type === 'call' && delta > 0.3) return 'bullish';
    if (type === 'put' && delta < -0.3) return 'bearish';
    return 'neutral';
  }

  // Sample data generation removed to ensure only real API data (or empty arrays) propagate.
}

// Export singleton instance
export const polygonService = new PolygonService();
