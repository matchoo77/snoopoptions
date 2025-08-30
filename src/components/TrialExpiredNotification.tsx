import { X } from 'lucide-react';

interface TrialExpiredNotificationProps {
  onClose: () => void;
}

export function TrialExpiredNotification({ onClose }: TrialExpiredNotificationProps) {
  return (
    <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="mr-3">
            <span className="text-2xl">🐕</span>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Trial Complete!</h4>
            <p className="text-sm">
              Your 7-day free trial has ended. Time to subscribe and keep your trading dog well-fed!
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-white hover:text-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
