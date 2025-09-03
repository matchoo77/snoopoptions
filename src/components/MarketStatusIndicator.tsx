import React from 'react';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useMarketStatus } from '../hooks/useMarketStatus';

interface MarketStatusIndicatorProps {
  refreshRate?: number;
  showDetailed?: boolean;
}

export function MarketStatusIndicator({ refreshRate, showDetailed = true }: MarketStatusIndicatorProps) {
  const marketStatus = useMarketStatus();

  if (!marketStatus) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Clock className="w-4 h-4" />
        <span className="text-sm">Loading market status...</span>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (marketStatus.currentPeriod) {
      case 'market-hours':
        return 'text-green-600 bg-green-50';
      case 'premarket':
      case 'after-hours':
        return 'text-yellow-600 bg-yellow-50';
      case 'closed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
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
        return <TrendingUp className="w-4 h-4" />;
      case 'premarket':
      case 'after-hours':
        return <TrendingDown className="w-4 h-4" />;
      case 'closed':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getDataTypeText = () => {
    switch (marketStatus.currentPeriod) {
      case 'market-hours':
        return 'Live Data';
      case 'premarket':
        return 'Pre-Market Data';
      case 'after-hours':
        return 'After-Hours Data';
      case 'closed':
        return 'Previous Session Data';
      default:
        return 'Market Data';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Market Status Badge */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
          
          {/* Data Type Indicator */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">{getDataTypeText()}</span>
          </div>
        </div>

        {/* Refresh Rate */}
        {refreshRate && (
          <div className="text-xs text-gray-500">
            Refreshing every {refreshRate / 1000}s
          </div>
        )}
      </div>

      {showDetailed && (
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          {/* Countdown Timer */}
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              {marketStatus.isOpen ? (
                <span className="text-gray-600">
                  Closes in: <span className="font-medium text-red-600">{marketStatus.timeUntilClose}</span>
                </span>
              ) : (
                <span className="text-gray-600">
                  Opens in: <span className="font-medium text-green-600">{marketStatus.timeUntilOpen}</span>
                </span>
              )}
            </div>
          </div>

          {/* Timezone */}
          <div className="text-right text-gray-500">
            <span>Eastern Time</span>
          </div>
        </div>
      )}

      {/* Additional Context */}
      {showDetailed && (
        <div className="mt-2 text-xs text-gray-500 border-t pt-2">
          {marketStatus.currentPeriod === 'market-hours' && (
            <span>📈 Showing real-time options activity and market movements</span>
          )}
          {marketStatus.currentPeriod === 'premarket' && (
            <span>🌅 Showing pre-market activity (limited options trading)</span>
          )}
          {marketStatus.currentPeriod === 'after-hours' && (
            <span>🌙 Showing after-hours activity (limited options trading)</span>
          )}
          {marketStatus.currentPeriod === 'closed' && (
            <span>💤 Showing data from the most recent trading session</span>
          )}
        </div>
      )}
    </div>
  );
}
