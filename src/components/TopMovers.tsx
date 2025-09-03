import { TrendingUp, TrendingDown, Flame, Loader2 } from 'lucide-react';
import { TopMover } from '../types/options';

interface TopMoversProps {
  topMovers?: TopMover[];
  loading?: boolean;
}

export function TopMovers({ topMovers = [], loading = false }: TopMoversProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border">
      <div className="flex items-center mb-4">
        <Flame className="w-5 h-5 text-orange-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Top Movers</h3>
      </div>

      <div className="space-y-3" style={{ minHeight: '280px' }}>
        {loading ? (
          <div className="flex items-center justify-center p-6 text-gray-500" style={{ height: '280px' }}>
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading top movers...</span>
            </div>
          </div>
        ) : topMovers.length === 0 ? (
          <div className="flex items-center justify-center p-6 text-gray-500" style={{ height: '280px' }}>
            <div className="text-center">
              <div className="text-sm">No top movers available</div>
              <div className="text-xs mt-1">Check back during market hours</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {topMovers.slice(0, 10).map((mover, index) => (
              <div key={mover.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{mover.symbol}</div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(mover.price)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-500 text-xs">Change</div>
                    <div className={`font-semibold ${mover.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {mover.change >= 0 ? '+' : ''}{mover.changePercent.toFixed(2)}%
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-gray-500 text-xs">Volume</div>
                    <div className="font-semibold text-gray-900">
                      {formatNumber(mover.volume)}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-gray-500 text-xs">Trend</div>
                    <div className="flex items-center">
                      {mover.change >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}