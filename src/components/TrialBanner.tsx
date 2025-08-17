import React from 'react';
import { Clock, Crown, CreditCard } from 'lucide-react';

interface TrialBannerProps {
  daysRemaining: number;
  onUpgrade: () => void;
}

export function TrialBanner({ daysRemaining, onUpgrade }: TrialBannerProps) {
  const getUrgencyColor = () => {
    if (daysRemaining <= 1) return 'bg-red-50 border-red-200 text-red-800';
    if (daysRemaining <= 3) return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  const getUrgencyIcon = () => {
    if (daysRemaining <= 1) return <Clock className="w-5 h-5 text-red-600" />;
    if (daysRemaining <= 3) return <Clock className="w-5 h-5 text-yellow-600" />;
    return <Crown className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className={`border rounded-lg p-4 mb-6 ${getUrgencyColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getUrgencyIcon()}
          <div>
            <h3 className="font-semibold">
              {daysRemaining > 0 ? (
                <>🐕 Free Trial - {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} of sniffing left!</>
              ) : (
                '🐕 Your pup needs a subscription to keep hunting!'
              )}
            </h3>
            <p className="text-sm opacity-90">
              {daysRemaining > 0 ? (
                'Keep your trading dog well-fed with a subscription to continue the hunt for big trades!'
              ) : (
                'Subscribe now to get your trading companion back on the scent trail!'
              )}
            </p>
          </div>
        </div>
        
        <button
          onClick={onUpgrade}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
            daysRemaining <= 1 
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Upgrade Now</span>
        </button>
      </div>
    </div>
  );
}