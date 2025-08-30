import { useState } from 'react';
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
          className="absolute top-2 sm:top-4 lg:top-6 left-2 sm:left-4 lg:left-6 z-10 text-white/80 hover:text-white font-medium px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-200 text-xs sm:text-sm lg:text-base"
        >
          <span className="hidden sm:inline">← Back to Home</span>
          <span className="sm:hidden">← Back</span>
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