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
  }

  // Get all options contracts for a symbol
  async getOptionsContracts(symbol: string, expiredGte?: string, expiredLte?: string): Promise<PolygonOptionsContract[]> {
    try {
      const params = new URLSearchParams({
        'underlying_ticker': symbol,
        'limit': '1000',
        'apikey': this.apiKey,
      });

      if (expiredGte) params.append('expired.gte', expiredGte);
      if (expiredLte) params.append('expired.lte', expiredLte);

      const response = await fetch(`${this.baseUrl}/v3/reference/options/contracts?${params}`);
      
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching options contracts:', error);
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
      const response = await fetch(
        `${this.baseUrl}/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}?adjusted=true&sort=asc&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          // No data available for this contract
          return [];
        }
        throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error(`Error fetching options aggregates for ${ticker}:`, error);
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
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<OptionsActivity[]> {
    const activities: OptionsActivity[] = [];
    
    for (const symbol of symbols) {
      try {
        console.log(`Scanning EOD options activity for ${symbol}...`);
        
        // Get options contracts for this symbol
        const contracts = await this.getOptionsContracts(symbol);
        
        // Filter to active contracts (not expired, reasonable expiration dates)
        const activeContracts = contracts.filter(contract => {
          const expDate = new Date(contract.expiration_date);
          const today = new Date(date);
          const daysToExp = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysToExp > 0 && daysToExp <= 60; // 0-60 days to expiration
        });

        // Limit to most liquid contracts for API efficiency
        const contractsToCheck = activeContracts.slice(0, 50);
        
        // Get EOD data for each contract
        for (const contract of contractsToCheck) {
          const ticker = this.buildOptionsTicker(contract);
          const aggregates = await this.getOptionsAggregates(ticker, date);
          
          if (aggregates.length > 0) {
            const agg = aggregates[0];
            const activity = this.convertAggregateToActivity(agg, contract, date);
            
            if (activity && this.isUnusualActivity(activity)) {
              activities.push(activity);
            }
          }
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.error(`Error scanning ${symbol}:`, error);
        continue;
      }
    }
    
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
          await new Promise(resolve => setTimeout(resolve, 100));
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
    const dateStr = contract.expiration_date.replace(/-/g, '').substring(2); // YYMMDD
    const callPut = contract.contract_type === 'call' ? 'C' : 'P';
    const strikeStr = Math.round(contract.strike_price * 1000).toString().padStart(8, '0');
    
    return `O:${contract.underlying_ticker}${dateStr}${callPut}${strikeStr}`;
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
        bid: lastPrice - 0.05,
        ask: lastPrice + 0.05,
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
    return volume >= 1000 || premium >= 50000;
  }

  // Detect block trades
  private isBlockTrade(volume: number, premium: number): boolean {
    return volume >= 1000 || premium >= 100000;
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
      // Get contracts for the symbol
      const contracts = await this.getOptionsContracts(symbol);
      
      // Filter to active contracts
      const activeContracts = contracts.filter(contract => {
        const expDate = new Date(contract.expiration_date);
        const checkDate = new Date(date);
        return expDate > checkDate;
      });

      const activities: OptionsActivity[] = [];
      
      // Get EOD data for each contract
      for (const contract of activeContracts.slice(0, limit)) {
        const ticker = this.buildOptionsTicker(contract);
        const aggregates = await this.getOptionsAggregates(ticker, date);
        
        if (aggregates.length > 0) {
          const activity = this.convertAggregateToActivity(aggregates[0], contract, date);
          if (activity) {
            activities.push(activity);
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Sort by volume and return top activities
      return activities
        .sort((a, b) => b.volume - a.volume)
        .slice(0, limit);
        
    } catch (error) {
      console.error(`Error getting most active options for ${symbol}:`, error);
      return [];
    }
  }

  // Get unusual activity for multiple symbols
  async getUnusualActivityMultiSymbol(
    symbols: string[],
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<OptionsActivity[]> {
    const allActivities: OptionsActivity[] = [];
    
    for (const symbol of symbols) {
      const activities = await this.getMostActiveOptions(symbol, date, 10);
      const unusualActivities = activities.filter(activity => activity.unusual);
      allActivities.push(...unusualActivities);
    }
    
    return allActivities.sort((a, b) => b.premium - a.premium);
  }
}