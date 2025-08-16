import React from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthPage } from './components/auth/AuthPage';
import { Header } from './components/Header';

function App() {
  const { user, loading } = useAuth();

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

  if (!user) {
    return <AuthPage onSuccess={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to SnoopFlow Scanner
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Real-time unusual options activity detection
          </p>
          <div className="bg-white rounded-lg shadow-sm p-8 border">
            <p className="text-gray-700">
              You're successfully logged in as: <strong>{user.email}</strong>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Dashboard components will be added next...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;