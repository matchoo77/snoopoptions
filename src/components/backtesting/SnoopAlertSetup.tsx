import React, { useState } from 'react';
import { Bell, Save, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { BacktestParams, BacktestSummary, SnoopAlertConfig } from '../../types/backtesting';

interface SnoopAlertSetupProps {
  backtestParams: BacktestParams;
  backtestSummary: BacktestSummary | null;
  onClose: () => void;
}

export function SnoopAlertSetup({ backtestParams, backtestSummary, onClose }: SnoopAlertSetupProps) {
  const [alertConfig, setAlertConfig] = useState<SnoopAlertConfig>({
    enabled: true,
    minDollarAmount: 500000, // $500K default
    timeWindow: 4, // 4 hours default
    tradeLocations: backtestParams.tradeLocations,
    optionTypes: backtestParams.optionTypes,
    symbols: backtestParams.symbols,
    minVolume: backtestParams.minVolume,
    minPremium: backtestParams.minPremium,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save to localStorage for now (in production, this would save to user preferences in database)
    localStorage.setItem('snoopAlertConfig', JSON.stringify(alertConfig));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 2000);
  };

  const handleSymbolsChange = (symbolsText: string) => {
    const symbols = symbolsText
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);
    setAlertConfig(prev => ({ ...prev, symbols }));
  };

  const toggleOptionType = (type: 'call' | 'put') => {
    const newTypes = alertConfig.optionTypes.includes(type)
      ? alertConfig.optionTypes.filter(t => t !== type)
      : [...alertConfig.optionTypes, type];
    setAlertConfig(prev => ({ ...prev, optionTypes: newTypes }));
  };

  const toggleTradeLocation = (location: 'below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask') => {
    const newLocations = alertConfig.tradeLocations.includes(location)
      ? alertConfig.tradeLocations.filter(l => l !== location)
      : [...alertConfig.tradeLocations, location];
    setAlertConfig(prev => ({ ...prev, tradeLocations: newLocations }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Create Snoop Alert</h2>
            <span className="text-sm">🐕 Get barked at when similar trades happen!</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {backtestSummary && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Based on Your Backtest Results
              </h3>
              <p className="text-sm text-blue-700">
                Your backtest found a {backtestSummary.successRate.toFixed(1)}% success rate with {backtestSummary.totalTrades} trades. 
                This alert will notify you when similar trades occur in real-time.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Threshold ($)
              </label>
              <input
                type="number"
                value={alertConfig.minDollarAmount}
                onChange={(e) => setAlertConfig(prev => ({ 
                  ...prev, 
                  minDollarAmount: parseInt(e.target.value) || 0 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="500000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Alert when this dollar amount of qualifying trades occurs
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Window (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={alertConfig.timeWindow}
                onChange={(e) => setAlertConfig(prev => ({ 
                  ...prev, 
                  timeWindow: parseInt(e.target.value) || 4 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="4"
              />
              <p className="text-xs text-gray-500 mt-1">
                Within this many hours
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Volume
              </label>
              <input
                type="number"
                value={alertConfig.minVolume}
                onChange={(e) => setAlertConfig(prev => ({ 
                  ...prev, 
                  minVolume: parseInt(e.target.value) || 0 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Premium ($)
              </label>
              <input
                type="number"
                value={alertConfig.minPremium}
                onChange={(e) => setAlertConfig(prev => ({ 
                  ...prev, 
                  minPremium: parseInt(e.target.value) || 0 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symbols (comma-separated)
              </label>
              <input
                type="text"
                value={alertConfig.symbols.join(', ')}
                onChange={(e) => handleSymbolsChange(e.target.value)}
                placeholder="AAPL, TSLA (leave empty for all)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Option Types
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={alertConfig.optionTypes.includes('call')}
                    onChange={() => toggleOptionType('call')}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Calls</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={alertConfig.optionTypes.includes('put')}
                    onChange={() => toggleOptionType('put')}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Puts</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trade Locations to Monitor
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
                      checked={alertConfig.tradeLocations.includes(value as any)}
                      onChange={() => toggleTradeLocation(value as any)}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-${color}-600 font-medium`}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 mb-1">
                  How Snoop Alerts Work
                </h3>
                <p className="text-sm text-yellow-700">
                  Your trading dog will bark (send an alert) when the total dollar amount of trades matching 
                  your backtest criteria reaches your threshold within the specified time window. This helps 
                  you catch similar patterns to your successful backtests in real-time!
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={alertConfig.enabled}
                onChange={(e) => setAlertConfig(prev => ({ 
                  ...prev, 
                  enabled: e.target.checked 
                }))}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Snoop Alerts</span>
            </label>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saved}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {saved ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Alert</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}