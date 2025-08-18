import React, { useState, useEffect } from 'react';
import { DogIcon } from './components/DogIcon';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-lg mb-4 inline-block">
          <DogIcon className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
          SnoopFlow
        </h1>
        <p className="text-xl text-gray-600 mb-2">🐕 Your Trading Dog is Ready!</p>
        <p className="text-gray-500">Sniffing out unusual options activity...</p>
      </div>
    </div>
  );
}

export default App;