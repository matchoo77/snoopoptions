// Centralized API key validation
export function isValidPolygonApiKey(apiKey: string | undefined): boolean {
  if (!apiKey) return false;
  
  // Check if it's a placeholder/example key
  const placeholderKeys = [
    'your_polygon_api_key_here',
    'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X', // Example key from .env.example
  ];
  
  if (placeholderKeys.includes(apiKey)) return false;
  
  // Valid Polygon API keys are typically 32 characters long
  return apiKey.length >= 20;
}