import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { MarketingApp } from './components/marketing/MarketingApp';
import { AuthPage } from './components/auth/AuthPage';
import { DashboardApp } from './components/dashboard/DashboardApp';
import { SubscriptionPage } from './components/subscription/SubscriptionPage';
import { SuccessPage } from './components/subscription/SuccessPage';

function App() {
  const { user, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'marketing' | 'auth' | 'dashboard' | 'subscription' | 'success'>('marketing');

  // Check URL parameters for payment success/cancel
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setCurrentView('success');
    } else if (urlParams.get('canceled') === 'true') {
      console.log('Payment was canceled');
    }
  }, []);

  // Handle authentication state changes
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
          setCurrentView('success');
        } else if (currentView === 'auth') {
          setCurrentView('dashboard');
        }
      } else if (currentView === 'dashboard') {
        setCurrentView('marketing');
      }
    }
  }, [user, authLoading, currentView]);

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
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // Show loading state only briefly
  if (authLoading) {
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

      // For now, always allow dashboard access (simplified trial logic)
      return (
        <DashboardApp 
          trialStatus={{
            hasActiveTrial: true,
            hasActiveSubscription: false,
            accessType: 'trial',
            trialDaysRemaining: 7,
          }}
          onUpgrade={handleUpgrade}
        />
      );

    default:
      return <MarketingApp onLogin={handleLogin} />;
  }
}

export default App;