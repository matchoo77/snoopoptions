import { useState } from 'react';
import { Zap, TrendingUp, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DogIcon } from './DogIcon';

export function Header() {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Always visible */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                <DogIcon className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">SnoopFlow</h1>
                <p className="text-xs text-gray-500">🐕 Sniffing Out Options</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">SnoopFlow</h1>
              </div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
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
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{user.email}</span>
                </div>
                
                <button
                  onClick={() => {
                    console.log('Sign out button clicked (desktop)');
                    signOut();
                  }}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
            >
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">Real-time Data Active</span>
              </div>
              
              <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Block Trades Scanner</span>
              </div>
              
              <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span>Unusual Activity Monitor</span>
              </div>
              
              {user && (
                <>
                  <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 border-t border-gray-200 mt-2 pt-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      console.log('Sign out button clicked (mobile)');
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}