"use client";

export interface StoredSessionUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  emailVerified?: boolean;
}

export interface StoredSessionData {
  id: string;
  userId: string;
  expiresAt: string;
  user: StoredSessionUser;
  cachedAt: number;
}

const SESSION_STORAGE_KEY = "samvad_auth_session_v1";

/**
 * Checks if a session's expiresAt ISO string or Date timestamp has expired.
 */
export function isSessionExpired(expiresAt: string | Date | number | undefined | null): boolean {
  if (!expiresAt) return true;
  const expiryTime = new Date(expiresAt).getTime();
  if (isNaN(expiryTime)) return true;
  return expiryTime <= Date.now();
}

/**
 * Safely saves active session metadata in sessionStorage (cleared on tab/window close).
 */
export function storeSession(data: {
  id: string;
  userId: string;
  expiresAt: string | Date;
  user: StoredSessionUser;
}): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredSessionData = {
      id: data.id,
      userId: data.userId,
      expiresAt: new Date(data.expiresAt).toISOString(),
      user: {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        image: data.user.image,
        emailVerified: data.user.emailVerified,
      },
      cachedAt: Date.now(),
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    // Ignore storage quota or disabled storage errors
  }
}

/**
 * Retrieves cached session if valid and not expired.
 */
export function getStoredSession(): StoredSessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredSessionData = JSON.parse(raw);
    if (!parsed || !parsed.expiresAt || isSessionExpired(parsed.expiresAt)) {
      clearStoredSession();
      return null;
    }
    return parsed;
  } catch {
    clearStoredSession();
    return null;
  }
}

/**
 * Clears all local and session-storage auth caches.
 */
export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem("samvad_login_success");
    sessionStorage.removeItem("samvad_admin_authenticated");
    sessionStorage.removeItem("samvad_admin_email");
  } catch {
    // Ignore
  }
}

const LOGGED_OUT_KEY = "samvad_is_logged_out";

/**
 * Flags that the user explicitly signed out, preventing bfcache history restores.
 */
export function markLoggedOut(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(LOGGED_OUT_KEY, "true");
    clearStoredSession();
  } catch {}
}

/**
 * Resets the sign-out flag upon successful login.
 */
export function markLoggedIn(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(LOGGED_OUT_KEY);
  } catch {}
}

/**
 * Checks if the user was flagged as signed out.
 */
export function isLoggedOut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(LOGGED_OUT_KEY) === "true";
  } catch {
    return false;
  }
}
