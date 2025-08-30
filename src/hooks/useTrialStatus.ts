import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TrialStatus {
  hasActiveTrial: boolean;
  hasActiveSubscription: boolean;
  accessType: 'trial' | 'subscription' | 'expired';
  trialDaysRemaining: number;
  trialEndDate: string | null;
  trialStartDate: string | null;
}

export function useTrialStatus() {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrialStatus();
    
    // Set up periodic trial status checking (every 30 seconds)
    const interval = setInterval(() => {
      console.log('[useTrialStatus] Periodic trial status check');
      fetchTrialStatus();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
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

      // First, ensure user has a trial record based on their account creation
      await ensureUserHasTrial(user.id, user.created_at);

      // Then fetch the access status
      const { data, error } = await supabase
        .from('user_access_status')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching trial status:', error);
        // Don't block access on database errors - calculate trial from user creation
        const userCreated = new Date(user.created_at);
        const trialEnd = new Date(userCreated.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
        const now = new Date();
        const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        
        setTrialStatus({
          hasActiveTrial: daysRemaining > 0,
          hasActiveSubscription: false,
          accessType: daysRemaining > 0 ? 'trial' : 'expired',
          trialDaysRemaining: Math.max(0, daysRemaining),
          trialEndDate: trialEnd.toISOString(),
          trialStartDate: user.created_at,
        });
        setError(error.message);
        return;
      }

      if (data) {
        console.log('Trial status data:', data);
        // Calculate precise days remaining from trial end date
        const trialEndDate = data.trial_end_date ? new Date(data.trial_end_date) : null;
        const now = new Date();
        let daysRemaining = 0;
        
        if (trialEndDate) {
          const timeDiff = trialEndDate.getTime() - now.getTime();
          daysRemaining = Math.max(0, Math.ceil(timeDiff / (24 * 60 * 60 * 1000)));
        }

        setTrialStatus({
          hasActiveTrial: data.has_active_trial || false,
          hasActiveSubscription: data.has_active_subscription || false,
          accessType: data.access_type || (daysRemaining > 0 ? 'trial' : 'expired'),
          trialDaysRemaining: daysRemaining,
          trialEndDate: data.trial_end_date,
          trialStartDate: data.trial_start_date,
        });
      } else {
        console.log('No trial status data found, calculating from user creation date');
        // Calculate trial from user creation date
        const userCreated = new Date(user.created_at);
        const trialEnd = new Date(userCreated.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
        const now = new Date();
        const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        
        setTrialStatus({
          hasActiveTrial: daysRemaining > 0,
          hasActiveSubscription: false,
          accessType: daysRemaining > 0 ? 'trial' : 'expired',
          trialDaysRemaining: Math.max(0, daysRemaining),
          trialEndDate: trialEnd.toISOString(),
          trialStartDate: user.created_at,
        });
      }
    } catch (err) {
      console.error('Trial status fetch error:', err);
      // On any error, calculate trial from user creation if available
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userCreated = new Date(user.created_at);
        const trialEnd = new Date(userCreated.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
        const now = new Date();
        const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        
        setTrialStatus({
          hasActiveTrial: daysRemaining > 0,
          hasActiveSubscription: false,
          accessType: daysRemaining > 0 ? 'trial' : 'expired',
          trialDaysRemaining: Math.max(0, daysRemaining),
          trialEndDate: trialEnd.toISOString(),
          trialStartDate: user.created_at,
        });
      } else {
        setTrialStatus({
          hasActiveTrial: false,
          hasActiveSubscription: false,
          accessType: 'expired',
          trialDaysRemaining: 0,
          trialEndDate: null,
          trialStartDate: null,
        });
      }
      setError('Failed to fetch trial status');
    } finally {
      setLoading(false);
    }
  };

  const ensureUserHasTrial = async (userId: string, userCreatedAt: string) => {
    try {
      console.log('Ensuring trial exists for user:', userId, 'created at:', userCreatedAt);
      
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
      
      // Calculate trial dates based on account creation
      const userCreated = new Date(userCreatedAt);
      const trialStart = userCreated;
      const trialEnd = new Date(userCreated.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from creation
      
      // Create trial record with proper dates
      const { data: newTrial, error: createError } = await supabase
        .from('user_trials')
        .insert({
          user_id: userId,
          trial_start_date: trialStart.toISOString(),
          trial_end_date: trialEnd.toISOString(),
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