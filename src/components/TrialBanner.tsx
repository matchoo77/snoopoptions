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
    if (daysRemaining <= 1) return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />;
    if (daysRemaining <= 3) return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />;
    return <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />;
  };

  return (
    <div className={`border rounded-lg p-2 sm:p-4 mb-2 sm:mb-4 ${getUrgencyColor()}`}>
      <div className="flex items-center justify-between flex-col sm:flex-row gap-2 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
          {getUrgencyIcon()}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xs sm:text-sm md:text-base">
              {daysRemaining > 0 ? (
                <>🐕 Free Trial - {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left!</>
              ) : (
                '🐕 Your pup needs a subscription!'
              )}
            </h3>
            <p className="text-xs sm:text-sm opacity-90 hidden sm:block">
              {daysRemaining > 0 ? (
                'Keep your trading dog well-fed with a subscription to continue the hunt!'
              ) : (
                'Subscribe now to get your trading companion back on the scent trail!'
              )}
            </p>
          </div>
        </div>
        
        <button
          onClick={onUpgrade}
          className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 rounded-md font-medium transition-colors text-xs sm:text-sm ${
            daysRemaining <= 1 
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Upgrade Now</span>
          <span className="sm:hidden">Upgrade</span>
        </button>
      </div>
    </div>
  );
}