import { Authenticator } from "remix-auth";
import { GoogleStrategy } from "remix-auth-google";
import { OAuth2Strategy } from "remix-auth-oauth2";
import { userSessionStorage } from "./user-session.server";
import { db } from "./db.server";
import type { AuthProvider } from "@prisma/client";

// Define the user type returned from user authentication
export interface UserAuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  provider: AuthProvider;
  providerId: string;
  role: 'USER'; // Always USER for general users
  emailVerified: boolean;
}

// Create an instance of the authenticator for users
export const userAuthenticator = new Authenticator<UserAuthenticatedUser>(userSessionStorage);

// Helper function to find or create user for general users (role='USER')
async function findOrCreateUserForUser(
  provider: AuthProvider,
  profile: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  },
  accessToken?: string,
  refreshToken?: string,
  expiresAt?: Date
): Promise<UserAuthenticatedUser> {
  // First, check if OAuth account already exists
  const existingOAuth = await db.userOAuth.findUnique({
    where: {
      provider_providerUserId: {
        provider,
        providerUserId: profile.id,
      },
    },
    include: { user: true },
  });

  if (existingOAuth) {
    // OAuth account exists, update tokens and last login
    await db.userOAuth.update({
      where: { id: existingOAuth.id },
      data: {
        accessToken,
        refreshToken,
        expiresAt,
        email: profile.email,
        name: profile.name,
        profileImage: profile.avatar,
        updatedAt: new Date(),
      },
    });

    await db.user.update({
      where: { id: existingOAuth.userId },
      data: { lastLoginAt: new Date() },
    });

    return {
      id: existingOAuth.user.id,
      email: existingOAuth.user.email,
      name: existingOAuth.user.name,
      avatarUrl: existingOAuth.user.avatarUrl,
      provider,
      providerId: profile.id,
      role: 'USER',
      emailVerified: existingOAuth.user.emailVerified,
    };
  }

  // Check if user with same email exists (account linking)
  const existingUser = await db.user.findUnique({
    where: { email: profile.email },
    include: { oauthAccounts: true },
  });

  if (existingUser) {
    // User exists with same email - link accounts
    const linkedOAuth = await db.userOAuth.create({
      data: {
        userId: existingUser.id,
        provider,
        providerUserId: profile.id,
        email: profile.email,
        emailVerified: true,
        name: profile.name,
        profileImage: profile.avatar,
        accessToken,
        refreshToken,
        expiresAt,
        profileRaw: profile,
      },
    });

    // Log account linking for audit
    await db.adminAuditLog.create({
      data: {
        actorId: existingUser.id,
        action: "USER_ACCOUNT_LINKED",
        targetType: "UserOAuth",
        targetId: linkedOAuth.id,
        metadata: {
          provider,
          email: profile.email,
          linkedToUserId: existingUser.id,
          userType: "general_user",
        },
      },
    });

    // Update user profile if missing info
    const updateData: any = { lastLoginAt: new Date() };
    if (!existingUser.name && profile.name) updateData.name = profile.name;
    if (!existingUser.avatarUrl && profile.avatar) updateData.avatarUrl = profile.avatar;
    
    await db.user.update({
      where: { id: existingUser.id },
      data: updateData,
    });

    return {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name || profile.name || null,
      avatarUrl: existingUser.avatarUrl || profile.avatar || null,
      provider,
      providerId: profile.id,
      role: 'USER',
      emailVerified: existingUser.emailVerified,
    };
  }

  // Create new user and OAuth account (always role='USER')
  const newUser = await db.user.create({
    data: {
      email: profile.email,
      name: profile.name || null,
      avatarUrl: profile.avatar || null,
      emailVerified: true,
      role: 'USER', // Fixed role for general users
      lastLoginAt: new Date(),
      oauthAccounts: {
        create: {
          provider,
          providerUserId: profile.id,
          email: profile.email,
          emailVerified: true,
          name: profile.name,
          profileImage: profile.avatar,
          accessToken,
          refreshToken,
          expiresAt,
          profileRaw: profile,
        },
      },
    },
    include: { oauthAccounts: true },
  });

  // Log user creation for audit
  await db.adminAuditLog.create({
    data: {
      actorId: newUser.id,
      action: "USER_REGISTER",
      targetType: "User",
      targetId: newUser.id,
      metadata: {
        provider,
        email: profile.email,
        userType: "general_user",
        role: "USER",
      },
    },
  });

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    avatarUrl: newUser.avatarUrl,
    provider,
    providerId: profile.id,
    role: 'USER',
    emailVerified: newUser.emailVerified,
  };
}

// Google Strategy for Users
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  userAuthenticator.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.APP_URL}/auth/user/google/callback`,
      },
      async ({ accessToken, refreshToken, extraParams, profile }) => {
        // Calculate token expiry (Google tokens typically expire in 1 hour)
        const expiresAt = extraParams.expires_in 
          ? new Date(Date.now() + extraParams.expires_in * 1000)
          : undefined;

        return findOrCreateUserForUser(
          "GOOGLE",
          {
            id: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            avatar: profile.photos[0]?.value,
          },
          accessToken,
          refreshToken,
          expiresAt
        );
      }
    ),
    "google"
  );
}

// Kakao Strategy for Users
if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET) {
  userAuthenticator.use(
    new OAuth2Strategy(
      {
        authorizationURL: "https://kauth.kakao.com/oauth/authorize",
        tokenURL: "https://kauth.kakao.com/oauth/token",
        clientID: process.env.KAKAO_CLIENT_ID,
        clientSecret: process.env.KAKAO_CLIENT_SECRET,
        callbackURL: `${process.env.APP_URL}/auth/user/kakao/callback`,
      },
      async ({ accessToken, refreshToken, extraParams }) => {
        // Get user info from Kakao
        const response = await fetch("https://kapi.kakao.com/v2/user/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const profile = await response.json();
        
        // Calculate token expiry (Kakao tokens typically expire in 6 hours)
        const expiresAt = extraParams?.expires_in 
          ? new Date(Date.now() + extraParams.expires_in * 1000)
          : undefined;

        return findOrCreateUserForUser(
          "KAKAO",
          {
            id: String(profile.id),
            email: profile.kakao_account?.email || `kakao_${profile.id}@kakao.com`,
            name: profile.kakao_account?.profile?.nickname,
            avatar: profile.kakao_account?.profile?.profile_image_url,
          },
          accessToken,
          refreshToken,
          expiresAt
        );
      }
    ),
    "kakao"
  );
}

// Naver Strategy for Users
if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
  userAuthenticator.use(
    new OAuth2Strategy(
      {
        authorizationURL: "https://nid.naver.com/oauth2.0/authorize",
        tokenURL: "https://nid.naver.com/oauth2.0/token",
        clientID: process.env.NAVER_CLIENT_ID,
        clientSecret: process.env.NAVER_CLIENT_SECRET,
        callbackURL: `${process.env.APP_URL}/auth/user/naver/callback`,
      },
      async ({ accessToken, refreshToken, extraParams }) => {
        // Get user info from Naver
        const response = await fetch("https://openapi.naver.com/v1/nid/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await response.json();
        const profile = data.response;
        
        // Calculate token expiry (Naver tokens typically expire in 1 hour)
        const expiresAt = extraParams?.expires_in 
          ? new Date(Date.now() + extraParams.expires_in * 1000)
          : undefined;

        return findOrCreateUserForUser(
          "NAVER",
          {
            id: profile.id,
            email: profile.email || `naver_${profile.id}@naver.com`,
            name: profile.name || profile.nickname,
            avatar: profile.profile_image,
          },
          accessToken,
          refreshToken,
          expiresAt
        );
      }
    ),
    "naver"
  );
}

// User authentication helper functions

/**
 * Require user login with next parameter preservation
 * 함정 주의: __admin_session 혼용 절대 금지
 */
export async function requireUser(request: Request): Promise<UserAuthenticatedUser> {
  const user = await userAuthenticator.isAuthenticated(request);
  
  if (!user || user.role !== 'USER') {
    // Get current path for redirect after login with next parameter preservation
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;
    
    throw await userAuthenticator.logout(request, { 
      redirectTo: `/login?next=${encodeURIComponent(redirectTo)}` 
    });
  }
  
  return user;
}

/**
 * Legacy alias for requireUser - maintaining backward compatibility
 */
export async function requireUserLogin(request: Request): Promise<UserAuthenticatedUser> {
  return requireUser(request);
}

/**
 * Get optional user login - returns null if not authenticated
 */
export async function getOptionalUser(request: Request): Promise<UserAuthenticatedUser | null> {
  try {
    const user = await userAuthenticator.isAuthenticated(request);
    return (user && user.role === 'USER') ? user : null;
  } catch {
    return null;
  }
}

/**
 * Legacy alias for getOptionalUser
 */
export async function getOptionalUserLogin(request: Request): Promise<UserAuthenticatedUser | null> {
  return getOptionalUser(request);
}

/**
 * Require user with completed profile and terms consent
 * Redirects to /onboard if profile/terms incomplete
 */
export async function requireUserProfile(request: Request): Promise<UserAuthenticatedUser & { hasProfile: boolean }> {
  const user = await requireUser(request);
  
  const CURRENT_TERMS_VERSION = "2025-08-24";
  
  // Check if user has completed profile setup
  const profile = await db.userProfile.findUnique({
    where: { userId: user.id },
  });
  
  // Check if user has agreed to latest terms
  const latestTerms = await db.termsConsent.findFirst({
    where: { 
      userId: user.id,
      revokedAt: null,
      version: CURRENT_TERMS_VERSION,
    },
  });
  
  // Redirect to onboarding if profile incomplete or terms not agreed
  if (!profile || !latestTerms) {
    const url = new URL(request.url);
    const currentPath = url.pathname + url.search;
    
    throw new Response(null, {
      status: 302,
      headers: {
        "Location": `/onboard?next=${encodeURIComponent(currentPath)}`,
      },
    });
  }
  
  return {
    ...user,
    hasProfile: true,
  };
}

/**
 * Require user with role-based access control
 * 401/403 구분: 미로그인은 302(/login), 권한부족은 403 JSON
 */
export async function requireUserRole(request: Request, requiredRole: 'USER' = 'USER'): Promise<UserAuthenticatedUser> {
  try {
    const user = await requireUser(request);
    
    // For general users, only 'USER' role is supported
    if (requiredRole !== 'USER') {
      throw new Response(
        JSON.stringify({ 
          error: "권한이 부족합니다.", 
          code: "INSUFFICIENT_PERMISSIONS",
          requiredRole,
          userRole: user.role
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    return user;
  } catch (error) {
    // If it's already a Response (redirect), re-throw it
    if (error instanceof Response) {
      throw error;
    }
    
    // For other errors, redirect to login (401 -> 302)
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;
    
    throw new Response(null, {
      status: 302,
      headers: {
        "Location": `/login?next=${encodeURIComponent(redirectTo)}`,
      },
    });
  }
}

// Log user actions for audit trail
export async function logUserAction(
  user: UserAuthenticatedUser,
  action: string,
  target?: { type: string; id: string },
  metadata?: any,
  request?: Request
) {
  await db.adminAuditLog.create({
    data: {
      actorId: user.id,
      action: `USER_${action}`,
      targetType: target?.type,
      targetId: target?.id,
      metadata: {
        ...metadata,
        userType: "general_user",
        provider: user.provider,
      },
      ipAddress: request?.headers.get("x-forwarded-for") || undefined,
      userAgent: request?.headers.get("user-agent") || undefined,
    },
  });
}