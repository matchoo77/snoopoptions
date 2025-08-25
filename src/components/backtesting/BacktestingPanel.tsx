import React, { useState } from 'react';
import { BarChart3, Play, RotateCcw } from 'lucide-react';
import { BacktestParams } from '../../types/backtesting';
import { useBacktesting } from '../../hooks/useBacktesting';
import { BacktestResults } from './BacktestResults';
import { SnoopAlertSetup } from './SnoopAlertSetup';
import { isValidPolygonApiKey } from '../../lib/apiKeyValidation';

export function BacktestingPanel() {
  const { results, summary, loading, error, runBacktest, clearResults } = useBacktesting();
  const [params, setParams] = useState<BacktestParams>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // Today
    targetMovement: 5, // 5% movement
    timeHorizon: 7, // 7 days to measure outcome
    minVolume: 1000,
    minPremium: 100000,
    symbols: [], // All symbols
    optionTypes: ['call', 'put'],
    tradeLocations: ['below-bid', 'at-bid', 'midpoint', 'at-ask', 'above-ask'],
  });
  const [showAlertSetup, setShowAlertSetup] = useState(false);

  const handleParamChange = (key: keyof BacktestParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleSymbolsChange = (symbolsText: string) => {
    const symbols = symbolsText
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);
    handleParamChange('symbols', symbols);
  };

  const toggleOptionType = (type: 'call' | 'put') => {
    const newTypes = params.optionTypes.includes(type)
      ? params.optionTypes.filter(t => t !== type)
      : [...params.optionTypes, type];
    handleParamChange('optionTypes', newTypes);
  };

  const toggleTradeLocation = (location: 'below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask') => {
    const newLocations = params.tradeLocations.includes(location)
      ? params.tradeLocations.filter(l => l !== location)
      : [...params.tradeLocations, location];
    handleParamChange('tradeLocations', newLocations);
  };

  const handleRunBacktest = () => {
    if (params.optionTypes.length === 0) {
      alert('Please select at least one option type (calls or puts)');
      return;
    }
    if (params.tradeLocations.length === 0) {
      alert('Please select at least one trade location');
      return;
    }
    runBacktest(params);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Block Trade Backtesting</h2>
          <span className="text-sm">📊 Test your hunting strategy</span>
        </div>
        
        {(results.length > 0 || summary) && (
          <button
            onClick={clearResults}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Results</span>
          </button>
        )}
      </div>

      {/* Backtest Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={params.startDate}
            onChange={(e) => handleParamChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={params.endDate}
            onChange={(e) => handleParamChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Movement (%)
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="50"
            value={params.targetMovement}
            onChange={(e) => handleParamChange('targetMovement', parseFloat(e.target.value) || 5)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Horizon (Days)
          </label>
          <input
            type="number"
            min="1"
            max="30"
            value={params.timeHorizon}
            onChange={(e) => handleParamChange('timeHorizon', parseInt(e.target.value) || 7)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Volume
          </label>
          <input
            type="number"
            value={params.minVolume}
            onChange={(e) => handleParamChange('minVolume', parseInt(e.target.value) || 1000)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Premium ($)
          </label>
          <input
            type="number"
            value={params.minPremium}
            onChange={(e) => handleParamChange('minPremium', parseInt(e.target.value) || 100000)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Symbols (comma-separated)
          </label>
          <input
            type="text"
            value={params.symbols.join(', ')}
            onChange={(e) => handleSymbolsChange(e.target.value)}
            placeholder="AAPL, TSLA, NVDA (leave empty for all)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Option Types
          </label>
          <div className="flex space-x-4 mt-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={params.optionTypes.includes('call')}
                onChange={() => toggleOptionType('call')}
                className="mr-2 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Calls</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={params.optionTypes.includes('put')}
                onChange={() => toggleOptionType('put')}
                className="mr-2 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Puts</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trade Locations
          </label>
          <div className="space-y-1">
            {[
              { value: 'below-bid', label: 'Below Bid', color: 'red' },
              { value: 'at-bid', label: 'At Bid', color: 'orange' },
              { value: 'midpoint', label: 'Midpoint', color: 'blue' },
              { value: 'at-ask', label: 'At Ask', color: 'green' },
              { value: 'above-ask', label: 'Above Ask', color: 'purple' },
            ].map(({ value, label, color }) => (
              <label key={value} className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={params.tradeLocations.includes(value as any)}
                  onChange={() => toggleTradeLocation(value as any)}
                  className="mr-2 text-purple-600 focus:ring-purple-500"
                />
                <span className={`text-${color}-600 font-medium`}>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Run Backtest Button */}
      <div className="flex items-center justify-center mb-6">
        <button
          onClick={handleRunBacktest}
          disabled={loading || params.optionTypes.length === 0 || params.tradeLocations.length === 0}
          className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Running Backtest...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Run Backtest Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {summary && (
        <BacktestResults 
          results={results} 
          summary={summary} 
          params={params}
          onCreateAlert={() => setShowAlertSetup(true)}
        />
      )}

      {/* Snoop Alert Setup */}
      {showAlertSetup && (
        <SnoopAlertSetup
          backtestParams={params}
          backtestSummary={summary}
          onClose={() => setShowAlertSetup(false)}
        />
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          How Pattern Recognition Works
        </h3>
        <p className="text-sm text-blue-700">
          This tool identifies patterns of unusual options activity that occurred 1-3 days BEFORE significant stock moves. 
          It searches for clusters of block trades that preceded your target % movement, helping you recognize early warning signals. 
          If no such patterns exist, try adjusting your parameters (lower thresholds, different time periods, etc.).
        </p>
        <p className="text-xs text-blue-600 mt-2">
          {isValidPolygonApiKey(import.meta.env.VITE_POLYGON_API_KEY)
            ? '✓ Using Polygon.io data'
            : '⚠️ Configure VITE_POLYGON_API_KEY to run backtests'
          }
        </p>
        <p className="text-xs text-gray-500 mt-1">
          API Key Status: {import.meta.env.VITE_POLYGON_API_KEY ? 
            `Configured (${import.meta.env.VITE_POLYGON_API_KEY.length} chars, ends with ...${import.meta.env.VITE_POLYGON_API_KEY.slice(-4)})` : 
            'Not configured'
          }
        </p>
      </div>
    </div>
  );
}