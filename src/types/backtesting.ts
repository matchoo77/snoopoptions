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
  stockMovement: number; // Percentage change
  targetReached: boolean;
  daysToTarget: number;
  actualDays: number; // How many days it actually took
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
    small: { total: number; successful: number; rate: number }; // < $100k
    medium: { total: number; successful: number; rate: number }; // $100k - $500k
    large: { total: number; successful: number; rate: number }; // > $500k
  };
}

export interface BacktestParams {
  startDate: string;
  endDate: string;
  targetMovement: number; // Percentage (e.g., 5 for 5%)
  timeHorizon: number; // Days to measure outcome
  minVolume: number;
  minPremium: number;
  symbols: string[]; // Empty array means all symbols
  optionTypes: ('call' | 'put')[];
  tradeLocations: ('below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask')[];
}

export interface SnoopAlertConfig {
  enabled: boolean;
  minDollarAmount: number;
  timeWindow: number; // Hours
  tradeLocations: ('below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask')[];
  optionTypes: ('call' | 'put')[];
  symbols: string[]; // Empty means all symbols
}