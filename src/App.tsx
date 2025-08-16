import React from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthPage } from './components/auth/AuthPage';
import { Header } from './components/Header';
import { useOptionsData } from './hooks/useOptionsData';
import { useFavorites } from './hooks/useFavorites';
import { SearchBar } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { StatsOverview } from './components/StatsOverview';
import { DataSourceIndicator } from './components/DataSourceIndicator';
import { ActivityFeed } from './components/ActivityFeed';
import { AlertsPanel } from './components/AlertsPanel';
import { MarketOverview } from './components/MarketOverview';
import { TopMovers } from './components/TopMovers';
import { WatchlistPanel } from './components/WatchlistPanel';

function App() {
  const { user, loading } = useAuth();
  const { 
    activities, 
    filters, 
    setFilters, 
    isConnected, 
    isUsingRealData, 
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

  if (loading) {
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
    return <AuthPage onSuccess={() => window.location.reload()} />;
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DataSourceIndicator 
          isConnected={isConnected} 
          isUsingRealData={isUsingRealData} 
          error={error} 
        />
        
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
      </main>
    </div>
  );
}

export default App;