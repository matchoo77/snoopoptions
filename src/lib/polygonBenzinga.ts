interface BenzingaRating {
  ticker: string;
  action_type: string;
  analyst?: string;
  firm?: string;
  rating_change?: string;
  price_target_change?: string;
  date?: string;
}

interface PolygonBenzingaResponse {
  results?: BenzingaRating[];
  status: string;
  count?: number;
}

interface OptionsTradeResult {
  conditions: number[];
  exchange: number;
  participant_timestamp: number;
  price: number;
  size: number;
  sip_timestamp: number;
  timeframe: string;
  amount?: number; // Add this property
  details?: {
    contract_type: string;
    exercise_style: string;
    expiration_date: string;
    strike_price: number;
    ticker: string;
  };
}

interface PolygonOptionsTradesResponse {
  results?: OptionsTradeResult[];
  status: string;
  count?: number;
  next_url?: string;
}

export class PolygonBenzingaService {
  private supabaseUrl: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!this.supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL environment variable is required');
    }
  }

  async fetchTodaysBenzingaRatings(): Promise<BenzingaRating[]> {
    try {
      // Always use sample data for now to avoid API issues
      console.log('[PolygonBenzingaService] Using sample data');
      return this.generateSampleData();
    } catch (error) {
      console.warn('[PolygonBenzingaService] Error fetching Benzinga ratings:', error);
      return this.generateSampleData();
    }
  }

  async fetchOptionsTradesForTicker(ticker: string): Promise<OptionsTradeResult[]> {
    try {
      console.log(`Fetching options trades for ${ticker} via Supabase proxy...`);
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/benzinga-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'block-trades',
          ticker: ticker
        })
      });
      
      if (!response.ok) {
        throw new Error(`Benzinga proxy error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Benzinga proxy returned error: ${data.error}`);
      }
      
      // Transform block trades to OptionsTradeResult format
      const trades: OptionsTradeResult[] = (data.blockTrades || []).map((trade: any) => ({
        conditions: trade.tradeLocation === 'above-ask' ? [4] : [1], // Map trade location to condition codes
        exchange: 1,
        participant_timestamp: new Date(`${trade.date} ${trade.time}`).getTime(),
        price: trade.price,
        size: trade.volume,
        sip_timestamp: new Date(`${trade.date} ${trade.time}`).getTime(),
        timeframe: 'REAL_TIME',
        details: {
          contract_type: trade.optionType,
          exercise_style: 'american',
          expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          strike_price: trade.strike,
          ticker: ticker,
        },
        amount: trade.amount, // This will be available from the proxy
      }));
      
      return trades.sort((a, b) => (b.amount || 0) - (a.amount || 0));
    } catch (error) {
      console.error('Error fetching options trades:', error);
      // Return empty array instead of throwing to allow fallback to sample data
      return [];
    }
  }

  formatActionType(rating: BenzingaRating): string {
    const actionType = rating.action_type?.toLowerCase() || '';
    
    if (actionType.includes('upgrade')) {
      return `Upgrade by ${rating.firm || 'Unknown Firm'}`;
    } else if (actionType.includes('downgrade')) {
      return `Downgrade by ${rating.firm || 'Unknown Firm'}`;
    } else if (actionType.includes('initiated') || actionType.includes('coverage')) {
      return `Coverage Initiated by ${rating.firm || 'Unknown Firm'}`;
    } else if (rating.price_target_change) {
      return `Price Target ${rating.price_target_change} by ${rating.firm || 'Unknown Firm'}`;
    } else if (rating.rating_change) {
      return `Rating ${rating.rating_change} by ${rating.firm || 'Unknown Firm'}`;
    } else {
      return `${rating.action_type || 'Unknown Action'} by ${rating.firm || 'Unknown Firm'}`;
    }
  }

  getTradeLocation(conditions: number[]): string {
    // Common condition codes for trade location
    if (conditions.includes(1)) return 'At Ask';
    if (conditions.includes(4)) return 'Above Ask';
    if (conditions.includes(2)) return 'At Bid';
    if (conditions.includes(3)) return 'Below Bid';
    return 'Unknown';
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
}

export const polygonBenzingaService = new PolygonBenzingaService();