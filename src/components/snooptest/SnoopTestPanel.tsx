import { useState } from 'react';
import { TestTube, Play, RotateCcw, Info } from 'lucide-react';
import { SnoopTestParams, TradeLocation } from '../../types/snooptest';
import { useSnoopTest } from '../../hooks/useSnoopTest';
import { SnoopTestResults } from './SnoopTestResults';
import { AlertSetup } from './AlertSetup';

const TRADE_LOCATIONS: { value: TradeLocation; label: string; color: string }[] = [
  { value: 'below-bid', label: 'Below Bid', color: 'red' },
  { value: 'at-bid', label: 'At Bid', color: 'orange' },
  { value: 'midpoint', label: 'Midpoint', color: 'blue' },
  { value: 'at-ask', label: 'At Ask', color: 'green' },
  { value: 'above-ask', label: 'Above Ask', color: 'purple' },
];

export function SnoopTestPanel() {
  const { results, summary, loading, error, runSnoopTest, clearResults } = useSnoopTest();
  const [params, setParams] = useState<SnoopTestParams>({
    ticker: 'SPY',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    holdPeriod: 10,
    tradeLocations: ['below-bid', 'at-bid', 'midpoint', 'at-ask', 'above-ask'],
  });
  const [showAlertSetup, setShowAlertSetup] = useState(false);

  const handleParamChange = (key: keyof SnoopTestParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const toggleTradeLocation = (location: TradeLocation) => {
    const newLocations = params.tradeLocations.includes(location)
      ? params.tradeLocations.filter(l => l !== location)
      : [...params.tradeLocations, location];
    handleParamChange('tradeLocations', newLocations);
  };

  const handleRunTest = () => {
    if (!params.ticker.trim()) {
      alert('Please enter a ticker symbol');
      return;
    }
    if (params.tradeLocations.length === 0) {
      alert('Please select at least one trade location');
      return;
    }
    if (params.holdPeriod < 1 || params.holdPeriod > 30) {
      alert('Hold period must be between 1 and 30 days');
      return;
    }
    runSnoopTest(params);
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TestTube className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-semibold">SnoopTest</h2>
          <span className="text-sm text-gray-400">🧪 Test sweep predictions</span>
        </div>

        {(results.length > 0 || summary) && (
          <button
            onClick={clearResults}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 rounded-md hover:bg-gray-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Results</span>
          </button>
        )}
      </div>

      {/* Explanation */}
      <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-300 mb-1">How SnoopTest Works</h3>
            <p className="text-sm text-blue-200 leading-relaxed mb-2">
              SnoopTest evaluates if the stock price moves in the direction implied by unusual options sweeps 
              (e.g., Buy Calls at/above ask or Sell Puts at/below bid expect stock up; Sell Calls at/below bid 
              or Buy Puts at/above ask expect stock down) over your selected hold period.
            </p>
            <div className="bg-green-900/30 border border-green-700/50 rounded p-2 mt-2">
              <p className="text-xs text-green-200">
                <strong>Data Sources:</strong> ✅ Real stock prices from Polygon.io API • 
                ✅ Real options contracts validation • 
                ⚠️ Synthetic options sweep data (real trades require special API access)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Test Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ticker Symbol
          </label>
          <input
            type="text"
            value={params.ticker}
            onChange={(e) => handleParamChange('ticker', e.target.value.toUpperCase())}
            placeholder="SPY"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={params.startDate}
            onChange={(e) => handleParamChange('startDate', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={params.endDate}
            onChange={(e) => handleParamChange('endDate', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Hold Period (Days)
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="30"
              value={params.holdPeriod}
              onChange={(e) => handleParamChange('holdPeriod', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>1</span>
              <span className="text-green-400 font-medium">{params.holdPeriod} days</span>
              <span>30</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Locations */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Trade Locations to Test
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {TRADE_LOCATIONS.map(({ value, label, color }) => (
            <label key={value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={params.tradeLocations.includes(value)}
                onChange={() => toggleTradeLocation(value)}
                className="text-green-500 focus:ring-green-500 bg-gray-800 border-gray-600 rounded"
              />
              <span className={`text-sm font-medium text-${color}-400`}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Run Test Button */}
      <div className="flex items-center justify-center mb-6">
        <button
          onClick={handleRunTest}
          disabled={loading || params.tradeLocations.length === 0}
          className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Running SnoopTest...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Run SnoopTest</span>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {summary && (
        <SnoopTestResults
          results={results}
          summary={summary}
          params={params}
          onCreateAlert={() => setShowAlertSetup(true)}
        />
      )}

      {/* Alert Setup */}
      {showAlertSetup && summary && (
        <AlertSetup
          params={params}
          summary={summary}
          onClose={() => setShowAlertSetup(false)}
        />
      )}
    </div>
  );
}