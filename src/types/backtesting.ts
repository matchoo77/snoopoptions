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

export interface BacktestResult {
  tradeId: string;
  symbol: string;
  tradeDate: string;
  type: 'call' | 'put';
  tradeLocation: 'below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask';
  premium: number;
  underlyingPriceAtTrade: number;
  underlyingPriceAtTarget: number;
  stockMovement: number;
  targetReached: boolean;
  daysToTarget: number;
  actualDays: number;
}

export interface BacktestSummary {
  totalTrades: number;
  successfulTrades: number;
  successRate: number;
  averageStockMovement: number;
  averageDaysToTarget: number;
  bestTrade: BacktestResult | null;
  worstTrade: BacktestResult | null;
  breakdownByType: {
    calls: { total: number; successful: number; rate: number };
    puts: { total: number; successful: number; rate: number };
  };
  breakdownBySector: Record<string, { total: number; successful: number; rate: number }>;
  breakdownByPremium: {
    small: { total: number; successful: number; rate: number };
    medium: { total: number; successful: number; rate: number };
    large: { total: number; successful: number; rate: number };
  };
}

export interface BacktestParams {
  symbols: string[];
  startDate: string;
  endDate: string;
  optionTypes: ('call' | 'put')[];
  tradeLocations: ('below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask')[];
  minVolume: number;
  minPremium: number;
  targetMovement: number;
  timeHorizon: number;
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