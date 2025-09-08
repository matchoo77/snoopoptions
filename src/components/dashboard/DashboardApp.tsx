import { useState, useEffect } from 'react';
import { Header } from '../Header';
import { MarketStatusIndicator } from '../MarketStatusIndicator';
import { useOptionsData } from '../../hooks/useOptionsData';
import { useFavorites } from '../../hooks/useFavorites';
import { SearchBar } from '../SearchBar';
import { FilterPanel } from '../FilterPanel';
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
    filters,
    setFilters,
    isConnected,
    isUsingRealData,
    dataSource,
    loading: dataLoading,
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

  const [showBacktesting, setShowBacktesting] = useState(false);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!showBacktesting) {
      const interval = setInterval(() => {
        refreshData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [showBacktesting, refreshData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Market Status and Data Source Indicators - Full Width */}
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-4 lg:gap-6">
            <MarketStatusIndicator 
              refreshRate={30000} 
              showDetailed={false} 
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
                ? 'bg-teal-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              SnoopIdeas
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
              </div>

              {/* Sidebar - Only AlertsPanel remains */}
              <div className="lg:col-span-1 space-y-6">
                <AlertsPanel activities={activities} />
              </div>
            </div>

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
