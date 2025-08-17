import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

interface AuthPageProps {
  onSuccess: () => void;
  initialMode?: 'login' | 'signup';
  onBack?: () => void;
}

export function AuthPage({ onSuccess, initialMode = 'login', onBack }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 font-medium"
        >
          ← Back to Home
        </button>
      )}
      {isLogin ? (
        <LoginForm
          onSuccess={onSuccess}
          onSwitchToSignup={() => setIsLogin(false)}
        />
      ) : (
        <SignupForm
          onSuccess={onSuccess}
          onSwitchToLogin={() => setIsLogin(true)}
        />
      )}
    </div>
  );
}