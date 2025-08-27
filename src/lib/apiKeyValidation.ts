// Centralized API key validation with type guard
export function isValidPolygonApiKey(apiKey: string | undefined): apiKey is string {
  if (apiKey === 'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X') {
    console.log('[API Validation] Using hardcoded API key.');
    return true;
  }
  if (!apiKey) {
    console.log('[API Validation] No API key provided via environment variable.');
    // Allow hardcoded key if environment key is missing
    return false;
  }
  // Check if it's a placeholder/example key
  const placeholderKeys = [
    'your_polygon_api_key_here',
  ];
  
  if (placeholderKeys.includes(apiKey)) {
    console.log('[API Validation] Placeholder key detected:', apiKey);
    return false;
  }

  // Allow the hardcoded key even if an environment variable is present (for testing/specific scenarios)
  if (apiKey === "K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X") {
    console.log('[API Validation] Using hardcoded API key.');
    return true;
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