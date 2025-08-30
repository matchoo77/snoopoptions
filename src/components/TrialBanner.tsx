import { Clock, Crown, CreditCard } from 'lucide-react';

interface TrialBannerProps {
  daysRemaining: number;
  trialEndDate?: string | null;
  onUpgrade: () => void;
}

export function TrialBanner({ daysRemaining, trialEndDate, onUpgrade }: TrialBannerProps) {
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

  const formatTrialEndTime = () => {
    if (!trialEndDate) return `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
    
    const endDate = new Date(trialEndDate);
    const now = new Date();
    const timeDiff = endDate.getTime() - now.getTime();
    
    if (timeDiff <= 0) return 'Trial expired';
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 24) {
      return `${hours}h ${minutes}m remaining`;
    }
    
    return `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
  };

  return (
    <div className={`border rounded-lg p-3 mb-4 ${getUrgencyColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getUrgencyIcon()}
          <div>
            <h3 className="font-semibold">
              {daysRemaining > 0 ? (
                <>🐕 Free Trial - {formatTrialEndTime()}</>
              ) : (
                '🐕 Your pup needs a subscription to keep hunting!'
              )}
            </h3>
            <p className="text-sm opacity-90">
              {daysRemaining > 0 ? (
                daysRemaining <= 1 ? 
                  'Your trial expires today! Subscribe now to keep your trading dog well-fed!' :
                  'Keep your trading dog well-fed with a subscription to continue the hunt for big trades!'
              ) : (
                'Subscribe now to get your trading companion back on the scent trail!'
              )}
            </p>
          </div>
        </div>

        <button
          onClick={onUpgrade}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${daysRemaining <= 1
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