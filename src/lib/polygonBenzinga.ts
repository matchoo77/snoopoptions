export interface BenzingaRating {
  ticker: string;
  action_type: string;
  analyst?: string;
  firm?: string;
  rating_change?: string;
  price_target_change?: string;
  date?: string;
}


export interface OptionsTradeResult {
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


import { getResolvedSupabaseUrl, getResolvedSupabaseAnonKey } from './supabase';

export class PolygonBenzingaService {
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor() {
    // Use resolved Supabase config to avoid missing env issues
    this.supabaseUrl = getResolvedSupabaseUrl();
    this.supabaseAnonKey = getResolvedSupabaseAnonKey();
  }

  async fetchTodaysBenzingaRatings(limit: number = 50): Promise<BenzingaRating[]> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/benzinga-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
        body: JSON.stringify({ action: 'analyst-actions', noMock: true, limit }),
      });

      if (!response.ok) {
        throw new Error(`Benzinga proxy error: ${response.status} ${response.statusText}`);
      }

  const data = await response.json();
      const actions = (data.actions || []) as Array<{
        ticker: string;
        actionType: string;
        analystFirm?: string;
        actionDate?: string;
      }>;

      // Map to a BenzingaRating-shaped object so formatActionType can still work if needed
  return actions.map((a) => ({
        ticker: a.ticker,
        action_type: a.actionType,
        firm: a.analystFirm,
        date: a.actionDate,
      }));
    } catch (error) {
      console.warn('[PolygonBenzingaService] Error fetching Benzinga ratings via proxy:', error);
      return [];
    }
  }

  async fetchOptionsTradesForTicker(ticker: string): Promise<OptionsTradeResult[]> {
    try {
      console.log(`🔄 [PolygonBenzinga] Fetching options trades for ${ticker} via Supabase proxy...`);
      const startTime = Date.now();
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/benzinga-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
        body: JSON.stringify({
          action: 'block-trades',
          ticker: ticker,
          lookbackDays: 7 // Increased for better data coverage
        })
      });
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ [PolygonBenzinga] Request completed in ${duration}ms`);
      
      if (!response.ok) {
        throw new Error(`Benzinga proxy error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📊 [PolygonBenzinga] Raw benzinga-proxy response for ${ticker}:`, {
        hasBlockTrades: !!data.blockTrades,
        blockTradesCount: data.blockTrades?.length || 0,
        hasError: !!data.error,
        sampleTrade: data.blockTrades?.[0],
        fullResponse: data
      });
      
      if (data.error) {
        throw new Error(`Benzinga proxy returned error: ${data.error}`);
      }
      
      const blockTrades = data.blockTrades || [];
      
      if (blockTrades.length === 0) {
        console.warn(`📭 [PolygonBenzinga] No block trades returned for ${ticker}`);
        return [];
      }

      console.log(`🔄 [PolygonBenzinga] Processing ${blockTrades.length} trades from edge function...`);

      // The edge function now returns data in the format we need, so we just need to convert it to OptionsTradeResult format
      const trades: OptionsTradeResult[] = blockTrades.map((trade: any, index: number) => {
        // Better timestamp handling - use the original timestamp if available, otherwise parse date/time
        let timestamp: number;
        
        if (trade.originalTimestamp && typeof trade.originalTimestamp === 'number') {
          // Use original timestamp if available
          timestamp = trade.originalTimestamp;
        } else {
          // Parse date and time from the edge function response
          try {
            // Handle formats like "19:31" -> "2025-09-03T19:31:00.000Z"
            const timeStr = trade.time.includes(':') ? `${trade.time}:00` : trade.time;
            const dateTimeStr = `${trade.date}T${timeStr}.000Z`;
            timestamp = new Date(dateTimeStr).getTime();
            
            // If parsing failed, use current time
            if (isNaN(timestamp)) {
              console.warn(`❌ [PolygonBenzinga] Failed to parse timestamp for trade ${index}: ${dateTimeStr}`);
              timestamp = Date.now();
            }
          } catch (error) {
            console.warn(`❌ [PolygonBenzinga] Error parsing timestamp for trade ${index}:`, error);
            timestamp = Date.now();
          }
        }
        
        const result: OptionsTradeResult = {
          conditions: trade.tradeLocation === 'Above Ask' ? [4] : 
                     trade.tradeLocation === 'At Ask' ? [1] :
                     trade.tradeLocation === 'At Bid' ? [2] :
                     trade.tradeLocation === 'Below Bid' ? [3] : [1],
          exchange: 1,
          participant_timestamp: timestamp,
          price: trade.price || 0,
          size: trade.volume || 0,
          sip_timestamp: timestamp,
          timeframe: 'REAL_TIME',
          details: {
            contract_type: trade.optionType === 'unknown' ? 'call' : trade.optionType,
            exercise_style: 'american',
            expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            strike_price: trade.strike || 0,
            ticker: ticker,
          },
          amount: trade.amount || 0,
        };
        
        if (index < 3) { // Log first 3 trades for debugging
          console.log(`🔧 [PolygonBenzinga] Converted trade ${index}:`, { 
            original: trade, 
            converted: result,
            timestamp: new Date(timestamp).toISOString()
          });
        }
        
        return result;
      });
      
      console.log(`✅ [PolygonBenzinga] Successfully converted ${trades.length} trades for ${ticker}`);
      return trades.sort((a, b) => (b.amount || 0) - (a.amount || 0));
    } catch (error) {
      console.error('❌ [PolygonBenzinga] Error fetching options trades:', error);
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