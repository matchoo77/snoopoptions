import React from 'react';
import { TrendingUp, TrendingDown, Target, Clock, DollarSign, BarChart3 } from 'lucide-react';
import { BacktestResult, BacktestSummary, BacktestParams } from '../../types/backtesting';

interface BacktestResultsProps {
  results: BacktestResult[];
  summary: BacktestSummary;
  params: BacktestParams;
  onCreateAlert: () => void;
}

export function BacktestResults({ results, summary, params, onCreateAlert }: BacktestResultsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Pattern Instances</p>
              <p className="text-2xl font-bold text-blue-900">
                {summary.totalTrades}
              </p>
              <p className="text-xs text-blue-600">
                Trades preceding {formatPercentage(params.targetMovement)} moves
              </p>
            </div>
            <Target className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700">Avg Movement</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatPercentage(summary.averageStockMovement)}
              </p>
              <p className="text-xs text-purple-600">
                Average stock movement after trades
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700">Lookback Period</p>
              <p className="text-2xl font-bold text-orange-900">
                1-3 days
              </p>
              <p className="text-xs text-orange-600">
                Trades before stock moves
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Create Alert Button */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white text-center">
        <h3 className="text-lg font-semibold mb-2">
          🐕 Want Your Trading Dog to Bark When Similar Trades Happen?
        </h3>
        <p className="text-blue-100 mb-4 text-sm">
          Set up a Snoop Alert to get notified when similar trade patterns occur in real-time - before the next big move!
        </p>
        <button
          onClick={onCreateAlert}
          className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-50 transition-colors"
        >
          Create Snoop Alert from This Pattern
        </button>
      </div>

      {/* Breakdown Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Option Type Breakdown */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
            Calls vs Puts Performance
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white rounded border">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Call Options</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {formatPercentage(summary.breakdownByType.calls.rate)}
                </div>
                <div className="text-xs text-gray-600">
                  {summary.breakdownByType.calls.successful} / {summary.breakdownByType.calls.total}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white rounded border">
              <div className="flex items-center space-x-3">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span className="font-medium text-gray-900">Put Options</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {formatPercentage(summary.breakdownByType.puts.rate)}
                </div>
                <div className="text-xs text-gray-600">
                  {summary.breakdownByType.puts.successful} / {summary.breakdownByType.puts.total}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Size Breakdown */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
            Premium Size Analysis
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white rounded border">
              <div>
                <span className="font-medium text-gray-900">Small</span>
                <div className="text-xs text-gray-600">{"< $100K"}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {formatPercentage(summary.breakdownByPremium.small.rate)}
                </div>
                <div className="text-xs text-gray-600">
                  {summary.breakdownByPremium.small.successful} / {summary.breakdownByPremium.small.total}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white rounded border">
              <div>
                <span className="font-medium text-gray-900">Medium</span>
                <div className="text-xs text-gray-600">$100K - $500K</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {formatPercentage(summary.breakdownByPremium.medium.rate)}
                </div>
                <div className="text-xs text-gray-600">
                  {summary.breakdownByPremium.medium.successful} / {summary.breakdownByPremium.medium.total}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white rounded border">
              <div>
                <span className="font-medium text-gray-900">Large</span>
                <div className="text-xs text-gray-600">{"> $500K"}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {formatPercentage(summary.breakdownByPremium.large.rate)}
                </div>
                <div className="text-xs text-gray-600">
                  {summary.breakdownByPremium.large.successful} / {summary.breakdownByPremium.large.total}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Best and Worst Trades */}
      {(summary.bestTrade || summary.worstTrade) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {summary.bestTrade && (
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-4">
                🏆 Best Performing Trade
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Symbol:</span>
                  <span className="font-medium text-green-900">{summary.bestTrade.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Type:</span>
                  <span className="font-medium text-green-900 capitalize">{summary.bestTrade.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Stock Movement:</span>
                  <span className="font-bold text-green-900">
                    {formatPercentage(summary.bestTrade.stockMovement)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Premium:</span>
                  <span className="font-medium text-green-900">
                    {formatCurrency(summary.bestTrade.premium)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Trade Date:</span>
                  <span className="font-medium text-green-900">
                    {formatDate(summary.bestTrade.tradeDate)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {summary.worstTrade && (
            <div className="bg-red-50 rounded-lg p-6 border border-red-200">
              <h3 className="text-lg font-semibold text-red-900 mb-4">
                📉 Worst Performing Trade
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-red-700">Symbol:</span>
                  <span className="font-medium text-red-900">{summary.worstTrade.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Type:</span>
                  <span className="font-medium text-red-900 capitalize">{summary.worstTrade.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Stock Movement:</span>
                  <span className="font-bold text-red-900">
                    {formatPercentage(summary.worstTrade.stockMovement)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Premium:</span>
                  <span className="font-medium text-red-900">
                    {formatCurrency(summary.worstTrade.premium)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Trade Date:</span>
                  <span className="font-medium text-red-900">
                    {formatDate(summary.worstTrade.tradeDate)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Results Table */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Trade Results</h3>
            <p className="text-sm text-gray-600">
              Set up a Snoop Alert to catch these same patterns in real-time - potentially before the next big move!
            </p>
          </div>
          
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trade Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Premium</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Move</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target Hit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.slice(0, 50).map((result) => (
                  <tr key={result.tradeId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {result.symbol}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`capitalize font-medium ${
                        result.type === 'call' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {formatDate(result.tradeDate)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.tradeLocation === 'below-bid' ? 'bg-red-100 text-red-800' :
                        result.tradeLocation === 'at-bid' ? 'bg-orange-100 text-orange-800' :
                        result.tradeLocation === 'midpoint' ? 'bg-blue-100 text-blue-800' :
                        result.tradeLocation === 'at-ask' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {result.tradeLocation === 'below-bid' ? 'Below' :
                         result.tradeLocation === 'at-bid' ? 'Bid' :
                         result.tradeLocation === 'midpoint' ? 'Mid' :
                         result.tradeLocation === 'at-ask' ? 'Ask' :
                         'Above'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                      {formatCurrency(result.premium)}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      <span className={`font-bold ${
                        result.stockMovement >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.stockMovement >= 0 ? '+' : ''}{formatPercentage(result.stockMovement)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {result.targetReached ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Hit
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ✗ Miss
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {results.length > 50 && (
            <div className="px-6 py-3 bg-gray-50 border-t text-center">
              <p className="text-sm text-gray-600">
                Showing first 50 of {results.length} results
              </p>
            </div>
          )}
        </div>
      )}

      {/* Analysis Insights */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          📈 Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Performance Analysis</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• Found {summary.totalTrades} instances of unusual activity preceding {formatPercentage(params.targetMovement)} moves</li>
              <li>• {summary.breakdownByType.calls.total > summary.breakdownByType.puts.total ? 'Call' : 'Put'} options appeared more frequently in patterns</li>
              <li>• {summary.breakdownByPremium.large.total >= summary.breakdownByPremium.small.total ? 'Larger' : 'Smaller'} premiums were more common in patterns</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Trading Strategy</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• Watch for similar patterns 1-3 days before potential {formatPercentage(params.targetMovement)} moves</li>
              <li>• Focus on unusual activity with premium > {formatCurrency(params.minPremium)}</li>
              <li>• Average stock movement after patterns: {formatPercentage(summary.averageStockMovement)}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}