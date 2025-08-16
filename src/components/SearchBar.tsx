import React, { useState } from 'react';
import { Search, X, Star } from 'lucide-react';

interface SearchBarProps {
  searchSymbol: string;
  onSearchChange: (symbol: string) => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: (show: boolean) => void;
  favoriteCount: number;
}

export function SearchBar({ 
  searchSymbol, 
  onSearchChange, 
  showFavoritesOnly, 
  onToggleFavorites,
  favoriteCount 
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(searchSymbol);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(inputValue.toUpperCase());
  };

  const handleClear = () => {
    setInputValue('');
    onSearchChange('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              placeholder="Search by symbol (e.g., AAPL, TSLA)"
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorites(!showFavoritesOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              showFavoritesOnly
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">
              Favorites {favoriteCount > 0 && `(${favoriteCount})`}
            </span>
          </button>
        </div>
      </div>

      {searchSymbol && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-gray-600">Showing results for:</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
            {searchSymbol}
          </span>
          <button
            onClick={handleClear}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear search
          </button>
        </div>
      )}

      {showFavoritesOnly && (
        <div className="mt-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="text-sm text-gray-600">
            Showing {favoriteCount} favorited alert{favoriteCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}