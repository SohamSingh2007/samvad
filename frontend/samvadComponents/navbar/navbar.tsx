"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Keyboard, Video } from "lucide-react";
import { NewMeetingMenu } from "./new-meeting-menu";
import { ProfileMenu } from "./profile-menu";
import { NotificationMenu } from "./notification-menu";
import { toast } from "@/samvadComponents/toastMessage";

export interface SamvadNavbarProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    accessibilityPreferences?: any;
  } | null;
  onStartInstantMeeting?: () => void;
}

export function SamvadNavbar({ user, onStartInstantMeeting }: SamvadNavbarProps) {
  const router = useRouter();
  const [meetingCode, setMeetingCode] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = meetingCode.trim().replace(/^https?:\/\/[^\/]+\/meeting\//i, "");
    if (!cleanCode) {
      toast.warning("Enter a code or link", {
        description: "Please enter a valid meeting code or link to join.",
      });
      return;
    }

    toast.success("Joining meeting...", {
      description: `Connecting to room ${cleanCode.toUpperCase()}...`,
      action: { label: "Got It!" },
    });
    router.push(`/meeting/${cleanCode}`);
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
          className="hidden md:flex items-center h-[42px] bg-[#f0f4f9] dark:bg-stone-800/90 hover:bg-[#e7edf5] dark:hover:bg-stone-800 border border-transparent focus-within:border-black dark:focus-within:border-white focus-within:bg-white dark:focus-within:bg-stone-900 focus-within:shadow-md rounded-xl pl-2 pr-1 transition-all w-full max-w-xs lg:max-w-sm"
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
            disabled={!hasCode}
            className={`px-3 sm:px-3.5 h-[32px] rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center justify-center shrink-0 ${
              hasCode
                ? "bg-black dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-stone-200 shadow-xs cursor-pointer active:scale-95"
                : "text-stone-400 dark:text-stone-500 cursor-not-allowed"
            }`}
          >
            Join
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
