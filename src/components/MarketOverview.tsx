import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { PolygonEODService } from '../lib/polygonEOD';
import { isValidPolygonApiKey } from '../lib/apiKeyValidation';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export function MarketOverview() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [marketStatus, setMarketStatus] = useState<'open' | 'closed' | 'pre' | 'after'>('closed');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const symbols = ['SPY', 'QQQ'];

    const apiKey = import.meta.env.VITE_POLYGON_API_KEY || '';
    console.log('[MarketOverview] API Key check:', {
      hasKey: !!apiKey,
      keyLength: apiKey.length,
      keyValid: isValidPolygonApiKey(apiKey),
      keyPreview: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}` : 'none',
      fullKey: apiKey
    });
    
    if (!isValidPolygonApiKey(apiKey)) {
      console.log('[MarketOverview] Invalid API key, setting error state');
      setError('Polygon API key is missing or invalid.');
      setMarketData([]);
    } else {
      console.log('[MarketOverview] Valid API key found, fetching market data...');
      // Fetch EOD aggregates for each symbol (previous trading day)
      const service = new PolygonEODService(apiKey);

      const fetchData = async () => {
        try {
          console.log('[MarketOverview] Starting market data fetch...');
          setError(null);
          // Determine previous trading day (rough approximation)
          const today = new Date();
          const prev = new Date(today);
          prev.setDate(today.getDate() - 1);
          if (today.getDay() === 1) prev.setDate(today.getDate() - 3); // Monday -> Friday
          if (today.getDay() === 0) prev.setDate(today.getDate() - 2); // Sunday -> Friday
          const dateStr = prev.toISOString().split('T')[0];

          const results: MarketData[] = [];
          for (const symbol of symbols) {
            console.log(`[MarketOverview] Fetching data for ${symbol}...`);
            const aggs = await service.getStockAggregates(symbol, dateStr, dateStr);
            if (aggs && aggs.length > 0) {
              const agg = aggs[0];
              const price = agg.c ?? agg.vw ?? agg.o ?? 0;
              const open = agg.o ?? price;
              const change = price - open;
              const changePercent = open ? (change / open) * 100 : 0;
              const volume = agg.v ?? 0;
              results.push({ symbol, price, change, changePercent, volume });
              console.log(`[MarketOverview] ${symbol}: $${price.toFixed(2)} (${changePercent.toFixed(2)}%)`);
            }
            // Small delay to avoid rate limiting on free tier
            await new Promise(r => setTimeout(r, 15000)); // 15 second delay for free tier
          }

          console.log(`[MarketOverview] Fetched data for ${results.length} symbols`);
          setMarketData(results);
        } catch (e) {
          console.error('MarketOverview fetch error:', e);
          setError('Failed to load market data from Polygon');
          setMarketData([]);
        }
      };

      fetchData();
    }

    console.log('[MarketOverview] Setting market status...');
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
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className={`text-sm font-medium ${getMarketStatusColor()}`}>
            {getMarketStatusText()}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-800">{error}</p>
            <p className="text-xs text-yellow-700 mt-1">Set VITE_POLYGON_API_KEY in your environment to enable real data.</p>
          </div>
        </div>
      )}

  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {marketData.map((stock) => (
          <div key={stock.symbol} className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-semibold text-gray-900 mb-1">
              {stock.symbol}
            </div>
            <div className="text-lg font-bold text-gray-900 mb-1">
              ${stock.price.toFixed(2)}
            </div>
            <div className={`flex items-center text-xs ${
              stock.change >= 0 ? 'text-green-600' : 'text-red-600'
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
  );
}