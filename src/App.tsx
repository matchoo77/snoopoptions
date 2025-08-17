import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import { MarketingApp } from './components/marketing/MarketingApp';
import { DashboardApp } from './components/dashboard/DashboardApp';
import { AuthPage } from './components/auth/AuthPage';
import { SuccessPage } from './components/subscription/SuccessPage';

function App() {
  const { user, loading, signOut } = useAuth();
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState(false);

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

  // Show auth page when explicitly requested and no user
  if (showAuthPage) {
    return <AuthPage onSuccess={() => setShowAuthPage(false)} />;
  }

  // Show dashboard for authenticated users
  if (user) {
    return <DashboardApp />;
  }

  // Show marketing site by default for visitors who haven't clicked login
  return <MarketingApp onLogin={() => setShowAuthPage(true)} />;
}

export default App;