import { useState, useEffect } from 'react';
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
  const [pageSize] = useState(25); // fetch this many at a time from edge
  const [fetchedCount, setFetchedCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchAnalystActions = async (append = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const targetLimit = append ? fetchedCount + pageSize : pageSize;
      console.log('🔄 [useSnoopIdeas] Fetching analyst actions', { targetLimit, append });
      const benzingaRatings = await polygonBenzingaService.fetchTodaysBenzingaRatings(targetLimit);
      
      console.log(`📊 [useSnoopIdeas] Received ${benzingaRatings.length} analyst actions from API`);
      
      if (benzingaRatings.length === 0) {
        console.log('📭 [useSnoopIdeas] No Benzinga ratings found for today');
        setAnalystActions([]);
        setHasMore(false);
        return;
      }
      const transformedActions: AnalystAction[] = benzingaRatings.map((rating, index) => {
        const baseId = `${rating.ticker}_${rating.date || today}_${index}`;
        return {
          id: baseId,
          ticker: rating.ticker,
          company: formatCompanySymbol(rating.ticker),
          actionType: rating.action_type, // Already formatted by edge function
          analystFirm: rating.firm || 'Unknown Firm',
          actionDate: rating.date || today,
          previousTarget: extractPreviousTarget(rating.action_type),
          newTarget: extractNewTarget(rating.action_type),
          rating: rating.rating_change,
          previousRating: extractPreviousRating(rating.action_type),
          newRating: extractNewRating(rating.action_type),
        };
      });

      console.log(`✅ [useSnoopIdeas] Transformed ${transformedActions.length} actions for display:`, transformedActions);
      setAnalystActions(transformedActions);
      setFetchedCount(transformedActions.length);
      setHasMore(transformedActions.length >= targetLimit); // if we filled the target limit, assume more may exist
    } catch (error) {
      console.error('❌ [useSnoopIdeas] Error fetching analyst actions:', error);
      setError('Failed to fetch analyst actions');
      setAnalystActions([]);
      setHasMore(false);
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

  // Basic fallback mapping if company info not yet retrieved
  const formatCompanySymbol = (ticker: string): string => {
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
    return companies[ticker] || ticker;
  };

  const refreshData = async () => {
    setFetchedCount(0);
    setHasMore(true);
    await fetchAnalystActions(false);
  };

  const loadMore = async () => {
    if (!hasMore) return;
    await fetchAnalystActions(true);
  };

  useEffect(() => {
    fetchAnalystActions();
  }, []);

  return {
    analystActions,
    loading,
    error,
    refreshData,
    loadMore,
    hasMore,
  };
}