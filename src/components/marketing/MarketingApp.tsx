import React, { useState } from 'react';
import { Navigation } from './Navigation';
import { HomePage } from './HomePage';
import { FeaturesPage } from './FeaturesPage';
import { PricingPage } from './PricingPage';
import { AboutPage } from './AboutPage';
import { ContactPage } from './ContactPage';
import { Footer } from './Footer';
import { AuthPage } from '../auth/AuthPage';

interface MarketingAppProps {
  onLogin: () => void;
}

export function MarketingApp({ onLogin }: MarketingAppProps) {
  const [currentPage, setCurrentPage] = useState('home');
  const [showSignup, setShowSignup] = useState(false);

  // Handle signup navigation
  const handleNavigate = (page: string) => {
    if (page === 'signup') {
      setShowSignup(true);
    } else {
      setCurrentPage(page);
    }
  };

  // Show signup page when requested
  if (showSignup) {
    return (
      <AuthPage 
        onSuccess={onLogin}
        initialMode="signup"
        onBack={() => setShowSignup(false)}
      />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'features':
        return <FeaturesPage onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'pricing':
        return <PricingPage onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'about':
        return <AboutPage onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'contact':
        return <ContactPage onNavigate={handleNavigate} currentPage={currentPage} />;
      default:
        return <HomePage onNavigate={handleNavigate} currentPage={currentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation 
        currentPage={currentPage} 
        onNavigate={handleNavigate} 
        onLogin={onLogin}
      />
      <main className="pt-16">
        {renderPage()}
      </main>
      <Footer 
        onNavigate={handleNavigate} 
        currentPage={currentPage}
        onLogin={onLogin}
      />
    </div>
  );
}