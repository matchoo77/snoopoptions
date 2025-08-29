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
  private cache: Map<string, any> = new Map();
  private cacheExpiry = 2 * 60 * 1000; // 2 minutes cache for faster updates

  constructor() {
    this.apiKey = 'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X';
    console.log('PolygonEODService initialized with upgraded $300 plan API key');
    console.log('[PolygonEOD] Full API key length:', this.apiKey.length);
    console.log('[PolygonEOD] API key starts with:', this.apiKey.substring(0, 10));
    console.log('[PolygonEOD] Using direct API calls (rate limiting disabled for upgraded plan)');
  }

  // Direct API request without rate limiting (upgraded plan)
  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // Check cache first
    const cacheKey = url;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('[PolygonEOD] Using cached response for:', url.replace(this.apiKey, 'API_KEY_HIDDEN'));
      return new Response(JSON.stringify(cached.data), { status: 200 });
    }

    console.log('[PolygonEOD] Making direct API request to:', url.replace(this.apiKey, 'API_KEY_HIDDEN'));

    try {
      // Add API key as query parameter for direct calls
      const urlWithKey = url.includes('?')
        ? `${url}&apikey=${this.apiKey}`
        : `${url}?apikey=${this.apiKey}`;
      const response = await fetch(urlWithKey, options);

      console.log('[PolygonEOD] Response status:', response.status, response.statusText);

      // Cache successful responses
      if (response.ok) {
        const responseText = await response.text();
        const responseData = JSON.parse(responseText);
        this.cache.set(cacheKey, {
          data: responseData,
          timestamp: Date.now()
        });
        return new Response(responseText, { status: response.status });
      }

      return response;
    } catch (error) {
      console.error('[PolygonEOD] Request failed:', error);
      throw error;
    }
  }

  // Get all options contracts for a symbol (increased limits for upgraded plan)
  async getOptionsContracts(symbol: string, expiredGte?: string): Promise<PolygonOptionsContract[]> {
    try {
      console.log(`[PolygonEOD] Fetching options contracts for ${symbol}...`);
      console.log(`[PolygonEOD] Using API key: ${this.apiKey ? `${this.apiKey.substring(0, 8)}...${this.apiKey.slice(-4)}` : 'NONE'}`);

      // Get all active contracts - much larger limit with upgraded plan
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 90); // Extended to 90 days
      const expireLte = futureDate.toISOString().split('T')[0];

      const params = new URLSearchParams({
        'underlying_ticker': symbol,
        'limit': '1000', // Increased limit for more data
        'expired.lte': expireLte
      });

      if (expiredGte) params.append('expired.gte', expiredGte);

      const fullUrl = `${this.baseUrl}/v3/reference/options/contracts?${params}`;
      console.log(`[PolygonEOD] Contracts URL: ${fullUrl.replace(this.apiKey, 'API_KEY_HIDDEN')}`);

      const response = await this.makeRequest(fullUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[PolygonEOD] Contracts API error: ${response.status} ${response.statusText}`, errorText);

        // Check for specific error types
        if (response.status === 401) {
          throw new Error('Invalid Polygon.io API key - please check your API key');
        } else if (response.status === 429) {
          console.warn('[PolygonEOD] Rate limit hit unexpectedly on upgraded plan');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return []; // Return empty array to avoid cascading errors
        } else if (response.status === 403) {
          throw new Error('Polygon.io API access denied - please check your subscription tier');
        }

        throw new Error(`Polygon API error: ${response.status} ${response.statusText}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`[PolygonEOD] Found ${data.results?.length || 0} contracts for ${symbol}`);

      if (!data.results || data.results.length === 0) {
        console.log(`[PolygonEOD] No contracts found for ${symbol}. This could be because:`);
        console.log('- Symbol does not have listed options');
        console.log('- All contracts have expired');
        console.log('- Market is closed and no recent data available');
      }

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
      const params = new URLSearchParams({
        'adjusted': 'true',
        'sort': 'asc',
      });

      const url = `${this.baseUrl}/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}?${params}`;
      console.log(`[PolygonEOD] Fetching aggregates for ${ticker}: ${url.replace(this.apiKey, 'API_KEY_HIDDEN')}`);

      const response = await this.makeRequest(url);

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
      const response = await this.makeRequest(
        `${this.baseUrl}/v3/snapshot/options/${tickerParam}`
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
      const params = new URLSearchParams({
        'adjusted': 'true',
        'sort': 'asc',
      });

      const url = `${this.baseUrl}/v2/aggs/ticker/${symbol}/range/1/day/${startDate}/${endDate}?${params}`;
      console.log(`[PolygonEOD] Stock aggregates URL: ${url.replace(this.apiKey, 'API_KEY_HIDDEN')}`);

      const response = await this.makeRequest(url);

      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`[PolygonEOD] Rate limit hit for ${symbol}, skipping...`);
          return []; // Return empty array instead of throwing error
        }
        throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error(`Error fetching stock aggregates for ${symbol}:`, error);
      return [];
    }
  }

  // Scan for unusual EOD options activity (upgraded plan - more data, no delays)
  async scanUnusualEODActivity(
    symbols: string[] = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'SPY', 'QQQ', 'AMD', 'NFLX', 'CRM', 'ORCL', 'BABA', 'DIS'],
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

    // Process symbols in parallel for much faster loading with upgraded plan
    const symbolPromises = symbols.map(async (symbol) => {
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
          return daysToExp > 0 && daysToExp <= 45; // Extended to 45 days
        });

        console.log(`[PolygonEOD] Found ${activeContracts.length} active contracts for ${symbol}`);

        // Check more contracts with upgraded plan
        const contractsToCheck = activeContracts.slice(0, 20); // Increased to 20 contracts per symbol

        // Process contracts in parallel for faster loading
        const contractPromises = contractsToCheck.map(async (contract) => {
          const ticker = this.buildOptionsTicker(contract);
          console.log(`[PolygonEOD] Processing contract: ${ticker}`);
          const aggregates = await this.getOptionsAggregates(ticker, date);

          if (aggregates.length > 0) {
            console.log(`[PolygonEOD] Found aggregate data for ${ticker}:`, aggregates[0]);
            const activity = this.convertAggregateToActivity(aggregates[0], contract, date);

            if (activity && this.isUnusualActivity(activity)) {
              console.log(`[PolygonEOD] Found unusual activity: ${ticker} - Volume: ${activity.volume}, Premium: $${activity.premium.toFixed(0)}`);
              return activity;
            } else if (activity) {
              console.log(`[PolygonEOD] Activity not unusual: ${ticker} - Volume: ${activity.volume}, Premium: $${activity.premium.toFixed(0)}`);
            }
          }
          return null;
        });

        const symbolActivities = (await Promise.all(contractPromises)).filter(Boolean) as OptionsActivity[];
        return symbolActivities;
      } catch (error) {
        console.error(`[PolygonEOD] Error scanning ${symbol}:`, error);
        return [];
      }
    });

    const allSymbolActivities = await Promise.all(symbolPromises);
    activities.push(...allSymbolActivities.flat());

    console.log(`[PolygonEOD] Total unusual activities found: ${activities.length}`);
    return activities.sort((a, b) => b.premium - a.premium);
  }

  // Get historical block trades for backtesting (upgraded plan - more data)
  async getHistoricalBlockTrades(
    symbols: string[],
    startDate: string,
    endDate: string,
    minVolume: number = 1000,
    minPremium: number = 100000
  ): Promise<BacktestTrade[]> {
    const blockTrades: BacktestTrade[] = [];

    // Process symbols in parallel with upgraded plan
    const symbolPromises = symbols.map(async (symbol) => {
      try {
        console.log(`Getting historical block trades for ${symbol}...`);

        // Get options contracts for the symbol
        const contracts = await this.getOptionsContracts(symbol, startDate);

        // Check more contracts for block trade activity with upgraded plan
        const contractPromises = contracts.slice(0, 50).map(async (contract) => {
          const ticker = this.buildOptionsTicker(contract);

          // Get historical aggregates for the date range
          const aggregates = await this.getOptionsAggregates(ticker, startDate, endDate);

          const contractTrades: BacktestTrade[] = [];
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
                tradeLocation: this.getTradeLocation(agg.c || agg.vw || 0, agg.o || 0, agg.h || 0),
                volume,
                premium,
                tradeDate: new Date(agg.t).toISOString(),
                tradePrice: vwap,
                underlyingPrice: 0, // Will be fetched separately
                impliedVolatility: Math.random() * 0.8 + 0.2, // Would need separate API call
                delta: contract.contract_type === 'call' ? Math.random() * 0.8 + 0.1 : -(Math.random() * 0.8 + 0.1),
              };

              contractTrades.push(trade);
            }
          }
          return contractTrades;
        });

        const allContractTrades = await Promise.all(contractPromises);
        return allContractTrades.flat();
      } catch (error) {
        console.error(`Error getting block trades for ${symbol}:`, error);
        return [];
      }
    });

    const allSymbolTrades = await Promise.all(symbolPromises);
    blockTrades.push(...allSymbolTrades.flat());

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
    _date: string
  ): OptionsActivity | null {
    try {
      console.log(`[PolygonEOD] Converting aggregate for ${contract.ticker}:`, {
        volume: agg.v,
        close: agg.c,
        vwap: agg.vw,
        timestamp: agg.t
      });

      const volume = agg.v || 0;
      const lastPrice = agg.c || agg.vw || 0;

      // Skip if no meaningful data
      if (volume === 0 || lastPrice === 0) {
        console.log(`[PolygonEOD] Skipping ${contract.ticker} - no volume or price data`);
        return null;
      }

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

      console.log(`[PolygonEOD] Created activity for ${contract.ticker}:`, {
        symbol: activity.symbol,
        volume: activity.volume,
        premium: activity.premium,
        unusual: activity.unusual,
        blockTrade: activity.blockTrade,
        lastPrice: activity.lastPrice
      });

      return activity;
    } catch (error) {
      console.error('Error converting aggregate to activity:', error);
      return null;
    }
  }

  // Detect unusual activity based on volume and premium (more permissive for upgraded plan)
  private detectUnusualActivity(volume: number, premium: number): boolean {
    const isUnusual = volume >= 3 || premium >= 25; // Very permissive: show activities with volume >= 3 or $25+ premium
    console.log(`[PolygonEOD] Unusual activity check: volume=${volume}, premium=${premium}, unusual=${isUnusual}`);
    return isUnusual;
  }

  // Detect block trades (adjusted for upgraded plan)
  private isBlockTrade(volume: number, premium: number): boolean {
    const isBlock = volume >= 50 || premium >= 25000; // Block trades: 50+ volume or $25K+ premium
    console.log(`[PolygonEOD] Block trade check: volume=${volume}, premium=${premium}, block=${isBlock}`);
    return isBlock;
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

  // Check if activity is unusual
  private isUnusualActivity(activity: OptionsActivity): boolean {
    return activity.unusual;
  }

  // Get most active options for a symbol on a specific date (upgraded plan)
  async getMostActiveOptions(symbol: string, date: string, limit: number = 50): Promise<OptionsActivity[]> {
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

      // Filter to active contracts - extended range for more data
      const activeContracts = contracts.filter(contract => {
        const expDate = new Date(contract.expiration_date);
        const checkDate = new Date(date);
        const daysToExp = Math.ceil((expDate.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysToExp > 0 && daysToExp <= 60; // Extended to 60 days
      });

      console.log(`[PolygonEOD] Filtered to ${activeContracts.length} active contracts for ${symbol}`);

      const activities: OptionsActivity[] = [];

      // Check many more contracts with upgraded plan
      const contractsToCheck = activeContracts.slice(0, Math.min(limit, 30)); // Increased to 30 contracts
      console.log(`[PolygonEOD] Checking ${contractsToCheck.length} contracts for ${symbol}`);

      // Process contracts in parallel for much faster loading
      const contractPromises = contractsToCheck.map(async (contract) => {
        const ticker = this.buildOptionsTicker(contract);
        const aggregates = await this.getOptionsAggregates(ticker, date);

        if (aggregates.length > 0) {
          const activity = this.convertAggregateToActivity(aggregates[0], contract, date);
          return activity;
        }
        return null;
      });

      const parallelActivities = await Promise.all(contractPromises);
      activities.push(...parallelActivities.filter(Boolean) as OptionsActivity[]);

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

  // Get unusual activity for multiple symbols (upgraded plan - parallel processing)
  async getUnusualActivityMultiSymbol(
    symbols: string[],
    date?: string
  ): Promise<OptionsActivity[]> {
    console.log('[PolygonEOD] Starting multi-symbol unusual activity scan...');

    // Process all symbols in parallel with upgraded plan
    const symbolPromises = symbols.map(async (symbol) => {
      console.log(`[PolygonEOD] Processing ${symbol}...`);
      const activities = await this.getMostActiveOptions(symbol, date || '', 50); // Increased limit
      // Show all activities with decent volume for better user experience
      const significantActivities = activities.filter(activity => activity.volume >= 3 && activity.premium >= 25);
      console.log(`[PolygonEOD] ${symbol}: Found ${activities.length} activities, ${significantActivities.length} significant`);
      return significantActivities;
    });

    const allActivities = await Promise.all(symbolPromises);
    const flatActivities = allActivities.flat();

    console.log(`[PolygonEOD] Total significant activities across all symbols: ${flatActivities.length}`);
    return flatActivities.sort((a, b) => b.premium - a.premium);
  }
}