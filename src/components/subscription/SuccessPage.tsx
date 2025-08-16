import React, { useEffect } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface SuccessPageProps {
  onContinue: () => void;
}

export function SuccessPage({ onContinue }: SuccessPageProps) {
  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      onContinue();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for subscribing to SnoopOptions Scanner. Your account has been activated and you now have access to all premium features.
        </p>
        
        <div className="space-y-3 mb-8 text-left">
          <div className="flex items-center text-sm text-gray-700">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            Real-time unusual options activity alerts
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            Advanced filtering capabilities
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            Block trade notifications
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            Premium support
          </div>
        </div>
        
        <button
          onClick={onContinue}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
        >
          Continue to Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
        
        <p className="text-xs text-gray-500 mt-4">
          Redirecting automatically in 5 seconds...
        </p>
      </div>
    </div>
  );
}