import React from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthPage } from './components/auth/AuthPage';

function App() {
  const { user, loading } = useAuth();
  
  console.log('App render - user:', user, 'loading:', loading);
  
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

  if (!user) {
    console.log('No user, showing auth page');
    return <AuthPage onSuccess={() => window.location.reload()} />;
  }

  console.log('User authenticated, showing dashboard');
  
  // Simple dashboard for now
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">SnoopFlow</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={() => {
                  import('./lib/supabase').then(({ supabase }) => {
                    supabase.auth.signOut();
                  });
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to SnoopFlow Scanner
          </h2>
          <p className="text-gray-600 mb-4">
            Your account is set up and ready! The options scanner is loading...
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              ✅ Authentication working<br/>
              ✅ User logged in: {user.email}<br/>
              🔄 Loading scanner components...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;