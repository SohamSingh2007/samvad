"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Keyboard, Video, Loader2 } from "lucide-react";
import { NewMeetingMenu } from "./new-meeting-menu";
import { ProfileMenu } from "./profile-menu";
import { NotificationMenu } from "./notification-menu";
import { toast } from "@/samvadComponents/toastMessage";
import { getMeeting } from "@/lib/meetings-client";

export interface SamvadNavbarProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    accessibilityPreferences?: any;
  } | null;
  onStartInstantMeeting?: (title?: string) => void;
}

export function SamvadNavbar({ user, onStartInstantMeeting }: SamvadNavbarProps) {
  const router = useRouter();
  const [meetingCode, setMeetingCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isJoining) return;

    const raw = meetingCode.trim();
    if (!raw) {
      toast.warning("Enter a code or link", {
        description: "Please enter a valid room code or link to join.",
      });
      return;
    }

    // Extract room code cleanly from any URL or string
    let cleanCode = raw;
    try {
      if (cleanCode.includes("/")) {
        const urlWithoutQuery = cleanCode.split("?")[0].split("#")[0];
        const parts = urlWithoutQuery.split("/").filter(Boolean);
        cleanCode = parts[parts.length - 1] || cleanCode;
      }
    } catch {}

    cleanCode = cleanCode.split("?")[0].split("#")[0].trim().toLowerCase();
    cleanCode = cleanCode.replace(/[^a-z0-9-]/g, "");

    // Auto-format 10 char codes without dashes (e.g. lozr13lxyz -> loz-r13l-xyz)
    if (!cleanCode.includes("-") && cleanCode.length === 10) {
      cleanCode = `${cleanCode.slice(0, 3)}-${cleanCode.slice(3, 7)}-${cleanCode.slice(7, 10)}`;
    }

    if (!cleanCode) {
      toast.warning("Enter a code or link", {
        description: "Please enter a valid room code or link.",
      });
      return;
    }

    try {
      setIsJoining(true);
      toast.info("Connecting...", {
        description: `Joining room ${cleanCode.toUpperCase()}...`,
      });

      router.push(`/room/${cleanCode}`);
    } catch {
      setIsJoining(false);
      router.push(`/room/${cleanCode}`);
    }
  };

  const hasCode = meetingCode.trim().length > 0;

  return (
    <header className="w-full h-16 sm:h-[68px] px-6 sm:px-10 flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 sticky top-0 z-40 transition-colors select-none">
      {/* 1. Left Section: Logo & Brand Name */}
      <div className="flex items-center shrink-0">
        <Link href="/" className="inline-flex items-center group py-1">
          <Image
            src="/logo-light.svg"
            alt="Samvad"
            width={130}
            height={34}
            className="h-7 sm:h-8 w-auto object-contain dark:hidden transition-opacity group-hover:opacity-85"
            priority
          />
          <Image
            src="/logo-dark.svg"
            alt="Samvad"
            width={130}
            height={34}
            className="h-7 sm:h-8 w-auto object-contain hidden dark:block transition-opacity group-hover:opacity-85"
            priority
          />
        </Link>
      </div>

      {/* 2. Center Action Area: Input capsule + New button + In-person notes button */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-2xl ml-auto md:mx-6 justify-end md:justify-center">
        {/* Search / Enter Code Input Capsule */}
        <form
          onSubmit={handleJoin}
          className="flex items-center h-[42px] bg-[#f0f4f9] dark:bg-stone-800/90 hover:bg-[#e7edf5] dark:hover:bg-stone-800 border border-transparent focus-within:border-black dark:focus-within:border-white focus-within:bg-white dark:focus-within:bg-stone-900 focus-within:shadow-md rounded-xl pl-2 pr-1 transition-all w-full max-w-[220px] sm:max-w-xs lg:max-w-sm"
        >
          <Keyboard className="w-4 h-4 text-stone-500 ml-2.5 mr-2 shrink-0 stroke-[2]" />
          <input
            type="text"
            value={meetingCode}
            onChange={(e) => setMeetingCode(e.target.value)}
            placeholder="Enter a code or link"
            className="bg-transparent text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-500 focus:outline-none w-full h-full py-0"
          />
          <button
            type="submit"
            disabled={!hasCode || isJoining}
            className={`px-3 sm:px-3.5 h-[32px] rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center justify-center shrink-0 ${
              hasCode && !isJoining
                ? "bg-black dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-stone-200 shadow-xs cursor-pointer active:scale-95"
                : "text-stone-400 dark:text-stone-500 cursor-not-allowed"
            }`}
          >
            {isJoining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Join"}
          </button>
        </form>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <NewMeetingMenu onStartInstantMeeting={onStartInstantMeeting} />
        </div>
      </div>

      {/* 3. Right Section: Notification & Profile Avatar (Desktop/Tablet) */}
      <div className="hidden md:flex items-center gap-2 sm:gap-2.5 shrink-0">
        <NotificationMenu />
        <ProfileMenu user={user} />
      </div>
    </header>
  );
}
