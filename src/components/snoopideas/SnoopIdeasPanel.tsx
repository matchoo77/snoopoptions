import { useState } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { FlowCheckModal } from './FlowCheckModal';
import { useSnoopIdeas } from '../../hooks/useSnoopIdeas';

interface AnalystAction {
  id: string;
  ticker: string;
  company: string;
  actionType: string;
  analystFirm: string;
  actionDate: string;
  previousTarget?: number;
  newTarget?: number;
  rating?: string;
  previousRating?: string;
  newRating?: string;
}

export function SnoopIdeasPanel() {
  const { analystActions, loading, error, refreshData } = useSnoopIdeas();
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [showFlowModal, setShowFlowModal] = useState(false);

  const handleFlowCheck = (ticker: string) => {
    setSelectedTicker(ticker);
    setShowFlowModal(true);
  };

  const getActionIcon = (actionType: string) => {
    if (actionType.toLowerCase().includes('upgrade') || actionType.toLowerCase().includes('raised')) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
    if (actionType.toLowerCase().includes('downgrade') || actionType.toLowerCase().includes('lowered')) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <TrendingUp className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">SnoopIdeas</h1>
        <button
          onClick={refreshData}
          disabled={loading}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto mx-auto" style={{ width: '80%' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticker</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flow Check</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && analystActions.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-600 text-sm">Loading analyst actions...</td>
              </tr>
            ) : analystActions.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-600 text-sm">No Analyst Actions Today</td>
              </tr>
            ) : (
              analystActions.map((action: AnalystAction) => (
                <tr key={action.id}>
                  <td className="px-4 py-3 font-bold text-gray-900">{action.ticker}</td>
                  <td className="px-4 py-3 text-gray-800">{action.actionType}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleFlowCheck(action.ticker)}
                      className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700"
                    >
                      Flow Check
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showFlowModal && selectedTicker && (
        <FlowCheckModal
          ticker={selectedTicker}
          onClose={() => {
            setShowFlowModal(false);
            setSelectedTicker(null);
          }}
        />
      )}
    </div>
  );
}