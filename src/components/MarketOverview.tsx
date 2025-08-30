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

  // Generate realistic synthetic market data
  const generateMarketData = () => {
    const symbols = [
      { symbol: 'SPY', basePrice: 575 },
      { symbol: 'QQQ', basePrice: 495 },
      { symbol: 'IWM', basePrice: 215 },
      { symbol: 'VIX', basePrice: 18 },
      { symbol: 'GLD', basePrice: 185 },
      { symbol: 'AAPL', basePrice: 230 },
      { symbol: 'MSFT', basePrice: 445 },
      { symbol: 'GOOGL', basePrice: 175 },
      { symbol: 'AMZN', basePrice: 195 },
      { symbol: 'TSLA', basePrice: 275 },
      { symbol: 'NVDA', basePrice: 135 },
      { symbol: 'META', basePrice: 555 },
      { symbol: 'NFLX', basePrice: 485 },
      { symbol: 'JPM', basePrice: 215 },
      { symbol: 'BAC', basePrice: 42 },
      { symbol: 'XOM', basePrice: 115 },
      { symbol: 'JNJ', basePrice: 165 },
      { symbol: 'PG', basePrice: 165 },
      { symbol: 'KO', basePrice: 68 },
      { symbol: 'WMT', basePrice: 175 },
      { symbol: 'V', basePrice: 285 }
    ];

    const timeSeed = Math.floor(Date.now() / 1000); // Changes every second for more variation
    
    return symbols.map((stock, index) => {
      // Generate realistic intraday movement
      const dailyChangePercent = ((timeSeed * 7 + index * 13) % 600 - 300) / 100; // -3% to +3%
      const intradayVariation = (Math.sin((timeSeed + index) * 0.1) * 0.5); // Small intraday moves
      const totalChangePercent = (dailyChangePercent + intradayVariation) / 100;
      
      const currentPrice = stock.basePrice * (1 + totalChangePercent);
      const change = currentPrice - stock.basePrice;
      const volume = Math.floor((50000 + (timeSeed * 17 + index * 23) % 2000000)); // 50K to 2M volume
      
      return {
        symbol: stock.symbol,
        price: Math.round(currentPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(totalChangePercent * 10000) / 100,
        volume: volume,
        high: Math.round(currentPrice * 1.005 * 100) / 100,
        low: Math.round(currentPrice * 0.995 * 100) / 100
      };
    });
  };

  useEffect(() => {
    const fetchData = () => {
      const data = generateMarketData();
      setMarketData(data);

      // Calculate market statistics
      const advancers = data.filter(stock => stock.change > 0).length;
      const decliners = data.filter(stock => stock.change < 0).length;
      const unchanged = data.filter(stock => stock.change === 0).length;

      const volumeLeaders = [...data]
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5);

      const gainers = [...data]
        .filter(stock => stock.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 5);

      const losers = [...data]
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
    };

    // Initial load
    fetchData();

    // Update every 100ms to match the options data refresh rate
    const interval = setInterval(fetchData, 100);
    
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
        <h3 className="text-sm font-semibold text-gray-900">Market Overview</h3>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-500">
            {lastUpdate.toLocaleTimeString()}
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className={`text-xs font-medium ${getMarketStatusColor()}`}>
              {getMarketStatusText()}
            </span>
          </div>
        </div>
      </div>

      {/* Market Statistics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-green-50 rounded p-2 text-center">
          <div className="text-lg font-bold text-green-600">{marketStats.advancers}</div>
          <div className="text-xs text-green-700">Advancers</div>
        </div>
        <div className="bg-red-50 rounded p-2 text-center">
          <div className="text-lg font-bold text-red-600">{marketStats.decliners}</div>
          <div className="text-xs text-red-700">Decliners</div>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="text-lg font-bold text-gray-600">{marketStats.unchanged}</div>
          <div className="text-xs text-gray-700">Unchanged</div>
        </div>
      </div>

      {/* Major Market Indices */}
      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Major Indices & ETFs</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {marketData.slice(0, 6).map((stock) => (
            <div key={stock.symbol} className="bg-gray-50 rounded p-2">
              <div className="text-xs font-semibold text-gray-900 mb-1">
                {stock.symbol}
              </div>
              <div className="text-sm font-bold text-gray-900 mb-1">
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
      <div className="mb-2" style={{ minHeight: '60px' }}>
        {marketStats.gainers.length > 0 && (
          <>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Top Gainers</h4>
            <div className="grid grid-cols-5 gap-2">
              {marketStats.gainers.map((stock) => (
                <div key={stock.symbol} className="bg-green-50 rounded p-1.5">
                  <div className="text-xs font-semibold text-gray-900 mb-1">
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
      <div className="mb-2" style={{ minHeight: '60px' }}>
        {marketStats.losers.length > 0 && (
          <>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Top Losers</h4>
            <div className="grid grid-cols-5 gap-2">
              {marketStats.losers.map((stock) => (
                <div key={stock.symbol} className="bg-red-50 rounded p-1.5">
                  <div className="text-xs font-semibold text-gray-900 mb-1">
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