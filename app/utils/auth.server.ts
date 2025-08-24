import { Authenticator } from "remix-auth";
import { GoogleStrategy } from "remix-auth-google";
import { OAuth2Strategy } from "remix-auth-oauth2";
import { sessionStorage } from "./session.server";
import { db } from "./db.server";
import type { User, Role, AuthProvider } from "@prisma/client";
import { getUserRoleFromEmail, isAdminEmail, SECURITY_CONFIG } from "./admin-config.server";

// Define the user type returned from authentication
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  provider: AuthProvider;
  providerId: string;
  role: Role;
}

// Create an instance of the authenticator
export const authenticator = new Authenticator<AuthUser>(sessionStorage);

// Helper function to find or create user with account linking
async function findOrCreateUser(
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
): Promise<AuthUser> {
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
      role: existingOAuth.user.role,
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

    // Log account linking
    await db.adminAuditLog.create({
      data: {
        actorId: existingUser.id,
        action: "ACCOUNT_LINKED",
        targetType: "UserOAuth",
        targetId: linkedOAuth.id,
        metadata: {
          provider,
          email: profile.email,
          linkedToUserId: existingUser.id,
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
      role: existingUser.role,
    };
  }

  // Create new user and OAuth account
  const userCount = await db.user.count();
  const isFirstUser = userCount === 0;

  const newUser = await db.user.create({
    data: {
      email: profile.email,
      name: profile.name || null,
      avatarUrl: profile.avatar || null,
      emailVerified: true,
      role: getUserRoleFromEmail(profile.email, isFirstUser),
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

  // Log user creation
  await db.adminAuditLog.create({
    data: {
      actorId: newUser.id,
      action: "USER_REGISTER",
      targetType: "User",
      targetId: newUser.id,
      metadata: {
        provider,
        email: profile.email,
        isFirstUser,
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
    role: newUser.role,
  };
}

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  authenticator.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.APP_URL}/auth/google/callback`,
      },
      async ({ accessToken, refreshToken, extraParams, profile }) => {
        // Calculate token expiry (Google tokens typically expire in 1 hour)
        const expiresAt = extraParams.expires_in 
          ? new Date(Date.now() + extraParams.expires_in * 1000)
          : undefined;

        return findOrCreateUser(
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

// Kakao Strategy
if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET) {
  authenticator.use(
    new OAuth2Strategy(
      {
        authorizationURL: "https://kauth.kakao.com/oauth/authorize",
        tokenURL: "https://kauth.kakao.com/oauth/token",
        clientID: process.env.KAKAO_CLIENT_ID,
        clientSecret: process.env.KAKAO_CLIENT_SECRET,
        callbackURL: `${process.env.APP_URL}/auth/kakao/callback`,
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

        return findOrCreateUser(
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

// Naver Strategy
if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
  authenticator.use(
    new OAuth2Strategy(
      {
        authorizationURL: "https://nid.naver.com/oauth2.0/authorize",
        tokenURL: "https://nid.naver.com/oauth2.0/token",
        clientID: process.env.NAVER_CLIENT_ID,
        clientSecret: process.env.NAVER_CLIENT_SECRET,
        callbackURL: `${process.env.APP_URL}/auth/naver/callback`,
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

        return findOrCreateUser(
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

// Auth helper functions
export async function requireUser(request: Request): Promise<AuthUser> {
  // Try OAuth authentication first
  let user = await authenticator.isAuthenticated(request);
  
  // Fallback to session-based auth for dev
  if (!user && process.env.NODE_ENV === "development") {
    const session = await sessionStorage.getSession(request.headers.get("Cookie"));
    const sessionUser = session.get("user");
    if (sessionUser) {
      user = sessionUser;
    }
  }
  
  if (!user) {
    throw await authenticator.logout(request, { redirectTo: "/admin/login" });
  }
  return user;
}

export async function requireAdmin(request: Request): Promise<AuthUser> {
  const user = await requireUser(request);
  if (user.role !== "ADMIN") {
    throw new Response("Forbidden", { status: 403 });
  }
  return user;
}

export async function requireOperator(request: Request): Promise<AuthUser> {
  const user = await requireUser(request);
  if (user.role !== "ADMIN" && user.role !== "OPERATOR") {
    throw new Response("Forbidden", { status: 403 });
  }
  return user;
}

export async function requireRole(request: Request, minRole: Role): Promise<AuthUser> {
  const user = await requireUser(request);
  
  const roleHierarchy = { VIEWER: 0, OPERATOR: 1, ADMIN: 2 };
  const userLevel = roleHierarchy[user.role];
  const requiredLevel = roleHierarchy[minRole];

  if (userLevel < requiredLevel) {
    throw new Response("Forbidden", { status: 403 });
  }

  return user;
}

// Audit logging helper
export async function logAdminAction(
  user: AuthUser,
  action: string,
  target?: { type: string; id: string },
  metadata?: any,
  request?: Request
) {
  await db.adminAuditLog.create({
    data: {
      actorId: user.id,
      action,
      targetType: target?.type,
      targetId: target?.id,
      metadata,
      ipAddress: request?.headers.get("x-forwarded-for") || undefined,
      userAgent: request?.headers.get("user-agent") || undefined,
    },
  });
}