import React from 'react';
import { TrendingUp, TrendingDown, Zap, Activity } from 'lucide-react';
import { OptionsActivity, DataSource } from '../types/options';

interface StatsOverviewProps {
  activities: OptionsActivity[];
  dataSource?: DataSource;
}

export function StatsOverview({ activities, dataSource = 'realtime' }: StatsOverviewProps) {
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-6 gap-3 lg:gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-5 border hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              Total Volume
              {dataSource === 'realtime' && <span className="text-xs text-green-600 block font-semibold">LIVE</span>}
            </p>
            <p className="text-xl lg:text-2xl font-bold text-gray-900">
              {formatNumber(stats.totalVolume)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Contracts</p>
          </div>
          <div className="flex-shrink-0 bg-blue-50 p-3 rounded-lg">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-5 border hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              Total Premium
              {dataSource === 'realtime' && <span className="text-xs text-green-600 block font-semibold">LIVE</span>}
            </p>
            <p className="text-xl lg:text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalPremium)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Value</p>
          </div>
          <div className="flex-shrink-0 bg-green-50 p-3 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-5 border hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">Block Trades</p>
            <p className="text-xl lg:text-2xl font-bold text-gray-900">
              {stats.blockTrades}
            </p>
            <p className="text-xs text-gray-500 mt-1">Large Orders</p>
          </div>
          <div className="flex-shrink-0 bg-yellow-50 p-3 rounded-lg">
            <Zap className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-5 border hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">Total Alerts</p>
            <p className="text-xl lg:text-2xl font-bold text-gray-900">
              {stats.totalTrades}
            </p>
            <p className="text-xs text-gray-500 mt-1">Activities</p>
          </div>
          <div className="flex-shrink-0 bg-purple-50 p-3 rounded-lg">
            <Activity className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-5 border hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">Bullish</p>
            <p className="text-xl lg:text-2xl font-bold text-green-600">
              {stats.bullishTrades}
            </p>
            <p className="text-xs text-gray-500 mt-1">Sentiment</p>
          </div>
          <div className="flex-shrink-0 bg-green-50 p-3 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-5 border hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">Bearish</p>
            <p className="text-xl lg:text-2xl font-bold text-red-600">
              {stats.bearishTrades}
            </p>
            <p className="text-xs text-gray-500 mt-1">Sentiment</p>
          </div>
          <div className="flex-shrink-0 bg-red-50 p-3 rounded-lg">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
}