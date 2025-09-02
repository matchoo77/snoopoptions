import React, { useState, useEffect } from 'react';
import { Clock, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { getMarketStatus, getTimeUntilMarketOpen, MarketStatus } from '../lib/marketHours';
import { isDeveloperMode } from '../utils/developerMode';

interface MarketStatusBannerProps {
  className?: string;
}

export function MarketStatusBanner({ className = '' }: MarketStatusBannerProps) {
  const [marketStatus, setMarketStatus] = useState<MarketStatus>(getMarketStatus());
  const [timeUntilOpen, setTimeUntilOpen] = useState<string>('');

  useEffect(() => {
    const updateStatus = () => {
      const status = getMarketStatus();
      setMarketStatus(status);
      setTimeUntilOpen(getTimeUntilMarketOpen(status));
    };

    // Update immediately
    updateStatus();

    // Update every minute
    const interval = setInterval(updateStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  if (marketStatus.isOpen) {
    return (
      <div className={`bg-green-50 border-l-4 border-green-400 p-4 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700">
              <span className="font-medium">Market is open</span> - Live data streaming
            </p>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Live
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-orange-50 border-l-4 border-orange-400 p-4 ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Clock className="h-5 w-5 text-orange-400" />
        </div>
        <div className="ml-3 flex-1">
          <div className="text-sm text-orange-700">
            <span className="font-medium">{marketStatus.message}</span>
            {timeUntilOpen && (
              <span className="ml-2">• Opens in {timeUntilOpen}</span>
            )}
          </div>
          <div className="text-xs text-orange-600 mt-1">
            Showing previous trading day data and market insights
          </div>
          {isDeveloperMode() && (
            <div className="mt-1 text-[11px] text-gray-500">
              DEV: status={marketStatus.currentStatus}, isOpen={marketStatus.isOpen}
            </div>
          )}
        </div>
        <div className="ml-auto">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Closed
          </span>
        </div>
      </div>
    </div>
  );
}

interface MarketClosedDashboardProps {
  children: React.ReactNode;
}

export function MarketClosedDashboard({ children }: MarketClosedDashboardProps) {
  const [marketStatus, setMarketStatus] = useState<MarketStatus>(getMarketStatus());
  const devMode = isDeveloperMode();

  useEffect(() => {
    const updateStatus = () => {
      setMarketStatus(getMarketStatus());
    };

    const interval = setInterval(updateStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  if (marketStatus.isOpen || devMode) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketStatusBanner className="sticky top-0 z-10" />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Market Closed Summary */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
              Previous Trading Session Summary
            </h2>
            <div className="text-sm text-gray-500 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Last Trading Day
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-600">Total Options Volume</div>
              <div className="text-2xl font-bold text-blue-900">2.8M</div>
              <div className="text-sm text-blue-700">+12% vs avg</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm font-medium text-green-600">Unusual Activity Alerts</div>
              <div className="text-2xl font-bold text-green-900">347</div>
              <div className="text-sm text-green-700">High activity day</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm font-medium text-purple-600">Block Trades</div>
              <div className="text-2xl font-bold text-purple-900">89</div>
              <div className="text-sm text-purple-700">Large flow detected</div>
            </div>
          </div>
        </div>

        {/* Regular Dashboard Content with Market Closed Context */}
        <div className="opacity-90">
          {children}
        </div>
        
        {/* Market Closed Overlay Message */}
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start">
            <Clock className="h-5 w-5 text-orange-500 mt-0.5 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-900">Market Closed</div>
              <div className="text-xs text-gray-600 mt-1">
                {marketStatus.message}
                {marketStatus.nextOpen && (
                  <div className="mt-1 text-blue-600">
                    Next open: {marketStatus.nextOpen.toLocaleDateString()} at 9:30 AM ET
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
