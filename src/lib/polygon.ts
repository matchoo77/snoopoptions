// Polygon.io API client for options data
export interface OptionsContract {
  underlying_ticker: string;
  expiration_date: string;
  contract_type: 'call' | 'put';
  strike_price: number;
}

export interface OptionsQuote {
  ticker: string;
  last_trade?: {
    price: number;
    timestamp: number;
  };
  last_quote?: {
    bid: number;
    ask: number;
  };
  open_interest?: number;
  implied_volatility?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
}

export class PolygonAPI {
  private apiKey: string;
  private ws: WebSocket | null = null;
  private setIsConnected: (connected: boolean) => void;
  private setError: (error: string | null) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    _apiKey: string,
    setIsConnected: (connected: boolean) => void,
    setError: (error: string | null) => void
  ) {
    this.apiKey = 'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X';
    this.setIsConnected = setIsConnected;
    this.setError = setError;
  }

  connectWebSocket(onData: (data: any[]) => void, onError?: (error: string) => void) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[Polygon] WebSocket already connected');
      return;
    }

    console.log('[Polygon] Connecting to options WebSocket...');
    this.ws = new WebSocket('wss://socket.polygon.io/options');

    this.ws.onopen = () => {
      console.log('[Polygon] ✅ WebSocket connected');
      this.setIsConnected(true);
      this.setError(null);
      this.reconnectAttempts = 0;

      // Authenticate
      const authMessage = {
        action: 'auth',
        params: this.apiKey
      };
      console.log('[Polygon] 🔐 Authenticating...');
      this.ws?.send(JSON.stringify(authMessage));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[Polygon] 📨 Received message:', data);

        if (Array.isArray(data)) {
          data.forEach(msg => {
            if (msg.ev === 'status') {
              if (msg.status === 'auth_success') {
                console.log('[Polygon] ✅ Authentication successful');

                // Subscribe to options trades
                const subscribeMessage = {
                  action: 'subscribe',
                  params: 'T.O:*' // All options trades (15-min delayed)
                };
                console.log('[Polygon] 📡 Subscribing to options trades...');
                this.ws?.send(JSON.stringify(subscribeMessage));
              } else if (msg.status === 'auth_failed') {
                console.log('[Polygon] ❌ Authentication failed');
                this.setError('Authentication failed. Please check your API key.');
                this.setIsConnected(false);
              } else if (msg.status === 'success' && msg.message?.includes('subscribed')) {
                console.log('[Polygon] ✅ Successfully subscribed to options trades');
              }
            } else if (msg.ev === 'T' && msg.sym?.startsWith('O:')) {
              console.log('[Polygon] 📈 Options trade received:', msg.sym, 'size:', msg.s, 'price:', msg.p);
            }
          });

          // Pass all data to the handler
          onData(data);
        }
      } catch (error) {
        console.error('[Polygon] Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('[Polygon] WebSocket closed:', event.code, event.reason);
      this.setIsConnected(false);

      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(`[Polygon] Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connectWebSocket(onData, onError);
        }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
      }
    };

    this.ws.onerror = (error) => {
      console.error('[Polygon] WebSocket error:', error);
      this.setError('WebSocket connection failed. Please verify your Polygon.io API key and subscription.');
      this.setIsConnected(false);
      onError?.('WebSocket connection failed');
    };
  }

  disconnect() {
    if (this.ws) {
      console.log('[Polygon] Disconnecting WebSocket...');
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
    this.setIsConnected(false);
  }

  async getOptionsContracts(symbol: string): Promise<OptionsContract[]> {
    try {
      const response = await fetch(
        `https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=${symbol}&limit=1000&apikey=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching options contracts:', error);
      throw error;
    }
  }

  async getOptionsQuotes(tickers: string[]): Promise<OptionsQuote[]> {
    try {
      const quotes: OptionsQuote[] = [];

      // Process in larger batches with upgraded plan
      for (let i = 0; i < tickers.length; i += 50) { // Increased batch size
        const batch = tickers.slice(i, i + 50);
        const tickerParam = batch.join(',');

        const response = await fetch(
          `https://api.polygon.io/v3/snapshot/options/${tickerParam}?apikey=${this.apiKey}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.results) {
            quotes.push(...data.results);
          }
        }

        // No delay needed with upgraded plan
      }

      return quotes;
    } catch (error) {
      console.error('Error fetching options quotes:', error);
      throw error;
    }
  }
}

// Utility functions for options analysis
export function detectUnusualActivity(
  volume: number,
  avgVolume: number,
  openInterest: number,
  premium: number
): boolean {
  const volumeRatio = avgVolume > 0 ? volume / avgVolume : 1;
  const oiRatio = openInterest > 0 ? volume / openInterest : 0;

  return (
    volumeRatio >= 2 || // Volume 2x average
    oiRatio >= 0.5 || // Volume is 50%+ of open interest
    premium >= 50000 // Premium over $50k
  );
}

export function isBlockTrade(volume: number, premium: number): boolean {
  return volume >= 100 || premium >= 100000; // 100+ contracts or $100k+ premium
}

export function calculateSentiment(
  type: 'call' | 'put',
  delta: number,
  volume: number
): 'bullish' | 'bearish' | 'neutral' {
  if (type === 'call' && delta > 0.3) return 'bullish';
  if (type === 'put' && delta < -0.3) return 'bearish';
  return 'neutral';
}