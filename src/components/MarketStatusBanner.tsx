import React, { useState, useEffect } from 'react';
import { Clock, Calendar, TrendingUp, BarChart3, AlertCircle, Signal } from 'lucide-react';
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
      <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 shadow-sm ${className}`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="bg-green-100 rounded-full p-2">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-green-800">Market is Open</h3>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-700 font-medium">Live Trading</span>
                  </div>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Real-time data streaming • Options activity monitoring active
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-xs text-green-600 uppercase tracking-wide font-medium">Status</div>
                <div className="text-sm font-semibold text-green-800">Market Hours</div>
              </div>
              <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm flex items-center space-x-1">
                <Signal className="w-4 h-4" />
                <span>LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 shadow-sm ${className}`}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="bg-amber-100 rounded-full p-2">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-amber-800">Market is Closed</h3>
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-1 space-y-1">
                <p className="text-sm text-amber-700 font-medium">
                  {marketStatus.message}
                  {timeUntilOpen && (
                    <span className="ml-2 text-amber-800">• Opens in {timeUntilOpen}</span>
                  )}
                </p>
                <p className="text-xs text-amber-600">
                  Displaying previous trading session data and market insights
                </p>
              </div>
              {isDeveloperMode() && (
                <div className="mt-2 text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  DEV: status={marketStatus.currentStatus}, isOpen={marketStatus.isOpen}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-xs text-amber-600 uppercase tracking-wide font-medium">Status</div>
              <div className="text-sm font-semibold text-amber-800">After Hours</div>
            </div>
            <div className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>CLOSED</span>
            </div>
          </div>
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
