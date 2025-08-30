// API Configuration
export const API_CONFIG = {
  POLYGON_API_KEY: 'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X',
  POLYGON_BASE_URL: 'https://api.polygon.io',
  POLYGON_WS_URL: 'wss://socket.polygon.io',
} as const;

// Validation function
export function validatePolygonApiKey(apiKey: string): boolean {
  return Boolean(apiKey && apiKey.length === 32 && /^[A-Za-z0-9_]+$/.test(apiKey));
}

// Helper to get API key with validation
export function getPolygonApiKey(): string {
  const apiKey = API_CONFIG.POLYGON_API_KEY;
  if (!validatePolygonApiKey(apiKey)) {
    throw new Error('Invalid Polygon API key configuration');
  }
  return apiKey;
}
