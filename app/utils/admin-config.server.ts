/**
 * Admin configuration and domain whitelist management
 */

// Admin domain whitelist (only these domains can have admin users)
const ADMIN_DOMAIN_WHITELIST = process.env.ADMIN_DOMAIN_WHITELIST?.split(",") || [];

// Individual email whitelist (specific emails that can be admin)
const ADMIN_EMAIL_WHITELIST = process.env.ADMIN_EMAIL_WHITELIST?.split(",") || [];

// Operator domain whitelist
const OPERATOR_DOMAIN_WHITELIST = process.env.OPERATOR_DOMAIN_WHITELIST?.split(",") || [];

// Operator email whitelist
const OPERATOR_EMAIL_WHITELIST = process.env.OPERATOR_EMAIL_WHITELIST?.split(",") || [];

/**
 * Check if an email is allowed to be an admin
 */
export function isAdminEmail(email: string): boolean {
  // Check explicit email whitelist first
  if (ADMIN_EMAIL_WHITELIST.includes(email)) {
    return true;
  }

  // Check domain whitelist
  const domain = email.split("@")[1];
  if (domain && ADMIN_DOMAIN_WHITELIST.includes(domain)) {
    return true;
  }

  return false;
}

/**
 * Check if an email is allowed to be an operator
 */
export function isOperatorEmail(email: string): boolean {
  // Admins can also be operators
  if (isAdminEmail(email)) {
    return true;
  }

  // Check explicit email whitelist
  if (OPERATOR_EMAIL_WHITELIST.includes(email)) {
    return true;
  }

  // Check domain whitelist
  const domain = email.split("@")[1];
  if (domain && OPERATOR_DOMAIN_WHITELIST.includes(domain)) {
    return true;
  }

  return false;
}

/**
 * Get the appropriate role for a user based on their email
 */
export function getUserRoleFromEmail(email: string, isFirstUser: boolean): "ADMIN" | "OPERATOR" | "VIEWER" {
  // First user becomes admin if configured
  if (isFirstUser && process.env.AUTO_ADMIN_FIRST_USER === "true") {
    return "ADMIN";
  }

  // Check admin permissions
  if (isAdminEmail(email)) {
    return "ADMIN";
  }

  // Check operator permissions
  if (isOperatorEmail(email)) {
    return "OPERATOR";
  }

  // Default to viewer
  return "VIEWER";
}

/**
 * Security configuration
 */
export const SECURITY_CONFIG = {
  // Session settings
  SESSION_MAX_AGE: parseInt(process.env.SESSION_MAX_AGE || "86400"), // 24 hours in seconds
  SESSION_RENEWAL_THRESHOLD: 0.5, // Renew session when 50% of max age passed
  
  // Rate limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || "900000"), // 15 minutes in ms
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  RATE_LIMIT_LOGIN_MAX: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || "5"),
  
  // Account security
  MAX_OAUTH_ACCOUNTS_PER_USER: 5,
  REQUIRE_EMAIL_VERIFICATION: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
  
  // IP restrictions
  ADMIN_IP_WHITELIST: process.env.ADMIN_IP_WHITELIST?.split(",") || [],
  BLOCK_TOR_EXIT_NODES: process.env.BLOCK_TOR_EXIT_NODES === "true",
};