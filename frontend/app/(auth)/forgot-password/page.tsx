"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, MailCheck, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      const msg = "Please enter a valid email address.";
      setError(msg);
      toast.error("Invalid email", {
        description: msg,
        action: { label: "Fixing!" },
      });
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
      toast.success("Reset link dispatched", {
        description: `Instructions to reset your password were sent to ${email.trim()}.`,
        action: { label: "Got It!" },
      });
    } catch (err: any) {
      const msg = err?.message || "Failed to process request. Please try again.";
      setError(msg);
      toast.error("Request failed", {
        description: msg,
      });
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 grid lg:grid-cols-2 transition-colors duration-200 bg-dot-grid">
      {/* Left Form Panel */}
      <div className="flex flex-col justify-between p-6 sm:p-10 md:p-14 lg:p-16 xl:p-20 min-h-screen w-full">
        {/* Top Header - At top position, aligned with form boundaries */}
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

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>

        {/* Centered Body */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto py-10">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-950 dark:text-stone-100 mb-2">
            Reset password
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-8 leading-relaxed">
            Enter the email address associated with your account and we’ll send you instructions to reset your password.
          </p>

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 mb-5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-lg border border-rose-200/80 dark:border-rose-900/60 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <p>{error}</p>
            </div>
          )}

          {sent ? (
            <div className="p-6 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <MailCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Check your inbox</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                  We have dispatched reset instructions to <strong className="text-stone-800 dark:text-stone-200 font-medium">{email}</strong>. If an account exists, you will receive an email shortly.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100 underline font-medium"
                >
                  Try another email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Registered Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-100 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all text-sm shadow-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg bg-stone-950 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white dark:text-stone-950 text-white font-medium text-sm transition-all shadow-md mt-2"
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

          <div className="mt-8 text-center text-xs text-stone-500 dark:text-stone-400">
            Remember your password?{" "}
            <Link href="/login" className="font-semibold text-stone-950 dark:text-stone-100 hover:underline">
              Back to login
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="py-4 border-t border-stone-100 dark:border-stone-900 flex items-center justify-center gap-4 text-xs text-stone-400 dark:text-stone-500">
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
