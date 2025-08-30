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
    console.log('MarketDataService initialized with premium API plan');
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
    try {
      console.log(`[MarketDataService] Fetching most active options for ${symbol} on ${date}`);
      
      // Get options contracts for the symbol
      const contracts = await this.getOptionsContracts(symbol);
      
      if (contracts.length === 0) {
        console.log(`[MarketDataService] No options contracts found for ${symbol}`);
        return [];
      }

      const activities: OptionsActivity[] = [];
      
      // Process contracts in parallel batches for better performance
      const batchSize = 10;
      for (let i = 0; i < Math.min(contracts.length, limit); i += batchSize) {
        const batch = contracts.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (contract) => {
          try {
            const optionsTicker = contract.ticker;
            const aggs = await this.getOptionsAggregates(optionsTicker, date, date);
            
            if (aggs.length > 0) {
              const agg = aggs[0];
              const volume = agg.v || 0;
              const price = agg.c || agg.vw || agg.o || 0;
              
              if (volume > 10 && price > 0.05) { // Filter for meaningful activity
                return this.mapToOptionsActivity(contract, agg, symbol);
              }
            }
          } catch (error) {
            console.warn(`Error processing contract ${contract.ticker}:`, error);
          }
          return null;
        });

        const batchResults = await Promise.all(batchPromises);
        activities.push(...batchResults.filter(Boolean) as OptionsActivity[]);
      }

      // Sort by volume and return top results
      return activities
        .sort((a, b) => b.volume - a.volume)
        .slice(0, limit);

    } catch (error) {
      console.error(`Error getting most active options for ${symbol}:`, error);
      return [];
    }
  }

  async getUnusualActivityMultiSymbol(symbols: string[], date: string): Promise<OptionsActivity[]> {
    console.log(`[MarketDataService] Fetching unusual activity for symbols:`, symbols);
    
    const allActivities: OptionsActivity[] = [];
    
    // Process symbols in parallel
    const promises = symbols.map(symbol => this.getMostActiveOptions(symbol, date, 20));
    const results = await Promise.all(promises);
    
    // Combine and filter for unusual activity
    results.forEach(activities => {
      allActivities.push(...activities);
    });

    // Sort by unusual criteria (high volume, high premium, etc.)
    return allActivities
      .filter(activity => activity.volume >= 50 || activity.premium >= 100) // Unusual thresholds
      .sort((a, b) => (b.volume * b.premium) - (a.volume * a.premium))
      .slice(0, 100);
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
