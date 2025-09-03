import { useState, useEffect } from 'react';

export interface MarketStatus {
  isOpen: boolean;
  currentPeriod: 'premarket' | 'market-hours' | 'after-hours' | 'closed';
  nextOpenTime: Date | null;
  nextCloseTime: Date | null;
  timeUntilOpen: string | null;
  timeUntilClose: string | null;
  timezone: string;
}

export function useMarketStatus() {
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);

  const calculateMarketStatus = (): MarketStatus => {
    const now = new Date();
    
    // Convert to Eastern Time (NYSE timezone)
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const currentHour = easternTime.getHours();
    const currentMinute = easternTime.getMinutes();
    const currentDay = easternTime.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Market hours: Monday-Friday, 9:30 AM - 4:00 PM ET
    // Pre-market: 4:00 AM - 9:30 AM ET
    // After-hours: 4:00 PM - 8:00 PM ET
    
    const isWeekday = currentDay >= 1 && currentDay <= 5;
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Market periods in minutes from midnight
    const preMarketStart = 4 * 60; // 4:00 AM
    const marketOpen = 9 * 60 + 30; // 9:30 AM
    const marketClose = 16 * 60; // 4:00 PM
    const afterHoursEnd = 20 * 60; // 8:00 PM
    
    let currentPeriod: 'premarket' | 'market-hours' | 'after-hours' | 'closed';
    let isOpen = false;
    
    if (!isWeekday) {
      currentPeriod = 'closed';
    } else if (currentTimeInMinutes >= preMarketStart && currentTimeInMinutes < marketOpen) {
      currentPeriod = 'premarket';
    } else if (currentTimeInMinutes >= marketOpen && currentTimeInMinutes < marketClose) {
      currentPeriod = 'market-hours';
      isOpen = true;
    } else if (currentTimeInMinutes >= marketClose && currentTimeInMinutes < afterHoursEnd) {
      currentPeriod = 'after-hours';
    } else {
      currentPeriod = 'closed';
    }
    
    // Calculate next open/close times
    const getNextOpenTime = (): Date => {
      const nextOpen = new Date(easternTime);
      
      if (isWeekday && currentTimeInMinutes < marketOpen) {
        // Today before market open
        nextOpen.setHours(9, 30, 0, 0);
      } else if (isWeekday && currentTimeInMinutes >= marketOpen && currentTimeInMinutes < marketClose) {
        // Currently during market hours - next open is tomorrow (or Monday)
        nextOpen.setDate(nextOpen.getDate() + (currentDay === 5 ? 3 : 1));
        nextOpen.setHours(9, 30, 0, 0);
      } else {
        // After hours or weekend - next business day
        const daysToAdd = currentDay === 5 ? 3 : currentDay === 6 ? 2 : 1;
        nextOpen.setDate(nextOpen.getDate() + daysToAdd);
        nextOpen.setHours(9, 30, 0, 0);
      }
      
      return nextOpen;
    };
    
    const getNextCloseTime = (): Date | null => {
      if (!isOpen) return null;
      
      const nextClose = new Date(easternTime);
      nextClose.setHours(16, 0, 0, 0);
      return nextClose;
    };
    
    const nextOpenTime = getNextOpenTime();
    const nextCloseTime = getNextCloseTime();
    
    // Calculate time until open/close
    const formatTimeUntil = (targetTime: Date): string => {
      const diff = targetTime.getTime() - easternTime.getTime();
      if (diff <= 0) return "Now";
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    };
    
    const timeUntilOpen = !isOpen ? formatTimeUntil(nextOpenTime) : null;
    const timeUntilClose = isOpen && nextCloseTime ? formatTimeUntil(nextCloseTime) : null;
    
    return {
      isOpen,
      currentPeriod,
      nextOpenTime,
      nextCloseTime,
      timeUntilOpen,
      timeUntilClose,
      timezone: 'America/New_York'
    };
  };

  useEffect(() => {
    // Update immediately
    setMarketStatus(calculateMarketStatus());
    
    // Update every minute
    const interval = setInterval(() => {
      setMarketStatus(calculateMarketStatus());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return marketStatus;
}
