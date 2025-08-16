import React from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthPage } from './components/auth/AuthPage';
import { SubscriptionPage } from './components/subscription/SubscriptionPage';
import { SuccessPage } from './components/subscription/SuccessPage';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { SearchBar } from './components/SearchBar';
import { ConnectionStatus } from './components/ConnectionStatus';
import { AlertsPanel } from './components/AlertsPanel';
import { MarketOverview } from './components/MarketOverview';
import { TopMovers } from './components/TopMovers';
import { WatchlistPanel } from './components/WatchlistPanel';
import { FilterPanel } from './components/FilterPanel';
import { ActivityFeed } from './components/ActivityFeed';
import { useOptionsData } from './hooks/useOptionsData';
import { useFavorites } from './hooks/useFavorites';

function App() {
  const { user, session, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = React.useState<'dashboard' | 'subscription' | 'success'>('dashboard');
  
  const { activities, filters, setFilters } = useOptionsData();
  const { 
    favorites, 
    addToFavorites, 
    removeFromFavorites, 
    isFavorite, 
    getFavoriteNote, 
    updateFavoriteNote 
  } = useFavorites();

  // Check URL parameters for success/cancel states
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setCurrentView('success');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
      // Handle canceled checkout if needed
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
    return <AuthPage onSuccess={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'success') {
    return <SuccessPage onContinue={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'subscription') {
    return <SubscriptionPage userToken={session?.access_token || ''} />;
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

  const handleToggleFavorites = (show: boolean) => {
    setFilters({ ...filters, showFavoritesOnly: show });
  };

  const handleSymbolSelect = (symbol: string) => {
    setFilters({ ...filters, searchSymbol: symbol });
  };

  const favoriteActivityIds = favorites.map(fav => fav.activityId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onShowSubscription={() => setCurrentView('subscription')} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`mr-4 px-4 py-2 rounded-md transition-colors ${
              currentView === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('subscription')}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentView === 'subscription'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Subscription
          </button>
        </div>
        
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
              onSymbolSelect={handleSymbolSelect}
            />
          </div>
        </div>
        
        <ConnectionStatus />
        
        <SearchBar
          searchSymbol={filters.searchSymbol}
          onSearchChange={handleSearchChange}
          showFavoritesOnly={filters.showFavoritesOnly}
          onToggleFavorites={handleToggleFavorites}
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