import React from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthPage } from './components/auth/AuthPage';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { SearchBar } from './components/SearchBar';
import { DataSourceIndicator } from './components/DataSourceIndicator';
import { AlertsPanel } from './components/AlertsPanel';
import { MarketOverview } from './components/MarketOverview';
import { TopMovers } from './components/TopMovers';
import { WatchlistPanel } from './components/WatchlistPanel';
import { FilterPanel } from './components/FilterPanel';
import { ActivityFeed } from './components/ActivityFeed';
import { useOptionsData } from './hooks/useOptionsData';
import { useFavorites } from './hooks/useFavorites';
import { useSubscription } from './hooks/useSubscription';

function App() {
  const { user, session, loading: authLoading } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  
  const { activities, filters, setFilters, isConnected, isUsingRealData, error } = useOptionsData();
  const { 
    favorites, 
    addToFavorites, 
    removeFromFavorites, 
    isFavorite, 
    getFavoriteNote, 
    updateFavoriteNote 
  } = useFavorites();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onSuccess={() => {}} />;
  }

  // Filter activities based on favorites
  const filteredActivities = React.useMemo(() => {
    if (filters.showFavoritesOnly) {
      const favoriteActivityIds = favorites.map(fav => fav.activityId);
      return activities.filter(activity => favoriteActivityIds.includes(activity.id));
    }
    return activities;
  }, [activities, filters.showFavoritesOnly, favorites]);

  const handleToggleFavorite = (activityId: string, note?: string) => {
    if (isFavorite(activityId)) {
      removeFromFavorites(activityId);
    } else {
      addToFavorites(activityId, note);
    }
  };

  const handleSearchChange = (symbol: string) => {
    setFilters({ ...filters, searchSymbol: symbol });
  };

  const favoriteActivityIds = favorites.map(fav => fav.activityId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3">
            <StatsOverview activities={filteredActivities} />
            <MarketOverview />
            <AlertsPanel activities={filteredActivities} />
            <TopMovers activities={filteredActivities} />
          </div>
          <div className="lg:col-span-1">
            <WatchlistPanel 
              activities={activities}
              onSymbolSelect={(symbol) => setFilters({ ...filters, searchSymbol: symbol })}
            />
          </div>
        </div>
        
        <DataSourceIndicator 
          isConnected={isConnected}
          isUsingRealData={isUsingRealData}
          error={error}
        />
        
        <SearchBar
          searchSymbol={filters.searchSymbol}
          onSearchChange={handleSearchChange}
          showFavoritesOnly={filters.showFavoritesOnly}
          onToggleFavorites={(show) => setFilters({ ...filters, showFavoritesOnly: show })}
          favoriteCount={favorites.length}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-4">
            <FilterPanel 
              filters={filters} 
              onFiltersChange={setFilters}
            />
            
            <ActivityFeed 
              activities={filteredActivities}
              favoriteActivityIds={favoriteActivityIds}
              onToggleFavorite={handleToggleFavorite}
              onUpdateNote={updateFavoriteNote}
              getFavoriteNote={getFavoriteNote}
            />
          </div>
        </div>
        
        {filteredActivities.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">
              {filters.showFavoritesOnly 
                ? "No favorited alerts found." 
                : filters.searchSymbol 
                  ? `No unusual options activity found for ${filters.searchSymbol}.`
                  : "No unusual options activity found matching your filters."
              }
            </div>
            <p className="text-gray-500 text-sm mt-2">
              {filters.showFavoritesOnly 
                ? "Start favoriting alerts to see them here." 
                : "Try adjusting your filter criteria to see more results."
              }
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;