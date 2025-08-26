import React from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';

export function ConnectionStatus() {
  const polygonApiKey = 'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X';
  const hasApiKey = true;

  if (!polygonApiKey) {
    return (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <WifiOff className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="text-sm font-medium text-red-800">No API Key Found</h3>
            <p className="text-sm text-red-700">VITE_POLYGON_API_KEY is not set in environment variables</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">API Key Not Configured</h3>
            <p className="text-sm text-yellow-700">Please replace 'your_polygon_api_key_here' with your actual Polygon.io API key</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <div>
          <h3 className="text-sm font-medium text-green-800">API Key Configured</h3>
          <p className="text-sm text-green-700">
            Polygon.io API key detected (ends with: ...{polygonApiKey.slice(-4)})
          </p>
        </div>
      </div>
    </div>
  );
}