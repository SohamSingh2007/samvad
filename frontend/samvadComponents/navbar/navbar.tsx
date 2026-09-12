"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Keyboard, Video } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NewMeetingMenu } from "./new-meeting-menu";
import { InPersonNotesButton } from "./notes-modal";
import { AppsMenu } from "./apps-menu";
import { SettingsButton } from "./settings-modal";
import { HelpButton } from "./help-modal";
import { ProfileMenu } from "./profile-menu";
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
    <header className="w-full h-16 sm:h-[68px] px-3 sm:px-6 flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 sticky top-0 z-40 transition-colors select-none">
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
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-2xl mx-2 sm:mx-6 justify-center">
        {/* Search / Enter Code Input Capsule */}
        <form
          onSubmit={handleJoin}
          className="hidden md:flex items-center bg-[#f0f4f9] dark:bg-stone-800/90 hover:bg-[#e7edf5] dark:hover:bg-stone-800 border border-transparent focus-within:border-blue-500/70 focus-within:bg-white dark:focus-within:bg-stone-900 focus-within:shadow-md rounded-full px-2 py-1 transition-all w-full max-w-xs lg:max-w-sm"
        >
          <Keyboard className="w-4 h-4 text-stone-500 ml-2 mr-2 shrink-0 stroke-[2]" />
          <input
            type="text"
            value={meetingCode}
            onChange={(e) => setMeetingCode(e.target.value)}
            placeholder="Enter a code or link"
            className="bg-transparent text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-500 focus:outline-none w-full py-1.5"
          />
          <button
            type="submit"
            disabled={!hasCode}
            className={`px-3 sm:px-3.5 py-1 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              hasCode
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer active:scale-95"
                : "text-stone-400 dark:text-stone-500 cursor-not-allowed"
            }`}
          >
            Join
          </button>
        </form>

        {/* Action Pills */}
        <div className="flex items-center gap-2 shrink-0">
          <NewMeetingMenu onStartInstantMeeting={onStartInstantMeeting} />
          <div className="hidden sm:block">
            <InPersonNotesButton />
          </div>
        </div>
      </div>

      {/* 3. Right Section: Help, Settings, Apps Grid, Theme Toggle, Profile Avatar */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <div className="hidden lg:flex items-center gap-1">
          <HelpButton />
          <SettingsButton />
          <AppsMenu />
        </div>

        <ThemeToggle />

        <div className="ml-1 sm:ml-2">
          <ProfileMenu user={user} />
        </div>
      </div>
    </header>
  );
}
