import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { OptionsActivity } from '../types/options';
import { FavoriteButton } from './FavoriteButton';
import { useMarketStatus } from '../hooks/useMarketStatus';

interface ActivityFeedProps {
  activities: OptionsActivity[];
  favoriteActivityIds: string[];
  onToggleFavorite: (activityId: string, note?: string) => void;
  onUpdateNote: (activityId: string, note: string) => void;
  getFavoriteNote: (activityId: string) => string;
  /** Changing key derived from filters to reset internal accumulation */
  filterKey?: string;
}

type SortField = 'timestamp' | 'volume' | 'premium' | 'impliedVolatility';
type SortDirection = 'asc' | 'desc';

// Memoized activity row component for performance
const ActivityRow = React.memo(({
  activity,
  isFavorite,
  favoriteNote,
  onToggleFavorite,
  onUpdateNote
}: {
  activity: OptionsActivity;
  isFavorite: boolean;
  favoriteNote: string;
  onToggleFavorite: (activityId: string) => void;
  onUpdateNote: (activityId: string, note: string) => void;
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'bearish':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <tr
      className={`hover:bg-gray-50 transition-colors ${activity.blockTrade ? 'bg-yellow-50' : ''
        }`}
    >
      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">
        {formatTime(activity.timestamp)}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex items-center">
          <span className="text-sm font-semibold text-gray-900">
            {activity.symbol}
          </span>
          {activity.blockTrade && (
            <Zap className="w-4 h-4 text-yellow-500 ml-2" />
          )}
        </div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          <span className={`font-semibold ${activity.type === 'call' ? 'text-green-600' : 'text-red-600'
            }`}>
            {activity.type.toUpperCase()}
          </span>
          <div className="text-xs text-gray-500 font-mono">
            ${activity.strike} • {activity.expiration}
          </div>
        </div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">
        {formatNumber(activity.volume)}
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">
        {formatNumber(activity.openInterest)}
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">
        {formatCurrency(activity.lastPrice)}
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-sm">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${activity.tradeLocation === 'below-bid' ? 'bg-red-100 text-red-800' :
          activity.tradeLocation === 'at-bid' ? 'bg-orange-100 text-orange-800' :
            activity.tradeLocation === 'midpoint' ? 'bg-blue-100 text-blue-800' :
              activity.tradeLocation === 'at-ask' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
          }`}>
          {activity.tradeLocation === 'below-bid' ? 'Below Bid' :
            activity.tradeLocation === 'at-bid' ? 'At Bid' :
              activity.tradeLocation === 'midpoint' ? 'Midpoint' :
                activity.tradeLocation === 'at-ask' ? 'At Ask' :
                  'Above Ask'}
        </span>
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">
        {formatCurrency(activity.premium)}
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">
        {(activity.impliedVolatility * 100).toFixed(1)}%
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 font-mono">
        <div>Δ {activity.delta.toFixed(3)}</div>
        <div>Γ {activity.gamma.toFixed(3)}</div>
        <div>Θ {activity.theta.toFixed(3)}</div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex items-center">
          {getSentimentIcon(activity.sentiment)}
          <span className="ml-2 text-sm capitalize text-gray-700">
            {activity.sentiment}
          </span>
        </div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <FavoriteButton
          activityId={activity.id}
          isFavorite={isFavorite}
          note={favoriteNote}
          onToggleFavorite={onToggleFavorite}
          onUpdateNote={onUpdateNote}
        />
      </td>
    </tr>
  );
});

export function ActivityFeed({
  activities,
  favoriteActivityIds,
  onToggleFavorite,
  onUpdateNote,
  getFavoriteNote,
  filterKey
}: ActivityFeedProps) {
  const marketStatus = useMarketStatus();
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [accumulatedActivities, setAccumulatedActivities] = useState<OptionsActivity[]>([]);
  const lastAppliedRef = useRef<number>(0);
  const APPLY_INTERVAL_MS = 30000; // apply updates to UI every 30 seconds

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedActivities = useMemo(() => {
    const arr = [...activities].sort((a, b) => {
      let aValue: number;
      let bValue: number;

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

      if (aValue === bValue) {
        // deterministic tie-breaker to avoid jitter
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    return arr.slice(0, 200); // Show up to 200 activities
  }, [activities, sortField, sortDirection]);

  // Accumulate activities and update display every 30 seconds
  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastAppliedRef.current;

    if (elapsed >= APPLY_INTERVAL_MS) {
      // Get the top 50 new activities
      const newTop50 = sortedActivities.slice(0, 50);
      
      // Stack them on top of existing activities, but keep total at 200
      setAccumulatedActivities(prev => {
        const combined = [...newTop50, ...prev];
        const uniqueActivities = Array.from(
          new Map(combined.map(activity => [activity.id, activity])).values()
        );
        return uniqueActivities.slice(0, 200);
      });
      
      lastAppliedRef.current = now;
      return;
    }

    const timeout = setTimeout(() => {
      const newTop50 = sortedActivities.slice(0, 50);
      
      setAccumulatedActivities(prev => {
        const combined = [...newTop50, ...prev];
        const uniqueActivities = Array.from(
          new Map(combined.map(activity => [activity.id, activity])).values()
        );
        return uniqueActivities.slice(0, 200);
      });
      
      lastAppliedRef.current = Date.now();
    }, APPLY_INTERVAL_MS - elapsed);

    return () => clearTimeout(timeout);
  }, [sortedActivities]);

  // Reset accumulation immediately when filters change
  useEffect(() => {
    if (filterKey !== undefined) {
      setAccumulatedActivities(sortedActivities.slice(0, 200));
      lastAppliedRef.current = Date.now();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  // Use accumulated activities for display, fallback to sorted activities
  const activitiesToShow = accumulatedActivities.length > 0 ? accumulatedActivities : sortedActivities;

  // Hide feed outside regular market hours (premarket, after-hours, closed)
  // Treat anything other than 'market-hours' as closed for the UI
  if (!marketStatus || marketStatus.currentPeriod !== 'market-hours') {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Zap className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-3">Market is closed right now</h3>
          <p className="text-base text-gray-500 mb-2">Options activity is visible only during regular market hours.</p>
          <p className="text-sm text-gray-400">Check back when the market reopens.</p>
        </div>
      </div>
    );
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <Minus className="w-4 h-4 ml-1 text-gray-300" />;
    }
    return sortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 ml-1" />
      : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Unusual Options Activity</h3>
            <p className="text-sm text-gray-600 mt-1">Showing top 200 unusual activity alerts</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-green-600">LIVE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('timestamp')}
                  className="flex items-center hover:text-gray-700 transition-colors"
                >
                  Time
                  {getSortIcon('timestamp')}
                </button>
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contract
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('volume')}
                  className="flex items-center hover:text-gray-700 transition-colors"
                >
                  Volume
                  {getSortIcon('volume')}
                </button>
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                OI
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Price
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trade Location
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('premium')}
                  className="flex items-center hover:text-gray-700 transition-colors"
                >
                  Premium
                  {getSortIcon('premium')}
                </button>
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('impliedVolatility')}
                  className="flex items-center hover:text-gray-700 transition-colors"
                >
                  IV
                  {getSortIcon('impliedVolatility')}
                </button>
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Greeks
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sentiment
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activitiesToShow.map((activity) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                isFavorite={favoriteActivityIds.includes(activity.id)}
                favoriteNote={getFavoriteNote(activity.id)}
                onToggleFavorite={onToggleFavorite}
                onUpdateNote={onUpdateNote}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}