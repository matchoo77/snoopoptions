import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, ArrowRight, Clock } from 'lucide-react';
import { FlowCheckModal } from './FlowCheckModal';
import { useSnoopIdeas } from '../../hooks/useSnoopIdeas';
import { supabase } from '../../lib/supabase';
import { getMarketStatus } from '../../utils/marketHours';

export function SnoopIdeasPanel() {
  const { analystActions, loading, error, refreshData } = useSnoopIdeas();
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const marketStatus = getMarketStatus();

  // Fetch current prices for all tickers when analyst actions change
  useEffect(() => {
    const fetchPrices = async () => {
      const prices: Record<string, number> = {};
      
      // Fetch prices in parallel instead of sequentially
      const pricePromises = analystActions.map(async (action) => {
        try {
          const { data, error } = await supabase.functions.invoke('benzinga-proxy', {
            body: {
              action: 'current-price',
              ticker: action.ticker
            }
          });

          if (!error && data?.price) {
            return { ticker: action.ticker, price: data.price };
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${action.ticker}:`, error);
        }
        return null;
      });

      const results = await Promise.all(pricePromises);
      
      results.forEach(result => {
        if (result) {
          prices[result.ticker] = result.price;
        }
      });
      
      setCurrentPrices(prices);
    };

    if (analystActions.length > 0) {
      fetchPrices();
    }
  }, [analystActions]);

  const handleFlowCheck = (action: any) => {
    setSelectedTicker(action.ticker);
    setSelectedAction(action);
    setShowFlowModal(true);
  };

  const getActionIcon = (actionType: string) => {
    const type = actionType.toLowerCase();
    if (type.includes('upgrade') || type.includes('raised') || type.includes('buy')) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
    if (type.includes('downgrade') || type.includes('lowered') || type.includes('sell')) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    if (type.includes('initiated') || type.includes('coverage')) {
      return <TrendingUp className="w-4 h-4 text-blue-500" />;
    }
    return <TrendingUp className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">SnoopIdeas</h1>
            <p className="text-sm text-gray-600">Analyst actions paired with unusual options activity</p>
          </div>
          <button
            onClick={refreshData}
            disabled={loading}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Ideas</span>
          </button>
        </div>
      </div>

      {/* Section Header */}
      <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Latest Analyst Actions</h2>
          <span className="text-sm text-blue-600 font-medium">
            {analystActions.length} actions today
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {!marketStatus.isOpen ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Market Closed</h3>
              <p className="text-gray-600 text-base mb-4">{marketStatus.message}</p>
              <p className="text-sm text-gray-500">
                SnoopIdeas data is only available during market hours (9:30 AM - 4:00 PM ET, Monday-Friday)
              </p>
            </div>
          </div>
        ) : loading && analystActions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading analyst actions...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {analystActions.map((action) => (
              <div key={action.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg font-bold text-blue-600">{action.ticker}</span>
                      {getActionIcon(action.actionType)}
                      <span className="text-sm text-gray-500">{new Date(action.actionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    
                    <div className="mb-2">
                      <h3 className="font-medium text-gray-900">{action.company}</h3>
                      <p className="text-sm font-medium text-green-600">{action.actionType}</p>
                      <p className="text-xs text-gray-500">{action.analystFirm}</p>
                    </div>

                    <div className="space-y-1">
                      {action.previousTarget && action.newTarget && (
                        <div className="text-sm">
                          <span className="text-gray-600">Target: </span>
                          <span className="font-medium">${action.previousTarget.toFixed(2)} → ${action.newTarget.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {action.previousRating && action.newRating && (
                        <div className="text-sm">
                          <span className="text-gray-600">Rating: </span>
                          <span className="font-medium">{action.previousRating} → {action.newRating}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2">
                      <span className="text-sm text-gray-600">Current Price</span>
                      <div className="text-lg font-bold text-gray-900">
                        {currentPrices[action.ticker] ? 
                          `$${currentPrices[action.ticker].toFixed(2)}` : 
                          '$---.--'
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <button
                      onClick={() => handleFlowCheck(action)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-1"
                    >
                      <span>Flow Check</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {analystActions.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analyst Actions Today</h3>
                <p className="text-gray-600 text-sm">Check back later for the latest analyst upgrades and downgrades</p>
              </div>
            )}
          </div>
        )}

        {/* Bottom instruction */}
        {analystActions.length > 0 && (
          <div className="mt-8 text-center py-8 border-t border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="w-6 h-6 border-2 border-gray-400 rounded-full border-dashed"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Analyst Action</h3>
            <p className="text-gray-600 text-sm">Click on any analyst action to view related unusual options activity</p>
          </div>
        )}
      </div>

      {/* Flow Check Modal */}
      {showFlowModal && selectedTicker && selectedAction && (
        <FlowCheckModal
          ticker={selectedTicker}
          analystAction={{
            company: selectedAction.company,
            actionType: selectedAction.actionType,
            analystFirm: selectedAction.analystFirm,
            actionDate: selectedAction.actionDate,
            currentPrice: currentPrices[selectedTicker]
          }}
          onClose={() => {
            setShowFlowModal(false);
            setSelectedTicker(null);
            setSelectedAction(null);
          }}
        />
      )}
    </div>
  );
}