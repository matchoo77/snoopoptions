import React from 'react';
import { Filter, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { FilterOptions } from '../types/options';

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const updateFilter = (key: keyof FilterOptions, value: any) => {
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <Filter className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Scanner Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Symbol Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Symbol
          </label>
          <input
            type="text"
            value={filters.searchSymbol || ''}
            onChange={(e) => updateFilter('searchSymbol', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="AAPL"
          />
        </div>

        {/* Volume Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Volume
          </label>
          <input
            type="number"
            value={filters.minVolume}
            onChange={(e) => updateFilter('minVolume', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1000"
          />
        </div>

        {/* Premium Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Premium ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={filters.minPremium}
            onChange={(e) => updateFilter('minPremium', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="10000"
          />
        </div>

        {/* Days to Expiration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Days to Expiration
          </label>
          <input
            type="number"
            value={filters.maxDaysToExpiration}
            onChange={(e) => updateFilter('maxDaysToExpiration', parseInt(e.target.value) || 365)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="30"
          />
        </div>

        {/* Min Open Interest */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Open Interest
          </label>
          <input
            type="number"
            value={filters.minOpenInterest}
            onChange={(e) => updateFilter('minOpenInterest', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="100"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Option Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Option Types
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.optionTypes.includes('call')}
                onChange={() => toggleOptionType('call')}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Calls</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.optionTypes.includes('put')}
                onChange={() => toggleOptionType('put')}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Puts</span>
            </label>
          </div>
        </div>

        {/* Sentiment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sentiment
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => toggleSentiment('bullish')}
              className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filters.sentiment.includes('bullish')
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Bullish
            </button>
            <button
              onClick={() => toggleSentiment('bearish')}
              className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filters.sentiment.includes('bearish')
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              <TrendingDown className="w-3 h-3 mr-1" />
              Bearish
            </button>
            <button
              onClick={() => toggleSentiment('neutral')}
              className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filters.sentiment.includes('neutral')
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              <Minus className="w-3 h-3 mr-1" />
              Neutral
            </button>
          </div>
        </div>

        {/* Trade Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trade Location
          </label>
          <div className="space-y-1">
            {[
              { value: 'below-bid', label: 'Below Bid', color: 'red' },
              { value: 'at-bid', label: 'At Bid', color: 'orange' },
              { value: 'midpoint', label: 'Midpoint', color: 'blue' },
              { value: 'at-ask', label: 'At Ask', color: 'green' },
              { value: 'above-ask', label: 'Above Ask', color: 'purple' },
            ].map(({ value, label, color }) => (
              <label key={value} className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={filters.tradeLocations.includes(value as any)}
                  onChange={() => {
                    const newLocations = filters.tradeLocations.includes(value as any)
                      ? filters.tradeLocations.filter(l => l !== value)
                      : [...filters.tradeLocations, value as any];
                    onFiltersChange({ ...filters, tradeLocations: newLocations });
                  }}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className={`text-${color}-600 font-medium`}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Block Trades Only */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Filters
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.blockTradesOnly}
              onChange={(e) => updateFilter('blockTradesOnly', e.target.checked)}
              className="mr-2 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Block Trades Only</span>
          </label>
        </div>
      </div>
    </div>
  );
}