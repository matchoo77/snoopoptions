import React, { useState } from 'react';
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { OptionsActivity } from '../types/options';
import { FavoriteButton } from './FavoriteButton';

interface ActivityFeedProps {
  activities: OptionsActivity[];
  favoriteActivityIds: string[];
  onToggleFavorite: (activityId: string, note?: string) => void;
  onUpdateNote: (activityId: string, note: string) => void;
  getFavoriteNote: (activityId: string) => string;
}

type SortField = 'timestamp' | 'volume' | 'premium' | 'impliedVolatility';
type SortDirection = 'asc' | 'desc';

export function ActivityFeed({ 
  activities, 
  favoriteActivityIds, 
  onToggleFavorite, 
  onUpdateNote, 
  getFavoriteNote 
}: ActivityFeedProps) {
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedActivities = [...activities].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'timestamp':
        aValue = new Date(a.timestamp).getTime();
        bValue = new Date(b.timestamp).getTime();
        break;
      case 'volume':
        aValue = a.volume;
        bValue = b.volume;
        break;
      case 'premium':
        aValue = a.premium;
        bValue = b.premium;
        break;
      case 'impliedVolatility':
        aValue = a.impliedVolatility;
        bValue = b.impliedVolatility;
        break;
      default:
        return 0;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'bearish':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Unusual Options Activity</h3>
        <p className="text-sm text-gray-600 mt-1">
          Showing {activities.length} unusual activity alerts
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('timestamp')}
                  className="flex items-center hover:text-gray-700 transition-colors"
                >
                  Time
                  {getSortIcon('timestamp')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contract
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('volume')}
                  className="flex items-center hover:text-gray-700 transition-colors"
                >
                  Volume
                  {getSortIcon('volume')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                OI
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('premium')}
                  className="flex items-center hover:text-gray-700 transition-colors"
                >
                  Premium
                  {getSortIcon('premium')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('impliedVolatility')}
                  className="flex items-center hover:text-gray-700 transition-colors"
                >
                  IV
                  {getSortIcon('impliedVolatility')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Greeks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sentiment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedActivities.map((activity) => (
              <tr 
                key={activity.id} 
                className={`hover:bg-gray-50 transition-colors ${
                  activity.blockTrade ? 'bg-yellow-50' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                  {formatTime(activity.timestamp)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-gray-900">
                      {activity.symbol}
                    </span>
                    {activity.blockTrade && (
                      <Zap className="w-4 h-4 text-yellow-500 ml-2" title="Block Trade" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <span className={`font-semibold ${
                      activity.type === 'call' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {activity.type.toUpperCase()}
                    </span>
                    <div className="text-xs text-gray-500 font-mono">
                      ${activity.strike} • {activity.expiration}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                  {formatNumber(activity.volume)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                  {formatNumber(activity.openInterest)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                  {formatCurrency(activity.lastPrice)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                  {formatCurrency(activity.premium)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                  {(activity.impliedVolatility * 100).toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                  <div>Δ {activity.delta.toFixed(3)}</div>
                  <div>Γ {activity.gamma.toFixed(3)}</div>
                  <div>Θ {activity.theta.toFixed(3)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getSentimentIcon(activity.sentiment)}
                    <span className="ml-2 text-sm capitalize text-gray-700">
                      {activity.sentiment}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <FavoriteButton
                    activityId={activity.id}
                    isFavorite={favoriteActivityIds.includes(activity.id)}
                    note={getFavoriteNote(activity.id)}
                    onToggleFavorite={onToggleFavorite}
                    onUpdateNote={onUpdateNote}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}