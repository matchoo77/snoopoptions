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
    <div className="relative">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-10 text-white/80 hover:text-white font-medium px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-200"
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