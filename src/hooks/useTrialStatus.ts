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
        setLoading(false);
        return;
      }

      console.log('Fetching trial status for user:', user.id);

      // First, ensure user has a trial record
      await ensureUserHasTrial(user.id);

      // Then fetch the access status
      const { data, error } = await supabase
        .from('user_access_status')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching trial status:', error);
        // Don't block access on database errors - default to trial access
        setTrialStatus({
          hasActiveTrial: true,
          hasActiveSubscription: false,
          accessType: 'trial',
          trialDaysRemaining: 7,
          trialEndDate: null,
        });
        setError(error.message);
        return;
      }

      if (data) {
        console.log('Trial status data:', data);
        setTrialStatus({
          hasActiveTrial: data.has_active_trial || false,
          hasActiveSubscription: data.has_active_subscription || false,
          accessType: data.access_type || 'trial',
          trialDaysRemaining: Math.max(0, data.trial_days_remaining || 0),
          trialEndDate: data.trial_end_date,
        });
      } else {
        console.log('No trial status data found, defaulting to active trial');
        // Default to active trial if no data found
        setTrialStatus({
          hasActiveTrial: true,
          hasActiveSubscription: false,
          accessType: 'trial',
          trialDaysRemaining: 7,
          trialEndDate: null,
        });
      }
    } catch (err) {
      console.error('Trial status fetch error:', err);
      // On any error, default to allowing access with trial
      setTrialStatus({
        hasActiveTrial: true,
        hasActiveSubscription: false,
        accessType: 'trial',
        trialDaysRemaining: 7,
        trialEndDate: null,
      });
      setError('Failed to fetch trial status');
    } finally {
      setLoading(false);
    }
  };

  const ensureUserHasTrial = async (userId: string) => {
    try {
      console.log('Ensuring trial exists for user:', userId);
      
      // Check if trial already exists
      const { data: existingTrial, error: checkError } = await supabase
        .from('user_trials')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking existing trial:', checkError);
        return;
      }
      
      if (existingTrial) {
        console.log('Trial already exists for user:', userId, existingTrial);
        return;
      }
      
      console.log('Creating new trial for user:', userId);
      
      // Create trial record
      const { data: newTrial, error: createError } = await supabase
        .from('user_trials')
        .insert({
          user_id: userId,
          trial_used: false,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating trial:', createError);
      } else {
        console.log('Trial created successfully:', newTrial);
      }
    } catch (err) {
      console.error('Failed to ensure trial exists:', err);
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