import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTrialStatus } from './hooks/useTrialStatus';
import { supabase } from './lib/supabase';
import { MarketingApp } from './components/marketing/MarketingApp';
import { DashboardApp } from './components/dashboard/DashboardApp';
import { AuthPage } from './components/auth/AuthPage';
import { SuccessPage } from './components/subscription/SuccessPage';
import { SubscriptionPage } from './components/subscription/SubscriptionPage';
import { SubscriptionGate } from './components/SubscriptionGate';

function App() {
  const { user, loading, signOut } = useAuth();
  const { trialStatus, loading: trialLoading } = useTrialStatus();
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [showSubscriptionPage, setShowSubscriptionPage] = useState(false);

  // Clear any invalid sessions on mount
  useEffect(() => {
    const clearInvalidSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Try to get user to validate session
          const { error } = await supabase.auth.getUser();
          if (error) {
            // Session is invalid, clear it
            await signOut();
          }
        }
      } catch (error) {
        // If any error occurs, clear the session
        await signOut();
      }
    };
    
    clearInvalidSession();
  }, [signOut]);

  // Check for success parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setShowSuccessPage(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show success page after payment (only if user is authenticated)
  if (showSuccessPage && user) {
    return <SuccessPage onContinue={() => setShowSuccessPage(false)} />;
  }

  // Show subscription page when requested
  if (showSubscriptionPage && user) {
    return (
      <SubscriptionPage 
        userToken={user.access_token || ''}
        onBack={() => setShowSubscriptionPage(false)}
      />
    );
  }

  // Show auth page only when explicitly requested
  if (showAuthPage) {
    return (
      <AuthPage 
        onSuccess={() => {
          setShowAuthPage(false);
          // If there was a success parameter, show success page after login
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('success') === 'true') {
            setShowSuccessPage(true);
          }
        }} 
      />
    );
  }

  // Show dashboard for authenticated users
  if (user) {
    // SIMPLIFIED LOGIC: Always show dashboard for authenticated users
    // Only block if we have definitive data showing expired access
    const shouldBlockAccess = trialStatus && 
      !trialLoading && 
      !trialStatus.hasActiveTrial && 
      !trialStatus.hasActiveSubscription && 
      trialStatus.accessType === 'expired';

    if (shouldBlockAccess) {
      return <SubscriptionGate onUpgrade={() => setShowSubscriptionPage(true)} />;
    }
    
    // Show dashboard with trial status (or default trial while loading)
    const defaultTrialStatus = {
      hasActiveTrial: true,
      hasActiveSubscription: false,
      accessType: 'trial' as const,
      trialDaysRemaining: 7,
    };
    
    return (
      <DashboardApp 
        trialStatus={trialStatus || defaultTrialStatus}
        onUpgrade={() => setShowSubscriptionPage(true)}
      />
    );
  }

  // DEFAULT: Show marketing site for unauthenticated users
  return <MarketingApp onLogin={() => setShowAuthPage(true)} />;
}

export default App;