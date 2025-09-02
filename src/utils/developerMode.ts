/**
 * Developer Mode Utilities
 * Provides centralized developer mode detection for bypassing subscription requirements
 */

export function isDeveloperMode(): boolean {
  // Only allow developer mode in development environment
  if (!import.meta.env.DEV) {
    return false;
  }

  return (
    import.meta.env.VITE_DEVELOPER_MODE === 'true' ||
    new URLSearchParams(window.location.search).get('dev') === 'true' ||
    localStorage.getItem('developer_mode') === 'true'
  );
}

export function hasValidSubscriptionOrDevMode(subscription: any): boolean {
  return isDeveloperMode() || Boolean(subscription);
}

export function shouldBypassSubscriptionCheck(): boolean {
  return isDeveloperMode();
}

// Console helper for debugging
if (import.meta.env.DEV) {
  (window as any).devModeStatus = () => {
    console.log('Developer Mode Status:', {
      isDeveloperMode: isDeveloperMode(),
      envVariable: import.meta.env.VITE_DEVELOPER_MODE,
      urlParameter: new URLSearchParams(window.location.search).get('dev'),
      localStorage: localStorage.getItem('developer_mode'),
      environment: import.meta.env.DEV ? 'development' : 'production'
    });
  };
}
