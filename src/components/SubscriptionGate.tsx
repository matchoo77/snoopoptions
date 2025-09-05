import React from 'react';
import { Lock, Crown, CreditCard, ArrowRight, ArrowLeft, LogOut } from 'lucide-react';

interface SubscriptionGateProps {
  onUpgrade: () => void;
  trialExpired?: boolean;
  onBack?: () => void;
  onLogout?: () => void;
}

export function SubscriptionGate({ onUpgrade, trialExpired = false, onBack, onLogout }: SubscriptionGateProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {trialExpired ?
            '🐕 Your Trading Pup\'s Trial Has Ended!' :
            '🐕 Your Trading Pup Needs Food!'
          }
        </h1>

        <p className="text-gray-600 mb-6">
          {trialExpired ?
            'Thanks for trying SnoopFlow! Your 7-day free trial has ended, but your trading dog is still hungry for more opportunities. Subscribe now to keep the hunt going!' :
            'Your 7-day free trial has ended and your trading dog is getting hungry! Subscribe now to keep your loyal companion sniffing out profitable opportunities.'
          }
        </p>

        <div className="space-y-3 mb-8 text-left">
          <div className="flex items-center text-sm text-gray-700">
            <Crown className="w-4 h-4 text-blue-600 mr-2" />
            Real-time unusual options activity alerts
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Crown className="w-4 h-4 text-blue-600 mr-2" />
            Advanced filtering capabilities
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Crown className="w-4 h-4 text-blue-600 mr-2" />
            Block trade notifications
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Crown className="w-4 h-4 text-blue-600 mr-2" />
            Unlimited watchlist symbols
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={onUpgrade}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Subscribe Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
          //
          <div className="flex space-x-2">
            {onBack && (
              <button
                onClick={onBack}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Go Back
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center text-sm"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Switch Account
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Cancel anytime • 30-day money-back guarantee
        </p>
      </div>
    </div>
  );
}