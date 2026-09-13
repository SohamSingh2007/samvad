"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import {
  isSessionExpired,
  storeSession,
  clearStoredSession,
  getStoredSession,
  isLoggedOut,
  markLoggedOut,
  markLoggedIn,
} from "@/lib/session";
import { toast } from "@/samvadComponents/toastMessage";
import { Lock, LogOut } from "lucide-react";

export interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
  loadingMessage?: string;
}

export function AuthGuard({
  children,
  requireAdmin = false,
  redirectTo = "/login",
  loadingMessage = "Verifying security session...",
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [isSignedOutState, setIsSignedOutState] = useState<boolean>(false);
  const expiryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Intercept back-forward cache (bfcache) navigation when user signed out
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && isLoggedOut()) {
        setIsSignedOutState(true);
        window.location.replace(`${redirectTo}?signed_out=true`);
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [redirectTo]);

  useEffect(() => {
    // If still resolving session from Better Auth, wait
    if (isPending) return;

    const currentPath = pathname || "/dashboard";

    // 1. Check if session object or user is completely missing
    if (!session?.user || !session?.session) {
      setIsAuthorized(false);
      setIsChecking(false);
      if (isLoggedOut()) {
        setIsSignedOutState(true);
        window.location.replace(`${redirectTo}?signed_out=true`);
      } else {
        window.location.replace(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
      }
      return;
    }

    // 2. Check if session has expired
    const expiresAt = session.session.expiresAt;
    if (isSessionExpired(expiresAt)) {
      markLoggedOut();
      signOut().catch(() => {});
      setIsAuthorized(false);
      setIsChecking(false);
      toast.error("Session Expired", {
        description: "Your security session has expired. Please sign in again.",
      });
      window.location.replace(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}&expired=true`);
      return;
    }

    // 3. Admin role check
    const userEmail = session.user.email?.toLowerCase();
    if (requireAdmin && userEmail !== "admin@samvad.com") {
      setIsAuthorized(false);
      setIsChecking(false);
      toast.error("Access Restricted", {
        description: "Admin privileges required. Your account is not authorized.",
      });
      router.replace("/dashboard");
      return;
    }

    // 4. Session is verified and valid! User is logged in.
    markLoggedIn();
    setIsSignedOutState(false);
    storeSession({
      id: session.session.id,
      userId: session.session.userId,
      expiresAt: session.session.expiresAt,
      user: session.user,
    });
    setIsAuthorized(true);
    setIsChecking(false);

    // Setup live expiration timer
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
    }
    const msUntilExpiry = new Date(expiresAt).getTime() - Date.now();
    if (msUntilExpiry > 0 && msUntilExpiry < 2147483647) {
      expiryTimerRef.current = setTimeout(() => {
        markLoggedOut();
        signOut().catch(() => {});
        setIsAuthorized(false);
        toast.error("Session Expired", {
          description: "Your session has expired for security. Please sign in again.",
        });
        window.location.replace(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}&expired=true`);
      }, msUntilExpiry);
    }

    return () => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
      }
    };
  }, [session, isPending, requireAdmin, pathname, redirectTo, router]);

  // Handle visibility change: re-verify if tab was idle
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const stored = getStoredSession();
        if (stored && isSessionExpired(stored.expiresAt)) {
          markLoggedOut();
          signOut().catch(() => {});
          setIsAuthorized(false);
          toast.error("Session Expired", {
            description: "Your session has expired while away. Please sign in again.",
          });
          window.location.replace(`${redirectTo}?redirect=${encodeURIComponent(pathname || "/dashboard")}&expired=true`);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [pathname, redirectTo]);

  // If user is signed out, show dedicated sign-out message instead of generic loader
  if (isSignedOutState) {
    return (
      <div className="w-full h-screen bg-[#faf9f7] dark:bg-[#121212] flex flex-col items-center justify-center gap-3.5 select-none transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-stone-200/90 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300 shadow-xs">
          <LogOut className="w-5 h-5 stroke-[2]" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            You are signed out
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  if (isChecking || !isAuthorized) {
    return (
      <div className="w-full h-screen bg-[#faf9f7] dark:bg-[#121212] flex flex-col items-center justify-center gap-3 select-none transition-colors">
        <div className="w-8 h-8 rounded-full border-2 border-stone-300 dark:border-stone-700 border-t-stone-900 dark:border-t-white animate-spin" />
        <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 font-mono text-xs mt-1">
          <Lock className="w-3.5 h-3.5 stroke-[2]" />
          <span>{loadingMessage}</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
