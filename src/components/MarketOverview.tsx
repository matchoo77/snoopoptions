import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { PolygonEODService } from '../lib/polygonEOD';
import { isValidPolygonApiKey } from '../lib/apiKeyValidation';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high?: number;
  low?: number;
  marketCap?: string;
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
  const [marketStatus, setMarketStatus] = useState<'open' | 'closed' | 'pre' | 'after'>('closed');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Expanded list of symbols for better market overview
    const symbols = [
      'SPY', 'QQQ', 'IWM', 'VIX', 'GLD', 'TLT',  // Major ETFs
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', // Tech leaders
      'JPM', 'BAC', 'XOM', 'JNJ', 'PG', 'KO', 'WMT', 'V' // Other sectors
    ];

    const apiKey = 'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X';

    if (!isValidPolygonApiKey(apiKey)) {
      setError('Polygon API key is missing or invalid.');
      setMarketData([]);
    } else {
      const service = new PolygonEODService();

      const fetchData = async () => {
        try {
          setError(null);

          // Determine previous trading day
          const today = new Date();
          const prev = new Date(today);
          prev.setDate(today.getDate() - 1);
          if (today.getDay() === 1) prev.setDate(today.getDate() - 3); // Monday -> Friday
          if (today.getDay() === 0) prev.setDate(today.getDate() - 2); // Sunday -> Friday
          const dateStr = prev.toISOString().split('T')[0];

          // Fetch data for all symbols in parallel
          const promises = symbols.map(async (symbol) => {
            try {
              const aggs = await service.getStockAggregates(symbol, dateStr, dateStr);
              if (aggs && aggs.length > 0) {
                const agg = aggs[0];
                const price = agg.c ?? agg.vw ?? agg.o ?? 0;
                const open = agg.o ?? price;
                const change = price - open;
                const changePercent = open ? (change / open) * 100 : 0;
                const volume = agg.v ?? 0;
                const high = agg.h ?? price;
                const low = agg.l ?? price;

                return {
                  symbol,
                  price,
                  change,
                  changePercent,
                  volume,
                  high,
                  low
                };
              }
              return null;
            } catch (e) {
              console.warn(`Failed to fetch data for ${symbol}:`, e);
              return null;
            }
          });

          const results = (await Promise.all(promises)).filter(Boolean) as MarketData[];
          setMarketData(results);

          // Calculate market statistics
          const advancers = results.filter(stock => stock.change > 0).length;
          const decliners = results.filter(stock => stock.change < 0).length;
          const unchanged = results.filter(stock => stock.change === 0).length;

          const volumeLeaders = [...results]
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 5);

          const gainers = [...results]
            .filter(stock => stock.changePercent > 0)
            .sort((a, b) => b.changePercent - a.changePercent)
            .slice(0, 5);

          const losers = [...results]
            .filter(stock => stock.changePercent < 0)
            .sort((a, b) => a.changePercent - b.changePercent)
            .slice(0, 5);

          setMarketStats({
            advancers,
            decliners,
            unchanged,
            volumeLeaders,
            gainers,
            losers
          });

          setLastUpdate(new Date());
        } catch (e) {
          console.error('MarketOverview fetch error:', e);
          setError('Failed to load market data from Polygon');
          setMarketData([]);
        }
      };

      fetchData();

      // Set up real-time updates every 2 minutes
      const interval = setInterval(fetchData, 2 * 60 * 1000);
      return () => clearInterval(interval);
    }

    // Determine market status based on current time
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    if (day === 0 || day === 6) {
      setMarketStatus('closed');
    } else if (hour >= 9 && hour < 16) {
      setMarketStatus('open');
    } else if (hour >= 4 && hour < 9) {
      setMarketStatus('pre');
    } else if (hour >= 16 && hour < 20) {
      setMarketStatus('after');
    } else {
      setMarketStatus('closed');
    }
  }, []);

  const getMarketStatusColor = () => {
    switch (marketStatus) {
      case 'open': return 'text-green-600';
      case 'pre': return 'text-yellow-600';
      case 'after': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getMarketStatusText = () => {
    switch (marketStatus) {
      case 'open': return 'Market Open';
      case 'pre': return 'Pre-Market';
      case 'after': return 'After Hours';
      default: return 'Market Closed';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border">
      <div className="flex items-center justify-between mb-4">
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

      {error && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        </div>
      )}

      {/* Market Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{marketStats.advancers}</div>
          <div className="text-sm text-green-700">Advancers</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{marketStats.decliners}</div>
          <div className="text-sm text-red-700">Decliners</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-600">{marketStats.unchanged}</div>
          <div className="text-sm text-gray-700">Unchanged</div>
        </div>
      </div>

      {/* Major Market Indices */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">Major Indices & ETFs</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {marketData.slice(0, 6).map((stock) => (
            <div key={stock.symbol} className="bg-gray-50 rounded-lg p-3">
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
      {marketStats.gainers.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">Top Gainers</h4>
          <div className="grid grid-cols-5 gap-3">
            {marketStats.gainers.map((stock) => (
              <div key={stock.symbol} className="bg-green-50 rounded-lg p-2">
                <div className="text-sm font-semibold text-gray-900 mb-1">
                  {stock.symbol}
                </div>
                <div className="text-green-600 text-xs font-medium">
                  +{stock.changePercent.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Losers */}
      {marketStats.losers.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">Top Losers</h4>
          <div className="grid grid-cols-5 gap-3">
            {marketStats.losers.map((stock) => (
              <div key={stock.symbol} className="bg-red-50 rounded-lg p-2">
                <div className="text-sm font-semibold text-gray-900 mb-1">
                  {stock.symbol}
                </div>
                <div className="text-red-600 text-xs font-medium">
                  {stock.changePercent.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}