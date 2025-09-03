import { useState, useEffect } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { polygonBenzingaService } from '../../lib/polygonBenzinga';

interface BlockTrade {
  id: string;
  date: string;
  time: string;
  optionType: 'call' | 'put';
  strike: number;
  expiry: string;
  volume: number;
  dollarVol: number;
  execution: string;
  premium: number;
  amount: number;
}

interface FlowCheckModalProps {
  ticker: string;
  onClose: () => void;
}

export function FlowCheckModal({ ticker, onClose }: FlowCheckModalProps) {
  const [blockTrades, setBlockTrades] = useState<BlockTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<{ name: string; price: number; firm: string; action: string; prevTarget?: number; newTarget?: number } | null>(null);

  useEffect(() => {
    fetchBlockTrades();
    fetchCompanyInfo();
  }, [ticker]);

  const fetchCompanyInfo = async () => {
    // Use basic company name mapping only
    const companyNames: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'NVDA': 'NVIDIA Corporation', 
      'TSLA': 'Tesla, Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'META': 'Meta Platforms Inc.',
    };

    setCompanyInfo({ 
      name: companyNames[ticker] || `${ticker} Corporation`, 
      price: 0, // No hardcoded prices
      firm: 'Unknown',
      action: 'Unknown',
    });
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
        const calculatedAmount = trade.size * trade.price * 100; // Calculate amount as specified
        
        return {
          id: `${ticker}_${index}`,
          date: polygonBenzingaService.formatDate(trade.participant_timestamp),
          time: polygonBenzingaService.formatTime(trade.participant_timestamp),
          optionType: trade.details?.contract_type === 'call' ? 'call' : 'put',
          strike: trade.details?.strike_price || 0,
          expiry: trade.details?.expiration_date ? 
            new Date(trade.details.expiration_date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: '2-digit' 
            }) : 'Unknown',
          volume: trade.size,
          dollarVol: calculatedAmount,
          execution: polygonBenzingaService.getTradeLocation(trade.conditions),
          premium: trade.price,
          amount: calculatedAmount,
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
              <div className="flex items-center space-x-2 mt-1">
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                  {companyInfo.action}
                </div>
              </div>
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
                {companyInfo.price > 0 && (
                  <>
                    <div className="text-lg font-bold text-gray-900">${companyInfo.price}</div>
                    <div className="text-sm text-gray-600">Current Price</div>
                  </>
                )}
              </div>
            </div>

            {(companyInfo.firm !== 'Unknown' || companyInfo.action !== 'Unknown') && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                {companyInfo.firm !== 'Unknown' && (
                  <div>
                    <span className="text-gray-600">Analyst Firm</span>
                    <div className="font-medium text-gray-900">{companyInfo.firm}</div>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Action Date</span>
                  <div className="font-medium text-gray-900">--</div>
                </div>
                {companyInfo.prevTarget && companyInfo.newTarget && (
                  <>
                    <div>
                      <span className="text-gray-600">Previous Target</span>
                      <div className="font-medium text-gray-900">${companyInfo.prevTarget.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">New Target</span>
                      <div className="font-medium text-gray-900">${companyInfo.newTarget.toFixed(2)}</div>
                    </div>
                  </>
                )}
              </div>
            )}

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
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type & Strike</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volume</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dollar Vol</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Execution</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Premium</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {blockTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {trade.optionType.toUpperCase()}
                            </div>
                            <div className="text-sm text-gray-600">${trade.strike}.00</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{trade.expiry}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">
                        {trade.volume.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-green-600 font-medium">
                        {formatCurrency(trade.dollarVol)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {trade.execution}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">
                        ${trade.premium.toFixed(2)}
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