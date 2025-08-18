import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { MarketingApp } from './components/marketing/MarketingApp';
import { DashboardApp } from './components/dashboard/DashboardApp';
import { AuthPage } from './components/auth/AuthPage';
import { SuccessPage } from './components/subscription/SuccessPage';
import { SubscriptionPage } from './components/subscription/SubscriptionPage';

function App() {
  const { user, loading } = useAuth();
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [showSubscriptionPage, setShowSubscriptionPage] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  // Error boundary effect
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      setAppError(event.error?.message || 'An unexpected error occurred');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setAppError('An unexpected error occurred');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Check for success parameter in URL
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        setShowSuccessPage(true);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Error checking URL params:', error);
    }
  }, []);

  // Show error page if there's an app error
  if (appError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-4">{appError}</p>
          <button
            onClick={() => {
              setAppError(null);
              window.location.reload();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SnoopFlow...</p>
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

  // Show dashboard for authenticated users with generous trial
  if (user) {
    const trialStatus = {
      hasActiveTrial: true,
      hasActiveSubscription: false,
      accessType: 'trial' as const,
      trialDaysRemaining: 30, // Generous trial period
    };
    
    return (
      <DashboardApp 
        trialStatus={trialStatus}
        onUpgrade={() => setShowSubscriptionPage(true)}
      />
    );
  }

  // DEFAULT: Show marketing site for unauthenticated users
  return <MarketingApp onLogin={() => setShowAuthPage(true)} />;
}

export default App;