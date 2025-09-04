import React from 'react';
import { TrendingUp, TrendingDown, Zap, Activity } from 'lucide-react';
import { OptionsActivity, DataSource } from '../types/options';
import { useMarketStatus } from '../hooks/useMarketStatus';

interface StatsOverviewProps {
  activities: OptionsActivity[];
  dataSource?: DataSource;
}

export function StatsOverview({ activities, dataSource = 'realtime' }: StatsOverviewProps) {
  const marketStatus = useMarketStatus();

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

  // Don't show data when market is completely closed
  if (!marketStatus || marketStatus.currentPeriod === 'closed') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-gray-100 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gray-400">--</div>
            <div className="text-xs text-gray-400 font-medium">Market Closed</div>
          </div>
        ))}
      </div>
    );
  }

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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
      <div className="bg-white rounded-lg shadow-sm p-3 border">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 mb-1">
              Total Volume
              {dataSource === 'realtime' && <span className="text-xs text-green-600 block font-semibold">LIVE</span>}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {formatNumber(stats.totalVolume)}
            </p>
          </div>
          <div className="flex-shrink-0 bg-blue-50 p-2 rounded">
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3 border">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 mb-1">
              Total Premium
              {dataSource === 'realtime' && <span className="text-xs text-green-600 block font-semibold">LIVE</span>}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(stats.totalPremium)}
            </p>
          </div>
          <div className="flex-shrink-0 bg-green-50 p-2 rounded">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3 border">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 mb-1">Block Trades</p>
            <p className="text-lg font-bold text-gray-900">
              {stats.blockTrades}
            </p>
          </div>
          <div className="flex-shrink-0 bg-yellow-50 p-2 rounded">
            <Zap className="w-4 h-4 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3 border">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 mb-1">Total Alerts</p>
            <p className="text-lg font-bold text-gray-900">
              {stats.totalTrades}
            </p>
          </div>
          <div className="flex-shrink-0 bg-purple-50 p-2 rounded">
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3 border">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 mb-1">Bullish</p>
            <p className="text-lg font-bold text-green-600">
              {stats.bullishTrades}
            </p>
          </div>
          <div className="flex-shrink-0 bg-green-50 p-2 rounded">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3 border">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 mb-1">Bearish</p>
            <p className="text-lg font-bold text-red-600">
              {stats.bearishTrades}
            </p>
          </div>
          <div className="flex-shrink-0 bg-red-50 p-2 rounded">
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
}