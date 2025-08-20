import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Volume2, VolumeX, Settings, Clock } from 'lucide-react';
import { OptionsActivity } from '../types/options';
import { SnoopAlertConfig } from '../types/backtesting';

interface AlertsPanelProps {
  activities: OptionsActivity[];
}

export function AlertsPanel({ activities }: AlertsPanelProps) {
  const [snoopAlerts, setSnoopAlerts] = useState<SnoopAlertConfig>({
    enabled: true,
    minDollarAmount: 500000,
    timeWindow: 24, // 24 hours
    tradeLocations: ['below-bid', 'at-bid'],
    optionTypes: ['call', 'put'],
    symbols: [],
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [lastAlertCount, setLastAlertCount] = useState(0);
  const [recentTrades, setRecentTrades] = useState<OptionsActivity[]>([]);

  // Track recent trades within the time window
  useEffect(() => {
    const cutoffTime = new Date(Date.now() - snoopAlerts.timeWindow * 60 * 60 * 1000);
    const recent = activities.filter(activity => 
      new Date(activity.timestamp) > cutoffTime &&
      snoopAlerts.tradeLocations.includes(activity.tradeLocation) &&
      snoopAlerts.optionTypes.includes(activity.type) &&
      (snoopAlerts.symbols.length === 0 || snoopAlerts.symbols.includes(activity.symbol))
    );
    setRecentTrades(recent);
  }, [activities, snoopAlerts]);

  // Check for new alerts
  useEffect(() => {
    if (!snoopAlerts.enabled) return;

    // Calculate total dollar amount of qualifying trades in time window
    const totalDollarAmount = recentTrades.reduce((sum, trade) => sum + trade.premium, 0);

    if (totalDollarAmount >= snoopAlerts.minDollarAmount && recentTrades.length > lastAlertCount) {
      const newTrades = recentTrades.length - lastAlertCount;

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`🐕 Snoop Alert: $${(totalDollarAmount / 1000000).toFixed(1)}M in Unusual Activity!`, {
          body: `${newTrades} new trade${newTrades > 1 ? 's' : ''} detected in ${snoopAlerts.timeWindow}h window`,
          icon: '/vite.svg',
        });
      }

      // Play sound
      if (soundEnabled) {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore errors if audio fails
      }
    }

    setLastAlertCount(recentTrades.length);
  }, [recentTrades, snoopAlerts, lastAlertCount, soundEnabled]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const totalDollarAmount = recentTrades.reduce((sum, trade) => sum + trade.premium, 0);
  const isAlertTriggered = totalDollarAmount >= snoopAlerts.minDollarAmount;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {snoopAlerts.enabled ? (
            <BellRing className="w-5 h-5 text-blue-600" />
          ) : (
            <Bell className="w-5 h-5 text-gray-400" />
          )}
          <h3 className="text-lg font-semibold text-gray-900">Snoop Alerts</h3>
          <span className="text-sm">🐕 Woof when something's up!</span>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isAlertTriggered
              ? 'bg-red-100 text-red-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            ${(totalDollarAmount / 1000000).toFixed(1)}M
          </div>
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {showSettings && (
        <div className="border-t pt-4 mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dollar Amount Threshold ($)
              </label>
              <input
                type="number"
                value={snoopAlerts.minDollarAmount}
                onChange={(e) => setSnoopAlerts(prev => ({ 
                  ...prev, 
                  minDollarAmount: parseInt(e.target.value) || 0 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="500000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Window (Hours)
              </label>
              <input
                type="number"
                value={snoopAlerts.timeWindow}
                onChange={(e) => setSnoopAlerts(prev => ({ 
                  ...prev, 
                  timeWindow: parseInt(e.target.value) || 24 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="24"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert on Trade Locations
            </label>
            <div className="flex flex-wrap gap-2">
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
                    checked={snoopAlerts.tradeLocations.includes(value as any)}
                    onChange={() => {
                      const newLocations = snoopAlerts.tradeLocations.includes(value as any)
                        ? snoopAlerts.tradeLocations.filter(l => l !== value)
                        : [...snoopAlerts.tradeLocations, value as any];
                      setSnoopAlerts(prev => ({ ...prev, tradeLocations: newLocations }));
                    }}
                    className="mr-1 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-${color}-600 font-medium`}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={snoopAlerts.enabled}
                onChange={(e) => setSnoopAlerts(prev => ({ 
                  ...prev, 
                  enabled: e.target.checked 
                }))}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable Snoop Alerts</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-gray-600 mr-1" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-400 mr-1" />
                )}
                <span className="text-sm text-gray-700">Sound Alerts</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {isAlertTriggered && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800 font-medium">
            🚨 Snoop Alert Triggered! ${(totalDollarAmount / 1000000).toFixed(1)}M in unusual activity
          </p>
          <p className="text-xs text-red-600 mt-1">
            {recentTrades.length} qualifying trades in the last {snoopAlerts.timeWindow} hours
          </p>
          <div className="mt-2 flex items-center text-xs text-red-600">
            <Clock className="w-3 h-3 mr-1" />
            <span>Tracking: {snoopAlerts.tradeLocations.join(', ')} trades</span>
          </div>
        </div>
      )}
    </div>
  );
}