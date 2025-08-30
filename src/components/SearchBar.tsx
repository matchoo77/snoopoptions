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
    const symbol = inputValue.toUpperCase().trim();
    if (symbol) {
      onSearchChange(symbol);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onSearchChange('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-2 sm:p-4 mb-2 sm:mb-4 border">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
        <form onSubmit={handleSubmit} className="flex-1 flex gap-1 sm:gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              placeholder="Search symbol..."
              className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
          >
            <span className="hidden sm:inline">Search</span>
            <Search className="w-3 h-3 sm:hidden" />
          </button>
        </form>

        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
          <button
            onClick={() => onToggleFavorites(!showFavoritesOnly)}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md transition-colors text-xs sm:text-sm font-medium flex-1 sm:flex-none justify-center ${
              showFavoritesOnly
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            <Star className={`w-3 h-3 sm:w-4 sm:h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">
              Favorites {favoriteCount > 0 && `(${favoriteCount})`}
            </span>
            <span className="sm:hidden">
              {favoriteCount > 0 ? favoriteCount : '★'}
            </span>
          </button>
        </div>
      </div>

      {searchSymbol && (
        <div className="mt-2 sm:mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs sm:text-sm text-gray-600">Results for:</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs sm:text-sm font-medium">
            {searchSymbol}
          </span>
          <button
            onClick={handleClear}
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear
          </button>
        </div>
      )}

      {showFavoritesOnly && (
        <div className="mt-2 sm:mt-3 flex items-center gap-2">
          <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
          <span className="text-xs sm:text-sm text-gray-600">
            {favoriteCount} favorite{favoriteCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}