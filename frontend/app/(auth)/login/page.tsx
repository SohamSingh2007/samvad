"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn, getAuthBaseURL } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { markLoggedIn } from "@/lib/session";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Clear loading state when navigating back via bfcache or returning focus
  useEffect(() => {
    const handleReset = () => {
      setSocialLoading(null);
      setLoading(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleReset();
      }
    };

    window.addEventListener("pageshow", handleReset);
    window.addEventListener("focus", handleReset);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handleReset);
      window.removeEventListener("focus", handleReset);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Alert user if redirected due to session expiration or sign out
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("expired") === "true") {
        toast.warning("Session Expired", {
          description: "Your session has expired for security. Please sign in again.",
          duration: 6000,
        });
      } else if (params.get("signed_out") === "true") {
        toast.info("Signed Out", {
          description: "You have been securely signed out of your account.",
          duration: 5000,
        });
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn.email({
        email,
        password,
      });

      if (res.error) {
        const errorMsg = res.error.message || "Invalid credentials. Please check your email and password.";
        setError(errorMsg);
        toast.error("Sign in failed", {
          description: errorMsg,
          action: { label: "Fixing!", onClick: () => {} },
        });
        setLoading(false);
      } else {
        markLoggedIn();
        if (typeof window !== "undefined") {
          sessionStorage.setItem("samvad_login_success", "true");
        }
        const redirectParam =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("redirect")
            : null;
        const destination =
          redirectParam ||
          (email.trim().toLowerCase() === "admin@samvad.com"
            ? "/admin"
            : "/dashboard");
        window.location.href = destination;
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to connect to authentication server. Please try again.";
      setError(errorMsg);
      toast.error("Connection error", {
        description: errorMsg,
      });
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "github") => {
    try {
      setSocialLoading(provider);
      setError("");

      const apiBase =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
          ? "http://localhost:4000"
          : "https://samvad-api.qixolabs.com";

      const redirectParam =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("redirect")
          : null;
      const callbackURL = `${window.location.origin}${redirectParam || "/dashboard"}`;
      const errorCallbackURL = `${window.location.origin}/login`;

      const response = await fetch(`${apiBase}/api/auth/sign-in/social`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          provider,
          callbackURL,
          errorCallbackURL,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to initiate ${provider} sign-in`);
      }

      const data = await response.json();
      if (data?.url) {
        markLoggedIn();
        if (typeof window !== "undefined") {
          sessionStorage.setItem("samvad_login_success", "true");
        }
        window.location.assign(data.url);
        return;
      }
      throw new Error("No authorization URL returned from server.");
    } catch (err: any) {
      console.error("Social login error:", err);
      const errorMsg = err?.message || `${provider} login is not configured yet. Please sign in with email.`;
      setError(errorMsg);
      toast.error(`${provider.charAt(0).toUpperCase() + provider.slice(1)} Login`, {
        description: errorMsg,
      });
      setSocialLoading(null);
    }
  };

  return (
    <div className="w-full min-h-screen lg:h-screen lg:max-h-screen bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 grid lg:grid-cols-2 lg:overflow-hidden transition-colors duration-200 bg-dot-grid">
      {/* Left Form Panel - Full Height with Centered Form Content */}
      <div className="flex flex-col justify-between px-6 py-4 sm:px-10 sm:py-5 lg:px-12 lg:py-6 xl:px-16 xl:py-7 min-h-screen lg:h-screen lg:max-h-screen overflow-y-auto lg:overflow-y-hidden w-full">
        {/* Top Navigation - At top position, aligned with form boundaries */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto flex items-center justify-between pb-1">
          <Link
            href="/"
            className="inline-flex items-center group"
          >
            <Image
              src="/logo-light.svg"
              alt="Samvad"
              width={130}
              height={34}
              className="h-8 w-auto object-contain dark:hidden transition-opacity group-hover:opacity-80"
              priority
            />
            <Image
              src="/logo-dark.svg"
              alt="Samvad"
              width={130}
              height={34}
              className="h-8 w-auto object-contain hidden dark:block transition-opacity group-hover:opacity-80"
              priority
            />
          </Link>

          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>

        {/* Form Container (Neatly centered vertically) */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto py-4 sm:py-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-950 dark:text-stone-100 mb-2">
            Welcome back!
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
            Your work, your team, your flow — all in one place.
          </p>

          {/* Social Sign In Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleSocialSignIn("google")}
              disabled={loading || !!socialLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-700 transition-all shadow-sm cursor-pointer"
            >
              {socialLoading === "google" ? (
                <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Sign In with Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialSignIn("github")}
              disabled={loading || !!socialLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-700 transition-all shadow-sm cursor-pointer"
            >
              {socialLoading === "github" ? (
                <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
              ) : (
                <svg className="w-4 h-4 fill-current text-stone-900 dark:text-white" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              )}
              <span>Sign In with GitHub</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-stone-200 dark:border-stone-800 w-full" />
            <span className="bg-white dark:bg-stone-950 px-3 text-xs text-stone-400 dark:text-stone-500 font-medium">
              Or
            </span>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 mb-5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200/80 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <p>{error}</p>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-400 dark:text-stone-100 transition-all text-sm shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-400 dark:text-stone-100 transition-all text-sm pr-12 shadow-sm"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100/70 dark:hover:bg-stone-800 transition-colors cursor-pointer z-10"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-stone-950 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200 font-medium text-sm transition-all shadow-md mt-2 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in with email"
              )}
            </Button>
          </form>

          {/* Switch to Signup */}
          <div className="mt-6 text-center text-xs text-stone-500 dark:text-stone-400">
            Don't have an account?{" "}
            <Link href="/signup" className="font-semibold text-stone-950 dark:text-white hover:underline">
              Sign Up
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-center gap-4 text-[11px] text-stone-400 dark:text-stone-500">
          <Link href="#" className="hover:text-stone-700 dark:hover:text-stone-300 transition-colors">Help</Link>
          <span>·</span>
          <Link href="#" className="hover:text-stone-700 dark:hover:text-stone-300 transition-colors">Terms</Link>
          <span>·</span>
          <Link href="#" className="hover:text-stone-700 dark:hover:text-stone-300 transition-colors">Privacy</Link>
        </div>
      </div>

      {/* Right Visual Panel - Full Viewport Height Architectural Garden */}
      <div className="hidden lg:relative lg:block bg-stone-950 overflow-hidden h-screen max-h-screen">
        <Image
          src="/image-auth3.png"
          alt="Samvad Visual Aesthetic"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
