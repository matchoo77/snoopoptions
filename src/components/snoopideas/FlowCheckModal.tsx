import { useState, useEffect } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { polygonBenzingaService } from '../../lib/polygonBenzinga';

interface BlockTrade {
  id: string;
  date: string;
  time: string;
  optionType: 'call' | 'put' | 'unknown';
  strike: number;
  volume: number;
  price: number;
  execution: string;
  amount: number;
}

interface FlowCheckModalProps {
  ticker: string;
  onClose: () => void;
}

export function FlowCheckModal({ ticker, onClose }: FlowCheckModalProps) {
  const [blockTrades, setBlockTrades] = useState<BlockTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<{ name: string } | null>({ name: `${ticker} Corporation` });

  useEffect(() => {
    fetchBlockTrades();
    fetchCompanyInfo();
  }, [ticker]);

  const fetchCompanyInfo = async () => {
    const companyNames: Record<string, string> = {
      AAPL: 'Apple Inc.',
      NVDA: 'NVIDIA Corporation',
      TSLA: 'Tesla, Inc.',
      MSFT: 'Microsoft Corporation',
      GOOGL: 'Alphabet Inc.',
      AMZN: 'Amazon.com Inc.',
      META: 'Meta Platforms Inc.',
    };
    setCompanyInfo({ name: companyNames[ticker] || `${ticker} Corporation` });
  };

  const fetchBlockTrades = async () => {
    setLoading(true);
    try {
      console.log(`Fetching options trades for ${ticker}...`);
      
      // Fetch real options trades from Polygon API
      const optionsData = await polygonBenzingaService.fetchOptionsTradesForTicker(ticker);
      
      if (optionsData.length === 0) {
        console.log(`No options trades found for ${ticker}`);
        setBlockTrades([]);
        return;
      }

      // Transform API data to component format
      const transformedTrades: BlockTrade[] = optionsData.map((trade, index) => {
        const ts = trade.participant_timestamp;
        const id = `${ticker}_${ts || index}`;
        const amount = (trade.size || 0) * (trade.price || 0) * 100;
        return {
          id,
          date: polygonBenzingaService.formatDate(ts),
          time: polygonBenzingaService.formatTime(ts),
          optionType:
            trade.details?.contract_type === 'call'
              ? 'call'
              : trade.details?.contract_type === 'put'
              ? 'put'
              : 'unknown',
          strike: trade.details?.strike_price || 0,
          volume: trade.size || 0,
          price: trade.price || 0,
          execution: polygonBenzingaService.getTradeLocation(trade.conditions || []),
          amount,
        };
      });

      setBlockTrades(transformedTrades);

    } catch (error) {
      console.error('Error fetching options trades:', error);
      setBlockTrades([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  if (!companyInfo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header matching the screenshot */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Options Activity for {ticker}</h2>
              <div className="flex items-center space-x-2 mt-1"></div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Company Info Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{companyInfo.name}</h3>
                {/* No price display for now */}
              </div>
            </div>

            {/* No firm/targets in this simplified modal */}

            {/* Remove hardcoded description */}
          </div>
        </div>

        {/* Options Flow Section */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">Top Options Flows</h3>
            </div>
            {blockTrades.length > 0 && (
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(blockTrades.reduce((sum, trade) => sum + trade.amount, 0))}
                </div>
                <div className="text-sm text-gray-600">Total Dollar Volume</div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : blockTrades.length === 0 ? (
            <div className="text-sm text-gray-600 py-6">No options flows found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Call/Put</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trade Location</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {blockTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{trade.date} {trade.time}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{trade.optionType.toUpperCase()}</td>
                      <td className="px-4 py-3 text-sm font-mono text-green-600 font-medium">{formatCurrency(trade.amount)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {trade.execution}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}