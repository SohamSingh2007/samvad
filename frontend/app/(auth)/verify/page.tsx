"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ShieldCheck, ArrowLeft, RotateCw } from "lucide-react";

export default function VerifyPage() {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(45);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanValue;
    setDigits(newDigits);

    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!pasteData) return;

    const newDigits = [...digits];
    for (let i = 0; i < pasteData.length; i++) {
      newDigits[i] = pasteData[i];
    }
    setDigits(newDigits);
    const nextFocusIndex = Math.min(pasteData.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setVerified(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    }, 1000);
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setTimeout(() => {
      setResending(false);
      setResendCooldown(60);
    }, 800);
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
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
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
            Verify your email
          </h1>
          <p className="text-sm text-stone-500 mb-8 leading-relaxed">
            We've sent a 6-digit confirmation code to your registered email address. Enter the code below to confirm your account.
          </p>

          {verified ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-center space-y-3 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-emerald-900">Email Verified Successfully!</h3>
              <p className="text-xs text-emerald-700">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              {/* 6-digit OTP Inputs */}
              <div className="flex items-center justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono font-bold text-xl rounded-2xl bg-white border border-stone-200 text-stone-900 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all outline-none shadow-sm"
                  />
                ))}
              </div>

              <Button
                type="submit"
                disabled={loading || digits.join("").length < 6}
                className="w-full h-11 rounded-full bg-stone-950 hover:bg-stone-800 text-white font-medium text-sm transition-all shadow-md"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  "Verify Account"
                )}
              </Button>

              {/* Resend Section */}
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-stone-400">Didn't receive code?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resending}
                  className="font-medium text-stone-950 hover:underline disabled:text-stone-400 disabled:no-underline flex items-center gap-1.5"
                >
                  {resending && <RotateCw className="w-3 h-3 animate-spin" />}
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center text-xs text-stone-500">
            Need to change email?{" "}
            <Link href="/signup" className="font-semibold text-stone-950 hover:underline">
              Create another account
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
