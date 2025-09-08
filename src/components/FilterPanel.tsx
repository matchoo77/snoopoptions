import { Filter, TrendingUp, TrendingDown, Minus, RotateCcw } from 'lucide-react';
import { FilterOptions } from '../types/options';

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const updateFilter = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleSentiment = (sentiment: 'bullish' | 'bearish' | 'neutral') => {
    const newSentiments = filters.sentiment.includes(sentiment)
      ? filters.sentiment.filter(s => s !== sentiment)
      : [...filters.sentiment, sentiment];
    updateFilter('sentiment', newSentiments);
  };

  const toggleOptionType = (type: 'call' | 'put') => {
    const newTypes = filters.optionTypes.includes(type)
      ? filters.optionTypes.filter(t => t !== type)
      : [...filters.optionTypes, type];
    updateFilter('optionTypes', newTypes);
  };

  const handleReset = () => {
    onFiltersChange({
      minVolume: 1,
      minPremium: 1,
      maxDaysToExpiration: 365,
      optionTypes: ['call', 'put'],
      sentiment: ['bullish', 'bearish', 'neutral'],
      tradeLocations: ['below-bid', 'at-bid', 'midpoint', 'at-ask', 'above-ask'],
      blockTradesOnly: false,
      minOpenInterest: 0,
      symbols: [],
      searchSymbol: '',
      showFavoritesOnly: false,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Filter className="w-4 h-4 text-blue-600 mr-2" />
          <h3 className="text-md font-semibold text-gray-900">Scanner Filters</h3>
        </div>
        <button
          onClick={handleReset}
          type="button"
          className="flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RotateCcw className="w-3 h-3 mr-1" /> Reset
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Symbol Search */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Symbol
          </label>
          <input
            type="text"
            value={filters.searchSymbol || ''}
            onChange={(e) => updateFilter('searchSymbol', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="AAPL"
          />
        </div>

        {/* Volume Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Min Volume
          </label>
          <input
            type="number"
            value={filters.minVolume}
            onChange={(e) => updateFilter('minVolume', parseInt(e.target.value) || 0)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="1000"
          />
        </div>

        {/* Premium Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Min Premium ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={filters.minPremium}
            onChange={(e) => updateFilter('minPremium', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="10000"
          />
        </div>

        {/* Days to Expiration */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Max Days to Exp
          </label>
          <input
            type="number"
            value={filters.maxDaysToExpiration}
            onChange={(e) => updateFilter('maxDaysToExpiration', parseInt(e.target.value) || 365)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="30"
          />
        </div>

        {/* Min Open Interest */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Min Open Int
          </label>
          <input
            type="number"
            value={filters.minOpenInterest}
            onChange={(e) => updateFilter('minOpenInterest', parseInt(e.target.value) || 0)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="100"
          />
        </div>

        {/* Block Trades Only */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Special
          </label>
          <label className="flex items-center mt-1">
            <input
              type="checkbox"
              checked={filters.blockTradesOnly}
              onChange={(e) => updateFilter('blockTradesOnly', e.target.checked)}
              className="mr-1 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-700">Block Only</span>
          </label>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Option Types */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Option Types
          </label>
          <div className="flex space-x-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.optionTypes.includes('call')}
                onChange={() => toggleOptionType('call')}
                className="mr-1 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700">Calls</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.optionTypes.includes('put')}
                onChange={() => toggleOptionType('put')}
                className="mr-1 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700">Puts</span>
            </label>
          </div>
        </div>

        {/* Sentiment */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Sentiment
          </label>
          <div className="flex space-x-1">
            <button
              onClick={() => toggleSentiment('bullish')}
              className={`flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${filters.sentiment.includes('bullish')
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Bull
            </button>
            <button
              onClick={() => toggleSentiment('bearish')}
              className={`flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${filters.sentiment.includes('bearish')
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
            >
              <TrendingDown className="w-3 h-3 mr-1" />
              Bear
            </button>
            <button
              onClick={() => toggleSentiment('neutral')}
              className={`flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${filters.sentiment.includes('neutral')
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
            >
              <Minus className="w-3 h-3 mr-1" />
              Neu
            </button>
          </div>
        </div>

        {/* Trade Location */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Trade Location
          </label>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {[
              { value: 'below-bid', label: 'Below', color: 'red' },
              { value: 'at-bid', label: 'At Bid', color: 'orange' },
              { value: 'midpoint', label: 'Mid', color: 'blue' },
              { value: 'at-ask', label: 'At Ask', color: 'green' },
              { value: 'above-ask', label: 'Above', color: 'purple' },
            ].map(({ value, label, color }) => (
              <label key={value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.tradeLocations.includes(value as any)}
                  onChange={() => {
                    const newLocations = filters.tradeLocations.includes(value as any)
                      ? filters.tradeLocations.filter(l => l !== value)
                      : [...filters.tradeLocations, value as any];
                    onFiltersChange({ ...filters, tradeLocations: newLocations });
                  }}
                  className="mr-1 text-blue-600 focus:ring-blue-500"
                />
                <span className={`text-${color}-600 font-medium`}>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}