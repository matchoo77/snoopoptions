export interface SnoopTestParams {
  ticker: string;
  startDate: string;
  endDate: string;
  holdPeriod: number; // 1-30 days
  tradeLocations: TradeLocation[];
}

export type TradeLocation = 'below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask';

export interface OptionsSweep {
  id: string;
  ticker: string;
  date: string;
  optionType: 'call' | 'put';
  volume: number;
  price: number;
  bid: number;
  ask: number;
  tradeLocation: TradeLocation;
  inferredSide: 'buy' | 'sell' | 'neutral';
  timestamp: string;
}

export interface SnoopTestResult {
  id: string;
  date: string;
  ticker: string;
  optionType: 'call' | 'put';
  tradeLocation: TradeLocation;
  inferredSide: 'buy' | 'sell' | 'neutral';
  entryPrice: number;
  exitPrice: number;
  percentChange: number;
  isWin: boolean;
  holdDays: number;
}

export interface SnoopTestSummary {
  totalTrades: number;
  neutralTrades: number;
  nonNeutralTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  averageMove: number;
  bestTrade: SnoopTestResult | null;
  worstTrade: SnoopTestResult | null;
  breakdownByLocation: Record<TradeLocation, {
    total: number;
    wins: number;
    winRate: number;
    avgMove: number;
  }>;
}

export interface AlertCriteria {
  id: string;
  userId: string;
  ticker: string;
  tradeLocations: TradeLocation[];
  minWinRate: number;
  notificationType: 'email' | 'browser';
  isActive: boolean;
  createdAt: string;
}