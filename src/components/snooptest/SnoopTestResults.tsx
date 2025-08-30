import React from 'react';
import { TrendingUp, TrendingDown, Target, BarChart3, Bell } from 'lucide-react';
import { SnoopTestResult, SnoopTestSummary, SnoopTestParams } from '../../types/snooptest';
import { SnoopTestChart } from './SnoopTestChart';

interface SnoopTestResultsProps {
  results: SnoopTestResult[];
  summary: SnoopTestSummary;
  params: SnoopTestParams;
  onCreateAlert: () => void;
}

export function SnoopTestResults({ results, summary, params, onCreateAlert }: SnoopTestResultsProps) {
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTradeLocationColor = (location: string) => {
    switch (location) {
      case 'below-bid': return 'text-red-400';
      case 'at-bid': return 'text-orange-400';
      case 'midpoint': return 'text-blue-400';
      case 'at-ask': return 'text-green-400';
      case 'above-ask': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getSideColor = (side: string) => {
    switch (side) {
      case 'buy': return 'text-green-400';
      case 'sell': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Sweeps</p>
              <p className="text-2xl font-bold text-white">{summary.totalTrades}</p>
              <p className="text-xs text-gray-500">{summary.neutralTrades} neutral excluded</p>
            </div>
            <Target className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Win Rate</p>
              <p className="text-2xl font-bold text-green-400">{summary.winRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">{summary.wins}/{summary.nonNeutralTrades} trades</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Move</p>
              <p className="text-2xl font-bold text-white">{formatPercentage(summary.averageMove)}</p>
              <p className="text-xs text-gray-500">Per {params.holdPeriod} day hold</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Best Trade</p>
              <p className="text-2xl font-bold text-green-400">
                {summary.bestTrade ? formatPercentage(Math.abs(summary.bestTrade.percentChange)) : 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                {summary.bestTrade ? `${summary.bestTrade.ticker} ${summary.bestTrade.optionType}` : ''}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Create Alert Button */}
      {summary.winRate >= 50 && (
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">
            🐕 Promising Pattern Detected!
          </h3>
          <p className="text-green-100 mb-4 text-sm">
            This sweep pattern shows a {summary.winRate.toFixed(1)}% win rate. Set up an alert to catch similar patterns in real-time!
          </p>
          <button
            onClick={onCreateAlert}
            className="bg-white text-green-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2 mx-auto"
          >
            <Bell className="w-4 h-4" />
            <span>Set Up Live Alert</span>
          </button>
        </div>
      )}

      {/* Chart */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Price Movement Distribution</h3>
        <SnoopTestChart results={results} />
      </div>

      {/* Breakdown by Trade Location */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Performance by Trade Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {TRADE_LOCATIONS.map(({ value, label, color }) => {
            const breakdown = summary.breakdownByLocation[value];
            if (!breakdown || breakdown.total === 0) return null;

            return (
              <div key={value} className="bg-gray-700 rounded-lg p-4">
                <div className="text-center">
                  <h4 className={`text-sm font-medium text-${color}-400 mb-2`}>{label}</h4>
                  <div className="text-2xl font-bold text-white mb-1">
                    {breakdown.winRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {breakdown.wins}/{breakdown.total} trades
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Avg: {formatPercentage(breakdown.avgMove)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Results Table */}
      {results.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Detailed Results</h3>
            <p className="text-sm text-gray-400">
              Showing {Math.min(results.length, 50)} of {results.length} sweep tests
            </p>
          </div>
          
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-700 border-b border-gray-600 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Ticker</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Side</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">% Change</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {results.slice(0, 50).map((result) => (
                  <tr key={result.id} className="hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                      {formatDate(result.date)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-white">
                      {result.ticker}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`capitalize font-medium ${
                        result.optionType === 'call' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.optionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`font-medium ${getTradeLocationColor(result.tradeLocation)}`}>
                        {TRADE_LOCATIONS.find(l => l.value === result.tradeLocation)?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`capitalize font-medium ${getSideColor(result.inferredSide)}`}>
                        {result.inferredSide}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      <span className={`font-bold ${
                        result.percentChange >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatPercentage(result.percentChange)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {result.isWin ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
                          ✓ Win
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900 text-red-300">
                          ✗ Loss
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analysis Insights */}
      <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-300 mb-4">
          📊 Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-200 mb-2">Pattern Analysis</h4>
            <ul className="space-y-1 text-blue-100">
              <li>• Found {summary.nonNeutralTrades} directional sweeps for {params.ticker}</li>
              <li>• {summary.winRate.toFixed(1)}% of sweeps correctly predicted direction</li>
              <li>• Average stock movement: {formatPercentage(summary.averageMove)}</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-200 mb-2">Best Performing Locations</h4>
            <ul className="space-y-1 text-blue-100">
              {Object.entries(summary.breakdownByLocation)
                .filter(([_, data]) => data.total > 0)
                .sort((a, b) => b[1].winRate - a[1].winRate)
                .slice(0, 3)
                .map(([location, data]) => (
                  <li key={location}>
                    • {TRADE_LOCATIONS.find(l => l.value === location)?.label}: {data.winRate.toFixed(1)}% win rate
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const TRADE_LOCATIONS = [
  { value: 'below-bid', label: 'Below Bid', color: 'red' },
  { value: 'at-bid', label: 'At Bid', color: 'orange' },
  { value: 'midpoint', label: 'Midpoint', color: 'blue' },
  { value: 'at-ask', label: 'At Ask', color: 'green' },
  { value: 'above-ask', label: 'Above Ask', color: 'purple' },
];