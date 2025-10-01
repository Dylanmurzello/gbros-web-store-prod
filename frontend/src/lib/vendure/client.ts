import { GraphQLClient } from 'graphql-request';
import authManager from './auth-manager';
import { logger } from '../logger'; // PERFORMANCE FIX: 2025-09-30 - Bye bye console spam 👋
import { rateLimiter } from '../rate-limiter'; // ARCHITECTURE FIX: 2025-09-30 - Rate limiting to prevent API abuse 🚫

// PERFORMANCE FIX: 2025-09-30 - Query caching to prevent repeated network requests 🚀
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL (reasonable for product data)

  // Generate cache key from query + variables
  private getCacheKey(query: string, variables?: Record<string, unknown>): string {
    return JSON.stringify({ query, variables });
  }

  // Get cached data if still valid
  get<T>(query: string, variables?: Record<string, unknown>): T | null {
    const key = this.getCacheKey(query, variables);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired, yeet it into the void 💀
      this.cache.delete(key);
      return null;
    }
    
    logger.debug('Cache HIT', 'QueryCache', { query: query.substring(0, 50) });
    return entry.data;
  }

  // Set cache entry with optional TTL
  set<T>(query: string, data: T, variables?: Record<string, unknown>, ttl?: number): void {
    const key = this.getCacheKey(query, variables);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
    logger.debug('Cache SET', 'QueryCache', { query: query.substring(0, 50) });
  }

  // Clear all cache (call this after mutations that change data)
  clear(): void {
    this.cache.clear();
    logger.debug('Cache CLEARED', 'QueryCache');
  }

  // Clear cache entries matching a pattern (for targeted invalidation)
  clearPattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    let cleared = 0;
    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        cleared++;
      }
    }
    logger.debug(`Cache CLEARED ${cleared} entries matching pattern`, 'QueryCache', { pattern });
  }
}

const queryCache = new QueryCache();

// Get the API URL - handle both absolute and relative URLs
const getApiUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_VENDURE_API_URL || '/shop-api';

  // If it's already an absolute URL, use it as-is
  if (configuredUrl.startsWith('http://') || configuredUrl.startsWith('https://')) {
    return configuredUrl;
  }

  // For relative URLs, construct the full URL
  // In the browser, use window.location.origin
  // In SSR/Node.js, fallback to localhost
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${configuredUrl}`;
  } else {
    // During SSR, use localhost as fallback
    return `http://localhost:3000${configuredUrl}`;
  }
};

// Type-safe fetch function for GraphQL requests
type CustomFetchType = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

// Custom fetch wrapper to handle auth token
const customFetch: CustomFetchType = async (url, options) => {
  // ARCHITECTURE FIX: 2025-09-30 - Rate limit check before making request
  const urlPath = typeof url === 'string' ? new URL(url, 'http://localhost').pathname : url.toString();
  if (!rateLimiter.checkLimit(urlPath, { maxRequests: 100, windowMs: 60 * 1000 })) {
    throw new Error('Rate limit exceeded - slow down bestie 🚫');
  }
  
  // Add auth token to headers if available
  const token = authManager.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Copy existing headers if any
  if (options?.headers) {
    const existingHeaders = options.headers as Record<string, string>;
    Object.assign(headers, existingHeaders);
  }

  if (token) {
    headers['authorization'] = `Bearer ${token}`;
    logger.debug('Adding Bearer token to request headers', 'customFetch');
  } else {
    logger.debug('No auth token available for request', 'customFetch');
  }

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Always include cookies
  });

  // Extract auth token from response if present
  authManager.extractTokenFromResponse(response);

  return response;
};

// PERFORMANCE FIX: 2025-09-30 - Cache client instance instead of recreating every time 💪
// Create a function to get the GraphQL client
let clientInstance: GraphQLClient | null = null;
let cachedUrl: string | null = null;

const getGraphQLClient = () => {
  const url = getApiUrl();
  
  // Only recreate client if URL changed (handles dynamic environments)
  if (!clientInstance || cachedUrl !== url) {
    logger.debug('Creating new GraphQL client', 'GraphQLClient', { url });
    clientInstance = new GraphQLClient(url, {
      fetch: customFetch as typeof fetch,
    });
    cachedUrl = url;
  }
  
  return clientInstance;
};

// Export a proxy that always uses the current client
export const graphqlClient = new Proxy({} as GraphQLClient, {
  get(_target, prop) {
    const client = getGraphQLClient();
    return Reflect.get(client, prop, client);
  }
});

// Types for GraphQL response
interface GraphQLResponse<T = unknown> {
  data: T;
  headers: Headers;
}

// Helper function that uses rawRequest to capture response headers
// PERFORMANCE FIX: 2025-09-30 - Added query caching for read operations 📦
export async function requestWithAuth<T = unknown>(
  query: string, 
  variables?: Record<string, unknown>,
  options?: { skipCache?: boolean; cacheTTL?: number }
): Promise<T> {
  const { skipCache = false, cacheTTL } = options || {};
  
  // Check if this is a mutation (mutations shouldn't be cached)
  const isMutation = query.trim().toLowerCase().startsWith('mutation');
  
  // Try to get from cache for queries (not mutations)
  if (!isMutation && !skipCache) {
    const cached = queryCache.get<T>(query, variables);
    if (cached) {
      return cached;
    }
  }
  
  const client = getGraphQLClient();
  const response = await (client as GraphQLClient & {
    rawRequest: (query: string, variables?: Record<string, unknown>) => Promise<GraphQLResponse<T>>;
  }).rawRequest(query, variables);
  const { data, headers } = response;

  // Extract and save the auth token if present
  const authToken = headers.get('vendure-auth-token');
  if (authToken) {
    logger.debug('Found vendure-auth-token in response headers', 'requestWithAuth');
    authManager.setToken(authToken);
  } else {
    logger.debug('No vendure-auth-token in response headers', 'requestWithAuth');
  }
  
  // Cache the result if it's a query (not a mutation)
  if (!isMutation) {
    queryCache.set(query, data, variables, cacheTTL);
  } else {
    // If it was a mutation, clear cache to ensure fresh data on next query
    logger.debug('Mutation executed, clearing query cache', 'requestWithAuth');
    queryCache.clear();
  }

  return data as T;
}

// Export cache control for manual invalidation if needed
export const clearQueryCache = () => queryCache.clear();
export const clearQueryCachePattern = (pattern: string) => queryCache.clearPattern(pattern);

export { authManager };
export default graphqlClient;