import { OptionsActivity } from '../types/options';
import { BacktestTrade } from '../types/backtesting';

interface PolygonOptionsContract {
  ticker: string;
  underlying_ticker: string;
  contract_type: 'call' | 'put';
  strike_price: number;
  expiration_date: string;
}

interface PolygonOptionsAgg {
  T: string; // ticker
  v: number; // volume
  vw: number; // volume weighted average price
  o: number; // open
  c: number; // close
  h: number; // high
  l: number; // low
  t: number; // timestamp
  n: number; // number of transactions
}

interface PolygonOptionsSnapshot {
  value: {
    underlying_ticker: string;
    last_quote?: {
      bid: number;
      ask: number;
      last_updated: number;
    };
    last_trade?: {
      conditions: number[];
      price: number;
      sip_timestamp: number;
      size: number;
      exchange: number;
    };
    implied_volatility?: number;
    open_interest?: number;
    day?: {
      change: number;
      change_percent: number;
      early_trading_change: number;
      early_trading_change_percent: number;
      close: number;
      high: number;
      last_updated: number;
      low: number;
      open: number;
      previous_close: number;
      volume: number;
    };
    greeks?: {
      delta: number;
      gamma: number;
      theta: number;
      vega: number;
    };
  };
}

export class PolygonEODService {
  private apiKey: string;
  private baseUrl = 'https://api.polygon.io';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.log('PolygonEODService initialized with API key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'none');
  }

  // Get all options contracts for a symbol
  async getOptionsContracts(symbol: string, expiredGte?: string, expiredLte?: string): Promise<PolygonOptionsContract[]> {
    try {
      console.log(`[PolygonEOD] Fetching options contracts for ${symbol}...`);
      const params = new URLSearchParams({
        'underlying_ticker': symbol,
        'limit': '1000',
        'apikey': this.apiKey,
      });

      if (expiredGte) params.append('expired.gte', expiredGte);
      if (expiredLte) params.append('expired.lte', expiredLte);

      const url = `${this.baseUrl}/v3/reference/options/contracts?${params}`;
      console.log(`[PolygonEOD] Contracts URL: ${url.replace(this.apiKey, 'API_KEY_HIDDEN')}`);
      
      const response = await fetch(`${this.baseUrl}/v3/reference/options/contracts?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[PolygonEOD] Contracts API error: ${response.status} ${response.statusText}`, errorText);
        
        // Check for specific error types
        if (response.status === 401) {
          throw new Error('Invalid Polygon.io API key - please check your VITE_POLYGON_API_KEY');
        } else if (response.status === 429) {
          throw new Error('Polygon.io rate limit exceeded - please wait and try again');
        } else if (response.status === 403) {
          throw new Error('Polygon.io API access denied - please check your subscription tier');
        }
        
        throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[PolygonEOD] Found ${data.results?.length || 0} contracts for ${symbol}`);
      return data.results || [];
    } catch (error) {
      console.error(`[PolygonEOD] Error fetching options contracts for ${symbol}:`, error);
      return [];
    }
  }

  // Get EOD aggregates for specific options contracts
  async getOptionsAggregates(
    ticker: string, 
    startDate: string, 
    endDate: string = startDate
  ): Promise<PolygonOptionsAgg[]> {
    try {
      const url = `${this.baseUrl}/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}?adjusted=true&sort=asc&apikey=${this.apiKey}`;
      console.log(`[PolygonEOD] Fetching aggregates for ${ticker}: ${url.replace(this.apiKey, 'API_KEY_HIDDEN')}`);
      
      const response = await fetch(
        `${this.baseUrl}/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}?adjusted=true&sort=asc&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`[PolygonEOD] No data available for ${ticker} on ${startDate}`);
          // No data available for this contract
          return [];
        }
        if (response.status === 403) {
          console.error(`[PolygonEOD] Access denied for ${ticker} - check subscription tier`);
          return [];
        }
        const errorText = await response.text();
        console.error(`[PolygonEOD] Aggregates API error for ${ticker}: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[PolygonEOD] Found ${data.results?.length || 0} aggregates for ${ticker} on ${startDate}`);
      return data.results || [];
    } catch (error) {
      console.error(`[PolygonEOD] Error fetching options aggregates for ${ticker}:`, error);
      return [];
    }
  }

  // Get current options snapshots for unusual activity detection
  async getOptionsSnapshots(tickers: string[]): Promise<Record<string, PolygonOptionsSnapshot>> {
    try {
      const tickerParam = tickers.join(',');
      const response = await fetch(
        `${this.baseUrl}/v3/snapshot/options/${tickerParam}?apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const snapshots: Record<string, PolygonOptionsSnapshot> = {};
      
      if (data.results) {
        data.results.forEach((result: any) => {
          snapshots[result.name] = result;
        });
      }
      
      return snapshots;
    } catch (error) {
      console.error('Error fetching options snapshots:', error);
      return {};
    }
  }

  // Get stock price data for backtesting
  async getStockAggregates(symbol: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v2/aggs/ticker/${symbol}/range/1/day/${startDate}/${endDate}?adjusted=true&sort=asc&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error(`Error fetching stock aggregates for ${symbol}:`, error);
      return [];
    }
  }

  // Scan for unusual EOD options activity
  async scanUnusualEODActivity(
    symbols: string[] = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'SPY', 'QQQ'],
    date?: string
  ): Promise<OptionsActivity[]> {
    console.log(`[PolygonEOD] Starting unusual activity scan...`);
    
    // Use previous trading day if no date specified  
    if (!date) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      // If today is Monday, go back to Friday
      if (today.getDay() === 1) {
        yesterday.setDate(today.getDate() - 3);
      }
      // If today is Sunday, go back to Friday  
      else if (today.getDay() === 0) {
        yesterday.setDate(today.getDate() - 2);
      }
      
      date = yesterday.toISOString().split('T')[0];
    }
    
    console.log(`[PolygonEOD] Scanning EOD options activity for date: ${date}`);
    const activities: OptionsActivity[] = [];
    
    for (const symbol of symbols) {
      try {
        console.log(`[PolygonEOD] Scanning EOD options activity for ${symbol}...`);
        
        // Get options contracts for this symbol
        const contracts = await this.getOptionsContracts(symbol);
        console.log(`[PolygonEOD] Found ${contracts.length} total contracts for ${symbol}`);
        
        // Filter to active contracts (not expired, reasonable expiration dates)
        const activeContracts = contracts.filter(contract => {
          const expDate = new Date(contract.expiration_date);
          const today = new Date(date);
          const daysToExp = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysToExp > 0 && daysToExp <= 90; // 0-90 days to expiration (increased range)
        });
        
        console.log(`[PolygonEOD] Found ${activeContracts.length} active contracts for ${symbol}`);

        // Limit to most liquid contracts for API efficiency - but check more for paid subscription
        const contractsToCheck = activeContracts.slice(0, 50); // Increased for paid subscription
        
        // Get EOD data for each contract
        for (const contract of contractsToCheck) {
          const ticker = this.buildOptionsTicker(contract);
          console.log(`[PolygonEOD] Checking contract: ${ticker}`);
          const aggregates = await this.getOptionsAggregates(ticker, date);
          
          if (aggregates.length > 0) {
            const agg = aggregates[0];
            const activity = this.convertAggregateToActivity(agg, contract, date);
            
            if (activity && this.isUnusualActivity(activity)) {
              console.log(`[PolygonEOD] Found unusual activity: ${ticker} - Volume: ${activity.volume}, Premium: $${activity.premium.toFixed(0)}`);
              activities.push(activity);
            }
          }
          
          // Reduced delay for paid subscription
          await new Promise(resolve => setTimeout(resolve, 200)); // Reduced to 200ms for paid tier
        }
      } catch (error) {
        console.error(`[PolygonEOD] Error scanning ${symbol}:`, error);
        continue;
      }
    }
    
    console.log(`[PolygonEOD] Total unusual activities found: ${activities.length}`);
    return activities.sort((a, b) => b.premium - a.premium);
  }

  // Get historical block trades for backtesting
  async getHistoricalBlockTrades(
    symbols: string[],
    startDate: string,
    endDate: string,
    minVolume: number = 1000,
    minPremium: number = 100000
  ): Promise<BacktestTrade[]> {
    const blockTrades: BacktestTrade[] = [];
    
    for (const symbol of symbols) {
      try {
        console.log(`Getting historical block trades for ${symbol}...`);
        
        // Get options contracts for the symbol
        const contracts = await this.getOptionsContracts(symbol, startDate, endDate);
        
        // Check each contract for block trade activity
        for (const contract of contracts.slice(0, 20)) { // Limit for API efficiency
          const ticker = this.buildOptionsTicker(contract);
          
          // Get historical aggregates for the date range
          const aggregates = await this.getOptionsAggregates(ticker, startDate, endDate);
          
          for (const agg of aggregates) {
            const volume = agg.v || 0;
            const vwap = agg.vw || agg.c || 0;
            const premium = volume * vwap * 100;
            
            // Check if this qualifies as a block trade
            if (volume >= minVolume && premium >= minPremium) {
              const trade: BacktestTrade = {
                id: `${ticker}-${agg.t}`,
                symbol: contract.underlying_ticker,
                strike: contract.strike_price,
                expiration: contract.expiration_date,
                type: contract.contract_type,
                volume,
                premium,
                tradeDate: new Date(agg.t).toISOString(),
                tradePrice: vwap,
                underlyingPrice: 0, // Will be fetched separately
                impliedVolatility: Math.random() * 0.8 + 0.2, // Would need separate API call
                delta: contract.contract_type === 'call' ? Math.random() * 0.8 + 0.1 : -(Math.random() * 0.8 + 0.1),
              };
              
              blockTrades.push(trade);
            }
          }
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error getting block trades for ${symbol}:`, error);
        continue;
      }
    }
    
    return blockTrades;
  }

  // Build Polygon options ticker format
  private buildOptionsTicker(contract: PolygonOptionsContract): string {
    // Format: O:AAPL240216C00150000
    const expDate = new Date(contract.expiration_date);
    const year = expDate.getFullYear().toString().substring(2);
    const month = (expDate.getMonth() + 1).toString().padStart(2, '0');
    const day = expDate.getDate().toString().padStart(2, '0');
    const dateStr = year + month + day;
    
    const callPut = contract.contract_type === 'call' ? 'C' : 'P';
    const strikeStr = Math.round(contract.strike_price * 1000).toString().padStart(8, '0');
    
    return `O:${contract.underlying_ticker}${dateStr}${callPut}${strikeStr}`;
  }

  // Calculate trade location relative to bid/ask
  private getTradeLocation(lastPrice: number, bid: number, ask: number): 'below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask' {
    const midpoint = (bid + ask) / 2;
    const bidThreshold = bid + (ask - bid) * 0.1; // 10% above bid
    const askThreshold = ask - (ask - bid) * 0.1; // 10% below ask
    
    if (lastPrice < bid) return 'below-bid';
    if (lastPrice <= bidThreshold) return 'at-bid';
    if (lastPrice >= askThreshold) return 'at-ask';
    if (lastPrice > ask) return 'above-ask';
    return 'midpoint';
  }

  // Convert Polygon aggregate to our OptionsActivity format
  private convertAggregateToActivity(
    agg: PolygonOptionsAgg, 
    contract: PolygonOptionsContract,
    date: string
  ): OptionsActivity | null {
    try {
      const volume = agg.v || 0;
      const lastPrice = agg.c || agg.vw || 0;
      const bid = lastPrice - 0.05;
      const ask = lastPrice + 0.05;
      const premium = volume * lastPrice * 100;
      
      // Estimate Greeks (in production, you'd get these from separate API calls)
      const delta = contract.contract_type === 'call' 
        ? Math.random() * 0.8 + 0.1 
        : -(Math.random() * 0.8 + 0.1);
      const gamma = Math.random() * 0.1;
      const theta = -(Math.random() * 0.5);
      const vega = Math.random() * 0.3;
      const impliedVolatility = Math.random() * 0.8 + 0.2;

      const activity: OptionsActivity = {
        id: `${contract.ticker}-${agg.t}`,
        symbol: contract.underlying_ticker,
        strike: contract.strike_price,
        expiration: contract.expiration_date,
        type: contract.contract_type,
        volume,
        openInterest: Math.floor(Math.random() * 10000) + 100, // Would need separate API call
        lastPrice,
        bid,
        ask,
        tradeLocation: this.getTradeLocation(lastPrice, bid, ask),
        impliedVolatility,
        delta,
        gamma,
        theta,
        vega,
        premium,
        timestamp: new Date(agg.t).toISOString(),
        unusual: this.detectUnusualActivity(volume, premium),
        blockTrade: this.isBlockTrade(volume, premium),
        sentiment: this.calculateSentiment(contract.contract_type, delta, volume),
      };

      return activity;
    } catch (error) {
      console.error('Error converting aggregate to activity:', error);
      return null;
    }
  }

  // Detect unusual activity based on volume and premium
  private detectUnusualActivity(volume: number, premium: number): boolean {
    return volume >= 100 || premium >= 10000; // Even lower thresholds for paid subscription
  }

  // Detect block trades
  private isBlockTrade(volume: number, premium: number): boolean {
    return volume >= 250 || premium >= 25000; // Lower thresholds for paid subscription
  }

  // Calculate sentiment
  private calculateSentiment(
    type: 'call' | 'put',
    delta: number,
    volume: number
  ): 'bullish' | 'bearish' | 'neutral' {
    if (type === 'call' && delta > 0.3) return 'bullish';
    if (type === 'put' && delta < -0.3) return 'bearish';
    if (volume < 500) return 'neutral';
    
    return type === 'call' ? 'bullish' : 'bearish';
  }

  // Get most active options for a symbol on a specific date
  async getMostActiveOptions(symbol: string, date: string, limit: number = 20): Promise<OptionsActivity[]> {
    try {
      console.log(`[PolygonEOD] Getting most active options for ${symbol} on ${date || 'latest'}`);
      
      // Use previous trading day if no date specified
      if (!date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        // If today is Monday, go back to Friday
        if (today.getDay() === 1) {
          yesterday.setDate(today.getDate() - 3);
        }
        // If today is Sunday, go back to Friday  
        else if (today.getDay() === 0) {
          yesterday.setDate(today.getDate() - 2);
        }
        
        date = yesterday.toISOString().split('T')[0];
        console.log(`[PolygonEOD] Using previous trading day: ${date}`);
      }
      
      // Get contracts for the symbol
      const contracts = await this.getOptionsContracts(symbol);
      console.log(`[PolygonEOD] Got ${contracts.length} contracts for ${symbol}`);
      
      // Filter to active contracts
      const activeContracts = contracts.filter(contract => {
        const expDate = new Date(contract.expiration_date);
        const checkDate = new Date(date);
        const daysToExp = Math.ceil((expDate.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysToExp > 0 && daysToExp <= 90; // 0-90 days to expiration
      });
      
      console.log(`[PolygonEOD] Filtered to ${activeContracts.length} active contracts for ${symbol}`);

      const activities: OptionsActivity[] = [];
      
      // Get EOD data for each contract - increased limit for paid subscription
      const contractsToCheck = activeContracts.slice(0, Math.min(limit * 2, 50));
      console.log(`[PolygonEOD] Checking ${contractsToCheck.length} contracts for ${symbol}`);
      
      for (const contract of contractsToCheck) {
        const ticker = this.buildOptionsTicker(contract);
        const aggregates = await this.getOptionsAggregates(ticker, date);
        
        if (aggregates.length > 0) {
          const activity = this.convertAggregateToActivity(aggregates[0], contract, date);
          if (activity) {
            activities.push(activity);
          }
        }
        
        // Reduced rate limiting for paid subscription
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log(`[PolygonEOD] Generated ${activities.length} activities for ${symbol}`);
      
      // Sort by volume and return top activities
      return activities
        .sort((a, b) => b.volume - a.volume)
        .slice(0, limit);
        
    } catch (error) {
      console.error(`[PolygonEOD] Error getting most active options for ${symbol}:`, error);
      return [];
    }
  }

  // Get unusual activity for multiple symbols
  async getUnusualActivityMultiSymbol(
    symbols: string[],
    date?: string
  ): Promise<OptionsActivity[]> {
    console.log('[PolygonEOD] Starting multi-symbol unusual activity scan...');
    const allActivities: OptionsActivity[] = [];
    
    for (const symbol of symbols) {
      console.log(`[PolygonEOD] Processing ${symbol}...`);
      const activities = await this.getMostActiveOptions(symbol, date, 20); // Increased limit
      const unusualActivities = activities.filter(activity => activity.unusual);
      console.log(`[PolygonEOD] ${symbol}: Found ${activities.length} activities, ${unusualActivities.length} unusual`);
      allActivities.push(...unusualActivities);
      
      // Add delay between symbols to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`[PolygonEOD] Total unusual activities across all symbols: ${allActivities.length}`);
    return allActivities.sort((a, b) => b.premium - a.premium);
  }
}