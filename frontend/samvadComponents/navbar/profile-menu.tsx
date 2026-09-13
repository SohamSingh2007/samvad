"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogOut, Settings, Command, Info, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "@/lib/auth-client";
import { markLoggedOut } from "@/lib/session";
import { toast } from "@/samvadComponents/toastMessage";
import { HelpModal } from "./help-modal";
import { ShortcutsModal } from "./shortcuts-modal";

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
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    markLoggedOut();
    try {
      await signOut();
    } catch {}
    window.location.replace("/login?signed_out=true");
  };

  const name = user?.name || "Samvad User";
  const email = user?.email || "user@samvad.test";
  const initials = (name || email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const currentTheme = mounted ? theme : "system";

  return (
    <>
      <div className="relative inline-block text-left" ref={menuRef}>
        {/* Avatar Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Google / Samvad Account"
          className="relative group rounded-full transition-all cursor-pointer select-none hover:opacity-90 active:scale-95"
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
            {/* Header info matching reference */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100 dark:border-stone-800">
              {/* Avatar without blue ring */}
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-500 text-white flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden">
                  {user?.image && !imageError ? (
                    <Image
                      src={user.image}
                      alt={name}
                      width={44}
                      height={44}
                      unoptimized
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
              </div>

              {/* Name and Email Stack */}
              <div className="min-w-0 flex-1 text-left">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-[15px] leading-tight truncate">
                  {name}
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 truncate font-normal">
                  {email}
                </p>
              </div>
            </div>

            {/* Theme / Appearance Switcher */}
            <div className="py-3 border-b border-stone-100 dark:border-stone-800">
              <div className="mb-2 px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  Theme
                </span>
              </div>
              <div className="grid grid-cols-3 p-1 rounded-2xl bg-stone-100 dark:bg-stone-800/70 border border-stone-200/50 dark:border-stone-700/50">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    currentTheme === "light"
                      ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold"
                      : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    currentTheme === "dark"
                      ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold"
                      : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    currentTheme === "system"
                      ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold"
                      : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Auto</span>
                </button>
              </div>
            </div>

            {/* Action Menu List matching reference style */}
            <div className="pt-2 space-y-0.5">
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[14.5px] text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors text-left font-normal cursor-pointer group"
              >
                <Settings className="w-[18px] h-[18px] text-stone-600 dark:text-stone-300 stroke-[1.8] group-hover:text-stone-950 dark:group-hover:text-white transition-colors shrink-0" />
                <span>Settings</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsShortcutsOpen(true);
                }}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[14.5px] text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors text-left font-normal cursor-pointer group"
              >
                <Command className="w-[18px] h-[18px] text-stone-600 dark:text-stone-300 stroke-[1.8] group-hover:text-stone-950 dark:group-hover:text-white transition-colors shrink-0" />
                <span>Keyboard shortcuts</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsHelpOpen(true);
                }}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[14.5px] text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors text-left font-normal cursor-pointer group"
              >
                <Info className="w-[18px] h-[18px] text-stone-600 dark:text-stone-300 stroke-[1.8] group-hover:text-stone-950 dark:group-hover:text-white transition-colors shrink-0" />
                <span>Help center</span>
              </button>

              <div className="my-2 border-t border-stone-100 dark:border-stone-800" />

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-red-200 hover:border-red-300 dark:border-red-900/60 dark:hover:border-red-800 bg-white dark:bg-transparent hover:bg-red-50/60 dark:hover:bg-red-950/25 text-red-600 dark:text-red-400 text-[14px] font-medium transition-all cursor-pointer group active:scale-[0.98]"
                >
                  <LogOut className="w-4 h-4 text-red-600 dark:text-red-400 stroke-[2] group-hover:translate-x-0.5 transition-transform shrink-0" />
                  <span>{isSigningOut ? "Signing out..." : "Sign out of Samvad"}</span>
                </button>
              </div>

              <div className="flex justify-center items-center gap-3 pt-2 text-[11px] text-stone-400">
                <Link href="/privacy" onClick={() => setIsOpen(false)} className="hover:text-stone-600 dark:hover:text-stone-300">Privacy Policy</Link>
                <span>•</span>
                <Link href="/terms" onClick={() => setIsOpen(false)} className="hover:text-stone-600 dark:hover:text-stone-300">Terms of Service</Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Modal triggered from menu */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Keyboard Shortcuts Modal triggered from menu */}
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </>
  );
}
