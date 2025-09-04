import { Clock, TrendingUp, Activity, Signal } from 'lucide-react';
import { useMarketStatus } from '../hooks/useMarketStatus';

interface MarketStatusIndicatorProps {
  refreshRate?: number;
  showDetailed?: boolean;
}

export function MarketStatusIndicator({ refreshRate, showDetailed = true }: MarketStatusIndicatorProps) {
  const marketStatus = useMarketStatus();

  if (!marketStatus) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center space-x-3 text-gray-500">
          <div className="animate-spin">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">Loading market status...</span>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (marketStatus.currentPeriod) {
      case 'market-hours':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'premarket':
      case 'after-hours':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'closed':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getBadgeColor = () => {
    switch (marketStatus.currentPeriod) {
      case 'market-hours':
        return 'bg-green-500 text-white';
      case 'premarket':
      case 'after-hours':
        return 'bg-amber-500 text-white';
      case 'closed':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = () => {
    switch (marketStatus.currentPeriod) {
      case 'market-hours':
        return 'Market Open';
      case 'premarket':
        return 'Pre-Market';
      case 'after-hours':
        return 'After Hours';
      case 'closed':
        return 'Market Closed';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = () => {
    switch (marketStatus.currentPeriod) {
      case 'market-hours':
        return <TrendingUp className="w-5 h-5" />;
      case 'premarket':
      case 'after-hours':
        return <Activity className="w-5 h-5" />;
      case 'closed':
        return <Clock className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getDataTypeText = () => {
    switch (marketStatus.currentPeriod) {
      case 'market-hours':
        return 'Live Trading Data';
      case 'premarket':
        return 'Pre-Market Activity';
      case 'after-hours':
        return 'After-Hours Trading';
      case 'closed':
        return 'Previous Session Data';
      default:
        return 'Market Data';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Enhanced Market Status Badge */}
          <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl border ${getStatusColor()}`}>
            <div className="flex-shrink-0">
              {getStatusIcon()}
            </div>
            <div>
              <div className="text-sm font-semibold">{getStatusText()}</div>
              <div className="text-xs opacity-75">{getDataTypeText()}</div>
            </div>
            {marketStatus.currentPeriod === 'market-hours' && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-4 py-2 rounded-lg font-medium text-sm shadow-sm flex items-center space-x-2 ${getBadgeColor()}`}>
          {marketStatus.currentPeriod === 'market-hours' && <Signal className="w-4 h-4" />}
          {marketStatus.currentPeriod !== 'market-hours' && <Clock className="w-4 h-4" />}
          <span className="uppercase tracking-wide">
            {marketStatus.currentPeriod === 'market-hours' ? 'LIVE' : 'CLOSED'}
          </span>
        </div>
      </div>

      {showDetailed && (
        <div className="space-y-3">
          {/* Countdown Timer */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {marketStatus.isOpen ? 'Market Closes' : 'Market Opens'}
                </span>
              </div>
              <div className="text-sm font-semibold">
                {marketStatus.isOpen ? (
                  <span className="text-red-600">{marketStatus.timeUntilClose}</span>
                ) : (
                  <span className="text-green-600">{marketStatus.timeUntilOpen}</span>
                )}
              </div>
            </div>
          </div>

          {/* Refresh Rate */}
          {refreshRate && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Data Refresh Rate</span>
              <span className="font-medium">Every {refreshRate / 1000}s</span>
            </div>
          )}

          {/* Context Message */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="text-xs text-blue-700">
              {marketStatus.currentPeriod === 'market-hours' && (
                <span>📈 Real-time options flow and unusual activity alerts</span>
              )}
              {marketStatus.currentPeriod === 'premarket' && (
                <span>🌅 Limited pre-market options activity (4:00 AM - 9:30 AM ET)</span>
              )}
              {marketStatus.currentPeriod === 'after-hours' && (
                <span>🌙 Extended hours trading (4:00 PM - 8:00 PM ET)</span>
              )}
              {marketStatus.currentPeriod === 'closed' && (
                <span>💤 Historical data from most recent trading session</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
