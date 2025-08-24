import { createCookieSessionStorage, Session } from "@remix-run/node";

// User session data interface
export interface UserSessionData {
  userId: string;
  role: 'user';
  emailVerified?: boolean;
  oidcSub?: string; // provider:subject format
  nonce?: string; // for re-authentication
}

// Separate session secret for users (security isolation)
const sessionSecret = process.env.SESSION_SECRET_USER;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET_USER must be set for user sessions");
}

// User session storage with security settings
export const userSessionStorage = createCookieSessionStorage<UserSessionData>({
  cookie: {
    name: "__user_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "strict", // Stricter security for users
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours (sliding renewal)
    httpOnly: true,
  },
});

// Export session helpers
export const { getSession, commitSession, destroySession } = userSessionStorage;

// Helper functions for user session management
export async function getUserSession(request: Request): Promise<Session<UserSessionData>> {
  return await getSession(request.headers.get("Cookie"));
}

export async function createUserSession(
  userId: string,
  sessionData: Omit<UserSessionData, 'userId' | 'role'> = {},
  redirectTo: string = "/"
) {
  const session = await userSessionStorage.getSession();
  
  // Set user session data
  session.set("userId", userId);
  session.set("role", "user" as const);
  
  // Optional fields
  if (sessionData.emailVerified !== undefined) {
    session.set("emailVerified", sessionData.emailVerified);
  }
  if (sessionData.oidcSub) {
    session.set("oidcSub", sessionData.oidcSub);
  }
  if (sessionData.nonce) {
    session.set("nonce", sessionData.nonce);
  }

  return new Response(null, {
    status: 302,
    headers: {
      "Set-Cookie": await commitSession(session),
      "Location": redirectTo,
    },
  });
}

export async function logoutUser(request: Request, redirectTo: string = "/") {
  const session = await getUserSession(request);
  
  return new Response(null, {
    status: 302,
    headers: {
      "Set-Cookie": await destroySession(session),
      "Location": redirectTo,
    },
  });
}

// Session regeneration for security (session fixation prevention)
export async function regenerateUserSession(
  request: Request,
  sessionData: UserSessionData,
  redirectTo?: string
) {
  // Destroy old session
  const oldSession = await getUserSession(request);
  
  // Create new session with same data
  const newSession = await userSessionStorage.getSession();
  Object.entries(sessionData).forEach(([key, value]) => {
    newSession.set(key as keyof UserSessionData, value);
  });
  
  const headers: HeadersInit = {
    "Set-Cookie": await commitSession(newSession),
  };
  
  if (redirectTo) {
    headers["Location"] = redirectTo;
    return new Response(null, {
      status: 302,
      headers,
    });
  }
  
  return headers;
}

// Guard functions for user authentication
export async function requireUser(request: Request): Promise<UserSessionData> {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  const role = session.get("role");
  
  // Session validation - must have userId and role must be 'user'
  if (!userId || role !== "user") {
    // Get current path for redirect after login
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;
    
    // Clear invalid session
    throw new Response(null, {
      status: 302,
      headers: {
        "Set-Cookie": await destroySession(session),
        "Location": `/login?next=${encodeURIComponent(redirectTo)}`,
      },
    });
  }
  
  // Return full session data
  return {
    userId,
    role: "user",
    emailVerified: session.get("emailVerified"),
    oidcSub: session.get("oidcSub"),
    nonce: session.get("nonce"),
  };
}

export async function getOptionalUser(request: Request): Promise<UserSessionData | null> {
  try {
    const session = await getUserSession(request);
    const userId = session.get("userId");
    const role = session.get("role");
    
    // Return null if no valid user session
    if (!userId || role !== "user") {
      return null;
    }
    
    return {
      userId,
      role: "user",
      emailVerified: session.get("emailVerified"),
      oidcSub: session.get("oidcSub"),
      nonce: session.get("nonce"),
    };
  } catch {
    return null;
  }
}

// Prevent admin session mixing (security check)
export function validateUserSessionOnly(sessionData: any): sessionData is UserSessionData {
  return sessionData && 
         typeof sessionData.userId === 'string' && 
         sessionData.role === 'user';
}