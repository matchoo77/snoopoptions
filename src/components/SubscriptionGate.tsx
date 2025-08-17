import React from 'react';
import { Lock, Crown, CreditCard, ArrowRight } from 'lucide-react';

interface SubscriptionGateProps {
  onUpgrade: () => void;
}

export function SubscriptionGate({ onUpgrade }: SubscriptionGateProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Trial Expired
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your 7-day free trial has ended. Subscribe now to continue accessing real-time unusual options activity and all premium features.
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
        
        <button
          onClick={onUpgrade}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Subscribe Now
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
        
        <p className="text-xs text-gray-500 mt-4">
          Cancel anytime • 30-day money-back guarantee
        </p>
      </div>
    </div>
  );
}