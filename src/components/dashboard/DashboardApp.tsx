import { useState, useEffect } from 'react';
import { Header } from '../Header';
import { MarketStatusIndicator } from '../MarketStatusIndicator';
import { useOptionsData } from '../../hooks/useOptionsData';
import { useFavorites } from '../../hooks/useFavorites';
import { SearchBar } from '../SearchBar';
import { FilterPanel } from '../FilterPanel';
import { StatsOverview } from '../StatsOverview';
import { DataSourceIndicator } from '../DataSourceIndicator';
import { ActivityFeed } from '../ActivityFeed';
import { AlertsPanel } from '../AlertsPanel';
import { SnoopIdeasPanel } from '../snoopideas/SnoopIdeasPanel';

interface DashboardAppProps {
  onUpgrade?: () => void;
}

export function DashboardApp({}: DashboardAppProps) {
  const {
    activities,
    topMovers,
    filters,
    setFilters,
    isConnected,
    isUsingRealData,
    dataSource,
    loading: dataLoading,
    topMoversLoading,
    error,
    refreshData
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

  // Auto-refresh every 10 seconds for more responsive feel
  useEffect(() => {
    if (!showBacktesting) {
      const interval = setInterval(() => {
        refreshData();
      }, 10000); // 10 seconds

      return () => clearInterval(interval);
    }
  }, [showBacktesting, refreshData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Market Status and Data Source Indicators */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MarketStatusIndicator 
            refreshRate={10000} 
            showDetailed={true} 
          />
          <DataSourceIndicator
            isConnected={isConnected}
            isUsingRealData={isUsingRealData}
            dataSource={dataSource}
            loading={dataLoading}
            error={error}
            onRefresh={refreshData}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-0.5 mb-3 border">
          <div className="flex space-x-0.5">
            <button
              onClick={() => setShowBacktesting(false)}
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${!showBacktesting
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              Live Scanner
            </button>
            <button
              onClick={() => setShowBacktesting(true)}
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${showBacktesting
                    ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                 }`}
              >
            </button>
          </div>
        </div>

        {showBacktesting ? (
          <SnoopIdeasPanel />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
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

                <StatsOverview activities={displayActivities} dataSource={dataSource} />
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

            {/* Full Width Top Movers */}
            {/* Full Width Activity Feed */}
            <div className="w-full">
              <ActivityFeed
                activities={displayActivities}
                favoriteActivityIds={favoriteActivityIds}
                onToggleFavorite={handleToggleFavorite}
                onUpdateNote={updateFavoriteNote}
                getFavoriteNote={getFavoriteNote}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
