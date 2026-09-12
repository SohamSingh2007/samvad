"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { LogOut, User, ShieldCheck, Sparkles } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { toast } from "@/samvadComponents/toastMessage";

interface ProfileMenuProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    accessibilityPreferences?: any;
  } | null;
}

export function ProfileMenu({ user }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    toast.info("Signing out...", {
      description: "You are being securely logged out of your session.",
    });
    await signOut();
    window.location.href = "/login";
  };

  const name = user?.name || "Samvad User";
  const email = user?.email || "user@samvad.test";
  const initials = (name || email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Avatar with Google-style ring */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Google / Samvad Account"
        className="relative group p-0.5 rounded-full ring-2 ring-blue-500/80 hover:ring-blue-600 dark:ring-blue-400 transition-all cursor-pointer select-none"
      >
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-500 text-white flex items-center justify-center font-semibold text-xs sm:text-sm overflow-hidden shadow-xs">
          {user?.image && !imageError ? (
            <Image
              src={user.image}
              alt={name}
              width={36}
              height={36}
              unoptimized
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      </button>

      {/* Account Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header info */}
          <div className="flex flex-col items-center text-center pb-4 border-b border-stone-100 dark:border-stone-800">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-500 text-white flex items-center justify-center font-bold text-xl mb-2.5 shadow-md overflow-hidden">
              {user?.image && !imageError ? (
                <Image
                  src={user.image}
                  alt={name}
                  width={64}
                  height={64}
                  unoptimized
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm sm:text-base leading-tight">
              {name}
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 max-w-[220px] truncate">
              {email}
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>ISL Accessibility Enabled</span>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4 space-y-2">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full py-2.5 px-4 rounded-full flex items-center justify-center gap-2 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-stone-500" />
              <span>{isSigningOut ? "Signing out..." : "Sign out of Samvad"}</span>
            </button>

            <div className="flex justify-center items-center gap-3 pt-2 text-[11px] text-stone-400">
              <span className="hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer">Privacy Policy</span>
              <span>•</span>
              <span className="hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
