import { createHash } from "crypto";
import { db } from "./db.server";
import type { User } from "@prisma/client";
import { SECURITY_CONFIG } from "./admin-config.server";

/**
 * Create a fingerprint from IP and User Agent
 */
export function createFingerprint(ip: string | null, userAgent: string | null): string {
  const data = `${ip || "unknown"}:${userAgent || "unknown"}`;
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Extract client IP from request headers
 */
export function getClientIP(request: Request): string | null {
  // Check various headers for the real IP
  const headers = request.headers;
  
  // Common proxy headers
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP from the list
    return forwardedFor.split(",")[0].trim();
  }
  
  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  
  // Cloudflare
  const cfIP = headers.get("cf-connecting-ip");
  if (cfIP) {
    return cfIP;
  }
  
  // Fallback to remote address (usually not available in serverless)
  return headers.get("x-remote-addr") || null;
}

/**
 * Validate session security
 */
export async function validateSessionSecurity(
  request: Request,
  userId: string,
  sessionId?: string
): Promise<{ valid: boolean; reason?: string }> {
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent");
  const fingerprint = createFingerprint(ip, userAgent);
  
  // Check IP whitelist for admins
  const user = await db.user.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    return { valid: false, reason: "User not found" };
  }
  
  // If admin and IP whitelist is configured, check it
  if (user.role === "ADMIN" && SECURITY_CONFIG.ADMIN_IP_WHITELIST.length > 0) {
    if (!ip || !SECURITY_CONFIG.ADMIN_IP_WHITELIST.includes(ip)) {
      await logSecurityEvent(userId, "IP_WHITELIST_VIOLATION", { ip, userAgent });
      return { valid: false, reason: "IP not whitelisted for admin access" };
    }
  }
  
  // Store session fingerprint for future validation
  if (sessionId) {
    await db.userSession.updateMany({
      where: { 
        id: sessionId,
        userId,
      },
      data: {
        // Store fingerprint in metadata (we'll need to add this field)
        // For now, just validate that the session exists
      },
    });
  }
  
  return { valid: true };
}

/**
 * Log security events
 */
export async function logSecurityEvent(
  userId: string,
  event: string,
  metadata?: any
) {
  try {
    await db.adminAuditLog.create({
      data: {
        actorId: userId,
        action: `SECURITY_${event}`,
        targetType: "User",
        targetId: userId,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}

/**
 * Check for suspicious activity patterns
 */
export async function checkSuspiciousActivity(
  userId: string,
  ip: string | null
): Promise<boolean> {
  // Check recent failed login attempts
  const recentFailures = await db.adminAuditLog.count({
    where: {
      actorId: userId,
      action: "LOGIN_FAILED",
      createdAt: {
        gte: new Date(Date.now() - SECURITY_CONFIG.RATE_LIMIT_WINDOW),
      },
    },
  });
  
  if (recentFailures >= SECURITY_CONFIG.RATE_LIMIT_LOGIN_MAX) {
    await logSecurityEvent(userId, "RATE_LIMIT_EXCEEDED", { ip, failures: recentFailures });
    return true;
  }
  
  // Check for rapid location changes (if we had geolocation data)
  // This would require an IP geolocation service
  
  return false;
}

/**
 * Session renewal check
 */
export function shouldRenewSession(sessionCreatedAt: Date): boolean {
  const now = Date.now();
  const sessionAge = now - sessionCreatedAt.getTime();
  const maxAge = SECURITY_CONFIG.SESSION_MAX_AGE * 1000; // Convert to ms
  const renewalThreshold = maxAge * SECURITY_CONFIG.SESSION_RENEWAL_THRESHOLD;
  
  return sessionAge > renewalThreshold;
}