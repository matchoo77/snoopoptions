import { CreditCard, Shield, Zap, TrendingUp } from 'lucide-react';

interface SubscriptionOnlyGateProps {
  onUpgrade: () => void;
  onLogout: () => void;
}

export function SubscriptionOnlyGate({ onUpgrade, onLogout }: SubscriptionOnlyGateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Subscription Required
          </h1>
          <p className="text-gray-600">
            Access to SnoopFlow Scanner requires an active subscription.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center text-left">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm text-gray-700">Real-time unusual options activity alerts</span>
          </div>

          <div className="flex items-center text-left">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm text-gray-700">Advanced filtering and analytics</span>
          </div>

          <div className="flex items-center text-left">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm text-gray-700">Professional trading insights</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onUpgrade}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Subscribe Now - $399/year
          </button>

          <button
            onClick={onLogout}
            className="w-full text-gray-500 py-2 text-sm hover:text-gray-700 transition-colors"
          >
            Sign out
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Secure payment processing by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
