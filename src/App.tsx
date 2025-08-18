import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTrialStatus } from './hooks/useTrialStatus';
import { MarketingApp } from './components/marketing/MarketingApp';
import { AuthPage } from './components/auth/AuthPage';
import { DashboardApp } from './components/dashboard/DashboardApp';
import { SubscriptionPage } from './components/subscription/SubscriptionPage';
import { SubscriptionGate } from './components/SubscriptionGate';
import { SuccessPage } from './components/subscription/SuccessPage';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { trialStatus, loading: trialLoading } = useTrialStatus();
  const [currentView, setCurrentView] = useState<'marketing' | 'auth' | 'dashboard' | 'subscription' | 'success'>('marketing');

  // Check URL parameters for payment success/cancel
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setCurrentView('success');
    } else if (urlParams.get('canceled') === 'true') {
      // Handle canceled payment - could show a message or redirect
      console.log('Payment was canceled');
    }
  }, []);

  // Handle authentication state changes
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // User is authenticated, check if we should show success page
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
          setCurrentView('success');
        } else {
          setCurrentView('dashboard');
        }
      } else {
        setCurrentView('marketing');
      }
    }
  }, [user, authLoading]);

  const handleLogin = () => {
    setCurrentView('auth');
  };

  const handleAuthSuccess = () => {
    setCurrentView('dashboard');
  };

  const handleUpgrade = () => {
    setCurrentView('subscription');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // Show loading state
  if (authLoading || trialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SnoopFlow...</p>
        </div>
      </div>
    );
  }

  // Handle different views
  switch (currentView) {
    case 'auth':
      return (
        <AuthPage 
          onSuccess={handleAuthSuccess}
          onBack={() => setCurrentView('marketing')}
        />
      );

    case 'subscription':
      return user ? (
        <SubscriptionPage 
          userToken={user.access_token || ''}
          onBack={handleBackToDashboard}
        />
      ) : (
        <AuthPage onSuccess={handleAuthSuccess} />
      );

    case 'success':
      return (
        <SuccessPage onContinue={handleBackToDashboard} />
      );

    case 'dashboard':
      if (!user) {
        return <AuthPage onSuccess={handleAuthSuccess} />;
      }

      // Check if user has access (trial or subscription)
      const hasAccess = trialStatus && (
        trialStatus.hasActiveTrial || 
        trialStatus.hasActiveSubscription ||
        trialStatus.accessType === 'trial'
      );

      if (!hasAccess && trialStatus?.accessType === 'expired') {
        return <SubscriptionGate onUpgrade={handleUpgrade} />;
      }

      return (
        <DashboardApp 
          trialStatus={trialStatus || undefined}
          onUpgrade={handleUpgrade}
        />
      );

    default:
      return <MarketingApp onLogin={handleLogin} />;
  }
}

export default App;