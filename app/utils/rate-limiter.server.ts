import { LRUCache } from "lru-cache";
import { getClientIP } from "./session-security.server";
import { SECURITY_CONFIG } from "./admin-config.server";

// Rate limiter store using LRU cache
const rateLimitStore = new LRUCache<string, number[]>({
  max: 10000, // Maximum number of items
  ttl: SECURITY_CONFIG.RATE_LIMIT_WINDOW, // Time to live in ms
});

const loginRateLimitStore = new LRUCache<string, number[]>({
  max: 1000,
  ttl: SECURITY_CONFIG.RATE_LIMIT_WINDOW * 2, // Longer window for login attempts
});

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

/**
 * Check general rate limit
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = SECURITY_CONFIG.RATE_LIMIT_WINDOW
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Get existing requests for this identifier
  const requests = rateLimitStore.get(identifier) || [];
  
  // Filter out requests outside the window
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  
  // Check if limit exceeded
  if (recentRequests.length >= maxRequests) {
    const oldestRequest = Math.min(...recentRequests);
    const resetAt = new Date(oldestRequest + windowMs);
    const retryAfter = Math.ceil((resetAt.getTime() - now) / 1000);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter,
    };
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitStore.set(identifier, recentRequests);
  
  return {
    allowed: true,
    remaining: maxRequests - recentRequests.length,
    resetAt: new Date(now + windowMs),
  };
}

/**
 * Check login rate limit (stricter)
 */
export function checkLoginRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const windowMs = SECURITY_CONFIG.RATE_LIMIT_WINDOW * 2; // Longer window for login
  const windowStart = now - windowMs;
  
  // Get existing attempts
  const attempts = loginRateLimitStore.get(identifier) || [];
  
  // Filter out attempts outside the window
  const recentAttempts = attempts.filter(timestamp => timestamp > windowStart);
  
  // Check if limit exceeded
  if (recentAttempts.length >= SECURITY_CONFIG.RATE_LIMIT_LOGIN_MAX) {
    const oldestAttempt = Math.min(...recentAttempts);
    const resetAt = new Date(oldestAttempt + windowMs);
    const retryAfter = Math.ceil((resetAt.getTime() - now) / 1000);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter,
    };
  }
  
  // Add current attempt
  recentAttempts.push(now);
  loginRateLimitStore.set(identifier, recentAttempts);
  
  return {
    allowed: true,
    remaining: SECURITY_CONFIG.RATE_LIMIT_LOGIN_MAX - recentAttempts.length,
    resetAt: new Date(now + windowMs),
  };
}

/**
 * Rate limit middleware for requests
 */
export async function rateLimitMiddleware(
  request: Request,
  userId?: string
): Promise<RateLimitResult> {
  // Use IP address as identifier, with user ID as backup
  const ip = getClientIP(request) || "unknown";
  const identifier = userId ? `user:${userId}` : `ip:${ip}`;
  
  // Check if this is a login attempt
  const url = new URL(request.url);
  const isLogin = url.pathname.includes("/login") || url.pathname.includes("/auth");
  
  if (isLogin) {
    return checkLoginRateLimit(identifier);
  }
  
  return checkRateLimit(identifier);
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const headers = new Headers({
    "X-RateLimit-Limit": SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetAt.toISOString(),
  });
  
  if (result.retryAfter) {
    headers.set("Retry-After", result.retryAfter.toString());
  }
  
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: result.retryAfter,
      resetAt: result.resetAt.toISOString(),
    }),
    {
      status: 429,
      headers,
    }
  );
}

/**
 * Reset rate limit for an identifier (e.g., after successful login)
 */
export function resetRateLimit(identifier: string, isLogin: boolean = false) {
  if (isLogin) {
    loginRateLimitStore.delete(identifier);
  } else {
    rateLimitStore.delete(identifier);
  }
}