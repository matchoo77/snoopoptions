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
  private baseUrl = 'https://api.polygon.io';
  private apiKey: string;
  private rateLimitDelay = 12000; // 12 seconds between calls (5 calls per minute)
  private lastCallTime = 0;

  constructor() {
    this.apiKey = import.meta.env.VITE_POLYGON_API_KEY;
    if (!this.apiKey) {
      throw new Error('VITE_POLYGON_API_KEY environment variable is required');
    }
  }

  private async rateLimitedFetch(url: string): Promise<Response> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastCall;
      console.log(`Rate limiting: waiting ${waitTime}ms before next API call`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastCallTime = Date.now();
    return fetch(url);
  }

  async fetchTodaysBenzingaRatings(): Promise<BenzingaRating[]> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const url = `${this.baseUrl}/v1/benzinga/ratings?date=${today}&apikey=${this.apiKey}`;
      
      console.log('Fetching Benzinga ratings for:', today);
      
      const response = await this.rateLimitedFetch(url);
      
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
      }
      
      const data: PolygonBenzingaResponse = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Polygon API returned status: ${data.status}`);
      }
      
      // Transform the response to match our interface
      const ratings: BenzingaRating[] = (data.results || []).map(result => ({
        ticker: result.ticker || '',
        action_type: result.action_type || 'Unknown',
        analyst: result.analyst || '',
        firm: result.firm || '',
        rating_change: result.rating_change || '',
        price_target_change: result.price_target_change || '',
        date: result.date || today,
      }));
      
      return ratings;
    } catch (error) {
      console.error('Error fetching Benzinga ratings:', error);
      throw error;
    }
  }

  async fetchOptionsTradesForTicker(ticker: string): Promise<OptionsTradeResult[]> {
    try {
      // Construct URL with exact parameters specified
      const url = `${this.baseUrl}/v3/trades/options/${ticker}?` + 
        `order=desc` +
        `&limit=50` +
        `&conditions=at,above_ask` +
        `&apikey=${this.apiKey}`;
      
      console.log('Fetching options trades for ticker:', ticker);
      
      const response = await this.rateLimitedFetch(url);
      
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
      }
      
      const data: PolygonOptionsTradesResponse = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Polygon API returned status: ${data.status}`);
      }
      
      // Calculate amounts and sort by amount desc
      const trades = data.results || [];
      const tradesWithAmounts = trades
        .map(trade => ({
          ...trade,
          amount: trade.size * trade.price * 100 // Calculate dollar amount as specified
        }))
        .sort((a, b) => b.amount - a.amount); // Sort by amount descending
      
      return tradesWithAmounts;
    } catch (error) {
      console.error('Error fetching options trades:', error);
      throw error;
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
