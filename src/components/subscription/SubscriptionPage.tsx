 
import { STRIPE_PRODUCTS } from '../../stripe-config';
import { SubscriptionCard } from './SubscriptionCard';
import { useSubscription } from '../../hooks/useSubscription';
import { Star } from 'lucide-react';

interface SubscriptionPageProps {
  userToken: string;
  onBack?: () => void;
}

export function SubscriptionPage({ userToken, onBack }: SubscriptionPageProps) {
  const { subscription, loading } = useSubscription();

  console.log('SubscriptionPage rendered with userToken:', userToken ? 'present' : 'missing');
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-600 to-purple-700 opacity-95" />
        <div className="mx-auto max-w-5xl px-6 lg:px-8 py-16">
          {onBack && (
            <button onClick={onBack} className="mb-6 text-white/90 hover:text-white font-medium">
              ← Back to Dashboard
            </button>
          )}

          <div className="text-center text-white mb-10">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur rounded-full px-4 py-2 mb-4">
              <Star className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium">Best Value</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">SnoopFlow Annual Plan</h1>
            <p className="mt-2 text-blue-100">One simple plan with everything included. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200 p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900">What's included</h2>
              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                <li className="flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" /> Real-time unusual options alerts</li>
                <li className="flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" /> Advanced filtering & analytics</li>
                <li className="flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" /> Block trade detection</li>
                <li className="flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" /> Priority support</li>
                <li className="flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" /> Mobile-friendly dashboard</li>
                <li className="flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" /> Continuous updates</li>
              </ul>

              {subscription && subscription.subscription_status === 'active' && (
                <div className="mt-8 bg-blue-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-blue-900">Current Subscription</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-2 text-blue-900/90">
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className="ml-2 capitalize text-green-700">
                        {subscription.subscription_status}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Next billing:</span>
                      <span className="ml-2">
                        {subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    {subscription.payment_method_brand && subscription.payment_method_last4 && (
                      <div>
                        <span className="font-medium">Payment method:</span>
                        <span className="ml-2 capitalize">
                          {subscription.payment_method_brand} ending in {subscription.payment_method_last4}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Auto-renewal:</span>
                      <span className="ml-2">
                        {subscription.cancel_at_period_end ? 'Disabled' : 'Enabled'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-1">
              {STRIPE_PRODUCTS.map((product) => (
                <SubscriptionCard
                  key={product.priceId}
                  product={product}
                  isCurrentPlan={subscription?.price_id === product.priceId && subscription?.subscription_status === 'active'}
                  userToken={userToken}
                />
              ))}
              <p className="text-xs text-white/80 text-center mt-4">Secure payment processing by Stripe</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}