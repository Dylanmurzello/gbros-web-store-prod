// ARCHITECTURE FIX: 2025-09-30 - Rate limiting to prevent API abuse and DDoS 🛡️
// Client-side rate limiter using token bucket algorithm

import { logger } from './logger';

interface RateLimitConfig {
  maxRequests: number;  // Max requests allowed
  windowMs: number;     // Time window in milliseconds
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  // Default: 60 requests per minute per endpoint
  private defaultConfig: RateLimitConfig = {
    maxRequests: 60,
    windowMs: 60 * 1000,
  };

  /**
   * Check if request is allowed based on rate limit
   * Returns true if allowed, false if rate limited
   */
  checkLimit(key: string, config?: Partial<RateLimitConfig>): boolean {
    const { maxRequests, windowMs } = { ...this.defaultConfig, ...config };
    
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this key
    let timestamps = this.requests.get(key) || [];
    
    // Remove timestamps outside current window (cleanup old data)
    timestamps = timestamps.filter(time => time > windowStart);
    
    // Check if under limit
    if (timestamps.length >= maxRequests) {
      logger.warn(`Rate limit exceeded for key: ${key}`, 'RateLimiter', {
        current: timestamps.length,
        max: maxRequests,
      });
      return false;
    }
    
    // Add current request timestamp
    timestamps.push(now);
    this.requests.set(key, timestamps);
    
    logger.debug(`Rate limit check passed`, 'RateLimiter', {
      key,
      count: timestamps.length,
      max: maxRequests,
    });
    
    return true;
  }

  /**
   * Wait until rate limit allows request (with exponential backoff)
   * Throws error if max retries exceeded
   */
  async waitForLimit(
    key: string, 
    config?: Partial<RateLimitConfig>,
    maxRetries = 3
  ): Promise<void> {
    let retries = 0;
    let delay = 1000; // Start with 1 second
    
    while (!this.checkLimit(key, config)) {
      if (retries >= maxRetries) {
        throw new Error(`Rate limit exceeded for ${key} after ${maxRetries} retries - slow down bestie 🚫`);
      }
      
      logger.warn(`Rate limited, waiting ${delay}ms before retry`, 'RateLimiter', { key, retry: retries + 1 });
      
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
      retries++;
    }
  }

  /**
   * Clear rate limit data for a specific key
   */
  clear(key: string): void {
    this.requests.delete(key);
    logger.debug(`Cleared rate limit data for key: ${key}`, 'RateLimiter');
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.requests.clear();
    logger.debug('Cleared all rate limit data', 'RateLimiter');
  }

  /**
   * Get current request count for a key
   */
  getCount(key: string, config?: Partial<RateLimitConfig>): number {
    const { windowMs } = { ...this.defaultConfig, ...config };
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const timestamps = this.requests.get(key) || [];
    return timestamps.filter(time => time > windowStart).length;
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Convenience wrapper for fetch with rate limiting
export async function rateLimitedFetch(
  url: string,
  options?: RequestInit,
  rateLimitKey?: string
): Promise<Response> {
  const key = rateLimitKey || new URL(url).pathname;
  
  // Wait for rate limit to allow request
  await rateLimiter.waitForLimit(key, {
    maxRequests: 30,  // 30 requests per minute per endpoint
    windowMs: 60 * 1000,
  });
  
  return fetch(url, options);
}

export default rateLimiter;
