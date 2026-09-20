"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Video, Link2, Plus, Calendar, Copy, Check, X, Loader2, ArrowRight } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { createMeeting } from "@/lib/meetings-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface NewMeetingMenuProps {
  onStartInstantMeeting?: (title?: string) => void;
}

export function NewMeetingMenu({ onStartInstantMeeting }: NewMeetingMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Meeting Title Prompt Modal State
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [meetingMode, setMeetingMode] = useState<"instant" | "later">("instant");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [isSubmittingTitle, setIsSubmittingTitle] = useState(false);

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

  const handleOpenForLater = () => {
    setMeetingMode("later");
    setMeetingTitle("");
    setShowTitleModal(true);
    setIsOpen(false);
  };

  const handleOpenInstant = () => {
    setMeetingMode("instant");
    setMeetingTitle("");
    setShowTitleModal(true);
    setIsOpen(false);
  };

  const handleTitleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle =
      meetingTitle.trim() ||
      (meetingMode === "instant" ? "Instant Meeting" : "Scheduled Meeting");

    setIsSubmittingTitle(true);

    if (meetingMode === "instant") {
      if (onStartInstantMeeting) {
        onStartInstantMeeting(cleanTitle);
        setShowTitleModal(false);
        setIsSubmittingTitle(false);
      } else {
        try {
          toast.info("Starting instant meeting...", {
            description: `Creating room "${cleanTitle}"...`,
          });
          const res = await createMeeting(cleanTitle);
          setShowTitleModal(false);
          router.push(`/room/${res.roomCode}`);
        } catch (err: any) {
          setIsSubmittingTitle(false);
          toast.error("Failed to start meeting", {
            description: err.message || "Please try again.",
          });
        }
      }
    } else {
      try {
        toast.info("Generating room link...", {
          description: `Creating room "${cleanTitle}"...`,
        });
        const res = await createMeeting(cleanTitle);
        setGeneratedCode(res.roomCode);
        setShowTitleModal(false);
        setShowLinkModal(true);
      } catch (err: any) {
        toast.error("Failed to create meeting", {
          description: err.message || "Please try again.",
        });
      } finally {
        setIsSubmittingTitle(false);
      }
    }
  };

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${origin}/room/${generatedCode}`;
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
      {/* Green "New" Meeting Button with rounded-xl box shape */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
      >
        <Video className="w-4 h-4 shrink-0" />
        <span>New meeting</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-stone-100 dark:divide-stone-800">
          <button
            type="button"
            onClick={handleOpenForLater}
            className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs sm:text-sm text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/70 transition-colors cursor-pointer first:rounded-t-2xl"
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
            onClick={handleOpenInstant}
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
            className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs sm:text-sm text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/70 transition-colors cursor-pointer last:rounded-b-2xl"
          >
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-stone-900 dark:text-stone-100">Schedule in Calendar</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Plan upcoming calls with invites</p>
            </div>
          </button>
        </div>
      )}

      {/* Ask Meeting Title Modal Dialog */}
      {showTitleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingTitle) {
              setShowTitleModal(false);
            }
          }}
        >
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    {meetingMode === "instant" ? "Start Instant Meeting" : "Create Meeting for Later"}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Enter a title before starting your video session
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSubmittingTitle}
                onClick={() => setShowTitleModal(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-sm font-semibold cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTitleSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                  Meeting Title
                </label>
                <div className="relative">
                  <Input
                    autoFocus
                    type="text"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="e.g. Design Catchup, Team Sync..."
                    maxLength={80}
                    className="h-10 text-sm dark:bg-stone-800 dark:border-stone-700 rounded-xl focus-visible:ring-1 pr-8"
                  />
                  {meetingTitle && (
                    <button
                      type="button"
                      onClick={() => setMeetingTitle("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                      title="Clear title"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick suggestions - hidden once a suggestion/title is selected */}
              {!meetingTitle.trim() && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500">Suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["Daily Standup", "Design Review", "Team Sync", "Quick Discussion"].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        disabled={isSubmittingTitle}
                        onClick={() => setMeetingTitle(suggestion)}
                        className="px-2.5 py-1 rounded-lg text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmittingTitle}
                  onClick={() => setShowTitleModal(false)}
                  className="rounded-xl text-xs h-9 px-4 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingTitle}
                  className="rounded-xl text-xs h-9 px-4 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200 font-semibold gap-1.5 shadow-xs cursor-pointer"
                >
                  {isSubmittingTitle ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>{meetingMode === "instant" ? "Start Meeting" : "Generate Link"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
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
                {typeof window !== "undefined" ? window.location.origin : ""}/room/{generatedCode}
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
                  router.push(`/room/${generatedCode}`);
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
