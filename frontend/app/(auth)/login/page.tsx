"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn, getAuthBaseURL } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

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
        setError(res.error.message || "Invalid credentials. Please check your email and password.");
        setLoading(false);
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err?.message || "Failed to connect to authentication server. Please try again.");
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

      const callbackURL = `${window.location.origin}/dashboard`;
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
        window.location.assign(data.url);
        return;
      }
      throw new Error("No authorization URL returned from server.");
    } catch (err: any) {
      console.error("Social login error:", err);
      setError(err?.message || `${provider} login is not configured yet. Please sign in with email.`);
      setSocialLoading(null);
    }
  };

  return (
    <div className="w-full min-h-screen lg:h-screen lg:max-h-screen bg-white text-stone-900 grid lg:grid-cols-2 lg:overflow-hidden">
      {/* Left Form Panel - Full Height with Centered Form Content */}
      <div className="flex flex-col justify-between px-6 py-4 sm:px-10 sm:py-5 lg:px-12 lg:py-6 xl:px-16 xl:py-7 min-h-screen lg:h-screen lg:max-h-screen overflow-y-auto lg:overflow-y-hidden w-full">
        {/* Top Navigation */}
        <div className="flex items-center justify-between pb-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 group text-xs text-stone-500 hover:text-stone-900 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-stone-950 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
              </svg>
            </div>
            <span className="font-semibold text-stone-900 text-sm">Samvad</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to site</span>
          </Link>
        </div>

        {/* Form Container (Neatly centered vertically) */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto py-4 sm:py-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-950 mb-2">
            Welcome back!
          </h1>
          <p className="text-sm text-stone-500 mb-6">
            Your work, your team, your flow — all in one place.
          </p>

          {/* Social Sign In Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleSocialSignIn("google")}
              disabled={loading || !!socialLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-stone-200 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm"
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
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-stone-200 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm"
            >
              {socialLoading === "github" ? (
                <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
              ) : (
                <svg className="w-4 h-4 fill-current text-stone-900" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              )}
              <span>Sign In with GitHub</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-stone-200 w-full" />
            <span className="bg-white px-3 text-xs text-stone-400 font-medium">
              Or
            </span>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 mb-5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200/80 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <p>{error}</p>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-medium text-stone-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl bg-white border-stone-200 focus:border-stone-900 transition-all text-sm shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium text-stone-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-stone-500 hover:text-stone-950 transition-colors"
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
                  className="h-11 rounded-xl bg-white border-stone-200 focus:border-stone-900 transition-all text-sm pr-12 shadow-sm"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100/70 transition-colors cursor-pointer z-10"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-stone-950 hover:bg-stone-800 text-white font-medium text-sm transition-all shadow-md mt-2"
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
          <div className="mt-6 text-center text-xs text-stone-500">
            Don't have an account?{" "}
            <Link href="/signup" className="font-semibold text-stone-950 hover:underline">
              Sign Up
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-center gap-4 text-[11px] text-stone-400">
          <Link href="#" className="hover:text-stone-700 transition-colors">Help</Link>
          <span>·</span>
          <Link href="#" className="hover:text-stone-700 transition-colors">Terms</Link>
          <span>·</span>
          <Link href="#" className="hover:text-stone-700 transition-colors">Privacy</Link>
        </div>
      </div>

      {/* Right Visual Panel - Full Viewport Height Architectural Garden */}
      <div className="hidden lg:relative lg:block bg-stone-950 overflow-hidden h-screen max-h-screen">
        <Image
          src="/image-auth2.png"
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
