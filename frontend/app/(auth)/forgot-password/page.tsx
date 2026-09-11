"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MailCheck, ArrowLeft, KeyRound, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      }).catch(() => null);

      setLoading(false);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Failed to process request. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white text-stone-900 grid lg:grid-cols-2">
      {/* Left Form Panel */}
      <div className="flex flex-col justify-between p-6 sm:p-10 md:p-14 lg:p-16 xl:p-20 min-h-screen w-full">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 group text-xs text-stone-500 hover:text-stone-900 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-stone-950 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <KeyRound className="w-4 h-4 text-amber-300" />
            </div>
            <span className="font-semibold text-stone-900 text-sm">Samvad</span>
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>

        {/* Centered Body */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto py-10">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-950 mb-2">
            Reset password
          </h1>
          <p className="text-sm text-stone-500 mb-8 leading-relaxed">
            Enter the email address associated with your account and we’ll send you instructions to reset your password.
          </p>

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 mb-5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200/80 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <p>{error}</p>
            </div>
          )}

          {sent ? (
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200/80 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <MailCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-stone-900">Check your inbox</h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  We have dispatched reset instructions to <strong className="text-stone-800 font-medium">{email}</strong>. If an account exists, you will receive an email shortly.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-xs text-stone-600 hover:text-stone-950 underline font-medium"
                >
                  Try another email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-medium text-stone-700">
                  Registered Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl bg-white border-stone-200 focus:border-stone-900 transition-all text-sm shadow-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-full bg-stone-950 hover:bg-stone-800 text-white font-medium text-sm transition-all shadow-md mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending link...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          )}

          <div className="mt-8 text-center text-xs text-stone-500">
            Remember your password?{" "}
            <Link href="/login" className="font-semibold text-stone-950 hover:underline">
              Back to login
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="py-4 border-t border-stone-100 flex items-center justify-center gap-4 text-xs text-stone-400">
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
          alt="Samvad Visual Showcase"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
