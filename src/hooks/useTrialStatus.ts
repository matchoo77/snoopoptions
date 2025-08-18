import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TrialStatus {
  hasActiveTrial: boolean;
  hasActiveSubscription: boolean;
  accessType: 'trial' | 'subscription' | 'expired';
  trialDaysRemaining: number;
  trialEndDate: string | null;
}

export function useTrialStatus() {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrialStatus();
  }, []);

  const fetchTrialStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTrialStatus(null);
        return;
      }

      const { data, error } = await supabase
        .from('user_access_status')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching trial status:', error);
        setError(error.message);
        return;
      }

      if (data) {
        setTrialStatus({
          hasActiveTrial: data.has_active_trial || false,
          hasActiveSubscription: data.has_active_subscription || false,
          accessType: data.access_type || 'expired',
          trialDaysRemaining: data.trial_days_remaining || 0,
          trialEndDate: data.trial_end_date,
        });
      } else {
        // If no data found, create a trial for the user
        await createTrialForUser(user.id);
        // Refetch after creating trial with a longer delay
        setTimeout(fetchTrialStatus, 2000);
      }
    } catch (err) {
      console.error('Trial status fetch error:', err);
      setError('Failed to fetch trial status');
    } finally {
      setLoading(false);
    }
  };

  const createTrialForUser = async (userId: string) => {
    try {
      console.log('Creating trial for user:', userId);
      const { error } = await supabase
        .from('user_trials')
        .insert({
          user_id: userId,
          trial_used: false,
        });

      if (error) {
        console.error('Error creating trial:', error);
      } else {
        console.log('Trial created successfully for user:', userId);
      }
    } catch (err) {
      console.error('Failed to create trial:', err);
    }
  };

  const markTrialAsUsed = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_trials')
        .update({ trial_used: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking trial as used:', error);
      } else {
        // Refresh trial status
        fetchTrialStatus();
      }
    } catch (err) {
      console.error('Failed to mark trial as used:', err);
    }
  };

  return {
    trialStatus,
    loading,
    error,
    refetch: fetchTrialStatus,
    markTrialAsUsed,
  };
}