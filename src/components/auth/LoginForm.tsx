import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToSignup: () => void;
}

export function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        onSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center py-4 sm:py-8 lg:py-12 px-2 sm:px-4 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center justify-center mb-2 sm:mb-3 lg:mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 sm:p-2.5 lg:p-3 rounded-xl sm:rounded-2xl">
              <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">Welcome Back</h1>
          <p className="text-sm sm:text-base text-blue-200">Continue tracking unusual options activity</p>
        </div>

        {/* Features Preview */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-white/20">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div className="text-white">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mx-auto mb-1 sm:mb-2 text-yellow-400" />
              <div className="text-xs font-medium">Real-time</div>
              <div className="text-xs text-blue-200">Alerts</div>
            </div>
            <div className="text-white">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mx-auto mb-1 sm:mb-2 text-green-400" />
              <div className="text-xs font-medium">Advanced</div>
              <div className="text-xs text-blue-200">Analytics</div>
            </div>
            <div className="text-white">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mx-auto mb-1 sm:mb-2 text-purple-400" />
              <div className="text-xs font-medium">Pattern</div>
              <div className="text-xs text-blue-200">Recognition</div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8">
          <div className="text-center mb-4 sm:mb-6">
            <LogIn className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-600 mx-auto mb-2 sm:mb-3" />
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Sign In</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Access your SnoopFlow dashboard</p>
          </div>

          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg text-sm sm:text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600 text-sm sm:text-base">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignup}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Create one now
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 sm:mt-6">
          <p className="text-blue-200 text-xs sm:text-sm">
            Join thousands of traders using SnoopFlow for options intelligence
          </p>
        </div>
      </div>
    </div>
  );
}