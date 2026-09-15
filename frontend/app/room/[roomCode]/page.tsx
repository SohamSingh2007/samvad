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
  checkJoinStatus,
  getWaitingParticipants,
  admitParticipant,
  denyParticipant,
  updateMeetingAccessPolicy,
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
  Lock,
  Globe,
  UserCheck,
  UserX,
  MoreVertical,
  MessageSquare,
  Info,
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
  const [errorStatus, setErrorStatus] = useState<"none" | "not_found" | "ended" | "error" | "rejected">("none");
  const [errorMessage, setErrorMessage] = useState("");
  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Waiting Room State
  const [isWaitingForHost, setIsWaitingForHost] = useState(false);
  const [waitingParticipants, setWaitingParticipants] = useState<ParticipantInfo[]>([]);
  const [isUpdatingAccessPolicy, setIsUpdatingAccessPolicy] = useState(false);
  const [admittingUserId, setAdmittingUserId] = useState<string | null>(null);
  const [denyingUserId, setDenyingUserId] = useState<string | null>(null);
  const [isAdmittingAll, setIsAdmittingAll] = useState(false);

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
  const waitingVideoRef = useRef<HTMLVideoElement | null>(null);
  const [showWaitingInfo, setShowWaitingInfo] = useState(false);

  // Manage webcam preview stream when attendee is in Waiting Room
  useEffect(() => {
    if (!isWaitingForHost || isVideoOff) {
      if (waitingVideoRef.current && waitingVideoRef.current.srcObject) {
        const stream = waitingVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        waitingVideoRef.current.srcObject = null;
      }
      return;
    }

    let isMounted = true;
    let localStream: MediaStream | null = null;

    navigator.mediaDevices
      ?.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      .then((stream) => {
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStream = stream;
        if (waitingVideoRef.current) {
          waitingVideoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        // Camera access blocked or unallowed
      });

    return () => {
      isMounted = false;
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (waitingVideoRef.current && waitingVideoRef.current.srcObject) {
        waitingVideoRef.current.srcObject = null;
      }
    };
  }, [isWaitingForHost, isVideoOff]);

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
          if (res.meeting) setMeeting(res.meeting);

          if (res.status === "waiting") {
            setIsWaitingForHost(true);
            setLoading(false);
            return;
          }

          if (res.status === "rejected") {
            setErrorStatus("rejected");
            setErrorMessage("The host has declined your request to join this meeting.");
            setLoading(false);
            return;
          }

          setParticipants(res.participants);
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
      if (res.meeting) setMeeting(res.meeting);

      if (res.status === "waiting") {
        setIsWaitingForHost(true);
        toast.info("Waiting for host approval", {
          description: "Your join request has been sent to the host.",
          duration: 3500,
        });
        return;
      }

      if (res.status === "rejected") {
        setErrorStatus("rejected");
        setErrorMessage("The host has declined your request to join this meeting.");
        return;
      }

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

  // 1b. Polling for waiting attendee approval (every 2s)
  useEffect(() => {
    if (!isWaitingForHost || hasJoined || !roomCode) return;

    const activeId = currentUserId || session?.user?.id || getSavedGuestIdentity().id || "";
    if (!activeId) return;

    let isCancelled = false;

    const checkStatus = async () => {
      try {
        const res = await checkJoinStatus(roomCode, activeId);
        if (isCancelled) return;
        if (res.status === "active") {
          // Host admitted user! Re-join room to receive participant state
          const chosenName = guestNameInput.trim() || session?.user?.name || "Guest";
          const joinRes = await joinMeeting(roomCode, chosenName);
          if (isCancelled) return;
          if (joinRes.meeting) setMeeting(joinRes.meeting);
          setParticipants(joinRes.participants);
          setIsWaitingForHost(false);
          setHasJoined(true);
          toast.success("Admitted to meeting!", {
            description: "The host has approved your entry into the room.",
            duration: 3500,
          });
        } else if (res.status === "rejected") {
          setIsWaitingForHost(false);
          setErrorStatus("rejected");
          setErrorMessage("The host has declined your request to join.");
        }
      } catch (err: any) {
        if (err.statusCode === 404 || err.message?.includes("ended")) {
          setIsWaitingForHost(false);
          setErrorStatus("ended");
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [isWaitingForHost, hasJoined, roomCode, currentUserId, session, guestNameInput]);

  // 1c. Host polling for waiting participants (every 2.5s)
  useEffect(() => {
    if (!hasJoined || !isHost || !roomCode || errorStatus !== "none") return;

    const activeId = currentUserId || session?.user?.id || getSavedGuestIdentity().id || "";
    let isCancelled = false;

    const pollWaiting = async () => {
      try {
        const waiting = await getWaitingParticipants(roomCode, activeId);
        if (!isCancelled) {
          setWaitingParticipants(waiting);
        }
      } catch {
        // silently ignore
      }
    };

    pollWaiting();
    const interval = setInterval(pollWaiting, 2500);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [hasJoined, isHost, roomCode, errorStatus, currentUserId, session]);

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

  const handleToggleAccessPolicy = async () => {
    if (!meeting || isUpdatingAccessPolicy) return;
    const nextPolicy = meeting.accessPolicy === "approval" ? "open" : "approval";
    const activeId = currentUserId || session?.user?.id || getSavedGuestIdentity().id || "";
    try {
      setIsUpdatingAccessPolicy(true);
      const res = await updateMeetingAccessPolicy(roomCode, nextPolicy, activeId);
      setMeeting((prev) => (prev ? { ...prev, accessPolicy: res.accessPolicy } : prev));
      toast.success(
        nextPolicy === "approval" ? "Waiting Room Enabled" : "Room Opened to Everyone",
        {
          description:
            nextPolicy === "approval"
              ? "Participants will need your approval before joining."
              : "Anyone with the link can now join directly.",
          duration: 3500,
        }
      );
      if (nextPolicy === "open") {
        setWaitingParticipants([]);
      }
    } catch (err: any) {
      toast.error("Failed to update access policy", {
        description: err.message || "Please try again.",
      });
    } finally {
      setIsUpdatingAccessPolicy(false);
    }
  };

  const handleAdmitParticipant = async (targetUserId?: string, admitAll = false) => {
    const activeId = currentUserId || session?.user?.id || getSavedGuestIdentity().id || "";
    try {
      if (admitAll) setIsAdmittingAll(true);
      else if (targetUserId) setAdmittingUserId(targetUserId);

      await admitParticipant(roomCode, targetUserId, admitAll, activeId);

      if (admitAll) {
        toast.success("Admitted all waiting participants");
        setWaitingParticipants([]);
      } else if (targetUserId) {
        setWaitingParticipants((prev) => prev.filter((p) => p.id !== targetUserId));
        toast.success("Participant admitted");
      }
      const latest = await getActiveParticipants(roomCode);
      setParticipants(latest);
    } catch (err: any) {
      toast.error("Failed to admit participant", { description: err.message });
    } finally {
      setIsAdmittingAll(false);
      setAdmittingUserId(null);
    }
  };

  const handleDenyParticipant = async (targetUserId: string) => {
    const activeId = currentUserId || session?.user?.id || getSavedGuestIdentity().id || "";
    try {
      setDenyingUserId(targetUserId);
      await denyParticipant(roomCode, targetUserId, activeId);
      setWaitingParticipants((prev) => prev.filter((p) => p.id !== targetUserId));
      toast.info("Participant request declined");
    } catch (err: any) {
      toast.error("Failed to deny participant", { description: err.message });
    } finally {
      setDenyingUserId(null);
    }
  };

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

  // Render Edge Case: Meeting Join Request Rejected
  if (errorStatus === "rejected") {
    return (
      <div className="w-full min-h-screen bg-stone-50 dark:bg-[#0e0f12] text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center p-6 select-none transition-colors bg-dot-grid">
        <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 shadow-xl flex flex-col items-center text-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
            <X className="w-7 h-7 stroke-[2]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">
              Request Declined
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              {errorMessage || "The host has declined your request to join this meeting."}
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

  // Render Waiting Room Screen (Attendee waiting for host approval, inspired by Google Meet)
  if (!hasJoined && isWaitingForHost) {
    const attendeeDisplayName = guestNameInput.trim() || session?.user?.name || "Guest";
    const initials = attendeeDisplayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

    return (
      <div className="w-full h-screen relative bg-[#faf9f7] dark:bg-[#131314] text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none bg-dot-grid transition-colors">
        {/* Subtle Ambient Glow */}
        <div className="absolute inset-0 dark:bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03)_0%,transparent_70%)] pointer-events-none" />

        {/* Center Section: Illustration + Waiting Message */}
        <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto px-4 z-10 -mt-10 sm:-mt-14">
          {/* Waiting Room Illustration: Light mode vs Dark mode */}
          <div className="w-full max-w-[380px] sm:max-w-[460px] h-auto flex items-center justify-center">
            <Image
              src="/waiting-room-img.svg"
              alt="Waiting for host to let you in"
              width={460}
              height={260}
              className="w-full h-auto drop-shadow-md dark:hidden"
              priority
            />
            <Image
              src="/waiting-room-img-dark.svg"
              alt="Waiting for host to let you in"
              width={460}
              height={260}
              className="w-full h-auto drop-shadow-md hidden dark:block"
              priority
            />
          </div>

          {/* Spinner and Status Text */}
          <div className="flex items-center justify-center gap-3 mt-5 sm:mt-7 text-sm sm:text-base font-medium text-stone-800 dark:text-stone-200 tracking-tight">
            <div className="w-4 h-4 rounded-full border-2 border-[#38bdf8]/30 border-t-[#38bdf8] animate-spin shrink-0" />
            <span>Please wait until a meeting host brings you into the call</span>
          </div>

          {/* Meeting Room Metadata Pill */}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200/70 dark:bg-stone-800/60 border border-stone-300/70 dark:border-stone-700/40 text-[11px] text-stone-600 dark:text-stone-400 font-mono backdrop-blur-xs">
            <span className="text-stone-900 dark:text-stone-300 font-sans font-medium">{meeting?.title || "Meeting"}</span>
            <span>•</span>
            <span>{roomCode}</span>
          </div>
        </div>

        {/* Floating Self-Preview Tile (Bottom-Right, exactly like Google Meet reference) */}
        <div className="absolute right-4 bottom-24 sm:right-8 sm:bottom-24 w-52 sm:w-64 h-32 sm:h-38 rounded-2xl bg-[#1e2330] border border-stone-700/60 shadow-2xl overflow-hidden flex flex-col justify-between p-3 z-20 transition-all text-white">
          {/* Live Video Preview Stream */}
          <video
            ref={waitingVideoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
              isVideoOff ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          />

          {/* Avatar Tile Fallback when Video is Off */}
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-gradient-to-br from-[#1b202d] to-[#12151e]">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-stone-800/90 border border-stone-600/50 flex items-center justify-center text-stone-200 text-base sm:text-lg font-semibold shadow-inner">
                {initials || "U"}
              </div>
            </div>
          )}

          {/* Top-Right Mic Muted Indicator Badge */}
          <div className="relative z-10 flex justify-end">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shadow-md ${
                isMuted
                  ? "bg-blue-600 text-white"
                  : "bg-stone-900/80 text-emerald-400 border border-stone-700/50"
              }`}
              title={isMuted ? "Microphone is muted" : "Microphone is on"}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Bottom-Left Attendee Name */}
          <div className="relative z-10 flex items-center">
            <span className="text-xs font-medium text-white truncate max-w-[170px] drop-shadow-md">
              {attendeeDisplayName}
            </span>
          </div>
        </div>

        {/* Floating Bottom Control Dock (Centered Pill, matching Google Meet) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-2.5 px-4 py-2 rounded-full bg-white/95 dark:bg-[#1e1f20]/95 backdrop-blur-md border border-stone-200/90 dark:border-stone-800/90 shadow-2xl">
          {/* Mic Toggle Button with Chevron */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                setIsMuted(!isMuted);
                toast.info(isMuted ? "Microphone turned on" : "Microphone muted", { duration: 2000 });
              }}
              className={`relative p-2.5 rounded-full transition-all cursor-pointer ${
                isMuted
                  ? "bg-stone-100 dark:bg-[#3c4043] hover:bg-stone-200 dark:hover:bg-[#4a4f53] text-stone-700 dark:text-stone-300"
                  : "bg-stone-100 dark:bg-[#3c4043] hover:bg-stone-200 dark:hover:bg-[#4a4f53] text-stone-900 dark:text-white"
              }`}
              title={isMuted ? "Turn on microphone" : "Turn off microphone"}
            >
              {isMuted ? (
                <MicOff className="w-4 h-4 text-red-500 dark:text-red-400" />
              ) : (
                <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )}
              {isMuted && (
                <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white dark:border-[#1e1f20]" />
              )}
            </button>
            <ChevronUp className="w-3 h-3 text-stone-400 dark:text-stone-500 ml-0.5" />
          </div>

          {/* Camera Toggle Button with Chevron */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                setIsVideoOff(!isVideoOff);
                toast.info(isVideoOff ? "Camera turned on" : "Camera turned off", { duration: 2000 });
              }}
              className={`relative p-2.5 rounded-full transition-all cursor-pointer ${
                isVideoOff
                  ? "bg-stone-100 dark:bg-[#3c4043] hover:bg-stone-200 dark:hover:bg-[#4a4f53] text-stone-700 dark:text-stone-300"
                  : "bg-stone-100 dark:bg-[#3c4043] hover:bg-stone-200 dark:hover:bg-[#4a4f53] text-stone-900 dark:text-white"
              }`}
              title={isVideoOff ? "Turn on camera" : "Turn off camera"}
            >
              {isVideoOff ? (
                <VideoOff className="w-4 h-4 text-red-500 dark:text-red-400" />
              ) : (
                <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )}
              {isVideoOff && (
                <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white dark:border-[#1e1f20]" />
              )}
            </button>
            <ChevronUp className="w-3 h-3 text-stone-400 dark:text-stone-500 ml-0.5" />
          </div>

          {/* More Options Button */}
          <button
            type="button"
            onClick={() => setShowWaitingInfo(!showWaitingInfo)}
            className="p-2.5 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-[#3c4043] dark:hover:bg-[#4a4f53] text-stone-700 dark:text-stone-300 transition-all cursor-pointer"
            title="Meeting details"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Red Leave / End Call Pill Button */}
          <button
            type="button"
            onClick={() => {
              setIsWaitingForHost(false);
              toast.info("Left waiting room", { duration: 2000 });
              router.push(session?.user ? "/dashboard" : "/");
            }}
            className="px-5 py-2.5 rounded-full bg-[#ea4335] hover:bg-[#d93025] active:bg-[#c5221f] text-white transition-all cursor-pointer shadow-md flex items-center justify-center active:scale-95 ml-1"
            title="Leave waiting room"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Meeting Details Popover */}
        {showWaitingInfo && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-72 rounded-2xl bg-white/95 dark:bg-stone-900/95 border border-stone-200/90 dark:border-stone-700/60 p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150 text-stone-900 dark:text-white">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-xs font-semibold text-stone-900 dark:text-white">Meeting Info</h3>
              <button
                type="button"
                onClick={() => setShowWaitingInfo(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="py-2.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">Title:</span>
                <span className="text-stone-800 dark:text-stone-200 font-medium truncate max-w-[150px]">{meeting?.title || "Meeting"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">Host:</span>
                <span className="text-stone-800 dark:text-stone-200 font-medium truncate max-w-[150px]">{meeting?.hostName || "Host"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">Code:</span>
                <span className="text-stone-800 dark:text-stone-200 font-mono">{roomCode}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-1.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-medium text-stone-800 dark:text-stone-200 flex items-center justify-center gap-1.5 border border-stone-200 dark:border-stone-700/60 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>
        )}

        {/* Bottom-Right Chat / Info Floating Button */}
        <button
          type="button"
          onClick={() => setShowWaitingInfo(!showWaitingInfo)}
          className="hidden sm:flex absolute right-6 bottom-7 z-20 w-10 h-10 rounded-full bg-white dark:bg-[#1e1f20] hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-stone-800 items-center justify-center shadow-lg transition-colors cursor-pointer"
          title="Meeting info"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Render Pre-Join Guest Lobby (If not logged in and not yet joined)
  if (!hasJoined && !session?.user) {
    return (
      <div className="w-full min-h-screen bg-stone-50 dark:bg-[#0e0f12] text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors bg-dot-grid">
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
              {meeting?.accessPolicy === "approval" ? (
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 justify-end">
                  <Lock className="w-3 h-3" />
                  <span>Approval required</span>
                </p>
              ) : (
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                  <Globe className="w-3 h-3" />
                  <span>Open to anyone</span>
                </p>
              )}
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
                {meeting?.accessPolicy === "approval"
                  ? "This room requires host approval. You'll enter a waiting room after clicking below."
                  : "This name will be shown to other participants in the room. No password or sign-up needed."}
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
                  <span>{meeting?.accessPolicy === "approval" ? "Requesting entry..." : "Entering room..."}</span>
                </>
              ) : meeting?.accessPolicy === "approval" ? (
                <>
                  <span>Ask to Join</span>
                  <ArrowRight className="w-4 h-4" />
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
          {/* Access Policy Toggle Button for Host */}
          {isHost && (
            <button
              type="button"
              onClick={handleToggleAccessPolicy}
              disabled={isUpdatingAccessPolicy}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                meeting?.accessPolicy === "approval"
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25"
                  : "bg-stone-800 hover:bg-stone-700/80 border-stone-700/60 text-stone-200"
              }`}
              title={
                meeting?.accessPolicy === "approval"
                  ? "Waiting room enabled. Click to allow anyone to join directly."
                  : "Anyone can join directly. Click to require host approval."
              }
            >
              {isUpdatingAccessPolicy ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : meeting?.accessPolicy === "approval" ? (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>
                {meeting?.accessPolicy === "approval" ? "Approval Required" : "Anyone Can Join"}
              </span>
            </button>
          )}

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
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              isParticipantsOpen
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-stone-800 hover:bg-stone-700/80 border-stone-700/60 text-stone-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{participants.length}</span>
            {isHost && waitingParticipants.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-stone-950 shadow-md animate-pulse">
                {waitingParticipants.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Host Floating Waiting Room Banner */}
        {isHost && waitingParticipants.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-md w-[92%] sm:w-auto bg-stone-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3 sm:px-4 sm:py-2.5 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 animate-pulse" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold text-white truncate">
                  {waitingParticipants.length === 1
                    ? `${waitingParticipants[0].name || (waitingParticipants[0].id.startsWith("guest_") ? "Guest" : waitingParticipants[0].email)} wants to join`
                    : `${waitingParticipants.length} people in waiting room`}
                </p>
                <p className="text-[10px] text-stone-400">
                  Waiting for your approval
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {waitingParticipants.length === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleDenyParticipant(waitingParticipants[0].id)}
                    disabled={denyingUserId === waitingParticipants[0].id}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-stone-300 hover:text-white hover:bg-stone-800 border border-stone-700 transition-colors cursor-pointer"
                  >
                    {denyingUserId === waitingParticipants[0].id ? "..." : "Deny"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdmitParticipant(waitingParticipants[0].id)}
                    disabled={admittingUserId === waitingParticipants[0].id}
                    className="px-3 py-1 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {admittingUserId === waitingParticipants[0].id ? (
                      <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Admit</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsParticipantsOpen(true)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-stone-300 hover:text-white hover:bg-stone-800 border border-stone-700 transition-colors cursor-pointer"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdmitParticipant(undefined, true)}
                    disabled={isAdmittingAll}
                    className="px-3 py-1 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {isAdmittingAll ? (
                      <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Admit All</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

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

            {/* Waiting Room Section for Host */}
            {isHost && waitingParticipants.length > 0 && (
              <div className="p-3 border-b border-stone-800/80 bg-amber-500/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <h3 className="text-xs font-semibold text-amber-300">
                      Waiting Room ({waitingParticipants.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdmitParticipant(undefined, true)}
                    disabled={isAdmittingAll}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isAdmittingAll ? "Admitting..." : "Admit All"}
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {waitingParticipants.map((wp) => (
                    <div
                      key={wp.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-stone-900/90 border border-stone-800 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-[10px] font-bold text-stone-300 shrink-0">
                          {(wp.name || wp.email || "G").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate text-xs">
                            {wp.name || (wp.id.startsWith("guest_") ? "Guest" : wp.email)}
                          </p>
                          <p className="text-[10px] text-stone-400 font-mono">
                            Waiting to join
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDenyParticipant(wp.id)}
                          disabled={denyingUserId === wp.id}
                          title="Deny entry"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdmitParticipant(wp.id)}
                          disabled={admittingUserId === wp.id}
                          title="Admit to room"
                          className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                        >
                          {admittingUserId === wp.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
