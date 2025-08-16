import React from 'react';
import { STRIPE_PRODUCTS } from '../../stripe-config';
import { SubscriptionCard } from './SubscriptionCard';
import { useSubscription } from '../../hooks/useSubscription';

interface SubscriptionPageProps {
  userToken: string;
}

export function SubscriptionPage({ userToken }: SubscriptionPageProps) {
  const { subscription, loading } = useSubscription();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            SnoopFlow Scanner Plans
          </h1>
          <p className="text-lg text-gray-600">
            Choose the plan that works best for your trading needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {STRIPE_PRODUCTS.map((product) => (
            <SubscriptionCard
              key={product.id}
              product={product}
              isCurrentPlan={subscription?.price_id === product.priceId && subscription?.subscription_status === 'active'}
              userToken={userToken}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-blue-50 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Why Choose Annual?
            </h3>
            <p className="text-blue-700">
              Save over 55% with our annual plan! That's more than 6 months free compared to monthly billing.
            </p>
          </div>
        </div>

        {subscription && subscription.subscription_status === 'active' && (
          <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Current Subscription
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className="ml-2 capitalize text-green-600">
                  {subscription.subscription_status}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Next billing:</span>
                <span className="ml-2 text-gray-600">
                  {subscription.current_period_end 
                    ? new Date(subscription.current_period_end * 1000).toLocaleDateString()
                    : 'N/A'
                  }
                </span>
              </div>
              {subscription.payment_method_brand && subscription.payment_method_last4 && (
                <div>
                  <span className="font-medium text-gray-700">Payment method:</span>
                  <span className="ml-2 text-gray-600 capitalize">
                    {subscription.payment_method_brand} ending in {subscription.payment_method_last4}
                  </span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Auto-renewal:</span>
                <span className="ml-2 text-gray-600">
                  {subscription.cancel_at_period_end ? 'Disabled' : 'Enabled'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}