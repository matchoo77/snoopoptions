import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high?: number;
  low?: number;
}

interface MarketStats {
  advancers: number;
  decliners: number;
  unchanged: number;
  volumeLeaders: MarketData[];
  gainers: MarketData[];
  losers: MarketData[];
}

export function MarketOverview() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats>({
    advancers: 0,
    decliners: 0,
    unchanged: 0,
    volumeLeaders: [],
    gainers: [],
    losers: []
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch real market data from Polygon API
  const fetchMarketData = async (): Promise<MarketData[]> => {
    try {
      // For now, return empty array until real API integration is implemented
      return [];
    } catch (error) {
      console.error('Error fetching market data:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchMarketData();
      setMarketData(data);

      // Calculate market statistics from real data (empty array safe)
      const advancers = data.length > 0 ? data.filter(stock => stock.change > 0).length : 0;
      const decliners = data.length > 0 ? data.filter(stock => stock.change < 0).length : 0;
      const unchanged = data.length > 0 ? data.filter(stock => stock.change === 0).length : 0;

      const volumeLeaders = data.length > 0 ? [...data]
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5) : [];

      const gainers = data.length > 0 ? [...data]
        .filter(stock => stock.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 5) : [];

      const losers = data.length > 0 ? [...data]
        .filter(stock => stock.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 5) : [];

      setMarketStats({
        advancers,
        decliners,
        unchanged,
        volumeLeaders,
        gainers,
        losers
      });

      setLastUpdate(new Date());
    };

    // Initial load
    fetchData();

    // Update every 30 seconds for responsive market data
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  const getMarketStatusColor = () => {
    return 'text-green-600';
  };

  const getMarketStatusText = () => {
    return 'LIVE';
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-2 mb-3 border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">Market Overview</h3>
        <div className="flex items-center space-x-4">
          <div className="text-xs text-gray-500">
            Last Update: {lastUpdate.toLocaleTimeString()}
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className={`text-sm font-medium ${getMarketStatusColor()}`}>
              {getMarketStatusText()}
            </span>
          </div>
        </div>
      </div>

      {/* Market Statistics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-green-50 rounded-lg p-1.5 text-center">
          <div className="text-2xl font-bold text-green-600">{marketStats.advancers}</div>
          <div className="text-sm text-green-700">Advancers</div>
        </div>
        <div className="bg-red-50 rounded-lg p-1.5 text-center">
          <div className="text-2xl font-bold text-red-600">{marketStats.decliners}</div>
          <div className="text-sm text-red-700">Decliners</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-1.5 text-center">
          <div className="text-2xl font-bold text-gray-600">{marketStats.unchanged}</div>
          <div className="text-sm text-gray-700">Unchanged</div>
        </div>
      </div>

      {/* Major Market Indices */}
      <div className="mb-3">
        <h4 className="text-md font-medium text-gray-900 mb-1.5">Major Indices & ETFs</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1.5">
          {marketData.slice(0, 6).map((stock) => (
            <div key={stock.symbol} className="bg-gray-50 rounded-lg p-1.5">
              <div className="text-sm font-semibold text-gray-900 mb-1">
                {stock.symbol}
              </div>
              <div className="text-lg font-bold text-gray-900 mb-1">
                ${stock.price.toFixed(2)}
              </div>
              <div className={`flex items-center text-xs ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                {stock.change >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                <span>
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                  ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center">
                <DollarSign className="w-3 h-3 mr-1" />
                Vol: {formatNumber(stock.volume)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Gainers */}
      <div className="mb-2" style={{ minHeight: '80px' }}>
        {marketStats.gainers.length > 0 && (
          <>
            <h4 className="text-md font-medium text-gray-900 mb-1.5">Top Gainers</h4>
            <div className="grid grid-cols-5 gap-1.5">
              {marketStats.gainers.map((stock) => (
                <div key={stock.symbol} className="bg-green-50 rounded-lg p-1.5">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {stock.symbol}
                  </div>
                  <div className="text-green-600 text-xs font-medium">
                    +{stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Top Losers */}
      <div className="mb-2" style={{ minHeight: '80px' }}>
        {marketStats.losers.length > 0 && (
          <>
            <h4 className="text-md font-medium text-gray-900 mb-1.5">Top Losers</h4>
            <div className="grid grid-cols-5 gap-1.5">
              {marketStats.losers.map((stock) => (
                <div key={stock.symbol} className="bg-red-50 rounded-lg p-1.5">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {stock.symbol}
                  </div>
                  <div className="text-red-600 text-xs font-medium">
                    {stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}