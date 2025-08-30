// Legacy backtesting types - keeping for compatibility
export interface BacktestTrade {
  id: string;
  symbol: string;
  strike: number;
  expiration: string;
  type: 'call' | 'put';
  tradeLocation: 'below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask';
  volume: number;
  premium: number;
  tradeDate: string;
  tradePrice: number;
  underlyingPrice: number;
  impliedVolatility: number;
  delta: number;
}

export interface SnoopAlertConfig {
  enabled: boolean;
  minDollarAmount: number;
  timeWindow: number;
  tradeLocations: ('below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask')[];
  optionTypes: ('call' | 'put')[];
  symbols: string[];
  minVolume: number;
  minPremium: number;
}