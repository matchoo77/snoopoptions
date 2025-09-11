import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { polygonBenzingaService } from '../lib/polygonBenzinga';

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

export function useSnoopIdeas() {
  const [analystActions, setAnalystActions] = useState<AnalystAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalystActions = async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch fresh data directly from Polygon Benzinga API via proxy
      console.log('🔄 [useSnoopIdeas] Fetching fresh data from Polygon Benzinga API...');
      const benzingaRatings = await polygonBenzingaService.fetchTodaysBenzingaRatings();
      
      console.log(`📊 [useSnoopIdeas] Received ${benzingaRatings.length} analyst actions from API`);
      
      if (benzingaRatings.length === 0) {
        console.log('📭 [useSnoopIdeas] No Benzinga ratings found for today');
        setAnalystActions([]);
        return;
      }

      // Transform API data to component format - using the normalized action_type from API (already classified)
      const transformedActions: AnalystAction[] = benzingaRatings.map((rating: any, index: number) => ({
        id: rating.id || `api_${index}_${Date.now()}`,
        ticker: rating.ticker,
        company: rating.company_name || getCompanyName(rating.ticker),
        actionType: rating.action_type, // classification string (e.g., Upgrade, Maintains, Raises PT ...)
        analystFirm: rating.firm || 'Unknown Firm',
        actionDate: rating.date || today,
        previousTarget: rating.previous_price_target ?? extractPreviousTarget(rating.action_type),
        newTarget: rating.price_target ?? extractNewTarget(rating.action_type),
        rating: rating.rating || rating.rating_change,
        previousRating: rating.previous_rating ?? extractPreviousRating(rating.action_type),
        newRating: rating.rating ?? extractNewRating(rating.action_type),
      }));

      console.log(`✅ [useSnoopIdeas] Transformed ${transformedActions.length} actions for display:`, transformedActions);
      setAnalystActions(transformedActions);
    } catch (error) {
      console.error('❌ [useSnoopIdeas] Error fetching analyst actions:', error);
      setError('Failed to fetch analyst actions');
      setAnalystActions([]);
    } finally {
      setLoading(false);
    }
  };

  const extractPreviousTarget = (actionType: string): number | undefined => {
    // Extract previous target from strings like "Price Target Lowered from $180 to $170"
    const match = actionType.match(/from\s*\$?(\d+(?:\.\d+)?)/i);
    return match ? parseFloat(match[1]) : undefined;
  };

  const extractNewTarget = (actionType: string): number | undefined => {
    // Extract new target from strings like "Price Target Raised from $150 to $180"
    const match = actionType.match(/to\s*\$?(\d+(?:\.\d+)?)/i);
    return match ? parseFloat(match[1]) : undefined;
  };

  const extractPreviousRating = (actionType: string): string | undefined => {
    // Extract previous rating from strings like "Upgraded from Hold to Buy"
    const match = actionType.match(/from\s+([A-Za-z\s]+)\s+to\s+/i);
    return match ? match[1].trim() : undefined;
  };

  const extractNewRating = (actionType: string): string | undefined => {
    // Extract new rating from strings like "Upgraded from Hold to Buy"
    const match = actionType.match(/to\s+([A-Za-z\s]+)$/i);
    return match ? match[1].trim() : undefined;
  };

  const getCompanyName = (ticker: string): string => {
    const companies: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'NVDA': 'NVIDIA Corporation',
      'TSLA': 'Tesla, Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'META': 'Meta Platforms Inc.',
      'NFLX': 'Netflix Inc.',
      'AMD': 'Advanced Micro Devices Inc.',
      'INTC': 'Intel Corporation',
      'CRM': 'Salesforce Inc.',
      'ORCL': 'Oracle Corporation',
      'ADBE': 'Adobe Inc.',
      'PYPL': 'PayPal Holdings Inc.',
      'DIS': 'The Walt Disney Company',
      'BABA': 'Alibaba Group Holding Ltd.',
      'V': 'Visa Inc.',
      'MA': 'Mastercard Inc.',
      'JPM': 'JPMorgan Chase & Co.',
      'BAC': 'Bank of America Corp.',
    };
    return companies[ticker] || `${ticker} Corporation`;
  };

  const refreshData = async () => {
    await fetchAnalystActions(); // Fetch fresh data
  };

  useEffect(() => {
    fetchAnalystActions(); // Initial load gets fresh data
  }, []);

  return {
    analystActions,
    loading,
    error,
    refreshData,
  };
}