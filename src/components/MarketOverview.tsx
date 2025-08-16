import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';

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

  useEffect(() => {
    // Simulate market data (in real implementation, this would come from Polygon.io)
    const symbols = ['SPY', 'QQQ', 'IWM', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN'];
    const mockData = symbols.map(symbol => ({
      symbol,
      price: Math.random() * 500 + 100,
      change: (Math.random() - 0.5) * 20,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 100000000) + 1000000,
    }));
    
    setMarketData(mockData);

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