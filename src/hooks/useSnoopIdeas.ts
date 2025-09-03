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
          actionDate: today,
        }));

        setAnalystActions(transformedActions);
        return;
      }

      // If no cached data, fetch from Polygon Benzinga API
      console.log('No cached data found, fetching from Polygon Benzinga API...');
      
      const benzingaRatings = await polygonBenzingaService.fetchTodaysBenzingaRatings();
      
      if (benzingaRatings.length === 0) {
        console.log('No Benzinga ratings found for today');
        setAnalystActions([]);
        return;
      }

      // Transform and cache the data
      const ideasToCache = benzingaRatings.map(rating => ({
        ticker: rating.ticker,
        action_type: polygonBenzingaService.formatActionType(rating),
      }));

      // Insert into Supabase for caching
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
        actionType: polygonBenzingaService.formatActionType(rating),
        analystFirm: rating.firm || 'Unknown Firm',
        actionDate: today,
      }));

      setAnalystActions(transformedActions);

    } catch (err) {
      console.error('Error fetching analyst actions:', err);
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

  const getCompanyName = (ticker: string): string => {
    const companies: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'NVDA': 'NVIDIA Corporation',
      'TSLA': 'Tesla, Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'META': 'Meta Platforms Inc.',
    };
    return companies[ticker] || `${ticker} Corporation`;
  };

  const refreshData = async () => {
    await fetchAnalystActions();
  };

  useEffect(() => {
    fetchAnalystActions();
  }, []);

  return {
    analystActions,
    loading,
    error,
    refreshData,
  };
}