import React, { useState } from 'react';
import { Header } from '../Header';
import { TrialBanner } from '../TrialBanner';
import { useOptionsData } from '../../hooks/useOptionsData';
import { useFavorites } from '../../hooks/useFavorites';
import { SearchBar } from '../SearchBar';
import { FilterPanel } from '../FilterPanel';
import { StatsOverview } from '../StatsOverview';
import { DataSourceIndicator } from '../DataSourceIndicator';
import { ActivityFeed } from '../ActivityFeed';
import { AlertsPanel } from '../AlertsPanel';
import { MarketOverview } from '../MarketOverview';
import { TopMovers } from '../TopMovers';
import { WatchlistPanel } from '../WatchlistPanel';
import { BacktestingPanel } from '../backtesting/BacktestingPanel';

interface DashboardAppProps {
  trialStatus?: {
    hasActiveTrial: boolean;
    hasActiveSubscription: boolean;
    accessType: 'trial' | 'subscription' | 'expired';
    trialDaysRemaining: number;
  };
  onUpgrade?: () => void;
}

export function DashboardApp({ trialStatus, onUpgrade }: DashboardAppProps) {
  const { 
    activities, 
    filters, 
    setFilters, 
    isConnected, 
    isUsingRealData, 
    dataSource,
    loading: dataLoading,
    error 
  } = useOptionsData();
  
  const {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    getFavoriteNote,
    updateFavoriteNote,
  } = useFavorites();

  // Filter activities based on favorites filter
  const displayActivities = filters.showFavoritesOnly 
    ? activities.filter(activity => isFavorite(activity.id))
    : activities;

  const favoriteActivityIds = favorites.map(fav => fav.activityId);

  const handleToggleFavorite = (activityId: string, note?: string) => {
    if (isFavorite(activityId)) {
      removeFromFavorites(activityId);
    } else {
      addToFavorites(activityId, note);
    }
  };

  const handleSymbolSelect = (symbol: string) => {
    setFilters(prev => ({ ...prev, searchSymbol: symbol }));
  };

  const [showBacktesting, setShowBacktesting] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show trial banner if user is on trial */}
        {trialStatus && trialStatus.hasActiveTrial && onUpgrade && (
          <TrialBanner 
            daysRemaining={trialStatus.trialDaysRemaining}
            onUpgrade={onUpgrade}
          />
        )}
        
        <DataSourceIndicator 
          isConnected={isConnected} 
          isUsingRealData={isUsingRealData} 
          dataSource={dataSource}
          loading={dataLoading}
          error={error} 
        />
        
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-1 mb-6 border">
          <div className="flex space-x-1">
            <button
              onClick={() => setShowBacktesting(false)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                !showBacktesting
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Live Scanner
            </button>
            <button
              onClick={() => setShowBacktesting(true)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                showBacktesting
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Backtesting Lab
            </button>
          </div>
        </div>
        
        {showBacktesting ? (
          <BacktestingPanel />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <SearchBar
              searchSymbol={filters.searchSymbol}
              onSearchChange={(symbol) => setFilters(prev => ({ ...prev, searchSymbol: symbol }))}
              showFavoritesOnly={filters.showFavoritesOnly}
              onToggleFavorites={(show) => setFilters(prev => ({ ...prev, showFavoritesOnly: show }))}
              favoriteCount={favorites.length}
            />
            
            <FilterPanel filters={filters} onFiltersChange={setFilters} />
            
            <StatsOverview activities={displayActivities} />
            <StatsOverview activities={displayActivities} dataSource={dataSource} />
            
            <MarketOverview />
            
            <TopMovers activities={displayActivities} />
            
            <ActivityFeed
              activities={displayActivities}
              favoriteActivityIds={favoriteActivityIds}
              onToggleFavorite={handleToggleFavorite}
              onUpdateNote={updateFavoriteNote}
              getFavoriteNote={getFavoriteNote}
            />
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <AlertsPanel activities={activities} />
            
            <WatchlistPanel 
              activities={activities} 
              onSymbolSelect={handleSymbolSelect}
            />
          </div>
        </div>
        )}
      </main>
    </div>
  );
}