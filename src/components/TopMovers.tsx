import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Flame } from 'lucide-react';
import { OptionsActivity } from '../types/options';

interface TopMoversProps {
  activities: OptionsActivity[];
}

export function TopMovers({ activities }: TopMoversProps) {
  console.log('[TopMovers] Received activities:', activities.length);
  
  const topMovers = useMemo(() => {
    console.log('[TopMovers] Processing activities:', activities.length);
    
    // Group activities by symbol and calculate totals
    const symbolData = activities.reduce((acc, activity) => {
      if (!acc[activity.symbol]) {
        acc[activity.symbol] = {
          symbol: activity.symbol,
          totalVolume: 0,
          totalPremium: 0,
          callVolume: 0,
          putVolume: 0,
          activities: [],
        };
      }
      
      acc[activity.symbol].totalVolume += activity.volume;
      acc[activity.symbol].totalPremium += activity.premium;
      acc[activity.symbol].activities.push(activity);
      
      if (activity.type === 'call') {
        acc[activity.symbol].callVolume += activity.volume;
      } else {
        acc[activity.symbol].putVolume += activity.volume;
      }
      
      return acc;
    }, {} as Record<string, any>);

    console.log('[TopMovers] Symbol data keys:', Object.keys(symbolData));

    // Sort by total premium and take top 10
    const sorted = Object.values(symbolData)
      .sort((a: any, b: any) => b.totalPremium - a.totalPremium)
      .slice(0, 10);
      
    console.log('[TopMovers] Top movers:', sorted.length);
    return sorted;
  }, [activities]);

  const formatCurrency = (value: number) => {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  const getCallPutRatio = (callVolume: number, putVolume: number) => {
    if (putVolume === 0) return callVolume > 0 ? '∞' : '0';
    return (callVolume / putVolume).toFixed(2);
  };

  const getSentimentColor = (callVolume: number, putVolume: number) => {
    const ratio = callVolume / (putVolume || 1);
    if (ratio > 1.5) return 'text-green-600';
    if (ratio < 0.67) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border">
      <div className="flex items-center mb-4">
        <Flame className="w-5 h-5 text-orange-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Top Movers by Premium</h3>
      </div>

      <div className="space-y-3">
        {topMovers.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-gray-500">
            <div className="text-center">
              <div className="text-sm">Loading unusual options activity...</div>
              <div className="text-xs mt-1">Real-time data is being processed</div>
            </div>
          </div>
        ) : (
          topMovers.map((mover: any, index) => (
            <div key={mover.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{mover.symbol}</div>
                  <div className="text-xs text-gray-500">
                    {mover.activities.length} alert{mover.activities.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-gray-500 text-xs">Volume</div>
                  <div className="font-semibold text-gray-900">
                    {formatNumber(mover.totalVolume)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-gray-500 text-xs">Premium</div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(mover.totalPremium)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-gray-500 text-xs">C/P Ratio</div>
                  <div className={`font-semibold ${getSentimentColor(mover.callVolume, mover.putVolume)}`}>
                    {getCallPutRatio(mover.callVolume, mover.putVolume)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-gray-500 text-xs">Sentiment</div>
                  <div className="flex items-center">
                    {mover.callVolume > mover.putVolume ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}