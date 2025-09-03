import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTrialStatus } from './hooks/useTrialStatus';
import { useTrialExpiration } from './hooks/useTrialExpiration';
import { MarketingApp } from './components/marketing/MarketingApp';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { DashboardApp } from './components/dashboard/DashboardApp';
import { SubscriptionPage } from './components/subscription/SubscriptionPage';
import { SuccessPage } from './components/subscription/SuccessPage';
import { SubscriptionGate } from './components/SubscriptionGate';
import { TrialExpiredNotification } from './components/TrialExpiredNotification';

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { trialStatus, loading: trialLoading, refetch: refetchTrialStatus } = useTrialStatus();
  
  // Initialize currentView based on URL or default to 'marketing'
  const getInitialView = () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      return 'success';
    }
    // If user is already logged in on page load, default to dashboard
    // This will be updated by the useEffect once auth loads
    return 'marketing';
  };
  
  const [currentView, setCurrentView] = useState<'marketing' | 'login' | 'signup' | 'dashboard' | 'subscription' | 'success' | 'auth'>(getInitialView);
  const [showTrialExpiredMessage, setShowTrialExpiredMessage] = useState(false);
  const [forceShowSubscriptionGate, setForceShowSubscriptionGate] = useState(false);

  // Handle trial expiration for logged-in users
  useTrialExpiration({
    trialStatus,
    onTrialExpired: () => {
      console.log('Trial expired, showing subscription gate');
      setForceShowSubscriptionGate(true);
      setShowTrialExpiredMessage(true);
      
      // Hide the message after 8 seconds but keep subscription gate
      setTimeout(() => {
        setShowTrialExpiredMessage(false);
      }, 8000);
    }
  });

  // Reset forced subscription gate when user has valid access
  useEffect(() => {
    if (trialStatus && (trialStatus.hasActiveTrial || trialStatus.hasActiveSubscription)) {
      console.log('User has valid access, clearing forced subscription gate:', {
        hasActiveTrial: trialStatus.hasActiveTrial,
        hasActiveSubscription: trialStatus.hasActiveSubscription,
        accessType: trialStatus.accessType,
        daysRemaining: trialStatus.trialDaysRemaining
      });
      setForceShowSubscriptionGate(false);
      setShowTrialExpiredMessage(false);
    }
  }, [trialStatus?.hasActiveTrial, trialStatus?.hasActiveSubscription]);

  const handleLogout = async () => {
    try {
      await signOut();
      setCurrentView('marketing');
      setForceShowSubscriptionGate(false);
      setShowTrialExpiredMessage(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCloseTrialNotification = () => {
    setShowTrialExpiredMessage(false);
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
    // Refresh trial status when user logs in
    setTimeout(() => {
      refetchTrialStatus();
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
      {/* Trial expired notification */}
      {showTrialExpiredMessage && (
        <TrialExpiredNotification 
          onClose={handleCloseTrialNotification} 
        />
      )}

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
          userToken={''}
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

      // Show loading while trial status is being fetched (only on first load)
      if (trialLoading && !trialStatus) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your access status...</p>
            </div>
          </div>
        );
      }

      // Check if user has access (trial or subscription) or if we're forcing the subscription gate
      if (forceShowSubscriptionGate || (!trialStatus?.hasActiveTrial && !trialStatus?.hasActiveSubscription)) {
        return (
          <SubscriptionGate 
            onUpgrade={handleUpgrade}
            trialExpired={forceShowSubscriptionGate || trialStatus?.accessType === 'expired'}
            onLogout={handleLogout}
          />
        );
      }

      return (
        <DashboardApp
          trialStatus={trialStatus}
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