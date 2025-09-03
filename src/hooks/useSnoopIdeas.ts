import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

  const generateSampleActions = (): AnalystAction[] => {
    return [
      {
        id: '1',
        ticker: 'AAPL',
        company: 'Apple Inc.',
        actionType: 'Upgrade',
        analystFirm: 'Morgan Stanley',
        actionDate: '2025-01-15',
        previousTarget: 175.00,
        newTarget: 190.00,
        previousRating: 'Equal-Weight',
        newRating: 'Overweight',
      },
      {
        id: '2',
        ticker: 'NVDA',
        company: 'NVIDIA Corporation',
        actionType: 'Price Target Raise',
        analystFirm: 'Goldman Sachs',
        actionDate: '2025-01-15',
        previousTarget: 500.00,
        newTarget: 575.00,
        previousRating: 'Buy',
        newRating: 'Buy',
      },
      {
        id: '3',
        ticker: 'TSLA',
        company: 'Tesla, Inc.',
        actionType: 'Downgrade',
        analystFirm: 'Barclays',
        actionDate: '2025-01-15',
        previousTarget: 275.00,
        newTarget: 250.00,
        previousRating: 'Overweight',
        newRating: 'Equal-Weight',
      },
    ];
  };

  const fetchAnalystActions = async () => {
    setLoading(true);
    setError(null);

    try {
      // First try to get cached data from Supabase
      const { data: cachedActions, error: dbError } = await supabase
        .from('snoopideas')
        .select('*')
        .eq('action_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (dbError) {
        console.warn('Error fetching cached actions:', dbError);
      }

      if (cachedActions && cachedActions.length > 0) {
        // Transform database format to component format
        const transformedActions: AnalystAction[] = cachedActions.map(action => ({
          id: action.id,
          ticker: action.ticker,
          company: getCompanyName(action.ticker),
          actionType: action.action_type,
          analystFirm: action.analyst_firm || 'Unknown',
          actionDate: action.action_date,
          previousTarget: action.previous_target,
          newTarget: action.new_target,
          rating: action.rating,
        }));

        setAnalystActions(transformedActions);
      } else {
        // Use sample data if no cached data available
        const sampleActions = generateSampleActions();
        setAnalystActions(sampleActions);

        // Cache sample data in Supabase for future use
        const dbInserts = sampleActions.map(action => ({
          ticker: action.ticker,
          action_type: action.actionType,
          analyst_firm: action.analystFirm,
          action_date: action.actionDate,
          previous_target: action.previousTarget,
          new_target: action.newTarget,
          rating: action.newRating,
        }));

        const { error: insertError } = await supabase
          .from('snoopideas')
          .upsert(dbInserts, {
            onConflict: 'ticker,action_type,analyst_firm,action_date',
            ignoreDuplicates: true
          });

        if (insertError) {
          console.warn('Error caching analyst actions:', insertError);
        }
      }

    } catch (err) {
      console.error('Error fetching analyst actions:', err);
      setError('Failed to fetch analyst actions');
      // Fallback to sample data
      setAnalystActions(generateSampleActions());
    } finally {
      setLoading(false);
    }
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