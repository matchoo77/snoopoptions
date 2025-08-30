import { useEffect } from 'react';

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
  useEffect(() => {
    // Only check for logged-in users
    if (!trialStatus) return;

    console.log('[useTrialExpiration] Checking trial status:', trialStatus);

    // If user has no active trial and no active subscription, notify parent
    if (!trialStatus.hasActiveTrial && !trialStatus.hasActiveSubscription && trialStatus.accessType === 'expired') {
      console.log('[useTrialExpiration] Trial expired, notifying parent component');
      onTrialExpired();
    }

    // Also check if trial end date has passed (real-time check)
    if (trialStatus.trialEndDate && !trialStatus.hasActiveSubscription) {
      const trialEndTime = new Date(trialStatus.trialEndDate).getTime();
      const now = new Date().getTime();
      
      if (now >= trialEndTime) {
        console.log('[useTrialExpiration] Trial end date reached, notifying parent component');
        onTrialExpired();
      }
    }
  }, [trialStatus, onTrialExpired]);

  // Set up real-time countdown check
  useEffect(() => {
    if (!trialStatus?.trialEndDate || trialStatus.hasActiveSubscription) return;

    const checkTrialExpiration = () => {
      const trialEndTime = new Date(trialStatus.trialEndDate!).getTime();
      const now = new Date().getTime();
      
      if (now >= trialEndTime) {
        console.log('[useTrialExpiration] Real-time trial expiration detected');
        onTrialExpired();
      }
    };

    // Check every minute for real-time expiration
    const interval = setInterval(checkTrialExpiration, 60000);

    return () => clearInterval(interval);
  }, [trialStatus?.trialEndDate, trialStatus?.hasActiveSubscription, onTrialExpired]);
}
