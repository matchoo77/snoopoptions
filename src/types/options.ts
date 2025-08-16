export interface OptionsActivity {
  id: string;
  symbol: string;
  strike: number;
  expiration: string;
  type: 'call' | 'put';
  volume: number;
  openInterest: number;
  lastPrice: number;
  bid: number;
  ask: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  premium: number;
  timestamp: string;
  unusual: boolean;
  blockTrade: boolean;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface FilterOptions {
  minVolume: number;
  minPremium: number;
  maxDaysToExpiration: number;
  optionTypes: ('call' | 'put')[];
  sentiment: ('bullish' | 'bearish' | 'neutral')[];
  blockTradesOnly: boolean;
  minOpenInterest: number;
  symbols: string[];
  searchSymbol: string;
  showFavoritesOnly: boolean;
}

export interface FavoriteAlert {
  id: string;
  activityId: string;
  timestamp: string;
  note?: string;
}