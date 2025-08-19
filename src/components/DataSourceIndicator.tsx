import React from 'react';
import { Wifi, WifiOff, AlertCircle, ExternalLink, Clock, Database, BarChart3 } from 'lucide-react';

interface DataSourceIndicatorProps {
  isConnected: boolean;
  isUsingRealData: boolean;
  dataSource?: 'mock' | 'realtime' | 'eod';
  loading?: boolean;
  error?: string | null;
}

export function DataSourceIndicator({ 
  isConnected, 
  isUsingRealData, 
  dataSource = 'mock',
  loading = false,
  error 
}: DataSourceIndicatorProps) {
  const polygonApiKey = import.meta.env.VITE_POLYGON_API_KEY;
  const hasValidApiKey = polygonApiKey && polygonApiKey.length > 10 && polygonApiKey !== 'your_polygon_api_key_here';
  
  // Check if market is likely closed (weekend or outside trading hours)
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getHours();
  const isWeekend = day === 0 || day === 6;
  const isOutsideTradingHours = hour < 4 || hour > 20; // Pre-market starts at 4 AM ET, after-hours ends at 8 PM ET
  const isMarketClosed = isWeekend || isOutsideTradingHours;

  // Show loading state
  if (loading) {
    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mt-0.5"></div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-800 mb-1">
              Loading EOD Options Data
            </h3>
            <p className="text-sm text-blue-700">
              Fetching unusual options activity from Polygon.io...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Add debug info
  console.log('DataSourceIndicator debug:', {
    hasValidApiKey,
    polygonApiKey: polygonApiKey ? `${polygonApiKey.substring(0, 8)}...` : 'none',
    dataSource,
    isUsingRealData,
    isConnected,
    loading,
    error,
    apiKeyLength: polygonApiKey?.length || 0,
    isMarketClosed
  });
  
  if (hasValidApiKey && isMarketClosed) {
    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-800 mb-1">
              Market Closed - Using {dataSource === 'eod' ? 'EOD' : 'Real-time'} Data
            </h3>
            <p className="text-sm text-blue-700 mb-2">
              Your Polygon.io API key is properly configured. Currently showing {dataSource === 'eod' ? 'end-of-day' : 'demo'} data because 
              {isWeekend ? ' the market is closed for the weekend' : ' the market is outside trading hours'}.
            </p>
            <p className="text-xs text-blue-600">
  if (!hasValidApiKey) {
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Debug: API Key ends with ...{polygonApiKey?.slice(-4)} | Data Source: {dataSource}
            </p>
      }
    );
  }

  // Show EOD data indicator
  if (dataSource === 'eod') {
    return (
      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Database className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800 mb-1">
              Real-time Market Data Connected
            </h3>
            <p className="text-sm text-green-700">
              EOD Market Data Connected
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isUsingRealData) {
    return (
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800 mb-1">
            <p className="text-sm text-yellow-700">
              Please set a valid Polygon.io API key. Current key length: {polygonApiKey?.length || 0} characters
              {polygonApiKey && polygonApiKey.length <= 10 && ' (too short)'}
            </p>
            </h3>
            <p className="text-sm text-yellow-700 mb-3">
              Your trading dog is practicing with toy bones! 🦴 To start the real hunt for unusual options activity, 
              you'll need to add your Polygon.io API key to the environment variables.
            </p>
            <p className="text-xs text-gray-600 mb-2">
              Debug: API Key = {polygonApiKey ? `"${polygonApiKey.substring(0, 8)}..." (${polygonApiKey.length} chars)` : 'not set'}
            </p>
            <div className="flex items-center space-x-4 text-xs">
              <a
                href="https://polygon.io/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-yellow-700 hover:text-yellow-800 underline"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Get Polygon.io API Key</span>
              </a>
              <span className="text-yellow-600">•</span>
              <span className="text-yellow-600">Free tier available</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <WifiOff className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 mb-1">
              Connection Error
            </h3>
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <WifiOff className="w-5 h-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-orange-800 mb-1">
              Reconnecting...
            </h3>
            <p className="text-sm text-orange-700">
              Attempting to reconnect to real-time data feed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-start space-x-3">
        <Wifi className="w-5 h-5 text-green-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-green-800 mb-1">
            Live Market Data Connected
          </h3>
          <p className="text-sm text-green-700">
            Receiving real-time unusual options activity from Polygon.io
          </p>
        </div>
      </div>
    </div>
  );
}
}