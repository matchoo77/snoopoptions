import React, { useState, useEffect } from 'react';
import { X, TrendingUp } from 'lucide-react';

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
    const analystData: Record<string, any> = {
      'AAPL': { 
        name: 'Apple Inc.', 
        price: 182.50,
        firm: 'Morgan Stanley',
        action: 'Upgrade',
        prevTarget: 175.00,
        newTarget: 190.00
      },
      'NVDA': { 
        name: 'NVIDIA Corporation', 
        price: 515.80,
        firm: 'Goldman Sachs',
        action: 'Price Target Raise',
        prevTarget: 500.00,
        newTarget: 575.00
      },
      'TSLA': { 
        name: 'Tesla, Inc.', 
        price: 245.30,
        firm: 'Barclays',
        action: 'Downgrade',
        prevTarget: 275.00,
        newTarget: 250.00
      },
    };

    setCompanyInfo(analystData[ticker] || { 
      name: `${ticker} Corporation`, 
      price: 150.00,
      firm: 'Goldman Sachs',
      action: 'Price Target Raise',
      prevTarget: 500.00,
      newTarget: 575.00
    });
  };

  const fetchBlockTrades = async () => {
    setLoading(true);
    try {
      // Sample block trades that match the modal format from your screenshot
      const sampleTrades: BlockTrade[] = [
        {
          id: '1',
          date: '2025-08-30',
          time: '10:00',
          optionType: 'call',
          strike: 520,
          expiry: 'Feb 16, 24',
          volume: 3200,
          dollarVol: 1440000,
          execution: 'Midpoint',
          premium: 4.50,
          amount: 1440000,
        },
        {
          id: '2',
          date: '2025-08-30',
          time: '11:15',
          optionType: 'call',
          strike: 525,
          expiry: 'Feb 16, 24',
          volume: 2100,
          dollarVol: 945000,
          execution: 'At Ask',
          premium: 4.50,
          amount: 945000,
        },
        {
          id: '3',
          date: '2025-08-30',
          time: '12:30',
          optionType: 'put',
          strike: 510,
          expiry: 'Feb 16, 24',
          volume: 1800,
          dollarVol: 720000,
          execution: 'Above Ask',
          premium: 4.00,
          amount: 720000,
        },
      ];

      setBlockTrades(sampleTrades.sort((a, b) => b.amount - a.amount));
    } catch (error) {
      console.error('Error fetching block trades:', error);
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
                <div className="text-lg font-bold text-gray-900">${companyInfo.price}</div>
                <div className="text-sm text-gray-600">Current Price</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Analyst Firm</span>
                <div className="font-medium text-gray-900">{companyInfo.firm}</div>
              </div>
              <div>
                <span className="text-gray-600">Action Date</span>
                <div className="font-medium text-gray-900">Jan 15, 2024</div>
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

            <div className="mt-4 text-sm text-gray-600">
              Raised price target on continued AI datacenter demand strength
            </div>
          </div>
        </div>

        {/* Options Flow Section */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">Top Options Flows</h3>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">$1.4M</div>
              <div className="text-sm text-gray-600">Total Dollar Volume</div>
            </div>
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