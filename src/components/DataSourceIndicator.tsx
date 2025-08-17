import React from 'react';
import { Wifi, WifiOff, AlertCircle, ExternalLink, Clock } from 'lucide-react';

interface DataSourceIndicatorProps {
  isConnected: boolean;
  isUsingRealData: boolean;
  error?: string | null;
}

export function DataSourceIndicator({ isConnected, isUsingRealData, error }: DataSourceIndicatorProps) {
  const polygonApiKey = import.meta.env.VITE_POLYGON_API_KEY;
  const hasValidApiKey = polygonApiKey && polygonApiKey !== 'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X' && polygonApiKey.length > 10;
  
  // Check if market is likely closed (weekend or outside trading hours)
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getHours();
  const isWeekend = day === 0 || day === 6;
  const isOutsideTradingHours = hour < 4 || hour > 20; // Pre-market starts at 4 AM ET, after-hours ends at 8 PM ET
  const isMarketClosed = isWeekend || isOutsideTradingHours;

  // If we have a valid API key but market is closed, show market closed message
  if (hasValidApiKey && isMarketClosed) {
    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-800 mb-1">
              Market Closed - API Key Configured
            </h3>
            <p className="text-sm text-blue-700 mb-2">
              Your Polygon.io API key is properly configured. Currently showing demo data because 
              {isWeekend ? ' the market is closed for the weekend' : ' the market is outside trading hours'}.
            </p>
            <p className="text-xs text-blue-600">
              Real-time data will automatically activate during market hours (4:00 AM - 8:00 PM ET, Monday-Friday)
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
              Demo Mode Active
            </h3>
            <p className="text-sm text-yellow-700 mb-3">
              You're currently viewing simulated options activity data. To access real-time market data, 
              you'll need to add your Polygon.io API key to the environment variables.
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