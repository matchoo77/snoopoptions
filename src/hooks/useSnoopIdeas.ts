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

  const fetchAnalystActions = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Only check cache if not forcing refresh
      if (!forceRefresh) {
        // First try to get cached data from Supabase
        const { data: cachedIdeas, error: dbError } = await supabase
          .from('snoopideas')
          .select('*')
          .gte('fetched_at', `${today}T00:00:00.000Z`)
          .order('fetched_at', { ascending: false });

        if (!dbError && cachedIdeas && cachedIdeas.length > 0) {
          console.log(`Found ${cachedIdeas.length} cached Benzinga ratings for today`);
          
          // Transform cached data to component format
          const transformedActions: AnalystAction[] = cachedIdeas.map(cached => ({
            id: cached.id,
            ticker: cached.ticker,
            company: getCompanyName(cached.ticker),
            actionType: cached.action_type,
            analystFirm: extractFirm(cached.action_type),
            actionDate: cached.action_date || today,
            previousTarget: cached.previous_target,
            newTarget: cached.new_target,
            rating: cached.rating,
            previousRating: cached.previous_rating,
            newRating: cached.new_rating,
          }));

          setAnalystActions(transformedActions);
          return;
        }
      }

      // If no cached data or forcing refresh, fetch from Polygon Benzinga API via proxy
      console.log(forceRefresh ? 'Force refreshing from Polygon Benzinga API...' : 'No cached data found, fetching from Polygon Benzinga API...');
      const benzingaRatings = await polygonBenzingaService.fetchTodaysBenzingaRatings();
      
      if (benzingaRatings.length === 0) {
        console.log('No Benzinga ratings found for today');
        setAnalystActions([]);
        return;
      }

      // Transform and cache the data (upsert to handle refresh case)
      const ideasToCache = benzingaRatings.map(rating => ({
        ticker: rating.ticker,
        action_type: rating.action_type,
        analyst_firm: rating.firm || 'Unknown Firm',
        action_date: rating.date || today,
        previous_target: extractPreviousTarget(rating.action_type),
        new_target: extractNewTarget(rating.action_type),
        rating: rating.rating_change,
        previous_rating: extractPreviousRating(rating.action_type),
        new_rating: extractNewRating(rating.action_type),
      }));

      // For refresh, we want to replace existing data for today
      if (forceRefresh) {
        // Delete existing entries for today first
        await supabase
          .from('snoopideas')
          .delete()
          .gte('fetched_at', `${today}T00:00:00.000Z`);
      }

      // Insert new data into Supabase
      const { data: insertedData, error: insertError } = await supabase
        .from('snoopideas')
        .insert(ideasToCache)
        .select();

      if (insertError) {
        console.error('Error caching data to Supabase:', insertError);
      } else {
        console.log(`Cached ${insertedData?.length || 0} new Benzinga ratings`);
      }

      // Transform API data to component format
      const transformedActions: AnalystAction[] = benzingaRatings.map((rating, index) => ({
        id: `api_${index}`,
        ticker: rating.ticker,
        company: getCompanyName(rating.ticker),
        actionType: rating.action_type,
        analystFirm: rating.firm || 'Unknown Firm',
        actionDate: rating.date || today,
        previousTarget: extractPreviousTarget(rating.action_type),
        newTarget: extractNewTarget(rating.action_type),
        rating: rating.rating_change,
        previousRating: extractPreviousRating(rating.action_type),
        newRating: extractNewRating(rating.action_type),
      }));

      setAnalystActions(transformedActions);
    } catch (error) {
      console.warn('Error fetching analyst actions:', error);
      setError('Failed to fetch analyst actions');
      setAnalystActions([]);
    } finally {
      setLoading(false);
    }
  };

  const extractFirm = (actionType: string): string => {
    // Extract firm name from action type string like "Upgrade by Morgan Stanley"
    const byMatch = actionType.match(/by (.+)$/);
    return byMatch ? byMatch[1] : 'Unknown Firm';
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
    await fetchAnalystActions(true); // Force refresh from API
  };

  useEffect(() => {
    fetchAnalystActions(); // Initial load uses cache if available
  }, []);

  return {
    analystActions,
    loading,
    error,
    refreshData,
  };
}