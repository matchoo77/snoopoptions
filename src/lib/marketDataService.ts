import { OptionsActivity } from '../types/options';

interface OptionsContract {
  ticker: string;
  strike_price: number;
  expiration_date: string;
  option_type: 'call' | 'put';
}

interface OptionsAgg {
  c?: number;  // close
  h?: number;  // high
  l?: number;  // low
  o?: number;  // open
  v?: number;  // volume
  vw?: number; // volume weighted
  t?: number;  // timestamp
}

interface StockAgg {
  c?: number;  // close
  h?: number;  // high
  l?: number;  // low
  o?: number;  // open
  v?: number;  // volume
  vw?: number; // volume weighted
  t?: number;  // timestamp
}

interface OptionsSnapshot {
  fmv?: number;
  value?: number;
  strike?: number;
  expiry?: string;
  option_type?: 'call' | 'put';
  bid?: number;
  ask?: number;
  volume?: number;
  open_interest?: number;
  underlying_price?: number;
  implied_volatility?: number;
}

export class MarketDataService {
  private apiKey = 'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X';
  private baseUrl = 'https://api.polygon.io';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute cache

  constructor() {
    console.log('MarketDataService initialized - Using synthetic data with realistic characteristics');
    console.log('NOTE: Currently generating realistic mock data. Real Polygon API integration available but volume data often empty for current contracts.');
  }

  private async makeRequest(url: string): Promise<any> {
    // Check cache first
    if (this.cache.has(url)) {
      const cached = this.cache.get(url)!;
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    console.log('[MarketDataService] Making API request to:', url.replace(this.apiKey, 'API_KEY_HIDDEN'));

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      console.log('[MarketDataService] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      // Cache the response
      this.cache.set(url, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.error('[MarketDataService] Request failed:', error);
      throw error;
    }
  }

  async getStockAggregates(symbol: string, startDate: string, endDate: string): Promise<StockAgg[]> {
    const url = `${this.baseUrl}/v2/aggs/ticker/${symbol}/range/1/day/${startDate}/${endDate}?adjusted=true&sort=asc&limit=50000&apikey=${this.apiKey}`;
    
    try {
      const response = await this.makeRequest(url);
      return response.results || [];
    } catch (error) {
      console.error(`Error fetching stock aggregates for ${symbol}:`, error);
      return [];
    }
  }

  async getOptionsContracts(underlyingTicker: string, expDate?: string): Promise<OptionsContract[]> {
    let url = `${this.baseUrl}/v3/reference/options/contracts?underlying_ticker=${underlyingTicker}&limit=1000&apikey=${this.apiKey}`;
    
    if (expDate) {
      url += `&expiration_date=${expDate}`;
    }

    try {
      const response = await this.makeRequest(url);
      return response.results || [];
    } catch (error) {
      console.error(`Error fetching options contracts for ${underlyingTicker}:`, error);
      return [];
    }
  }

  async getOptionsAggregates(optionsTicker: string, startDate: string, endDate: string): Promise<OptionsAgg[]> {
    const url = `${this.baseUrl}/v2/aggs/ticker/${optionsTicker}/range/1/day/${startDate}/${endDate}?adjusted=true&sort=asc&limit=50000&apikey=${this.apiKey}`;
    
    try {
      const response = await this.makeRequest(url);
      return response.results || [];
    } catch (error) {
      console.error(`Error fetching options aggregates for ${optionsTicker}:`, error);
      return [];
    }
  }

  async getOptionsSnapshot(optionsTicker: string): Promise<OptionsSnapshot | null> {
    const url = `${this.baseUrl}/v3/snapshot/options/${optionsTicker}?apikey=${this.apiKey}`;
    
    try {
      const response = await this.makeRequest(url);
      return response.results || null;
    } catch (error) {
      console.error(`Error fetching options snapshot for ${optionsTicker}:`, error);
      return null;
    }
  }

  async getMostActiveOptions(symbol: string, date: string, limit: number = 50): Promise<OptionsActivity[]> {
    console.log(`[MarketDataService] Fetching most active options for ${symbol} on ${date}`);
    
    // Generate immediate synthetic data to ensure something always shows
    const activities: OptionsActivity[] = [];
    
    // Create realistic options data for the symbol with time-based variation
    const baseStrikes = this.getBaseStrikes(symbol);
    const types: ('call' | 'put')[] = ['call', 'put'];
    const expDates = ['2025-09-06', '2025-09-13', '2025-09-20', '2025-10-18', '2025-11-15'];
    
    console.log(`[MarketDataService] Generating synthetic data for ${symbol}`);
    
    // Use time-based seed for variation but consistency within same refresh
    const timeSeed = Math.floor(Date.now() / 2000); // Changes every 2 seconds
    
    for (let i = 0; i < Math.min(limit, 12); i++) {
      const strikeIndex = (i + timeSeed) % baseStrikes.length;
      const strike = baseStrikes[strikeIndex];
      const type = types[i % types.length];
      const expDate = expDates[i % expDates.length];
      
      // Generate realistic volume and pricing with time variation
      const volumeBase = 150 + (timeSeed * 17) % 400; // Varies with time
      const volume = Math.floor(volumeBase + Math.random() * 100); // 150-650 volume
      
      const priceBase = 2 + ((timeSeed * 13 + i * 7) % 600) / 100; // $2-$8 base price
      const price = priceBase + (Math.random() - 0.5) * 2; // Add some random variation
      const premium = Math.round(Math.max(price, 0.5) * volume * 100);
      
      // Create unique but realistic activity
      const activity: OptionsActivity = {
        id: `${symbol}_${type}_${strike}_${expDate}_${timeSeed}_${i}`,
        symbol: symbol,
        type: type,
        strike: strike,
        expiration: expDate,
        lastPrice: Math.round(Math.max(price, 0.05) * 100) / 100,
        volume: volume,
        premium: premium,
        openInterest: Math.floor(volume * (1.2 + Math.random() * 0.8)),
        bid: Math.round(Math.max(price * 0.96, 0.01) * 100) / 100,
        ask: Math.round((price * 1.04) * 100) / 100,
        timestamp: new Date(Date.now() - Math.random() * 1800000).toISOString(),
        sentiment: this.getSentiment(type, symbol, timeSeed + i),
        tradeLocation: this.getTradeLocation(timeSeed + i),
        blockTrade: volume > 300,
        unusual: volume > 250 || premium > 75000,
        impliedVolatility: 0.2 + ((timeSeed + i * 3) % 40) / 100, // 20-60% IV
        delta: type === 'call' ? 0.3 + Math.random() * 0.5 : -0.7 + Math.random() * 0.5,
        gamma: Math.random() * 0.08,
        theta: -Math.random() * 0.04,
        vega: Math.random() * 0.25,
      };
      
      activities.push(activity);
    }
    
    // Sort by volume descending
    const sortedActivities = activities.sort((a, b) => b.volume - a.volume);
    
    console.log(`[MarketDataService] Generated ${sortedActivities.length} activities for ${symbol}`);
    
    return sortedActivities;
  }

  private getBaseStrikes(symbol: string): number[] {
    // Different base strikes for different symbols to make it more realistic
    switch (symbol) {
      case 'SPY': return [560, 565, 570, 575, 580, 585, 590, 595];
      case 'QQQ': return [480, 485, 490, 495, 500, 505, 510, 515];
      case 'AAPL': return [220, 225, 230, 235, 240, 245, 250, 255];
      case 'MSFT': return [430, 435, 440, 445, 450, 455, 460, 465];
      case 'GOOGL': return [160, 165, 170, 175, 180, 185, 190, 195];
      case 'AMZN': return [180, 185, 190, 195, 200, 205, 210, 215];
      case 'TSLA': return [250, 260, 270, 280, 290, 300, 310, 320];
      case 'NVDA': return [120, 125, 130, 135, 140, 145, 150, 155];
      case 'META': return [520, 530, 540, 550, 560, 570, 580, 590];
      default: return [400, 410, 420, 430, 440, 450, 460, 470];
    }
  }

  private getSentiment(type: 'call' | 'put', _symbol: string, seed: number): 'bullish' | 'bearish' | 'neutral' {
    if (type === 'call') {
      return (seed % 3 === 0) ? 'neutral' : 'bullish';
    } else {
      return (seed % 3 === 0) ? 'neutral' : 'bearish';
    }
  }

  private getTradeLocation(seed: number): 'below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask' {
    const locations: ('below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask')[] = 
      ['below-bid', 'at-bid', 'midpoint', 'at-ask', 'above-ask'];
    return locations[seed % locations.length];
  }

  private generateFallbackData(symbol: string, limit: number): OptionsActivity[] {
    console.log(`[MarketDataService] Generating fallback data for ${symbol}`);
    const activities: OptionsActivity[] = [];
    
    for (let i = 0; i < Math.min(limit, 10); i++) {
      const isCall = Math.random() > 0.5;
      const strike = 400 + (i * 10);
      const volume = Math.floor(Math.random() * 300) + 100;
      const price = Math.random() * 5 + 1;
      
      activities.push({
        id: `fallback_${symbol}_${i}_${Date.now()}`,
        symbol: symbol,
        type: isCall ? 'call' : 'put',
        strike: strike,
        expiration: '2025-09-20',
        lastPrice: price,
        volume: volume,
        premium: Math.round(price * volume * 100),
        openInterest: Math.floor(volume * 1.5),
        bid: price * 0.95,
        ask: price * 1.05,
        timestamp: new Date(Date.now() - Math.random() * 1800000).toISOString(),
        sentiment: isCall ? 'bullish' : 'bearish',
        tradeLocation: ['below-bid', 'at-bid', 'midpoint', 'at-ask', 'above-ask'][Math.floor(Math.random() * 5)] as any,
        blockTrade: volume > 200,
        unusual: true,
        impliedVolatility: 0.2 + Math.random() * 0.4,
        delta: isCall ? 0.3 + Math.random() * 0.4 : -0.7 + Math.random() * 0.4,
        gamma: Math.random() * 0.1,
        theta: -Math.random() * 0.05,
        vega: Math.random() * 0.3,
      });
    }
    
    return activities;
  }

  async getUnusualActivityMultiSymbol(symbols: string[], date: string): Promise<OptionsActivity[]> {
    console.log(`[MarketDataService] Fetching unusual activity for symbols:`, symbols);
    
    const allActivities: OptionsActivity[] = [];
    
    try {
      // Process symbols in parallel with error handling
      const promises = symbols.map(symbol => 
        this.getMostActiveOptions(symbol, date, 20).catch(error => {
          console.warn(`Failed to fetch data for ${symbol}:`, error);
          return []; // Return empty array on error
        })
      );
      
      const results = await Promise.all(promises);
      
      // Combine and filter for unusual activity
      results.forEach(activities => {
        allActivities.push(...activities);
      });

      console.log(`[MarketDataService] Total activities collected: ${allActivities.length}`);

      // Sort by unusual criteria (high volume, high premium, etc.)
      const filteredActivities = allActivities
        .filter(activity => activity.volume >= 50 || activity.premium >= 100) // Unusual thresholds
        .sort((a, b) => (b.volume * b.premium) - (a.volume * a.premium))
        .slice(0, 100);

      console.log(`[MarketDataService] Filtered unusual activities: ${filteredActivities.length}`);
      return filteredActivities;
    } catch (error) {
      console.error('[MarketDataService] Error in getUnusualActivityMultiSymbol:', error);
      return []; // Return empty array on any error
    }
  }

  async getHistoricalBlockTrades(symbols: string[], startDate: string, endDate: string, minVolume: number, minPremium: number): Promise<OptionsActivity[]> {
    console.log(`[MarketDataService] Fetching historical block trades from ${startDate} to ${endDate}`);
    
    const allTrades: OptionsActivity[] = [];
    
    for (const symbol of symbols) {
      try {
        const activities = await this.getMostActiveOptions(symbol, startDate, 50);
        const blockTrades = activities.filter(activity => 
          activity.volume >= minVolume && 
          activity.premium >= minPremium &&
          activity.blockTrade
        );
        allTrades.push(...blockTrades);
      } catch (error) {
        console.warn(`Error fetching block trades for ${symbol}:`, error);
      }
    }

    return allTrades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private mapToOptionsActivity(contract: OptionsContract, agg: OptionsAgg, underlyingSymbol: string): OptionsActivity {
    const volume = agg.v || 0;
    const price = agg.c || agg.vw || agg.o || 0;
    const isBlockTrade = volume >= 100;
    
    // Determine sentiment based on option type and price action
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (contract.option_type === 'call') {
      sentiment = price > (agg.o || price) ? 'bullish' : 'neutral';
    } else {
      sentiment = price > (agg.o || price) ? 'bearish' : 'neutral';
    }

    // Determine trade location (simplified)
    const tradeLocations = ['below-bid', 'at-bid', 'midpoint', 'at-ask', 'above-ask'] as const;
    const tradeLocation = tradeLocations[Math.floor(Math.random() * tradeLocations.length)];

    return {
      id: `${contract.ticker}_${Date.now()}_${Math.random()}`,
      symbol: underlyingSymbol,
      type: contract.option_type,
      strike: contract.strike_price,
      expiration: contract.expiration_date,
      lastPrice: price,
      volume,
      premium: Math.round(price * volume * 100),
      openInterest: Math.floor(volume * (1.5 + Math.random())), // Estimated
      bid: price * 0.95,
      ask: price * 1.05,
      timestamp: new Date(agg.t || Date.now()).toISOString(),
      sentiment,
      tradeLocation,
      blockTrade: isBlockTrade,
      unusual: volume >= 50 || Math.round(price * volume * 100) >= 100,
      impliedVolatility: 0.2 + Math.random() * 0.5, // Random IV between 20-70%
      delta: contract.option_type === 'call' ? 0.3 + Math.random() * 0.4 : -0.7 + Math.random() * 0.4,
      gamma: Math.random() * 0.1,
      theta: -Math.random() * 0.05,
      vega: Math.random() * 0.3,
    };
  }
}
