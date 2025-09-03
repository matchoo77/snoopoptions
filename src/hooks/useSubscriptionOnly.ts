import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  accessType: 'subscription' | 'grandfathered' | 'none';
  subscriptionStatus: string | null;
  currentPeriodEnd: number | null;
  priceId: string | null;
  isGrandfathered?: boolean;
}

export function useSubscriptionOnly() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionStatus(true); // Pass true for initial load
  }, []);

  const fetchSubscriptionStatus = async (isInitialLoad = false) => {
    try {
      // Only show loading state on initial load
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscriptionStatus({
          hasActiveSubscription: false,
          accessType: 'none',
          subscriptionStatus: null,
          currentPeriodEnd: null,
          priceId: null,
          isGrandfathered: false,
        });
        setLoading(false);
        return;
      }

      // Fetch subscription data from the new subscription-only view
      const { data, error } = await supabase
        .from('user_subscription_access')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription status:', error);
        setSubscriptionStatus({
          hasActiveSubscription: false,
          accessType: 'none',
          subscriptionStatus: null,
          currentPeriodEnd: null,
          priceId: null,
          isGrandfathered: false,
        });
        setError(error.message);
        return;
      }

      if (data) {
        setSubscriptionStatus({
          hasActiveSubscription: data.has_active_subscription || false,
          accessType: data.access_type || 'none',
          subscriptionStatus: data.subscription_status,
          currentPeriodEnd: data.current_period_end,
          priceId: data.price_id,
          isGrandfathered: data.is_grandfathered || false,
        });
      } else {
        // No access found
        setSubscriptionStatus({
          hasActiveSubscription: false,
          accessType: 'none',
          subscriptionStatus: null,
          currentPeriodEnd: null,
          priceId: null,
          isGrandfathered: false,
        });
      }
    } catch (err) {
      console.error('Subscription status fetch error:', err);
      setSubscriptionStatus({
        hasActiveSubscription: false,
        accessType: 'none',
        subscriptionStatus: null,
        currentPeriodEnd: null,
        priceId: null,
        isGrandfathered: false,
      });
      setError('Failed to fetch subscription status');
    } finally {
      setLoading(false);
    }
  };

  return {
    subscriptionStatus,
    loading,
    error,
    refetch: () => fetchSubscriptionStatus(false), // Don't show loading on manual refetch
  };
}
