import React from 'react';
import { useAuth } from './hooks/useAuth';
import { MarketingApp } from './components/marketing/MarketingApp';
import { DashboardApp } from './components/dashboard/DashboardApp';
import { AuthPage } from './components/auth/AuthPage';
import { SuccessPage } from './components/subscription/SuccessPage';
import { useState, useEffect } from 'react';

function App() {
  const { user, loading } = useAuth();
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState(false);

  // Check for success parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setShowSuccessPage(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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

  // Show success page after payment
  if (showSuccessPage) {
    return <SuccessPage onContinue={() => setShowSuccessPage(false)} />;
  }

  // Show auth page if user clicked login
  if (!user && showAuthPage) {
    return <AuthPage onSuccess={() => setShowAuthPage(false)} />;
  }

  // Show marketing site for non-authenticated visitors
  if (!user) {
    return <MarketingApp onLogin={() => setShowAuthPage(true)} />;
  }

  // Show dashboard for authenticated users
  return <DashboardApp />;
}

export default App;