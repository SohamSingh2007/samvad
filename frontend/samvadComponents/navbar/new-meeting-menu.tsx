"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Video, Link2, Plus, Calendar, Copy, Check } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";

interface NewMeetingMenuProps {
  onStartInstantMeeting?: () => void;
}

export function NewMeetingMenu({ onStartInstantMeeting }: NewMeetingMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
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

  const handleCreateMeetingForLater = () => {
    const code = Math.random().toString(36).substring(2, 5) + "-" + Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 5);
    setGeneratedCode(code);
    setShowLinkModal(true);
    setIsOpen(false);
  };

  const handleStartInstant = () => {
    setIsOpen(false);
    if (onStartInstantMeeting) {
      onStartInstantMeeting();
    } else {
      const code = Math.random().toString(36).substring(2, 5) + "-" + Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 5);
      toast.success("Starting instant meeting...", {
        description: "Setting up your camera and sign language detection...",
        action: { label: "Got It!" },
      });
      router.push(`/meeting/${code}`);
    }
  };

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://samvad.qixolabs.com";
    const fullUrl = `${origin}/meeting/${generatedCode}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopied(true);
    toast.success("Meeting link copied!", {
      description: "Send this link to participants to invite them.",
      action: { label: "Got It!" },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Green "New" Meeting Capsule Button matching Google Meet */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-[#c4eed0] hover:bg-[#b3e7c1] active:bg-[#a2e0b2] text-[#072711] dark:bg-[#1a4a2c] dark:hover:bg-[#225c38] dark:text-[#aef5c8] transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap select-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Video className="w-4 h-4 text-[#072711] dark:text-[#aef5c8] shrink-0 stroke-[2.2]" />
        <span>New</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-64 sm:w-72 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <button
            type="button"
            onClick={handleCreateMeetingForLater}
            className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs sm:text-sm text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/70 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 text-stone-600 dark:text-stone-300">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-stone-900 dark:text-stone-100">Create a meeting for later</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Get a link you can share</p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleStartInstant}
            className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs sm:text-sm text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/70 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-400">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-medium text-stone-900 dark:text-stone-100">Start an instant meeting</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Join a meeting room right now</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              toast.info("Calendar integration", {
                description: "Google Calendar & Samvad Calendar sync will be available soon.",
                action: { label: "Got It!" },
              });
            }}
            className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs sm:text-sm text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/70 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center shrink-0 text-sky-700 dark:text-sky-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-stone-900 dark:text-stone-100">Schedule in Calendar</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Plan upcoming calls with invites</p>
            </div>
          </button>
        </div>
      )}

      {/* Shareable Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Here's your joining info</h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Send this link to people you want to meet with. Be sure to save it so you can use it later, too.
            </p>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700">
              <span className="text-xs sm:text-sm font-mono text-stone-700 dark:text-stone-300 flex-1 truncate px-1">
                {typeof window !== "undefined" ? window.location.origin : "https://samvad.qixolabs.com"}/meeting/{generatedCode}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2 rounded-lg bg-white dark:bg-stone-700 hover:bg-stone-50 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 transition-colors shadow-xs cursor-pointer"
                title="Copy link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLinkModal(false);
                  router.push(`/meeting/${generatedCode}`);
                }}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-sm cursor-pointer"
              >
                Join now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
