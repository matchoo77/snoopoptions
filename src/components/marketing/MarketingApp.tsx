import React, { useState } from 'react';
import { Navigation } from './Navigation';
import { HomePage } from './HomePage';
import { FeaturesPage } from './FeaturesPage';
import { PricingPage } from './PricingPage';
import { AboutPage } from './AboutPage';
import { ContactPage } from './ContactPage';
import { Footer } from './Footer';
import { DisclaimerPage } from './DisclaimerPage';
import { PrivacyPage } from './PrivacyPage';

interface MarketingAppProps {
  onLogin: () => void;
}

export function MarketingApp({ onLogin }: MarketingAppProps) {
  const [currentPage, setCurrentPage] = useState('home');

  // Handle signup navigation
  const handleNavigate = (page: string) => {
    if (page === 'signup') {
      onLogin(); // Just redirect to login for now
    } else {
      setCurrentPage(page);
    }
  };

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
      case 'disclaimer':
        return <DisclaimerPage onNavigate={handleNavigate} currentPage={currentPage} />;
      case 'privacy':
        return <PrivacyPage onNavigate={handleNavigate} currentPage={currentPage} />;
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