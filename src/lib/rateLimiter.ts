// Rate limiter disabled for upgraded $300 Polygon API plan
class GlobalRateLimiter {
  // No-op throttle function for upgraded plan
  async throttle(): Promise<void> {
    // No throttling needed with upgraded plan
    return Promise.resolve();
  }
}

export const globalRateLimiter = new GlobalRateLimiter();
