import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Volume2, VolumeX, Settings } from 'lucide-react';
import { OptionsActivity } from '../types/options';

interface AlertsPanelProps {
  activities: OptionsActivity[];
}

interface AlertSettings {
  enabled: boolean;
  minVolume: number;
  minPremium: number;
  blockTradesOnly: boolean;
  soundEnabled: boolean;
}

export function AlertsPanel({ activities }: AlertsPanelProps) {
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    enabled: true,
    minVolume: 2000,
    minPremium: 100000,
    blockTradesOnly: false,
    soundEnabled: true,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [lastAlertCount, setLastAlertCount] = useState(0);

  // Check for new alerts
  useEffect(() => {
    if (!alertSettings.enabled) return;

    const qualifyingAlerts = activities.filter(activity => {
      if (activity.volume < alertSettings.minVolume) return false;
      if (activity.premium < alertSettings.minPremium) return false;
      if (alertSettings.blockTradesOnly && !activity.blockTrade) return false;
      return true;
    });

    if (qualifyingAlerts.length > lastAlertCount) {
      const newAlerts = qualifyingAlerts.length - lastAlertCount;
      
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${newAlerts} New Unusual Options Alert${newAlerts > 1 ? 's' : ''}`, {
          body: `High volume activity detected`,
          icon: '/vite.svg',
        });
      }

      // Play sound
      if (alertSettings.soundEnabled) {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore errors if audio fails
      }
    }

    setLastAlertCount(qualifyingAlerts.length);
  }, [activities, alertSettings, lastAlertCount]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const qualifyingAlerts = activities.filter(activity => {
    if (activity.volume < alertSettings.minVolume) return false;
    if (activity.premium < alertSettings.minPremium) return false;
    if (alertSettings.blockTradesOnly && !activity.blockTrade) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {alertSettings.enabled ? (
            <BellRing className="w-5 h-5 text-blue-600" />
          ) : (
            <Bell className="w-5 h-5 text-gray-400" />
          )}
          <h3 className="text-lg font-semibold text-gray-900">Smart Alerts</h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            qualifyingAlerts.length > 0 
              ? 'bg-red-100 text-red-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {qualifyingAlerts.length} Active
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
                Alert Volume Threshold
              </label>
              <input
                type="number"
                value={alertSettings.minVolume}
                onChange={(e) => setAlertSettings(prev => ({ 
                  ...prev, 
                  minVolume: parseInt(e.target.value) || 0 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Premium Threshold ($)
              </label>
              <input
                type="number"
                value={alertSettings.minPremium}
                onChange={(e) => setAlertSettings(prev => ({ 
                  ...prev, 
                  minPremium: parseInt(e.target.value) || 0 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100000"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={alertSettings.enabled}
                onChange={(e) => setAlertSettings(prev => ({ 
                  ...prev, 
                  enabled: e.target.checked 
                }))}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable Alerts</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={alertSettings.blockTradesOnly}
                onChange={(e) => setAlertSettings(prev => ({ 
                  ...prev, 
                  blockTradesOnly: e.target.checked 
                }))}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Block Trades Only</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={alertSettings.soundEnabled}
                onChange={(e) => setAlertSettings(prev => ({ 
                  ...prev, 
                  soundEnabled: e.target.checked 
                }))}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center">
                {alertSettings.soundEnabled ? (
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

      {qualifyingAlerts.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800 font-medium">
            🚨 {qualifyingAlerts.length} high-priority alert{qualifyingAlerts.length > 1 ? 's' : ''} detected!
          </p>
          <p className="text-xs text-red-600 mt-1">
            Large volume or premium activity that meets your alert criteria
          </p>
        </div>
      )}
    </div>
  );
}