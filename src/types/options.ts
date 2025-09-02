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
  tradeLocation: 'below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask';
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

export interface TopMover {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  avgVolume?: number;
}

export type DataSource = 'none' | 'realtime' | 'eod' | 'polygon';

export interface FilterOptions {
  minVolume: number;
  minPremium: number;
  maxDaysToExpiration: number;
  optionTypes: ('call' | 'put')[];
  sentiment: ('bullish' | 'bearish' | 'neutral')[];
  tradeLocations: ('below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask')[];
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