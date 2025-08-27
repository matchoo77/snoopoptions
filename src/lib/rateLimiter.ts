// Global rate limiter for Polygon API to prevent 429 errors
class GlobalRateLimiter {
  private lastRequestTime = 0;
  private minInterval = 1200; // 1.2 seconds between any API calls
  private requestQueue: Promise<void> = Promise.resolve();

  async throttle(): Promise<void> {
    return new Promise((resolve) => {
      this.requestQueue = this.requestQueue.then(async () => {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minInterval) {
          const delay = this.minInterval - timeSinceLastRequest;
          console.log(`[RateLimiter] Waiting ${delay}ms before next request`);
          await new Promise(r => setTimeout(r, delay));
        }
        
        this.lastRequestTime = Date.now();
        resolve();
      });
    });
  }
}

export const globalRateLimiter = new GlobalRateLimiter();
