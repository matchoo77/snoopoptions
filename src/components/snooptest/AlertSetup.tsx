import React, { useState } from 'react';
import { Bell, Save, X, Mail, Monitor, CheckCircle } from 'lucide-react';
import { SnoopTestParams, SnoopTestSummary, TradeLocation, AlertCriteria } from '../../types/snooptest';

interface AlertSetupProps {
  params: SnoopTestParams;
  summary: SnoopTestSummary;
  onClose: () => void;
}

export function AlertSetup({ params, summary, onClose }: AlertSetupProps) {
  const [alertConfig, setAlertConfig] = useState<Partial<AlertCriteria>>({
    ticker: params.ticker,
    tradeLocations: params.tradeLocations,
    minWinRate: Math.max(50, Math.floor(summary.winRate)),
    notificationType: 'browser',
    isActive: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      // Save alert configuration to localStorage for now
      // In production, this would save to Supabase user_alerts table
      const alerts = JSON.parse(localStorage.getItem('snooptest_alerts') || '[]');
      const newAlert: AlertCriteria = {
        id: `alert_${Date.now()}`,
        userId: 'current_user', // Would be actual user ID
        ticker: alertConfig.ticker || params.ticker,
        tradeLocations: alertConfig.tradeLocations || params.tradeLocations,
        minWinRate: alertConfig.minWinRate || 50,
        notificationType: alertConfig.notificationType || 'browser',
        isActive: alertConfig.isActive || true,
        createdAt: new Date().toISOString(),
      };

      alerts.push(newAlert);
      localStorage.setItem('snooptest_alerts', JSON.stringify(alerts));

      // Request notification permission if browser notifications selected
      if (newAlert.notificationType === 'browser' && 'Notification' in window) {
        await Notification.requestPermission();
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error saving alert:', error);
    }
  };

  const toggleTradeLocation = (location: TradeLocation) => {
    const current = alertConfig.tradeLocations || [];
    const newLocations = current.includes(location)
      ? current.filter(l => l !== location)
      : [...current, location];
    setAlertConfig(prev => ({ ...prev, tradeLocations: newLocations }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Bell className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-semibold text-white">Create Live Alert</h2>
            <span className="text-sm text-gray-400">🚨 Get notified of similar patterns</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-green-900/30 border border-green-700/50 rounded-lg">
            <h3 className="text-sm font-medium text-green-300 mb-2">
              Based on Your SnoopTest Results
            </h3>
            <p className="text-sm text-green-200">
              Your test found a {summary.winRate.toFixed(1)}% win rate with {summary.nonNeutralTrades} directional sweeps. 
              This alert will notify you when similar patterns occur in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ticker Symbol
              </label>
              <input
                type="text"
                value={alertConfig.ticker || ''}
                onChange={(e) => setAlertConfig(prev => ({ 
                  ...prev, 
                  ticker: e.target.value.toUpperCase() 
                }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                placeholder="SPY"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Win Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={alertConfig.minWinRate || 50}
                onChange={(e) => setAlertConfig(prev => ({ 
                  ...prev, 
                  minWinRate: parseInt(e.target.value) || 50 
                }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Trade Locations to Monitor
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { value: 'below-bid', label: 'Below Bid', color: 'red' },
                { value: 'at-bid', label: 'At Bid', color: 'orange' },
                { value: 'midpoint', label: 'Midpoint', color: 'blue' },
                { value: 'at-ask', label: 'At Ask', color: 'green' },
                { value: 'above-ask', label: 'Above Ask', color: 'purple' },
              ].map(({ value, label, color }) => (
                <label key={value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(alertConfig.tradeLocations || []).includes(value as TradeLocation)}
                    onChange={() => toggleTradeLocation(value as TradeLocation)}
                    className="text-green-500 focus:ring-green-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className={`text-sm font-medium text-${color}-400`}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notification Method
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                <input
                  type="radio"
                  name="notificationType"
                  value="browser"
                  checked={alertConfig.notificationType === 'browser'}
                  onChange={(e) => setAlertConfig(prev => ({ 
                    ...prev, 
                    notificationType: e.target.value as 'browser' | 'email' 
                  }))}
                  className="text-green-500 focus:ring-green-500"
                />
                <Monitor className="w-5 h-5 text-blue-400" />
                <span className="text-white">Browser Notifications</span>
              </label>
              
              <label className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                <input
                  type="radio"
                  name="notificationType"
                  value="email"
                  checked={alertConfig.notificationType === 'email'}
                  onChange={(e) => setAlertConfig(prev => ({ 
                    ...prev, 
                    notificationType: e.target.value as 'browser' | 'email' 
                  }))}
                  className="text-green-500 focus:ring-green-500"
                />
                <Mail className="w-5 h-5 text-green-400" />
                <span className="text-white">Email Alerts</span>
              </label>
            </div>
          </div>

          <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-yellow-300 mb-1">
              How Live Alerts Work
            </h3>
            <p className="text-sm text-yellow-200">
              Your trading dog will alert you when live options sweeps match your tested pattern criteria. 
              This helps you catch similar high-probability setups as they happen in real-time!
            </p>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={alertConfig.isActive || true}
                onChange={(e) => setAlertConfig(prev => ({ 
                  ...prev, 
                  isActive: e.target.checked 
                }))}
                className="text-green-500 focus:ring-green-500 bg-gray-700 border-gray-600 rounded"
              />
              <span className="text-sm font-medium text-gray-300">Enable Alert</span>
            </label>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white border border-gray-600 rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saved}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 transition-colors"
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