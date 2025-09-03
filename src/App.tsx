import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useSubscriptionOnly } from './hooks/useSubscriptionOnly';
import { MarketingApp } from './components/marketing/MarketingApp';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { DashboardApp } from './components/dashboard/DashboardApp';
import { SubscriptionPage } from './components/subscription/SubscriptionPage';
import { SuccessPage } from './components/subscription/SuccessPage';
import { SubscriptionOnlyGate } from './components/SubscriptionOnlyGate';

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { subscriptionStatus, loading: subscriptionLoading, refetch: refetchSubscriptionStatus } = useSubscriptionOnly();
  
  // Initialize currentView based on URL or default to 'marketing'
  const getInitialView = () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      return 'success';
    }
    return 'marketing';
  };
  
  const [currentView, setCurrentView] = useState<'marketing' | 'login' | 'signup' | 'dashboard' | 'subscription' | 'success'>(getInitialView);

  const handleLogout = async () => {
    try {
      await signOut();
      setCurrentView('marketing');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
        } else if (currentView === 'login' || currentView === 'signup' || currentView === 'marketing') {
          // Only auto-navigate to dashboard if user is coming from auth pages or marketing
          setCurrentView('dashboard');
        }
        // If currentView is already 'dashboard', 'subscription', or 'success', keep it
      } else {
        // User signed out or session expired - redirect to marketing page
        if (currentView === 'dashboard' || currentView === 'subscription' || currentView === 'success') {
          setCurrentView('marketing');
          // Clear any URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [user, authLoading]); // Removed currentView from dependencies to prevent loops

  const handleLogin = () => {
    setCurrentView('login');
  };

  const handleAuthSuccess = () => {
    setCurrentView('dashboard');
    // Refresh subscription status when user logs in
    setTimeout(() => {
      refetchSubscriptionStatus();
    }, 100);
  };

  const handleUpgrade = () => {
    setCurrentView('subscription');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // Show loading state only while auth is initializing
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
  return (
    <>
      {(() => {
        switch (currentView) {
    case 'login':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setCurrentView('marketing')}
            className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Home
          </button>
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToSignup={() => setCurrentView('signup')}
          />
        </div>
      );

    case 'signup':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setCurrentView('marketing')}
            className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Home
          </button>
          <SignupForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        </div>
      );

    case 'subscription':
      return user ? (
        <SubscriptionPage
          userToken={user.access_token || user.aud || ''}
          onBack={handleBackToDashboard}
        />
      ) : (
        <LoginForm
          onSuccess={handleAuthSuccess}
          onSwitchToSignup={() => setCurrentView('signup')}
        />
      );

    case 'success':
      return (
        <SuccessPage onContinue={handleBackToDashboard} />
      );

    case 'dashboard':
      if (!user) {
        return (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToSignup={() => setCurrentView('signup')}
          />
        );
      }

      // Show loading while subscription status is being fetched
      if (subscriptionLoading) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your subscription status...</p>
            </div>
          </div>
        );
      }

      // Check if user has active subscription
      if (!subscriptionStatus?.hasActiveSubscription) {
        return (
          <SubscriptionOnlyGate 
            onUpgrade={handleUpgrade}
            onLogout={handleLogout}
          />
        );
      }

      return (
        <DashboardApp
          onUpgrade={handleUpgrade}
        />
      );

    default:
      return <MarketingApp onLogin={handleLogin} />;
        }
      })()}
    </>
  );
}

export default App;