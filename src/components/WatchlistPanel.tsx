import React, { useState, useEffect } from 'react';
import { Plus, X, Eye, Star } from 'lucide-react';
import { OptionsActivity } from '../types/options';

interface WatchlistPanelProps {
  activities: OptionsActivity[];
  onSymbolSelect: (symbol: string) => void;
}

export function WatchlistPanel({ activities, onSymbolSelect }: WatchlistPanelProps) {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [newSymbol, setNewSymbol] = useState('');

  // Load watchlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('optionsScanner_watchlist');
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading watchlist:', error);
      }
    }
  }, []);

  // Save watchlist to localStorage
  useEffect(() => {
    localStorage.setItem('optionsScanner_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const addSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    const symbol = newSymbol.toUpperCase().trim();
    if (symbol && !watchlist.includes(symbol)) {
      setWatchlist(prev => [...prev, symbol]);
      setNewSymbol('');
    }
  };

  const removeSymbol = (symbol: string) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
  };

  // Get activity count for each watchlist symbol
  const getSymbolActivityCount = (symbol: string) => {
    return activities.filter(activity => activity.symbol === symbol).length;
  };

  // Get total premium for each symbol
  const getSymbolPremium = (symbol: string) => {
    return activities
      .filter(activity => activity.symbol === symbol)
      .reduce((sum, activity) => sum + activity.premium, 0);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border">
      <div className="flex items-center mb-4">
        <Star className="w-5 h-5 text-yellow-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Watchlist</h3>
        <span className="text-sm">🦴 Favorite hunting spots</span>
        <div className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
          {watchlist.length}
        </div>
      </div>

      <form onSubmit={addSymbol} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
          placeholder="Add symbol (e.g., AAPL)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          maxLength={10}
        />
        <button
          type="submit"
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {watchlist.map((symbol) => {
          const activityCount = getSymbolActivityCount(symbol);
          const totalPremium = getSymbolPremium(symbol);
          
          return (
            <div
              key={symbol}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-gray-900">{symbol}</span>
                {activityCount > 0 && (
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                      {activityCount} alert{activityCount > 1 ? 's' : ''}
                    </span>
                    <span className="text-gray-600">
                      {formatCurrency(totalPremium)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onSymbolSelect(symbol)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="View activity"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeSymbol(symbol)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove from watchlist"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {watchlist.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm">No symbols in watchlist</p>
          <p className="text-xs text-gray-400">Add symbols to track their unusual activity</p>
        </div>
      )}
    </div>
  );
}