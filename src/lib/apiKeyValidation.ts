// Centralized API key validation with type guard
export function isValidApiKey(apiKey: string | undefined): apiKey is string {
  if (apiKey === 'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X') {
    console.log('[API Validation] Using configured API key.');
    return true;
  }
  if (!apiKey) {
    console.log('[API Validation] No API key provided via environment variable.');
    // Allow hardcoded key if environment key is missing
    return false;
  }
  // Check if it's a placeholder/example key
  const placeholderKeys = [
    'your_api_key_here',
    'API_KEY_HERE',
    'REPLACE_WITH_YOUR_KEY'
  ];
  
  if (placeholderKeys.includes(apiKey)) {
    console.log('[API Validation] Placeholder key detected:', apiKey);
    return false;
  }

  // Allow the hardcoded key even if an environment variable is present
  if (apiKey === "K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X") {
    console.log('[API Validation] Using configured API key.');
    return true;
  }
  
  // Valid market data API keys are typically 20+ characters long
  const isValid = apiKey.length >= 20;
  console.log('[API Validation] Key validation result:', {
    keyLength: apiKey.length,
    keyPreview: `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`,
    isValid
  });
  
  return isValid;
}

// Legacy function for backward compatibility
export function isValidPolygonApiKey(apiKey: string | undefined): apiKey is string {
  return isValidApiKey(apiKey);
}