interface PolygonConfig {
  apiKey: string;
  baseUrl: string;
  websocketUrl: string;
}

interface OptionsContract {
  underlying_ticker: string;
  contract_type: 'call' | 'put';
  strike_price: number;
  expiration_date: string;
}

interface OptionsQuote {
  ticker: string;
  last_quote?: {
    bid: number;
    ask: number;
    last_updated: number;
  };
  last_trade?: {
    price: number;
    size: number;
    timestamp: number;
  };
  implied_volatility?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  open_interest?: number;
}

interface OptionsAgg {
  ticker: string;
  volume: number;
  vwap: number;
  open: number;
  close: number;
  high: number;
  low: number;
  timestamp: number;
}

export class PolygonAPI {
  private config: PolygonConfig;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private _setIsConnected?: (connected: boolean) => void;
  private _setError?: (error: string | null) => void;

  constructor(apiKey: string, setIsConnected?: (connected: boolean) => void, setError?: (error: string | null) => void) {
    this.config = {
      apiKey,
      baseUrl: 'https://api.polygon.io',
      websocketUrl: 'wss://socket.polygon.io/options',
    };
    this._setIsConnected = setIsConnected;
    this._setError = setError;
  }

  // Get options contracts for a symbol
  async getOptionsContracts(symbol: string): Promise<OptionsContract[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v3/reference/options/contracts?underlying_ticker=${symbol}&limit=1000&apikey=${this.config.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching options contracts:', error);
      return [];
    }
  }

  // Get options quotes for specific contracts
  async getOptionsQuotes(tickers: string[]): Promise<OptionsQuote[]> {
    try {
      const tickerParam = tickers.join(',');
      const response = await fetch(
        `${this.config.baseUrl}/v3/quotes/${tickerParam}?apikey=${this.config.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching options quotes:', error);
      return [];
    }
  }

  // Get aggregated options data (volume, etc.)
  async getOptionsAggregates(ticker: string, startDate: string, endDate?: string): Promise<OptionsAgg[]> {
    const toDate = endDate || startDate;
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${toDate}?adjusted=true&sort=asc&apikey=${this.config.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching options aggregates:', error);
      return [];
    }
  }

  // Get historical stock price data
  async getStockAggregates(symbol: string, startDate: string, endDate?: string): Promise<any[]> {
    const toDate = endDate || startDate;
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v2/aggs/ticker/${symbol}/range/1/day/${startDate}/${toDate}?adjusted=true&sort=asc&apikey=${this.config.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching stock aggregates:', error);
      return [];
    }
  }

  // Connect to real-time WebSocket feed
  connectWebSocket(onMessage: (data: any) => void, onError?: (error: Event) => void): void {
    try {
      this.ws = new WebSocket(this.config.websocketUrl);
      
      this.ws.onopen = () => {
        console.log('Connected to Polygon WebSocket');
        this.reconnectAttempts = 0;
        this._setIsConnected?.(true);
        
        // Use setTimeout to ensure connection is fully established
        setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            // Authenticate
            this.ws.send(JSON.stringify({
              action: 'auth',
              params: this.config.apiKey
            }));
            
            // Subscribe to options trades and quotes after authentication
            setTimeout(() => {
              if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                  action: 'subscribe',
                  params: 'T.*' // All options trades (15-min delayed for paid subscription)
                }));
              }
            }, 100);
          }
        }, 100);
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle authentication response
          if (data[0]?.ev === 'status' && data[0]?.status === 'auth_success') {
            console.log('Polygon WebSocket authenticated successfully');
            return;
          }
          
          // Handle subscription confirmation
          if (data[0]?.ev === 'status' && data[0]?.status === 'success') {
            console.log('Polygon WebSocket subscription confirmed');
            console.log('Now receiving 15-minute delayed options data');
            return;
          }
          
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('Polygon WebSocket disconnected');
        this._setIsConnected?.(false);
        this.handleReconnect(onMessage, onError);
      };
      
      this.ws.onerror = (error) => {
        console.error('Polygon WebSocket connection failed - check API key and subscription');
        this._setIsConnected?.(false);
        this._setError?.('WebSocket connection failed. Please verify your Polygon.io API key and subscription.');
        if (onError) onError(error);
      };
    } catch (error) {
      console.error('Error connecting to Polygon WebSocket:', error);
      this._setError?.('Failed to establish WebSocket connection');
      if (onError) onError(error as Event);
    }
  }

  private handleReconnect(onMessage: (data: any) => void, onError?: (error: Event) => void): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connectWebSocket(onMessage, onError);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._setIsConnected?.(false);
  }

  // Get market status
  async getMarketStatus(): Promise<{ market: string; serverTime: string; exchanges: any }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v1/marketstatus/now?apikey=${this.config.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching market status:', error);
      throw error;
    }
  }
}

// Utility functions for detecting unusual activity
export function detectUnusualActivity(
  currentVolume: number,
  averageVolume: number,
  openInterest: number,
  premium: number
): boolean {
  const volumeRatio = averageVolume > 0 ? currentVolume / averageVolume : 0;
  
  // Consider unusual if:
  // - Volume is 3x+ average volume
  // - Premium is over $50,000
  // - Volume is over 1000 contracts with low open interest
  return (
    volumeRatio >= 3 ||
    premium >= 50000 ||
    (currentVolume >= 1000 && openInterest < currentVolume * 2)
  );
}

export function isBlockTrade(volume: number, premium: number): boolean {
  // Block trade criteria:
  // - Volume over 1000 contracts OR
  // - Premium over $100,000
  return volume >= 1000 || premium >= 100000;
}

export function calculateSentiment(
  type: 'call' | 'put',
  delta: number,
  volume: number
): 'bullish' | 'bearish' | 'neutral' {
  if (type === 'call' && delta > 0.3) return 'bullish';
  if (type === 'put' && delta < -0.3) return 'bearish';
  if (volume < 500) return 'neutral';
  
  // For high volume trades, lean toward the option type
  return type === 'call' ? 'bullish' : 'bearish';
}