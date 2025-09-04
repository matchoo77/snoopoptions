import { Clock, TrendingUp, Activity, Signal } from 'lucide-react';
import { useMarketStatus } from '../hooks/useMarketStatus';

interface MarketStatusIndicatorProps {
    refreshRate?: number;
    showDetailed?: boolean;
}
//
export function MarketStatusIndicator({ refreshRate, showDetailed = false }: MarketStatusIndicatorProps) {
    const marketStatus = useMarketStatus();

    if (!marketStatus) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-3">
                <div className="flex items-center space-x-2 text-gray-500">
                    <div className="animate-spin">
                        <Clock className="w-4 h-4" />
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
                return <TrendingUp className="w-4 h-4" />;
            case 'premarket':
            case 'after-hours':
                return <Activity className="w-4 h-4" />;
            case 'closed':
                return <Clock className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
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
        <div className="bg-white rounded-lg shadow-sm border p-3">
            <div className="flex items-center justify-between">
                {/* Left side - Status info */}
                <div className="flex items-center space-x-4">
                    {/* Compact Market Status Badge */}
                    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getStatusColor()}`}>
                        <div className="flex-shrink-0">
                            {getStatusIcon()}
                        </div>
                        <div>
                            <div className="text-sm font-semibold">{getStatusText()}</div>
                            <div className="text-xs opacity-75">{getDataTypeText()}</div>
                        </div>
                        {marketStatus.currentPeriod === 'market-hours' && (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-1"></div>
                        )}
                    </div>

                    {/* Countdown Timer - Inline */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                            {marketStatus.isOpen ? 'Closes in' : 'Opens in'}:
                        </span>
                        <span className="font-semibold">
                            {marketStatus.isOpen ? (
                                <span className="text-red-600">{marketStatus.timeUntilClose}</span>
                            ) : (
                                <span className="text-green-600">{marketStatus.timeUntilOpen}</span>
                            )}
                        </span>
                    </div>

                    {/* Refresh Rate - Inline */}
                    {refreshRate && (
                        <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                            Updates every {refreshRate / 1000}s
                        </div>
                    )}
                </div>

                {/* Right side - Compact Status Badge */}
                <div className={`px-3 py-2 rounded-lg font-medium text-sm shadow-sm flex items-center space-x-1 ${getBadgeColor()}`}>
                    {marketStatus.currentPeriod === 'market-hours' && <Signal className="w-4 h-4" />}
                    {marketStatus.currentPeriod !== 'market-hours' && <Clock className="w-4 h-4" />}
                    <span className="uppercase tracking-wide">
                        {marketStatus.currentPeriod === 'market-hours' ? 'LIVE' : 'CLOSED'}
                    </span>
                </div>
            </div>
        </div>
    );
}
