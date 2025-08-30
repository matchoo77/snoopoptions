import { useEffect, useRef } from 'react';

interface TrialStatus {
  hasActiveTrial: boolean;
  hasActiveSubscription: boolean;
  accessType: 'trial' | 'subscription' | 'expired';
  trialDaysRemaining: number;
  trialEndDate: string | null;
  trialStartDate: string | null;
}

interface UseTrialExpirationProps {
  trialStatus: TrialStatus | null;
  onTrialExpired: () => void;
}

export function useTrialExpiration({ trialStatus, onTrialExpired }: UseTrialExpirationProps) {
  const hasNotifiedExpiration = useRef(false);

  useEffect(() => {
    // Only check for logged-in users
    if (!trialStatus) return;

    // Reset notification flag if user gets access back (subscription or trial becomes active)
    if (trialStatus.hasActiveTrial || trialStatus.hasActiveSubscription) {
      hasNotifiedExpiration.current = false;
      return;
    }

    // Only notify once when trial expires
    if (!trialStatus.hasActiveTrial && !trialStatus.hasActiveSubscription && 
        trialStatus.accessType === 'expired' && !hasNotifiedExpiration.current) {
      console.log('[useTrialExpiration] Trial expired, notifying parent component (first time)');
      hasNotifiedExpiration.current = true;
      onTrialExpired();
    }
  }, [trialStatus, onTrialExpired]);

  // Set up real-time countdown check - only if we haven't notified yet
  useEffect(() => {
    if (!trialStatus?.trialEndDate || trialStatus.hasActiveSubscription || hasNotifiedExpiration.current) return;

    const checkTrialExpiration = () => {
      const trialEndTime = new Date(trialStatus.trialEndDate!).getTime();
      const now = new Date().getTime();
      
      if (now >= trialEndTime && !hasNotifiedExpiration.current) {
        console.log('[useTrialExpiration] Real-time trial expiration detected');
        hasNotifiedExpiration.current = true;
        onTrialExpired();
      }
    };

    // Check every 5 minutes instead of every minute to be less aggressive
    const interval = setInterval(checkTrialExpiration, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [trialStatus?.trialEndDate, trialStatus?.hasActiveSubscription, onTrialExpired]);
}
