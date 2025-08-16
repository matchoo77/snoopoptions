import React from 'react';
import { BarChart3, Zap, TrendingUp, User, LogOut, CreditCard } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { getProductByPriceId } from '../stripe-config';

interface HeaderProps {
  onShowSubscription?: () => void;
}

export function Header({ onShowSubscription }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { subscription } = useSubscription();

  const currentProduct = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null;

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SnoopFlow</h1>
                <p className="text-xs text-gray-500">Unusual Activity Scanner</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 font-medium">Live</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Block Trades</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span>Unusual Activity</span>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                {currentProduct && subscription?.subscription_status === 'active' && (
                  <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-700 font-medium">
                      {currentProduct.interval === 'year' ? 'Annual Plan' : 'Monthly Plan'}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{user.email}</span>
                </div>
                
                {onShowSubscription && (
                  <button
                    onClick={onShowSubscription}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Subscription</span>
                  </button>
                )}
                
                <button
                  onClick={signOut}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}