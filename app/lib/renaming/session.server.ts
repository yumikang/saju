/**
 * Renaming Session Management
 *
 * Cookie-based session storage for renaming service form data.
 * Stores sensitive user input (birthdate, current name) securely.
 *
 * @created 2025-10-28
 * @refactor Phase 1: Preparation for URL-based nested routing
 */

import { createCookieSessionStorage } from '@remix-run/node';
import type { RenamingFormData, RenamingSession } from './types';

// ============================================================
// Session Configuration
// ============================================================

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set in environment variables');
}

/**
 * Cookie session storage for renaming service
 * Separate from admin session to avoid conflicts
 */
export const renamingSessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'saju_renaming_session',
    secure: process.env.NODE_ENV === 'production',
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 2, // 2 hours (shorter than admin session)
    httpOnly: true,
  },
});

// Export standard Remix session methods
export const { getSession, commitSession, destroySession } = renamingSessionStorage;

// ============================================================
// Type-Safe Session Helpers
// ============================================================

/**
 * Get renaming form data from session
 */
export async function getRenamingFormData(
  request: Request
): Promise<RenamingFormData | null> {
  const session = await getSession(request.headers.get('Cookie'));
  const formData = session.get('formData');
  return formData || null;
}

/**
 * Set renaming form data in session
 * Returns Cookie header string
 */
export async function setRenamingFormData(
  request: Request,
  formData: RenamingFormData
): Promise<string> {
  const session = await getSession(request.headers.get('Cookie'));

  // Create session object with metadata
  const sessionData: RenamingSession = {
    formData,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
  };

  session.set('formData', formData);
  session.set('createdAt', sessionData.createdAt);
  session.set('expiresAt', sessionData.expiresAt);

  return commitSession(session);
}

/**
 * Get analysisId from session
 */
export async function getAnalysisId(request: Request): Promise<string | null> {
  const session = await getSession(request.headers.get('Cookie'));
  return session.get('analysisId') || null;
}

/**
 * Set analysisId in session
 * Returns Cookie header string
 */
export async function setAnalysisId(
  request: Request,
  analysisId: string
): Promise<string> {
  const session = await getSession(request.headers.get('Cookie'));
  session.set('analysisId', analysisId);
  return commitSession(session);
}

/**
 * Get current score from session
 */
export async function getCurrentScore(request: Request): Promise<number | null> {
  const session = await getSession(request.headers.get('Cookie'));
  return session.get('currentScore') || null;
}

/**
 * Set current score in session
 * Returns Cookie header string
 */
export async function setCurrentScore(
  request: Request,
  score: number
): Promise<string> {
  const session = await getSession(request.headers.get('Cookie'));
  session.set('currentScore', score);
  return commitSession(session);
}

/**
 * Clear all renaming session data
 * Returns Cookie header string for destroying session
 */
export async function clearRenamingSession(request: Request): Promise<string> {
  const session = await getSession(request.headers.get('Cookie'));
  return destroySession(session);
}

/**
 * Get full renaming session data
 */
export async function getRenamingSession(
  request: Request
): Promise<RenamingSession | null> {
  const session = await getSession(request.headers.get('Cookie'));

  const formData = session.get('formData');
  if (!formData) return null;

  return {
    formData,
    analysisId: session.get('analysisId'),
    currentScore: session.get('currentScore'),
    createdAt: session.get('createdAt') || new Date().toISOString(),
    expiresAt: session.get('expiresAt') || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Check if session has expired
 */
export async function isSessionExpired(request: Request): Promise<boolean> {
  const sessionData = await getRenamingSession(request);
  if (!sessionData) return true;

  const expiresAt = new Date(sessionData.expiresAt);
  return expiresAt < new Date();
}
