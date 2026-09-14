"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useSession } from "@/lib/auth-client";
import {
  getMeeting,
  joinMeeting,
  leaveMeeting,
  getActiveParticipants,
  getSavedGuestIdentity,
  saveGuestIdentity,
  submitMeetingFeedback,
  MeetingDetails,
  ParticipantInfo,
} from "@/lib/meetings-client";
import { toast } from "@/samvadComponents/toastMessage";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  Copy,
  Check,
  Crown,
  Sparkles,
  AlertTriangle,
  Clock,
  ArrowLeft,
  X,
  Volume2,
  Hand,
  Shield,
  User,
  LogIn,
  ArrowRight,
  LogOut,
  ChevronUp,
  Star,
} from "lucide-react";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted
    ? resolvedTheme === "dark"
    : typeof document !== "undefined"
    ? document.documentElement.classList.contains("dark")
    : false;

  const roomCode = Array.isArray(params.roomCode)
    ? params.roomCode[0]
    : (params.roomCode as string) || "";

  // Core Room State
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [errorStatus, setErrorStatus] = useState<"none" | "not_found" | "ended" | "error">("none");
  const [errorMessage, setErrorMessage] = useState("");
  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Guest Lobby State
  const [guestNameInput, setGuestNameInput] = useState("");

  // Room Controls State
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isIslActive, setIsIslActive] = useState(true);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Concluded Meeting Feedback State
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize guest name from localStorage
  useEffect(() => {
    const saved = getSavedGuestIdentity();
    if (saved.name) {
      setGuestNameInput(saved.name);
    }
  }, []);

  // Clean up any browser extension drawing overlays (e.g. Web Paint) if present on feedback screen
  useEffect(() => {
    if (errorStatus === "ended" && typeof window !== "undefined") {
      const purge = () => {
        document
          .querySelectorAll('canvas, [id*="paint"], [class*="paint"], [id*="draw"], [class*="draw"]')
          .forEach((el) => {
            try {
              (el as HTMLElement).style.display = "none";
              el.remove();
            } catch {}
          });
      };
      purge();
      const interval = setInterval(purge, 400);
      return () => clearInterval(interval);
    }
  }, [errorStatus]);

  // 1. Fetch meeting info on mount to validate existence
  useEffect(() => {
    if (!roomCode) return;

    let isMounted = true;

    async function loadMeetingData() {
      try {
        setLoading(true);
        setErrorStatus("none");
        const data = await getMeeting(roomCode);

        if (!isMounted) return;
        setMeeting(data);

        if (data.status === "ended") {
          setErrorStatus("ended");
          setLoading(false);
          return;
        }

        // If session is still loading, wait for session check
        if (isSessionLoading) return;

        // If user is authenticated, join immediately
        if (session?.user) {
          const res = await joinMeeting(roomCode);
          if (!isMounted) return;
          const uid = res.currentUser?.id || session.user.id;
          setCurrentUserId(uid);
          setParticipants(res.participants);
          if (res.meeting) setMeeting(res.meeting);
          setHasJoined(true);
          setLoading(false);
          toast.success("Joined room", {
            description: `Connected to ${res.meeting?.title || data.title || roomCode}`,
            duration: 3000,
          });
          return;
        }

        // If user is guest: check if they are the host who just created this room
        const saved = getSavedGuestIdentity();
        if (saved.id && data.hostId === saved.id) {
          // Auto-join host
          const res = await joinMeeting(roomCode, saved.name || "Host");
          if (!isMounted) return;
          const uid = res.currentUser?.id || saved.id;
          setCurrentUserId(uid);
          setParticipants(res.participants);
          if (res.meeting) setMeeting(res.meeting);
          setHasJoined(true);
          setLoading(false);
          toast.success("Room ready", {
            description: `You are hosting ${res.meeting?.title || data.title || roomCode}`,
            duration: 3000,
          });
          return;
        }

        // Guest participant: ready to show lobby
        setLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        setLoading(false);
        if (err.statusCode === 404) {
          setErrorStatus("not_found");
          setErrorMessage(err.message || "Meeting room does not exist.");
        } else if (err.statusCode === 400 || err.statusCode === 410 || err.message?.includes("ended")) {
          setErrorStatus("ended");
          setErrorMessage("This meeting has already ended by the host.");
        } else {
          setErrorStatus("error");
          setErrorMessage(err.message || "Unable to load meeting.");
        }
      }
    }

    loadMeetingData();

    return () => {
      isMounted = false;
    };
  }, [roomCode, isSessionLoading, session]);

  // Handler for joining as guest
  const handleGuestJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isJoiningRoom || !roomCode) return;

    try {
      setIsJoiningRoom(true);
      const chosenName = guestNameInput.trim() || "Guest";
      saveGuestIdentity(getSavedGuestIdentity().id || "", chosenName);

      const res = await joinMeeting(roomCode, chosenName);
      if (res.currentUser?.id) {
        setCurrentUserId(res.currentUser.id);
      }
      setMeeting(res.meeting);
      setParticipants(res.participants);
      setHasJoined(true);

      toast.success("Joined room as guest", {
        description: `Welcome, ${chosenName}! You are connected.`,
        duration: 3000,
      });
    } catch (err: any) {
      if (err.statusCode === 404) {
        setErrorStatus("not_found");
      } else if (err.message?.includes("ended")) {
        setErrorStatus("ended");
      } else {
        toast.error("Failed to join room", {
          description: err.message || "Please check your connection and try again.",
        });
      }
    } finally {
      setIsJoiningRoom(false);
    }
  };

  // 2. Real-time participant presence polling (every 2.5s)
  useEffect(() => {
    if (!hasJoined || errorStatus !== "none" || !roomCode) return;

    const pollParticipants = async () => {
      try {
        const latest = await getActiveParticipants(roomCode);
        setParticipants(latest);
      } catch (err: any) {
        if (err.statusCode === 404 || err.message?.includes("ended")) {
          setErrorStatus("ended");
          setErrorMessage("This meeting has ended.");
        }
      }
    };

    pollingRef.current = setInterval(pollParticipants, 2500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [hasJoined, errorStatus, roomCode]);

  // 3. Meeting Elapsed Timer
  useEffect(() => {
    if (!hasJoined || errorStatus !== "none") return;

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasJoined, errorStatus]);

  // 4. Handle window close / unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (roomCode && hasJoined) {
        const activeId = currentUserId || session?.user?.id || getSavedGuestIdentity().id || "";
        const apiBase =
          window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            ? "http://localhost:4000"
            : "https://samvad-api.qixolabs.com";
        navigator.sendBeacon?.(
          `${apiBase}/api/meetings/${roomCode}/leave`,
          JSON.stringify({ endForAll: false, userId: activeId })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [roomCode, hasJoined, currentUserId, session]);

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${origin}/room/${roomCode}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopiedLink(true);
    toast.success("Room link copied!", {
      description: "Share this link with anyone to join.",
      duration: 3000,
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLeave = async (endForAll = false) => {
    setIsLeaving(true);
    const activeId = currentUserId || session?.user?.id || getSavedGuestIdentity().id || "";
    try {
      await leaveMeeting(roomCode, endForAll, activeId);
    } catch {
      // ignore
    } finally {
      setIsLeaving(false);
      if (endForAll) {
        // Concluded for all: show feedback screen to host
        setErrorStatus("ended");
      } else {
        toast.info("Left meeting", {
          description: "You have disconnected from the room.",
        });
        router.push(session?.user ? "/dashboard" : "/");
      }
    }
  };

  const handleFeedbackSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmittingFeedback) return;
    try {
      setIsSubmittingFeedback(true);
      const activeId = currentUserId || session?.user?.id || getSavedGuestIdentity().id || "";
      await submitMeetingFeedback(roomCode, {
        rating: selectedRating || 5,
        comment: feedbackComment.trim() || undefined,
        userId: activeId,
      });
    } catch {
      // Continue even if network error
    } finally {
      setIsSubmittingFeedback(false);
      toast.success("Thank you for your feedback!", {
        description: "Your response helps us improve Samvad.",
        duration: 3000,
      });
      router.push(session?.user ? "/dashboard" : "/");
    }
  };

  const handleFeedbackSkip = () => {
    router.push(session?.user ? "/dashboard" : "/");
  };

  const effectiveUserId =
    currentUserId ||
    session?.user?.id ||
    getSavedGuestIdentity().id;

  const isHost = Boolean(
    (meeting && effectiveUserId && meeting.hostId === effectiveUserId) ||
    participants.some(
      (p) =>
        (p.id === effectiveUserId ||
         (session?.user?.id && p.id === session.user.id) ||
         (currentUserId && p.id === currentUserId)) &&
        p.role === "host"
    )
  );

  // Render Loading State
  if (loading || isSessionLoading) {
    return (
      <div className="w-full h-screen bg-[#121212] text-stone-200 flex flex-col items-center justify-center gap-4 select-none">
        <div className="w-10 h-10 rounded-full border-3 border-emerald-500/30 border-t-emerald-500 animate-spin" />
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-base font-semibold text-white tracking-tight">
            Preparing Room
          </p>
          <p className="text-xs text-stone-400 font-mono tracking-wider">
            {roomCode.toUpperCase()}
          </p>
        </div>
      </div>
    );
  }

  // Render Edge Case: Meeting Not Found (404)
  if (errorStatus === "not_found") {
    return (
      <div className="w-full h-screen bg-[#faf9f7] dark:bg-[#121212] text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center p-6 select-none transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 shadow-xl flex flex-col items-center text-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 stroke-[2]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">
              Meeting not found
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              We couldn't find a meeting matching room code{" "}
              <span className="font-mono font-semibold text-stone-800 dark:text-stone-200">
                {roomCode}
              </span>
              . Check the code or create a new room.
            </p>
          </div>
          <div className="w-full flex flex-col gap-2.5 pt-2">
            <Link
              href={session?.user ? "/dashboard" : "/"}
              className="w-full py-3 px-5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-950 text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{session?.user ? "Back to Dashboard" : "Return to Home"}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }



  // Render Edge Case: Meeting Ended Feedback Screen (Matching feedback-img.png mockup)
  if (errorStatus === "ended") {
    const currentRating = hoverRating || selectedRating;

    return (
      <div className="w-full min-h-screen bg-white dark:bg-[#0e0f12] text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors select-none">
        <style
          dangerouslySetInnerHTML={{
            __html: `
              canvas,
              [id*="webpaint"],
              [class*="webpaint"],
              [id*="paint"],
              [class*="paint"],
              [id*="draw"],
              [class*="draw"] {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
              }
            `,
          }}
        />
        <div className="w-full max-w-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
          {/* Top Illustration from /feedback-img.png (light) and /feedback-img-dark-v2.svg (dark) */}
          <div className="w-full max-w-lg mb-6 sm:mb-8 relative flex justify-center">
            <Image
              key={isDark ? "feedback-dark-v2" : "feedback-light"}
              src={isDark ? "/feedback-img-dark-v2.svg" : "/feedback-img.png"}
              alt="How was your meeting?"
              width={640}
              height={360}
              priority
              suppressHydrationWarning
              className="w-full h-auto max-h-[260px] sm:max-h-[310px] object-contain"
            />
          </div>

          {/* Heading and Subtext */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-white tracking-tight">
            How was your meeting?
          </h1>
          <p className="text-sm sm:text-base text-stone-500 dark:text-stone-400 mt-2 max-w-md leading-relaxed">
            Your feedback helps us make Samvad better for everyone.
          </p>

          {/* Star Rating Section */}
          <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm mt-6">
            <div className="flex items-center justify-between w-full gap-2.5 sm:gap-3">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isFilled = currentRating >= starValue;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setSelectedRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border transition-all cursor-pointer active:scale-95 ${
                      isFilled
                        ? "bg-[#7075f7]/15 dark:bg-[#7075f7]/25 border-[#7075f7]/50 text-[#7075f7] shadow-xs"
                        : "bg-[#f0f3fa] dark:bg-stone-800/80 border-[#e2e8f5] dark:border-stone-700/80 text-[#1e2538] dark:text-stone-300 hover:border-[#c8d4ee] dark:hover:border-stone-600"
                    }`}
                    aria-label={`${starValue} star rating`}
                  >
                    <Star
                      className={`w-6 h-6 sm:w-7 sm:h-7 stroke-[1.6] transition-all ${
                        isFilled
                          ? "fill-[#7075f7] text-[#7075f7]"
                          : "text-[#1e2538] dark:text-stone-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Labels under stars: Poor on left, Excellent on right */}
            <div className="flex items-center justify-between w-full mt-2 px-1 text-xs text-stone-500 dark:text-stone-400 font-medium">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Comment input */}
          <div className="w-full max-w-md mt-5">
            <input
              type="text"
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Tell us more (optional)..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleFeedbackSubmit(e);
                }
              }}
              className="w-full px-4 py-3 rounded-xl border border-[#d6def0] dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white text-sm placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#7075f7]/30 focus:border-[#7075f7] transition-all shadow-xs"
            />
          </div>

          {/* Action buttons: Skip & Submit Feedback */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6">
            <button
              type="button"
              onClick={handleFeedbackSkip}
              className="px-7 py-2.5 rounded-xl text-sm font-medium bg-[#eef0f8] hover:bg-[#e2e6f3] dark:bg-stone-800 dark:hover:bg-stone-700 text-[#373d57] dark:text-stone-200 transition-all cursor-pointer active:scale-95"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleFeedbackSubmit}
              disabled={isSubmittingFeedback}
              className="px-7 py-2.5 rounded-xl text-sm font-medium bg-[#7075f7] hover:bg-[#5f64f5] active:bg-[#4f54e6] text-white shadow-md shadow-indigo-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-60 flex items-center gap-2"
            >
              {isSubmittingFeedback ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Feedback</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Pre-Join Guest Lobby (If not logged in and not yet joined)
  if (!hasJoined && !session?.user) {
    return (
      <div className="w-full min-h-screen bg-stone-50 dark:bg-[#0e0f12] text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors">
        <div className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-stone-900 dark:text-white leading-tight">
                  {meeting?.title || "Samvad Meeting"}
                </h1>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                  Room: {roomCode}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>

          {/* Meeting Details Card */}
          <div className="rounded-2xl bg-stone-100/70 dark:bg-stone-800/50 p-4 border border-stone-200/60 dark:border-stone-700/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-stone-300 dark:bg-stone-700 flex items-center justify-center text-sm font-semibold text-stone-700 dark:text-stone-200">
                {meeting?.hostName?.[0]?.toUpperCase() || "H"}
              </div>
              <div>
                <p className="text-xs text-stone-500 dark:text-stone-400">Host</p>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {meeting?.hostName || "Meeting Organizer"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500 dark:text-stone-400">Access</p>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Open to anyone
              </p>
            </div>
          </div>

          {/* Guest Name Form */}
          <form onSubmit={handleGuestJoin} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="guest-name"
                className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Your Display Name</span>
              </label>
              <input
                id="guest-name"
                type="text"
                value={guestNameInput}
                onChange={(e) => setGuestNameInput(e.target.value)}
                placeholder="Enter your name (e.g. Alex)"
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white text-sm placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              />
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                This name will be shown to other participants in the room. No password or sign-up needed.
              </p>
            </div>

            <button
              type="submit"
              disabled={isJoiningRoom}
              className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-950/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isJoiningRoom ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Entering room...</span>
                </>
              ) : (
                <>
                  <span>Join Meeting Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Login Alternative Link */}
          <div className="border-t border-stone-100 dark:border-stone-800/80 pt-4 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>Have a Samvad account?</span>
            <Link
              href={`/login?redirect=/room/${roomCode}`}
              className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log in to join with profile</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active Meeting Room Layout
  return (
    <div className="w-full h-screen bg-[#0e0f12] text-stone-100 flex flex-col overflow-hidden select-none">
      {/* Top Navigation Bar */}
      <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-stone-800/80 bg-[#0e0f12]/95 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (isHost) {
                setShowEndConfirm(true);
              } else {
                handleLeave(false);
              }
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800/60 transition-colors cursor-pointer"
            title={isHost ? "Host Options" : "Leave Meeting"}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm sm:text-base font-semibold text-white truncate max-w-[180px] sm:max-w-sm">
              {meeting?.title || "Instant Meeting"}
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-stone-800/80 text-stone-300 border border-stone-700/50">
              {roomCode}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Elapsed Room Timer */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/60 text-stone-300 text-xs font-mono border border-stone-700/40">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>{formatDuration(elapsedSeconds)}</span>
          </div>

          {/* Copy Room Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700/80 text-stone-200 text-xs font-medium border border-stone-700/60 transition-all cursor-pointer active:scale-95 shadow-xs"
            title="Copy Meeting Invite Link"
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-stone-400" />
            )}
            <span className="hidden sm:inline">
              {copiedLink ? "Link Copied!" : "Copy Link"}
            </span>
          </button>

          {/* Toggle Participants Button */}
          <button
            type="button"
            onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              isParticipantsOpen
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-stone-800 hover:bg-stone-700/80 border-stone-700/60 text-stone-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{participants.length}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Central Stage: Video Grid */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col justify-center items-center">
          <div
            className={`w-full max-w-6xl h-full flex flex-wrap items-center justify-center gap-4 transition-all duration-300 ${
              participants.length === 1
                ? "max-h-[78vh]"
                : participants.length === 2
                ? "grid grid-cols-1 md:grid-cols-2 max-h-[78vh]"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-h-[78vh]"
            }`}
          >
            {participants.map((p) => {
              const isCurrentUser =
                p.id === currentUserId ||
                p.id === session?.user?.id ||
                p.id === getSavedGuestIdentity().id;
              const isParticipantHost = p.role === "host" || (meeting && p.id === meeting.hostId);
              const initials = (p.name || p.email || "U")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .substring(0, 2);

              return (
                <div
                  key={p.id}
                  className="relative w-full h-full min-h-[260px] sm:min-h-[320px] rounded-3xl bg-gradient-to-b from-stone-900 to-[#14151a] border border-stone-800/90 shadow-2xl flex flex-col items-center justify-center overflow-hidden group transition-all"
                >
                  {/* Subtle Background Glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_70%)] pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      {isParticipantHost && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>Host</span>
                        </span>
                      )}
                      {isIslActive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>ISL Active</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Center Avatar / Video Placeholder */}
                  <div className="flex flex-col items-center justify-center gap-4 z-10">
                    <div className="relative">
                      {/* Audio Pulse Ring Animation */}
                      <div className="absolute -inset-2.5 rounded-full bg-emerald-500/20 animate-pulse opacity-75" />
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-stone-700 to-stone-900 border-2 border-stone-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold tracking-tight shadow-xl">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center text-center">
                      <p className="text-base sm:text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                        <span>{p.name || (p.id.startsWith("guest_") ? "Guest" : p.email)}</span>
                        {isCurrentUser && (
                          <span className="text-xs text-stone-400 font-normal">
                            (You)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-stone-500 font-mono mt-0.5">
                        {p.id.startsWith("guest_") ? "Guest participant" : p.email}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Tile Info Pill */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10 text-xs text-stone-400">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-950/70 border border-stone-800/80 backdrop-blur-xs">
                      {isCurrentUser && isMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span className="text-[11px] text-stone-300">
                        {isCurrentUser ? (isMuted ? "Muted" : "Speaking") : "Audio Ready"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-950/70 border border-stone-800/80 backdrop-blur-xs text-[11px] text-stone-400">
                      <Shield className="w-3 h-3 text-stone-500" />
                      <span>Encrypted</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Slide-out Participants Drawer */}
        {isParticipantsOpen && (
          <aside className="w-80 h-full border-l border-stone-800 bg-[#121318] flex flex-col shrink-0 z-20 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">
                  People in room ({participants.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsParticipantsOpen(false)}
                className="w-7 h-7 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Invite Link Banner */}
            <div className="p-4 border-b border-stone-800/80 bg-stone-900/40">
              <p className="text-xs text-stone-400 mb-2">
                Invite others to this room:
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700/80 text-white text-xs font-medium flex items-center justify-center gap-2 border border-stone-700/60 transition-colors"
              >
                {copiedLink ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-stone-400" />
                )}
                <span>{copiedLink ? "Link Copied" : "Copy Meeting Link"}</span>
              </button>
            </div>

            {/* Participants List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {participants.map((p) => {
                const isUser =
                  p.id === currentUserId ||
                  p.id === session?.user?.id ||
                  p.id === getSavedGuestIdentity().id;
                const isHostUser = p.role === "host" || (meeting && p.id === meeting.hostId);
                const initials = (p.name || p.email || "U")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .substring(0, 2);

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-xs font-semibold text-stone-200 shrink-0">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate flex items-center gap-1.5">
                          <span>{p.name || (p.id.startsWith("guest_") ? "Guest" : p.email)}</span>
                          {isUser && (
                            <span className="text-[10px] text-stone-400 font-normal">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-stone-500 font-mono truncate">
                          {p.id.startsWith("guest_") ? "Guest participant" : p.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isHostUser && (
                        <span className="p-1 rounded-md text-amber-400 bg-amber-400/10" title="Meeting Host">
                          <Crown className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <div className="p-1 text-stone-400">
                        <Volume2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Control Bar */}
      <footer className="h-20 px-4 sm:px-8 border-t border-stone-800/80 bg-[#0e0f12] flex items-center justify-center relative z-30 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mute Audio Button */}
          <button
            type="button"
            onClick={() => {
              setIsMuted(!isMuted);
              toast.info(isMuted ? "Microphone unmuted" : "Microphone muted", {
                duration: 2000,
              });
            }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
              isMuted
                ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
                : "bg-stone-800 text-white hover:bg-stone-700 border border-stone-700/70"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Camera Button */}
          <button
            type="button"
            onClick={() => {
              setIsVideoOff(!isVideoOff);
              toast.info(isVideoOff ? "Camera turned on" : "Camera turned off", {
                duration: 2000,
              });
            }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
              isVideoOff
                ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
                : "bg-stone-800 text-white hover:bg-stone-700 border border-stone-700/70"
            }`}
            title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* ISL Sign Detection Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsIslActive(!isIslActive);
              toast.info(
                isIslActive ? "ISL Detection Paused" : "ISL AI Detection Enabled",
                { duration: 2500 }
              );
            }}
            className={`px-4 h-12 rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 border ${
              isIslActive
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 font-medium"
                : "bg-stone-800 text-stone-400 hover:bg-stone-700 border-stone-700/70"
            }`}
            title="Indian Sign Language AI Detector"
          >
            <Hand className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">
              {isIslActive ? "ISL Active" : "ISL Disabled"}
            </span>
          </button>

          {/* Toggle Participants Side Panel */}
          <button
            type="button"
            onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 border ${
              isParticipantsOpen
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-stone-800 text-white hover:bg-stone-700 border-stone-700/70"
            }`}
            title="Participants List"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* Leave / End Meeting Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (isHost) {
                  setShowEndConfirm(true);
                } else {
                  handleLeave(false);
                }
              }}
              disabled={isLeaving}
              className="px-5 h-12 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-red-950/40 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <PhoneOff className="w-4 h-4" />
              <span>{isLeaving ? "Leaving..." : isHost ? "End / Leave" : "Leave"}</span>
              {isHost && <ChevronUp className="w-3.5 h-3.5 opacity-80" />}
            </button>
          </div>
        </div>
      </footer>

      {/* Host Leave / End Modal */}
      {showEndConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowEndConfirm(false)}
        >
          <div
            className="w-full max-w-md bg-[#16171e] border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Host Options</h2>
                  <p className="text-xs text-stone-400">Leave or end meeting</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="w-8 h-8 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              As the host, you can choose to leave the meeting on your own, or conclude the meeting for all participants.
            </p>

            {/* Option Cards */}
            <div className="flex flex-col gap-3">
              {/* Option 1: End Meeting for All */}
              <button
                type="button"
                onClick={() => {
                  setShowEndConfirm(false);
                  handleLeave(true);
                }}
                disabled={isLeaving}
                className="w-full p-4 rounded-2xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 hover:border-red-500/50 text-left transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-950/50">
                    <PhoneOff className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-red-200 transition-colors">
                      End meeting for all
                    </h3>
                    <p className="text-xs text-stone-400">
                      Concludes the meeting and disconnects everyone
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              {/* Option 2: Just Leave Meeting */}
              <button
                type="button"
                onClick={() => {
                  setShowEndConfirm(false);
                  handleLeave(false);
                }}
                disabled={isLeaving}
                className="w-full p-4 rounded-2xl bg-stone-800/60 hover:bg-stone-800 border border-stone-700/60 hover:border-stone-600 text-left transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-stone-700 text-stone-200 flex items-center justify-center shrink-0">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-stone-200 transition-colors">
                      Leave meeting
                    </h3>
                    <p className="text-xs text-stone-400">
                      You will leave, but others can stay in the room
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setShowEndConfirm(false)}
              className="w-full py-2.5 rounded-xl text-stone-400 hover:text-white text-xs font-medium text-center transition-colors cursor-pointer"
            >
              Cancel, keep meeting active
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
