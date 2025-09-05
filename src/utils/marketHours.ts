export function isMarketOpen(): boolean {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = et.getDay();
  
  // Market is closed on weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }
  
  // Get current time in ET
  const hours = et.getHours();
  const minutes = et.getMinutes();
  const currentTime = hours * 60 + minutes; // Convert to minutes since midnight
  
  // Market hours: 9:30 AM - 4:00 PM ET
  const marketOpen = 9 * 60 + 30; // 9:30 AM in minutes
  const marketClose = 16 * 60; // 4:00 PM in minutes
  
  return currentTime >= marketOpen && currentTime < marketClose;
}

export function getMarketStatus(): { isOpen: boolean; message: string } {
  const isOpen = isMarketOpen();
  
  if (isOpen) {
    return {
      isOpen: true,
      message: "Market is currently open"
    };
  }
  
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const dayOfWeek = et.getDay();
  
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      isOpen: false,
      message: "Market is closed - Weekend"
    };
  }
  
  const hours = et.getHours();
  if (hours < 9 || (hours === 9 && et.getMinutes() < 30)) {
    return {
      isOpen: false,
      message: "Market opens at 9:30 AM ET"
    };
  }
  
  return {
    isOpen: false,
    message: "Market is closed - After hours"
  };
}
