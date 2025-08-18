import React from 'react';
import { TrendingUp, TrendingDown, Zap, Activity } from 'lucide-react';
import { OptionsActivity } from '../types/options';

interface StatsOverviewProps {
  activities: OptionsActivity[];
  dataSource?: 'mock' | 'realtime' | 'eod';
}

export function StatsOverview({ activities, dataSource = 'mock' }: StatsOverviewProps) {
  const stats = React.useMemo(() => {
    const totalVolume = activities.reduce((sum, activity) => sum + activity.volume, 0);
    const totalPremium = activities.reduce((sum, activity) => sum + activity.premium, 0);
    const blockTrades = activities.filter(activity => activity.blockTrade).length;
    const bullishTrades = activities.filter(activity => activity.sentiment === 'bullish').length;
    const bearishTrades = activities.filter(activity => activity.sentiment === 'bearish').length;

    return {
      totalVolume,
      totalPremium,
      blockTrades,
      bullishTrades,
      bearishTrades,
      totalTrades: activities.length,
    };
  }, [activities]);

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-sm p-4 border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Total Volume
              {dataSource === 'eod' && <span className="text-xs text-blue-600 block">EOD</span>}
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {formatNumber(stats.totalVolume)}
            </p>
          </div>
          <Activity className="w-5 h-5 text-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Total Premium
              {dataSource === 'eod' && <span className="text-xs text-blue-600 block">EOD</span>}
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(stats.totalPremium)}
            </p>
          </div>
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Block Trades</p>
            <p className="text-lg font-semibold text-gray-900">
              {stats.blockTrades}
            </p>
          </div>
          <Zap className="w-5 h-5 text-yellow-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Alerts</p>
            <p className="text-lg font-semibold text-gray-900">
              {stats.totalTrades}
            </p>
          </div>
          <Activity className="w-5 h-5 text-purple-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Bullish</p>
            <p className="text-lg font-semibold text-green-600">
              {stats.bullishTrades}
            </p>
          </div>
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Bearish</p>
            <p className="text-lg font-semibold text-red-600">
              {stats.bearishTrades}
            </p>
          </div>
          <TrendingDown className="w-5 h-5 text-red-500" />
        </div>
      </div>
    </div>
  );
}