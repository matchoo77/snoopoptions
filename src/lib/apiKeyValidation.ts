// Centralized API key validation with type guard
export function isValidPolygonApiKey(apiKey: string | undefined): apiKey is string {
  if (!apiKey) {
    console.log('[API Validation] No API key provided');
    return false;
  }
  
  // Check if it's a placeholder/example key
  const placeholderKeys = [
    'your_polygon_api_key_here',
    'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X', // Example key from .env.example
  ];
  
  if (placeholderKeys.includes(apiKey)) {
    console.log('[API Validation] Placeholder key detected:', apiKey);
    return false;
  }
  
  // Valid Polygon API keys are typically 20+ characters long
  const isValid = apiKey.length >= 20;
  console.log('[API Validation] Key validation result:', {
    keyLength: apiKey.length,
    keyPreview: `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`,
    isValid
  });
  
  return isValid;
}