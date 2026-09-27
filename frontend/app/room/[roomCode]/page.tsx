"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useSession } from "@/lib/auth-client";
import { io, Socket } from "socket.io-client";
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
  removeParticipant,
  updateMeetingAccessPolicy,
  getMeetingMessages,
  sendMeetingMessage,
  sendHeartbeat,
  MeetingDetails,
  ParticipantInfo,
  MeetingMessage,
} from "@/lib/meetings-client";
import { toast } from "@/samvadComponents/toastMessage";
import {
  Mic,
  MicOff,
  AudioLines,
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
  ArrowUp,
  Plus,
  LogOut,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Star,
  Lock,
  Globe,
  UserCheck,
  UserX,
  MoreVertical,
  MessageSquare,
  Send,
  Info,
  Settings,
  Sliders,
  FlipHorizontal,
  Subtitles,
  Smile,
  MonitorUp,
  Camera,
  CircleDot,
  LayoutGrid,
  Maximize,
  Minimize,
  MessageSquareWarning,
  ShieldAlert,
  Activity,
  UserPlus,
  Sun,
  Moon,
} from "lucide-react";
import { SettingsState, DEFAULT_SETTINGS } from "@/samvadComponents/settings";

function VideoElement({
  stream,
  isMuted = false,
  isMirrored = false,
  isHidden = false,
}: {
  stream: MediaStream | null;
  isMuted?: boolean;
  isMirrored?: boolean;
  isHidden?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    const attemptPlay = () => {
      if (!isHidden) {
        video.play().catch(() => {});
      }
    };

    attemptPlay();

    video.addEventListener("loadedmetadata", attemptPlay);
    video.addEventListener("canplay", attemptPlay);

    const videoTracks = stream.getVideoTracks();
    videoTracks.forEach((t) => {
      t.addEventListener("unmute", attemptPlay);
    });

    return () => {
      video.removeEventListener("loadedmetadata", attemptPlay);
      video.removeEventListener("canplay", attemptPlay);
      videoTracks.forEach((t) => {
        t.removeEventListener("unmute", attemptPlay);
      });
    };
  }, [stream, isHidden]);

  if (!stream) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      style={{
        imageRendering: "-webkit-optimize-contrast",
        objectFit: "cover",
      }}
      className={`${isHidden ? "hidden" : "w-full h-full object-cover transform-gpu"} ${isMirrored ? "scale-x-[-1]" : ""}`}
    />
  );
}

function getMediaSender(pc: RTCPeerConnection, kind: "audio" | "video"): RTCRtpSender | null {
  if (pc.getTransceivers) {
    const transceiver = pc.getTransceivers().find(
      (t) =>
        t.currentDirection !== "stopped" &&
        (t.receiver?.track?.kind === kind || t.sender?.track?.kind === kind)
    );
    if (transceiver?.sender) {
      return transceiver.sender;
    }
  }
  return pc.getSenders().find((s) => s.track?.kind === kind) || null;
}

interface LiveCaption {
  id: string;
  socketId: string;
  userId: string;
  speakerName: string;
  speakerImage?: string | null;
  text: string;
  isFinal: boolean;
  timestamp: number;
}

const CAPTION_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi (हिंदी)" },
  { code: "mr", name: "Marathi (मराठी)" },
  { code: "ta", name: "Tamil (தமிழ்)" },
  { code: "te", name: "Telugu (తెలుగు)" },
  { code: "bn", name: "Bengali (বাংলা)" },
  { code: "gu", name: "Gujarati (ગુજરાતી)" },
  { code: "es", name: "Spanish (Español)" },
  { code: "fr", name: "French (Français)" },
];

function formatDuration(seconds: number): string {
  const totalSecs = Math.max(0, Math.floor(seconds));
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted
    ? resolvedTheme === "dark"
    : typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false;

  const rawRoomCode = Array.isArray(params.roomCode)
    ? params.roomCode[0]
    : (params.roomCode as string) || "";
  const roomCode = rawRoomCode.trim().toUpperCase();

  // Core Room State
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [errorStatus, setErrorStatus] = useState<"none" | "not_found" | "ended" | "error" | "rejected" | "removed">("none");
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
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("samvad_media_pref");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.isMuted === "boolean") return parsed.isMuted;
        }
      } catch {}
    }
    return false;
  });
  const [isVideoOff, setIsVideoOff] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("samvad_media_pref");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.isVideoOff === "boolean") return parsed.isVideoOff;
        }
      } catch {}
    }
    return false;
  });
  const [isIslActive, setIsIslActive] = useState(true);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<"people" | "chat" | "settings">("people");
  const [settingsCategory, setSettingsCategory] = useState<
    "audio" | "video" | "isl" | "captions" | "meeting"
  >("audio");
  const [roomSettings, setRoomSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [chatInputText, setChatInputText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatToast, setChatToast] = useState<{
    id: string;
    senderName: string;
    senderImage?: string | null;
    message: string;
  } | null>(null);
  const chatToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showIncomingChatToast = useCallback((msg: {
    id: string;
    senderName: string;
    senderImage?: string | null;
    message: string;
  }) => {
    if (chatToastTimeoutRef.current) {
      clearTimeout(chatToastTimeoutRef.current);
    }
    setChatToast(msg);
    chatToastTimeoutRef.current = setTimeout(() => {
      setChatToast(null);
    }, 5000);
  }, []);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [chatRecipient, setChatRecipient] = useState<string>("everyone");
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const recipientMenuRef = useRef<HTMLDivElement | null>(null);
  const [searchPeopleQuery, setSearchPeopleQuery] = useState("");
  const [isContributorsOpen, setIsContributorsOpen] = useState(true);
  const [activeMenuParticipantId, setActiveMenuParticipantId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [swipeDeltaX, setSwipeDeltaX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeStartXRef = useRef(0);
  const swipeDeltaXRef = useRef(0);

  const [removingParticipant, setRemovingParticipant] = useState<{ id: string; name: string } | null>(null);
  const [isRemovingParticipant, setIsRemovingParticipant] = useState(false);
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

  // Live WebRTC & Socket.io Signaling State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<
    Map<string, { socketId: string; userId: string; name: string; stream: MediaStream; isMuted?: boolean; isVideoOff?: boolean; isHandRaised?: boolean }>
  >(new Map());
  const [remoteSpeakingMap, setRemoteSpeakingMap] = useState<Record<string, boolean>>({});
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteHandRaisedMap, setRemoteHandRaisedMap] = useState<Record<string, boolean>>({});
  const [hasMicAccess, setHasMicAccess] = useState<boolean>(true);
  const [hasCamAccess, setHasCamAccess] = useState<boolean>(true);

  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>("");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>("");
  const [selectedCamId, setSelectedCamId] = useState<string>("");
  const [isBlurActive, setIsBlurActive] = useState<boolean>(false);

  const [showMicDropdown, setShowMicDropdown] = useState<boolean>(false);
  const [showSpeakerDropdown, setShowSpeakerDropdown] = useState<boolean>(false);
  const [showCamDropdown, setShowCamDropdown] = useState<boolean>(false);
  const [recipientSearchQuery, setRecipientSearchQuery] = useState("");

  const getParticipantDisplayName = useCallback(
    (p: ParticipantInfo) => {
      if (p.name && p.name !== "Guest" && p.name !== "Participant") return p.name;
      const streamName = Array.from(remoteStreams.values()).find(
        (r) => r.userId === p.id || r.socketId === p.id
      )?.name;
      if (streamName && streamName !== "Guest" && streamName !== "Participant") return streamName;
      if (p.email) return p.email.split("@")[0];
      if (p.role === "host" || (meeting && p.id === meeting.hostId)) return "Host";
      return p.name || "Participant";
    },
    [remoteStreams, meeting]
  );

  const selectableParticipants = useMemo(() => {
    const myId = currentUserId || (session?.user ? session.user.id : getSavedGuestIdentity().id);
    const uniqueMap = new Map<string, ParticipantInfo>();
    for (const p of participants) {
      if (p.id && p.id !== myId && !uniqueMap.has(p.id)) {
        uniqueMap.set(p.id, p);
      }
    }
    const list = Array.from(uniqueMap.values());
    const q = recipientSearchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter((p) => {
      const name = getParticipantDisplayName(p).toLowerCase();
      const email = (p.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [participants, currentUserId, session, recipientSearchQuery, getParticipantDisplayName]);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Active User Identifiers & Media Refs for Speech Recognition
  const activeId = currentUserId || session?.user?.id || getSavedGuestIdentity().id || "";
  const activeName = guestNameInput.trim() || session?.user?.name || "Participant";

  const activeIdRef = useRef(activeId);
  const activeNameRef = useRef(activeName);
  const roomCodeRef = useRef(roomCode);
  const isMutedRef = useRef(isMuted);
  const hasJoinedRef = useRef(hasJoined);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    activeNameRef.current = activeName;
  }, [activeName]);

  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    hasJoinedRef.current = hasJoined;
  }, [hasJoined]);

  // Live Captions & Speech Recognition State
  const [isCaptionsActive, setIsCaptionsActive] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("samvad_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.captionsTranslation?.enableCaptions !== undefined) {
            return Boolean(parsed.captionsTranslation.enableCaptions);
          }
        }
      } catch {}
    }
    return true;
  });
  const [captionMessages, setCaptionMessages] = useState<LiveCaption[]>([]);
  const [showCaptionLangMenu, setShowCaptionLangMenu] = useState(false);
  const [showCaptionSizeMenu, setShowCaptionSizeMenu] = useState(false);
  const [captionContrastMode, setCaptionContrastMode] = useState<"normal" | "high">("normal");
  const captionsEndRef = useRef<HTMLDivElement | null>(null);
  const captionsContainerRef = useRef<HTMLDivElement | null>(null);
  const participantsRef = useRef(participants);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    if (captionsEndRef.current) {
      captionsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [captionMessages]);

  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isRecognizingRef = useRef(false);
  const isListeningRef = useRef(false);
  const recognitionRestartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roomSettingsRef = useRef(roomSettings);

  useEffect(() => {
    roomSettingsRef.current = roomSettings;
  }, [roomSettings]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const handleIncomingCaption = useCallback(
    (data: {
      userId: string;
      socketId: string;
      speakerName: string;
      speakerImage?: string | null;
      text: string;
      isFinal: boolean;
      timestamp: number;
    }) => {
      setCaptionMessages((prev) => {
        const cleanText = data.text.trim();
        if (!cleanText) return prev;

        const speakerImg =
          data.speakerImage ||
          (data.userId === activeIdRef.current ? session?.user?.image : undefined) ||
          participantsRef.current.find((p) => p.id === data.userId)?.image ||
          null;

        const last = prev[prev.length - 1];

        // If from the same speaker and within 20 seconds:
        if (
          last &&
          (last.userId === data.userId || (data.socketId && last.socketId === data.socketId)) &&
          data.timestamp - last.timestamp < 20000
        ) {
          if (!last.isFinal) {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...last,
              text: cleanText,
              isFinal: data.isFinal,
              speakerImage: speakerImg || last.speakerImage,
              timestamp: data.timestamp,
            };
            return updated;
          }

          if (data.isFinal) {
            if (!last.text.endsWith(cleanText)) {
              const updated = [...prev];
              if (last.text.length < 240) {
                updated[updated.length - 1] = {
                  ...last,
                  text: `${last.text} ${cleanText}`.trim(),
                  timestamp: data.timestamp,
                };
                return updated;
              } else {
                return [
                  ...prev.slice(-24),
                  {
                    id: `${data.userId}-${data.timestamp}`,
                    userId: data.userId,
                    socketId: data.socketId,
                    speakerName: data.speakerName,
                    speakerImage: speakerImg,
                    text: cleanText,
                    isFinal: true,
                    timestamp: data.timestamp,
                  },
                ];
              }
            }
            return prev;
          } else {
            return [
              ...prev.slice(-24),
              {
                id: `${data.userId}-${data.timestamp}`,
                userId: data.userId,
                socketId: data.socketId,
                speakerName: data.speakerName,
                speakerImage: speakerImg,
                text: cleanText,
                isFinal: false,
                timestamp: data.timestamp,
              },
            ];
          }
        }

        // Different speaker: append new block
        const newEntry: LiveCaption = {
          id: `${data.userId}-${data.timestamp}`,
          userId: data.userId,
          socketId: data.socketId,
          speakerName: data.speakerName,
          speakerImage: speakerImg,
          text: cleanText,
          isFinal: data.isFinal,
          timestamp: data.timestamp,
        };
        return [...prev.slice(-24), newEntry];
      });
    },
    [session?.user?.image]
  );

  const cleanupRecognition = useCallback(() => {
    if (recognitionRestartTimeoutRef.current) {
      clearTimeout(recognitionRestartTimeoutRef.current);
      recognitionRestartTimeoutRef.current = null;
    }
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.onstart = null;
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    isRecognizingRef.current = false;
    cleanupRecognition();
  }, [cleanupRecognition]);

  const startSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return;

    // Do not start if microphone is hardware muted or user has not joined
    if (isMutedRef.current || !hasJoinedRef.current) {
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsSpeechRecognitionSupported(false);
      setSpeechError("not-supported");
      return;
    }

    setIsSpeechRecognitionSupported(true);

    // Insecure context check for Chrome (Web Speech requires HTTPS or localhost)
    if (
      !window.isSecureContext &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setSpeechError("insecure-context");
      console.warn("[SpeechRecognition] Insecure context: Web Speech API requires HTTPS or localhost");
      return;
    }

    // Clean up any existing instance to ensure fresh state
    cleanupRecognition();

    isRecognizingRef.current = true;
    setSpeechError(null);

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Language detection & fallback
      const langMap: Record<string, string> = {
        en: "en-US",
        English: "en-US",
        hi: "hi-IN",
        Hindi: "hi-IN",
        "Hindi (हिंदी)": "hi-IN",
        mr: "mr-IN",
        Marathi: "mr-IN",
        "Marathi (मराठी)": "mr-IN",
        ta: "ta-IN",
        Tamil: "ta-IN",
        "Tamil (தமிழ்)": "ta-IN",
        te: "te-IN",
        Telugu: "te-IN",
        "Telugu (తెలుగు)": "te-IN",
        bn: "bn-IN",
        Bengali: "bn-IN",
        "Bengali (বাংলা)": "bn-IN",
        gu: "gu-IN",
        Gujarati: "gu-IN",
        "Gujarati (ગુજરાતી)": "gu-IN",
        es: "es-ES",
        Spanish: "es-ES",
        "Spanish (Español)": "es-ES",
        fr: "fr-FR",
        French: "fr-FR",
        "French (Français)": "fr-FR",
      };

      const chosenLang =
        roomSettingsRef.current?.captionsTranslation?.translationLanguage || "en";
      recognition.lang =
        langMap[chosenLang] ||
        (typeof navigator !== "undefined" ? navigator.language : "en-US") ||
        "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let interimText = "";
        let latestFinalText = "";

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res && res[0]) {
            if (res.isFinal) {
              latestFinalText = res[0].transcript.trim();
            } else {
              interimText += (interimText ? " " : "") + res[0].transcript.trim();
            }
          }
        }

        const activeText = (interimText.trim() || latestFinalText.trim()).trim();
        if (!activeText) return;

        const isFinal = Boolean(latestFinalText && !interimText.trim());

        // Broadcast speech chunk to remote participants via Socket.io
        if (socketRef.current) {
          socketRef.current.emit("send-caption", {
            roomCode: roomCodeRef.current,
            text: activeText,
            isFinal,
            speakerName: activeNameRef.current,
            speakerImage: session?.user?.image || null,
          });
        }

        // Update local captions stream immediately for zero-latency local user feedback
        handleIncomingCaption({
          userId: activeIdRef.current || "local",
          socketId: socketRef.current?.id || "local",
          speakerName: activeNameRef.current || "You",
          speakerImage: session?.user?.image || null,
          text: activeText,
          isFinal,
          timestamp: Date.now(),
        });
      };

      recognition.onerror = (event: any) => {
        const err = event.error;
        if (err === "no-speech" || err === "aborted") {
          return;
        }
        console.warn("[SpeechRecognition] Warning/Error:", err);
        setSpeechError(err);
        if (err === "not-allowed" || err === "audio-capture" || err === "service-not-allowed") {
          isRecognizingRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;

        // Auto-restart with fresh instance when paused/silence ends
        if (isRecognizingRef.current && !isMutedRef.current && hasJoinedRef.current) {
          if (recognitionRestartTimeoutRef.current) {
            clearTimeout(recognitionRestartTimeoutRef.current);
          }
          recognitionRestartTimeoutRef.current = setTimeout(() => {
            if (isRecognizingRef.current && !isMutedRef.current && hasJoinedRef.current) {
              startSpeechRecognition();
            }
          }, 200);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      console.warn("[SpeechRecognition] start exception:", err);
      if (err.name !== "InvalidStateError") {
        setSpeechError("start-failed");
      }
    }
  }, [cleanupRecognition, handleIncomingCaption]);

  // Synchronize Speech Recognition with Microphone Mute & Join State
  useEffect(() => {
    if (isMuted || !hasJoined) {
      stopSpeechRecognition();
    } else if (hasJoined && !isMuted) {
      startSpeechRecognition();
    }
  }, [isMuted, hasJoined, startSpeechRecognition, stopSpeechRecognition]);

  // Restart speech recognition if translation language changed while listening
  useEffect(() => {
    if (isRecognizingRef.current && !isMutedRef.current && hasJoinedRef.current) {
      startSpeechRecognition();
    }
  }, [roomSettings.captionsTranslation.translationLanguage, startSpeechRecognition]);

  // User gesture auto-activation fallback on first interaction if blocked by autoplay policy
  useEffect(() => {
    if (!hasJoined || isMuted || isListening) return;

    const handleFirstInteraction = () => {
      if (!isMutedRef.current && hasJoinedRef.current && !isListeningRef.current) {
        startSpeechRecognition();
      }
    };

    window.addEventListener("click", handleFirstInteraction, { once: true, capture: true });
    return () => {
      window.removeEventListener("click", handleFirstInteraction, { capture: true });
    };
  }, [hasJoined, isMuted, isListening, startSpeechRecognition]);

  const updateAvailableDevices = async () => {
    try {
      if (typeof window === "undefined" || !navigator?.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter((d) => d.kind === "audioinput");
      const speakers = devices.filter((d) => d.kind === "audiooutput");
      const cams = devices.filter((d) => d.kind === "videoinput");

      setAudioInputDevices(mics);
      setAudioOutputDevices(speakers);
      setVideoInputDevices(cams);

      const hasValidMic = mics.some((m) => Boolean(m.label && m.label.trim()));
      const hasValidCam = cams.some((c) => Boolean(c.label && c.label.trim()));
      if (hasValidMic) setHasMicAccess(true);
      if (hasValidCam) setHasCamAccess(true);

      if (mics.length > 0) {
        const found = mics.find((m) => m.deviceId === selectedMicId && Boolean(m.label?.trim()));
        const def = mics.find((m) => m.deviceId === "default" && Boolean(m.label?.trim())) || mics.find((m) => Boolean(m.label?.trim())) || mics[0];
        if (!found && def) {
          setSelectedMicId(def.deviceId);
        }
      }
      if (speakers.length > 0) {
        const found = speakers.find((s) => s.deviceId === selectedSpeakerId && Boolean(s.label?.trim()));
        const def = speakers.find((s) => s.deviceId === "default" && Boolean(s.label?.trim())) || speakers.find((s) => Boolean(s.label?.trim())) || speakers[0];
        if (!found && def) {
          setSelectedSpeakerId(def.deviceId);
        }
      }
      if (cams.length > 0) {
        const found = cams.find((c) => c.deviceId === selectedCamId && Boolean(c.label?.trim()));
        const def = cams.find((c) => Boolean(c.label?.trim())) || cams[0];
        if (!found && def) {
          setSelectedCamId(def.deviceId);
        }
      }
    } catch (err) {
      console.warn("Could not enumerate media devices:", err);
    }
  };

  useEffect(() => {
    updateAvailableDevices();
    if (typeof window !== "undefined" && navigator?.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", updateAvailableDevices);
      return () => {
        navigator.mediaDevices.removeEventListener("devicechange", updateAvailableDevices);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      navigator.permissions.query({ name: "microphone" as PermissionName }).then((res) => {
        setHasMicAccess(res.state === "granted");
        res.onchange = () => {
          setHasMicAccess(res.state === "granted");
          if (res.state === "granted") updateAvailableDevices();
        };
      }).catch(() => {});

      navigator.permissions.query({ name: "camera" as PermissionName }).then((res) => {
        setHasCamAccess(res.state === "granted");
        res.onchange = () => {
          setHasCamAccess(res.state === "granted");
          if (res.state === "granted") updateAvailableDevices();
        };
      }).catch(() => {});
    }
  }, []);

  const activeMicLabel = useMemo(() => {
    if (!hasMicAccess) return null;
    const liveLabel = localStream?.getAudioTracks()[0]?.label;
    if (liveLabel && liveLabel.trim()) return liveLabel;
    const selected = audioInputDevices.find((d) => d.deviceId === selectedMicId && Boolean(d.label?.trim()));
    if (selected?.label) return selected.label;
    const anyLabeled = audioInputDevices.find((d) => Boolean(d.label?.trim()));
    if (anyLabeled?.label) return anyLabeled.label;
    return null;
  }, [hasMicAccess, localStream, audioInputDevices, selectedMicId]);

  const activeSpeakerLabel = useMemo(() => {
    if (!hasMicAccess && audioOutputDevices.every((d) => !d.label?.trim())) return null;
    const selected = audioOutputDevices.find((d) => d.deviceId === selectedSpeakerId && Boolean(d.label?.trim()));
    if (selected?.label) return selected.label;
    const anyLabeled = audioOutputDevices.find((d) => Boolean(d.label?.trim()));
    if (anyLabeled?.label) return anyLabeled.label;
    if (hasMicAccess && audioOutputDevices.length > 0) return "Default Speaker";
    return null;
  }, [hasMicAccess, audioOutputDevices, selectedSpeakerId]);

  const activeCamLabel = useMemo(() => {
    if (!hasCamAccess) return null;
    const liveLabel = localStream?.getVideoTracks()[0]?.label;
    if (liveLabel && liveLabel.trim()) return liveLabel;
    const selected = videoInputDevices.find((d) => d.deviceId === selectedCamId && Boolean(d.label?.trim()));
    if (selected?.label) return selected.label;
    const anyLabeled = videoInputDevices.find((d) => Boolean(d.label?.trim()));
    if (anyLabeled?.label) return anyLabeled.label;
    return null;
  }, [hasCamAccess, localStream, videoInputDevices, selectedCamId]);

  const switchMicrophone = async (deviceId: string) => {
    setSelectedMicId(deviceId);
    setShowMicDropdown(false);
    const dev = audioInputDevices.find((d) => d.deviceId === deviceId);
    const label = dev?.label || "Selected Microphone";

    if (isMuted) {
      toast.success(`Microphone set to: ${label}`);
      return;
    }

    try {
      const constraints = { audio: deviceId ? { deviceId: { exact: deviceId } } : true };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newTrack = newStream.getAudioTracks()[0];
      if (newTrack) {
        if (localStreamRef.current) {
          const oldTrack = localStreamRef.current.getAudioTracks()[0];
          if (oldTrack) {
            localStreamRef.current.removeTrack(oldTrack);
            oldTrack.stop();
          }
          localStreamRef.current.addTrack(newTrack);
        }
        peerConnectionsRef.current.forEach((pc) => {
          const sender = getMediaSender(pc, "audio");
          if (sender) {
            sender.replaceTrack(newTrack).catch(() => {});
          }
        });
        setLocalStream(new MediaStream(localStreamRef.current?.getTracks() || []));
        setHasMicAccess(true);
        toast.success(`Microphone set to: ${label}`);
      }
    } catch (err) {
      console.warn("Microphone switch error:", err);
      toast.error(`Could not switch to ${label}`);
    }
  };

  const switchCamera = async (deviceId: string) => {
    setSelectedCamId(deviceId);
    setShowCamDropdown(false);
    const dev = videoInputDevices.find((d) => d.deviceId === deviceId);
    const label = dev?.label || "Selected Camera";

    if (isVideoOff) {
      toast.success(`Camera set to: ${label}`);
      return;
    }

    try {
      const constraints = { video: deviceId ? { deviceId: { exact: deviceId } } : true };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newTrack = newStream.getVideoTracks()[0];
      if (newTrack) {
        if (localStreamRef.current) {
          const oldTrack = localStreamRef.current.getVideoTracks()[0];
          if (oldTrack) {
            localStreamRef.current.removeTrack(oldTrack);
            oldTrack.stop();
          }
          localStreamRef.current.addTrack(newTrack);
        }
        peerConnectionsRef.current.forEach((pc) => {
          const sender = getMediaSender(pc, "video");
          if (sender) {
            sender.replaceTrack(newTrack).catch(() => {});
          }
        });
        setLocalStream(new MediaStream(localStreamRef.current?.getTracks() || []));
        setHasCamAccess(true);
        toast.success(`Camera set to: ${label}`);
      }
    } catch (err) {
      console.warn("Camera switch error:", err);
      toast.error(`Could not switch to ${label}`);
    }
  };

  const switchSpeaker = (deviceId: string) => {
    setSelectedSpeakerId(deviceId);
    setShowSpeakerDropdown(false);
    const dev = audioOutputDevices.find((d) => d.deviceId === deviceId);
    const label = dev?.label || "Selected Speaker";
    toast.success(`Speaker output set to: ${label}`);
  };

  const handleRequestMediaPermission = async (type: "audio" | "video") => {
    try {
      toast.info(`Requesting ${type === "audio" ? "microphone" : "camera"} permission...`);
      const constraints = type === "audio" ? { audio: true } : { video: true };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (type === "audio") {
        const newTrack = newStream.getAudioTracks()[0];
        if (newTrack) {
          setHasMicAccess(true);
          setIsMuted(false);
          if (localStreamRef.current) {
            localStreamRef.current.addTrack(newTrack);
          } else {
            localStreamRef.current = newStream;
            setLocalStream(newStream);
          }
          peerConnectionsRef.current.forEach((pc) => {
            pc.addTrack(newTrack, localStreamRef.current!);
          });
          toast.success("Microphone permission granted!");
          await updateAvailableDevices();
        }
      } else {
        const newTrack = newStream.getVideoTracks()[0];
        if (newTrack) {
          setHasCamAccess(true);
          setIsVideoOff(false);
          if (localStreamRef.current) {
            localStreamRef.current.addTrack(newTrack);
          } else {
            localStreamRef.current = newStream;
            setLocalStream(newStream);
          }
          peerConnectionsRef.current.forEach((pc) => {
            pc.addTrack(newTrack, localStreamRef.current!);
          });
          toast.success("Camera permission granted!");
          await updateAvailableDevices();
        }
      }
    } catch (err) {
      console.warn(`Failed to request ${type} permission:`, err);
      toast.error(`Permission denied for ${type === "audio" ? "microphone" : "camera"}. Please allow access in browser settings.`);
    }
  };

  const handleToggleMic = async () => {
    if (!hasMicAccess) {
      handleRequestMediaPermission("audio");
      return;
    }
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (nextMuted) {
      // Completely stop audio tracks to release the microphone hardware and extinguish the recording dot
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.stop();
          localStreamRef.current?.removeTrack(track);
        });
      }

      peerConnectionsRef.current.forEach((pc) => {
        const sender = getMediaSender(pc, "audio");
        if (sender) {
          sender.replaceTrack(null).catch(() => {});
        }
      });

      setLocalStream(new MediaStream(localStreamRef.current ? localStreamRef.current.getTracks() : []));
      setIsSpeaking(false);
      stopSpeechRecognition();
      toast.info("Microphone muted", { duration: 2000 });
    } else {
      // Re-acquire microphone stream from hardware
      try {
        const constraints = {
          audio: selectedMicId
            ? {
                deviceId: { exact: selectedMicId },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        const newTrack = newStream.getAudioTracks()[0];
        if (newTrack) {
          if (!localStreamRef.current) {
            localStreamRef.current = new MediaStream();
          }
          localStreamRef.current.addTrack(newTrack);

          peerConnectionsRef.current.forEach((pc) => {
            const sender = getMediaSender(pc, "audio");
            if (sender) {
              sender.replaceTrack(newTrack).catch(() => {});
            } else if (localStreamRef.current) {
              pc.addTrack(newTrack, localStreamRef.current);
            }
          });

          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          setHasMicAccess(true);
          updateAvailableDevices();
          startSpeechRecognition();
          toast.info("Microphone turned on", { duration: 2000 });
        }
      } catch (err) {
        console.warn("Error turning on microphone:", err);
        setIsMuted(true);
        toast.error("Could not turn on microphone device");
      }
    }

    if (socketRef.current) {
      socketRef.current.emit("toggle-media", {
        roomCode,
        isMuted: nextMuted,
        isVideoOff,
      });
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("samvad_media_pref", JSON.stringify({ isMuted: nextMuted, isVideoOff }));
      } catch {}
    }
  };

  const handleToggleCam = async () => {
    if (!hasCamAccess) {
      handleRequestMediaPermission("video");
      return;
    }
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);

    if (nextVideoOff) {
      // Completely stop video tracks to release the camera hardware and extinguish the camera light
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.stop();
          localStreamRef.current?.removeTrack(track);
        });
      }

      peerConnectionsRef.current.forEach((pc) => {
        const sender = getMediaSender(pc, "video");
        if (sender) {
          sender.replaceTrack(null).catch(() => {});
        }
      });

      setLocalStream(new MediaStream(localStreamRef.current ? localStreamRef.current.getTracks() : []));
      toast.info("Camera turned off", { duration: 2000 });
    } else {
      // Re-acquire camera stream from hardware
      try {
        const constraints = {
          video: selectedCamId
            ? { deviceId: { exact: selectedCamId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 } },
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        const newTrack = newStream.getVideoTracks()[0];
        if (newTrack) {
          if (!localStreamRef.current) {
            localStreamRef.current = new MediaStream();
          }
          localStreamRef.current.addTrack(newTrack);

          peerConnectionsRef.current.forEach((pc) => {
            const sender = getMediaSender(pc, "video");
            if (sender) {
              sender.replaceTrack(newTrack).catch(() => {});
            } else if (localStreamRef.current) {
              pc.addTrack(newTrack, localStreamRef.current);
            }
          });

          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          setHasCamAccess(true);
          updateAvailableDevices();
          toast.info("Camera turned on", { duration: 2000 });
        }
      } catch (err) {
        console.warn("Error turning on camera:", err);
        setIsVideoOff(true);
        toast.error("Could not turn on camera device");
      }
    }

    if (socketRef.current) {
      socketRef.current.emit("toggle-media", {
        roomCode,
        isMuted,
        isVideoOff: nextVideoOff,
      });
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("samvad_media_pref", JSON.stringify({ isMuted, isVideoOff: nextVideoOff }));
      } catch {}
    }
  };

  const handleToggleHandRaise = () => {
    const nextHand = !isHandRaised;
    setIsHandRaised(nextHand);
    if (socketRef.current) {
      socketRef.current.emit("toggle-hand-raise", {
        roomCode,
        isHandRaised: nextHand,
      });
    }
    toast.info(nextHand ? "Hand raised" : "Hand lowered", { duration: 2000 });
  };

  // Socket.io + WebRTC Mesh Signaling Effect
  useEffect(() => {
    if (!hasJoined || errorStatus !== "none" || !roomCode) return;

    let directBase = "http://localhost:4000";
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host.includes("qixolabs.com")) {
        directBase = "https://samvad-api.qixolabs.com";
      } else if (host === "localhost" || host === "127.0.0.1") {
        directBase = "http://localhost:4000";
      } else {
        directBase = `${window.location.protocol}//${host}:4000`;
      }
    }

    const socket = io(directBase, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    const activeId = currentUserId || session?.user?.id || getSavedGuestIdentity().id || "";
    const activeName = guestNameInput.trim() || session?.user?.name || "Participant";

    const setSDPHDBitrate = (sdp: string, bitrateKbps = 4000) => {
      if (!sdp) return sdp;
      if (sdp.includes("b=AS:")) return sdp;
      return sdp.replace(
        /(m=video .*\r\n)/,
        `$1b=AS:${bitrateKbps}\r\nb=TIAS:${bitrateKbps * 1000}\r\n`
      );
    };

    const createPeerConnection = (
      targetSocketId: string,
      targetName: string,
      targetUserId: string,
      initialMuted = false,
      initialVideoOff = false
    ) => {
      if (peerConnectionsRef.current.has(targetSocketId)) {
        return peerConnectionsRef.current.get(targetSocketId)!;
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      const audioTrack = localStreamRef.current?.getAudioTracks()[0] || null;
      const videoTrack = localStreamRef.current?.getVideoTracks()[0] || null;

      if (audioTrack && localStreamRef.current) {
        pc.addTrack(audioTrack, localStreamRef.current);
      } else if (pc.addTransceiver) {
        pc.addTransceiver("audio", { direction: "sendrecv" });
      }

      if (videoTrack && localStreamRef.current) {
        const sender = pc.addTrack(videoTrack, localStreamRef.current);
        if (sender.setParameters) {
          try {
            const params = sender.getParameters();
            if (!params.encodings || params.encodings.length === 0) {
              params.encodings = [{}];
            }
            params.encodings[0].maxBitrate = 4000000; // 4 Mbps high definition stream
            params.degradationPreference = "maintain-resolution";
            sender.setParameters(params).catch(() => {});
          } catch {
            // ignore
          }
        }
      } else if (pc.addTransceiver) {
        pc.addTransceiver("video", { direction: "sendrecv" });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("ice-candidate", {
            targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const refreshRemoteStream = () => {
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            const existing = next.get(targetSocketId);
            if (existing && existing.stream) {
              next.set(targetSocketId, {
                ...existing,
                stream: new MediaStream(existing.stream.getTracks()),
              });
            }
            return next;
          });
        };

        event.track.onunmute = refreshRemoteStream;
        event.track.onmute = refreshRemoteStream;

        setRemoteStreams((prev) => {
          const next = new Map(prev);
          const existing = next.get(targetSocketId);

          let currentStream = existing?.stream;
          if (currentStream) {
            if (!currentStream.getTracks().some((t) => t.id === event.track.id)) {
              currentStream.addTrack(event.track);
            }
            currentStream = new MediaStream(currentStream.getTracks());
          } else {
            currentStream =
              event.streams && event.streams[0]
                ? event.streams[0]
                : new MediaStream([event.track]);
          }

          next.set(targetSocketId, {
            socketId: targetSocketId,
            userId: targetUserId,
            name: targetName,
            stream: currentStream,
            isMuted: existing?.isMuted ?? initialMuted,
            isVideoOff: existing?.isVideoOff ?? initialVideoOff,
            isHandRaised: existing?.isHandRaised ?? false,
          });
          return next;
        });
      };

      pc.oniceconnectionstatechange = () => {
        if (
          pc.iceConnectionState === "disconnected" ||
          pc.iceConnectionState === "failed" ||
          pc.iceConnectionState === "closed"
        ) {
          closePeerConnection(targetSocketId);
        }
      };

      peerConnectionsRef.current.set(targetSocketId, pc);
      return pc;
    };

    const closePeerConnection = (targetSocketId: string) => {
      const pc = peerConnectionsRef.current.get(targetSocketId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(targetSocketId);
      }
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(targetSocketId);
        return next;
      });
    };

    const getHDUserMedia = async () => {
      const shouldGetAudio = !isMuted;
      const shouldGetVideo = !isVideoOff;

      // If user joined with both mic muted and camera turned off, do not request hardware devices
      if (!shouldGetAudio && !shouldGetVideo) {
        return new MediaStream();
      }

      const audioConstraints = shouldGetAudio
        ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            deviceId: selectedMicId ? { exact: selectedMicId } : undefined,
          }
        : false;

      if (!shouldGetVideo) {
        return await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: audioConstraints,
        });
      }

      const videoProfiles = [
        { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        { width: { ideal: 960 }, height: { ideal: 540 } },
        true,
      ];

      for (const vConstraints of videoProfiles) {
        try {
          const finalV =
            typeof vConstraints === "object" && selectedCamId
              ? { ...vConstraints, deviceId: { exact: selectedCamId } }
              : vConstraints;

          const stream = await navigator.mediaDevices.getUserMedia({
            video: finalV,
            audio: audioConstraints,
          });

          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack && videoTrack.applyConstraints) {
            videoTrack.applyConstraints({
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
            }).catch(() => {});
          }

          return stream;
        } catch {
          // try next profile
        }
      }

      return await navigator.mediaDevices.getUserMedia({
        video: selectedCamId ? { deviceId: { exact: selectedCamId } } : true,
        audio: audioConstraints,
      });
    };

    getHDUserMedia()
      .then((stream) => {
        localStreamRef.current = stream;
        setLocalStream(stream);

        const audioTracks = stream.getAudioTracks();
        const videoTracks = stream.getVideoTracks();
        if (audioTracks.length > 0) {
          setHasMicAccess(audioTracks.some((t) => t.readyState === "live"));
        }
        if (videoTracks.length > 0) {
          setHasCamAccess(videoTracks.some((t) => t.readyState === "live"));
        }
        updateAvailableDevices();

        if (isMuted && audioTracks.length > 0) {
          audioTracks.forEach((t) => {
            t.stop();
            stream.removeTrack(t);
          });
        }
        if (isVideoOff && videoTracks.length > 0) {
          videoTracks.forEach((t) => {
            t.stop();
            stream.removeTrack(t);
          });
        }

        // Add or replace tracks on any peer connection created prior to getUserMedia resolution
        peerConnectionsRef.current.forEach((pc) => {
          stream.getTracks().forEach((track) => {
            const sender = getMediaSender(pc, track.kind as "audio" | "video");
            if (sender) {
              sender.replaceTrack(track).catch(() => {});
            } else {
              pc.addTrack(track, stream);
            }
          });
        });

        socket.emit("join-room", {
          roomCode,
          userId: activeId,
          name: activeName,
          isMuted,
          isVideoOff,
          isHandRaised,
        });
      })
      .catch((err) => {
        console.warn("Could not access camera/mic:", err);
        setHasMicAccess(false);
        setHasCamAccess(false);
        socket.emit("join-room", {
          roomCode,
          userId: activeId,
          name: activeName,
          isMuted,
          isVideoOff,
          isHandRaised,
        });
      });

    socket.on("existing-peers", async (peers: Array<{ socketId: string; userId: string; name: string; isMuted?: boolean; isVideoOff?: boolean; isHandRaised?: boolean }>) => {
      for (const peer of peers) {
        try {
          const pc = createPeerConnection(peer.socketId, peer.name, peer.userId, peer.isMuted ?? false, peer.isVideoOff ?? false);
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            const existing = next.get(peer.socketId);
            next.set(peer.socketId, {
              socketId: peer.socketId,
              userId: peer.userId,
              name: peer.name,
              stream: existing?.stream || new MediaStream(),
              isMuted: peer.isMuted ?? false,
              isVideoOff: peer.isVideoOff ?? false,
              isHandRaised: peer.isHandRaised ?? false,
            });
            return next;
          });
          if (peer.isHandRaised) {
            setRemoteHandRaisedMap((prev) => ({ ...prev, [peer.socketId]: true, [peer.userId]: true }));
          }

          const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
          const hdOffer = new RTCSessionDescription({
            type: offer.type,
            sdp: setSDPHDBitrate(offer.sdp || ""),
          });
          await pc.setLocalDescription(hdOffer);
          socket.emit("offer", {
            targetSocketId: peer.socketId,
            offer: hdOffer,
            name: activeName,
            userId: activeId,
          });
        } catch (err) {
          console.error("Offer error:", err);
        }
      }
    });

    socket.on("user-joined", (data: { socketId: string; userId: string; name: string; isMuted?: boolean; isVideoOff?: boolean; isHandRaised?: boolean }) => {
      createPeerConnection(data.socketId, data.name, data.userId, data.isMuted ?? false, data.isVideoOff ?? false);
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        const existing = next.get(data.socketId);
        next.set(data.socketId, {
          socketId: data.socketId,
          userId: data.userId,
          name: data.name,
          stream: existing?.stream || new MediaStream(),
          isMuted: data.isMuted ?? false,
          isVideoOff: data.isVideoOff ?? false,
          isHandRaised: data.isHandRaised ?? false,
        });
        return next;
      });
      if (data.isHandRaised) {
        setRemoteHandRaisedMap((prev) => ({ ...prev, [data.socketId]: true, [data.userId]: true }));
      }
    });

    socket.on("offer", async (data: { senderSocketId: string; senderUserId: string; senderName: string; offer: any }) => {
      try {
        const pc = createPeerConnection(data.senderSocketId, data.senderName, data.senderUserId);
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
        const hdAnswer = new RTCSessionDescription({
          type: answer.type,
          sdp: setSDPHDBitrate(answer.sdp || ""),
        });
        await pc.setLocalDescription(hdAnswer);
        socket.emit("answer", {
          targetSocketId: data.senderSocketId,
          answer: hdAnswer,
        });
      } catch (err) {
        console.error("Answer error:", err);
      }
    });

    socket.on("answer", async (data: { senderSocketId: string; answer: any }) => {
      try {
        const pc = peerConnectionsRef.current.get(data.senderSocketId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      } catch (err) {
        console.error("Remote description error:", err);
      }
    });

    socket.on("ice-candidate", async (data: { senderSocketId: string; candidate: any }) => {
      try {
        const pc = peerConnectionsRef.current.get(data.senderSocketId);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error("ICE candidate error:", err);
      }
    });

    socket.on("user-media-toggled", (data: { socketId: string; userId: string; isMuted: boolean; isVideoOff: boolean }) => {
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        let targetKey = data.socketId;
        if (!next.has(targetKey)) {
          for (const [key, val] of next.entries()) {
            if (val.userId === data.userId || val.socketId === data.socketId) {
              targetKey = key;
              break;
            }
          }
        }
        const existing = next.get(targetKey);
        if (existing) {
          if (existing.stream) {
            existing.stream.getAudioTracks().forEach((track) => {
              track.enabled = !data.isMuted;
            });
            existing.stream.getVideoTracks().forEach((track) => {
              track.enabled = !data.isVideoOff;
            });
          }
          next.set(targetKey, {
            ...existing,
            isMuted: data.isMuted,
            isVideoOff: data.isVideoOff,
            stream: existing.stream ? new MediaStream(existing.stream.getTracks()) : existing.stream,
          });
        }
        return next;
      });
    });

    socket.on("user-hand-toggled", (data: { socketId: string; userId: string; name?: string; isHandRaised: boolean }) => {
      if (data.isHandRaised && data.name && data.userId !== activeId) {
        toast.info(`${data.name} raised hand ✋`, { duration: 3000 });
      }
      setRemoteHandRaisedMap((prev) => ({
        ...prev,
        [data.socketId]: data.isHandRaised,
        [data.userId]: data.isHandRaised,
      }));
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        let targetKey = data.socketId;
        if (!next.has(targetKey)) {
          for (const [key, val] of next.entries()) {
            if (val.userId === data.userId || val.socketId === data.socketId) {
              targetKey = key;
              break;
            }
          }
        }
        const existing = next.get(targetKey);
        if (existing) {
          next.set(targetKey, {
            ...existing,
            isHandRaised: data.isHandRaised,
          });
        } else {
          next.set(data.socketId, {
            socketId: data.socketId,
            userId: data.userId,
            name: data.name || "Participant",
            stream: new MediaStream(),
            isHandRaised: data.isHandRaised,
          });
        }
        return next;
      });
    });

    socket.on("new-caption", (data: {
      socketId: string;
      userId: string;
      speakerName: string;
      speakerImage?: string | null;
      text: string;
      isFinal: boolean;
      timestamp: number;
    }) => {
      // Avoid duplicate display for own speech since local SpeechRecognition updates immediately
      if (
        (activeId && data.userId && data.userId === activeId) ||
        (socket.id && data.socketId === socket.id)
      ) {
        return;
      }
      handleIncomingCaption(data);
    });

    socket.on("user-left", (data: { socketId: string; userId: string; name: string }) => {
      closePeerConnection(data.socketId);
    });

    return () => {
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.emit("leave-room");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [hasJoined, errorStatus, roomCode]);

  // Google Meet Quick Controls Popovers State
  const [showQuickMicBar, setShowQuickMicBar] = useState(false);
  const [showQuickCamBar, setShowQuickCamBar] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const micMenuRef = useRef<HTMLDivElement>(null);
  const camMenuRef = useRef<HTMLDivElement>(null);
  const emojiMenuRef = useRef<HTMLDivElement>(null);

  // Google Meet More Options (⋮) Menu & Modals State
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [problemDescription, setProblemDescription] = useState("");
  const [showAbuseModal, setShowAbuseModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"grid" | "spotlight">("grid");
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Active Speech Detection State & Volume Analyzer
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (isMuted || !localStream) {
      setIsSpeaking(false);
      return;
    }
    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack || !audioTrack.enabled) {
      setIsSpeaking(false);
      return;
    }

    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animId: number | null = null;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioCtx();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Require speech volume level above background noise threshold (> 22)
        setIsSpeaking(avg > 22);
        animId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch {
      // AudioContext fallback
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
    };
  }, [localStream, isMuted]);

  // Active Remote Speech Detection via WebAudio AnalyserNodes
  useEffect(() => {
    const entries = Array.from(remoteStreams.entries());
    if (entries.length === 0) {
      setRemoteSpeakingMap({});
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    let audioCtx: AudioContext | null = null;
    try {
      audioCtx = new AudioCtx();
    } catch {
      return;
    }

    const analysers: Array<{ key: string; userId: string; analyser: AnalyserNode }> = [];

    entries.forEach(([socketId, remoteData]) => {
      if (!remoteData.isMuted && remoteData.stream) {
        const audioTracks = remoteData.stream.getAudioTracks();
        if (audioTracks.length > 0 && audioTracks[0].enabled) {
          try {
            const analyser = audioCtx!.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.5;
            const source = audioCtx!.createMediaStreamSource(new MediaStream([audioTracks[0]]));
            source.connect(analyser);
            analysers.push({ key: socketId, userId: remoteData.userId, analyser });
          } catch {
            // Ignore stream connection errors
          }
        }
      }
    });

    if (analysers.length === 0) {
      setRemoteSpeakingMap({});
      if (audioCtx.state !== "closed") audioCtx.close().catch(() => {});
      return;
    }

    let animId: number;
    const dataArray = new Uint8Array(128);

    const checkRemoteVolumes = () => {
      const newMap: Record<string, boolean> = {};
      analysers.forEach(({ key, userId, analyser }) => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const isSpk = avg > 20;
        newMap[key] = isSpk;
        if (userId) newMap[userId] = isSpk;
      });

      setRemoteSpeakingMap((prev) => {
        let changed = false;
        for (const k in newMap) {
          if (prev[k] !== newMap[k]) {
            changed = true;
            break;
          }
        }
        return changed ? { ...prev, ...newMap } : prev;
      });

      animId = requestAnimationFrame(checkRemoteVolumes);
    };

    checkRemoteVolumes();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
    };
  }, [remoteStreams]);

  // Click outside listener for Google Meet quick popups
  useEffect(() => {
    const handleClickOutsidePopups = (e: MouseEvent) => {
      const target = e.target as Node;
      if (micMenuRef.current && !micMenuRef.current.contains(target)) {
        setShowQuickMicBar(false);
      }
      if (camMenuRef.current && !camMenuRef.current.contains(target)) {
        setShowQuickCamBar(false);
      }
      if (emojiMenuRef.current && !emojiMenuRef.current.contains(target)) {
        setShowEmojiPicker(false);
      }
      if (recipientMenuRef.current && !recipientMenuRef.current.contains(target)) {
        setShowRecipientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsidePopups);
    return () => document.removeEventListener("mousedown", handleClickOutsidePopups);
  }, []);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Click outside to dismiss More Options menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreMenu]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast.info("Fullscreen is not supported or was blocked by browser permissions");
    }
  };

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
      ?.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }, audio: false })
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
            } catch { }
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
          // Clear stale guest credentials so an authenticated user never sends a ghost guest ID
          try {
            localStorage.removeItem("samvad_guest_id");
            localStorage.removeItem("samvad_guest_name");
          } catch { }

          const res = await joinMeeting(roomCode, undefined, session.user.id);
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

        // Check if the current user was removed by the host
        const activeId = currentUserId || session?.user?.id || getSavedGuestIdentity().id || "";
        if (activeId && !isHost && latest.length > 0) {
          const isStillInRoom = latest.some((p) => p.id === activeId);
          if (!isStillInRoom) {
            setErrorStatus("removed");
            setErrorMessage("You have been removed from the meeting by the host.");
          }
        }
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

  // 2b. Heartbeat: keep lastSeen fresh every 5s so the server can expire stale waiting entries
  useEffect(() => {
    if (!roomCode || errorStatus !== "none") return;
    // Fire in both waiting room and active meeting
    if (!isWaitingForHost && !hasJoined) return;

    const activeId = currentUserId || session?.user?.id || getSavedGuestIdentity().id || "";
    if (!activeId) return;

    const beat = () => sendHeartbeat(roomCode, activeId);
    beat(); // fire immediately
    const hbInterval = setInterval(beat, 5000);
    return () => clearInterval(hbInterval);
  }, [hasJoined, isWaitingForHost, errorStatus, roomCode, currentUserId, session]);

  // 3. Meeting Elapsed Timer: accurately calculates time since the meeting went live
  useEffect(() => {
    if (!hasJoined || errorStatus !== "none") return;

    const computeElapsed = () => {
      // Find earliest participant join time across roster
      const earliestParticipantJoined = participants.reduce<string | null>((earliest, p) => {
        if (!p.joinedAt) return earliest;
        if (!earliest) return p.joinedAt;
        return new Date(p.joinedAt) < new Date(earliest) ? p.joinedAt : earliest;
      }, null);

      // Prioritize official backend startedAt, then earliest participant join, then createdAt
      const liveStartTimeStr = meeting?.startedAt || earliestParticipantJoined || meeting?.createdAt;

      if (liveStartTimeStr) {
        const liveStartMs = new Date(liveStartTimeStr).getTime();
        if (!isNaN(liveStartMs)) {
          const secs = Math.max(0, Math.floor((Date.now() - liveStartMs) / 1000));
          setElapsedSeconds(secs);
          return;
        }
      }

      setElapsedSeconds((prev) => prev + 1);
    };

    // Calculate immediately on join/mount so it shows true live duration without starting at 0
    computeElapsed();

    timerRef.current = setInterval(computeElapsed, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasJoined, errorStatus, meeting?.startedAt, meeting?.createdAt, participants]);

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

  // 5. In-Call Chat Messages Polling
  useEffect(() => {
    if (!hasJoined || errorStatus !== "none" || !roomCode) return;

    let isMounted = true;
    const fetchChat = async () => {
      try {
        const list = await getMeetingMessages(roomCode);
        if (!isMounted) return;

        setMessages((prev) => {
          if (prev.length > 0 && list.length > prev.length) {
            const newCount = list.length - prev.length;
            const latestMsg = list[list.length - 1];
            const currentId = currentUserId || session?.user?.id || getSavedGuestIdentity().id;

            if (latestMsg.senderId !== currentId) {
              if (!isParticipantsOpen || panelTab !== "chat") {
                setUnreadCount((u) => u + newCount);
              }
              showIncomingChatToast({
                id: latestMsg.id,
                senderName: latestMsg.senderName,
                senderImage:
                  latestMsg.senderImage ||
                  participantsRef.current.find((p) => p.id === latestMsg.senderId)?.image,
                message: latestMsg.message,
              });
            }
          }
          return list;
        });
      } catch {
        // Silently catch polling failures
      }
    };

    fetchChat();
    const chatInterval = setInterval(fetchChat, 2500);

    return () => {
      isMounted = false;
      clearInterval(chatInterval);
    };
  }, [hasJoined, errorStatus, roomCode, isParticipantsOpen, panelTab, currentUserId, session, showIncomingChatToast]);

  // Auto-scroll chat feed to bottom on new messages or when switching to chat tab
  useEffect(() => {
    if (isParticipantsOpen && panelTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isParticipantsOpen, panelTab]);

  // Auto-resize chat textarea for longer messages
  useEffect(() => {
    if (chatTextareaRef.current) {
      chatTextareaRef.current.style.height = "auto";
      const scrollH = chatTextareaRef.current.scrollHeight;
      chatTextareaRef.current.style.height = `${Math.min(Math.max(scrollH, 28), 120)}px`;
    }
  }, [chatInputText]);

  // 6. Settings Persistence & Sync
  useEffect(() => {
    try {
      const saved = localStorage.getItem("samvad_user_settings_v1");
      if (saved) {
        setRoomSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch { }
  }, []);

  const updateRoomSettings = (updater: (prev: SettingsState) => SettingsState) => {
    setRoomSettings((prev) => {
      const updated = updater(prev);
      try {
        localStorage.setItem("samvad_user_settings_v1", JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatInputText.trim();
    if (!text || isSendingMessage || !roomCode) return;

    const guestId = getSavedGuestIdentity().id || undefined;
    const guestName = getSavedGuestIdentity().name || (session?.user?.name ? undefined : "Guest");
    const activeUserId = currentUserId || session?.user?.id || guestId || "";
    const activeUserName = session?.user?.name || guestName || "Participant";
    const activeUserImage = session?.user?.image || null;

    const tempId = `temp_${Date.now()}`;
    const recipientObj = chatRecipient !== "everyone" ? participants.find((p) => p.id === chatRecipient) : null;
    const recipientName = recipientObj ? getParticipantDisplayName(recipientObj) : "Participant";
    const outgoingText = recipientObj ? `(Direct to ${recipientName}): ${text}` : text;

    const optimisticMessage: MeetingMessage = {
      id: tempId,
      meetingId: meeting?.id || "",
      senderId: activeUserId,
      senderName: activeUserName,
      senderImage: activeUserImage,
      message: outgoingText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setChatInputText("");
    setIsSendingMessage(true);

    try {
      const saved = await sendMeetingMessage(roomCode, outgoingText, {
        userId: activeUserId,
        guestId,
        guestName,
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? saved : m))
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSendingMessage(false);
    }
  };

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

  const handleCopyCode = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${origin}/room/${roomCode}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopiedCode(true);
    toast.success("Meeting link copied!", {
      description: "Share this link with anyone to join.",
      duration: 2500,
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLeave = async (endForAll = false) => {
    setIsLeaving(true);
    const activeId = currentUserId || session?.user?.id || getSavedGuestIdentity().id || "";
    try {
      if (socketRef.current) {
        socketRef.current.emit("leave-room");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
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

  useEffect(() => {
    if (!isSwiping) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - swipeStartXRef.current;
      const clamped = Math.max(-60, Math.min(60, delta));
      swipeDeltaXRef.current = clamped;
      setSwipeDeltaX(clamped);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const delta = e.touches[0].clientX - swipeStartXRef.current;
        const clamped = Math.max(-60, Math.min(60, delta));
        swipeDeltaXRef.current = clamped;
        setSwipeDeltaX(clamped);
      }
    };

    const handleMouseUp = () => {
      setIsSwiping(false);
      const finalDelta = swipeDeltaXRef.current;
      swipeDeltaXRef.current = 0;
      setSwipeDeltaX(0);

      if (finalDelta < -40) {
        if (isHost) {
          handleLeave(true);
        } else {
          handleLeave(false);
        }
      } else if (finalDelta > 40) {
        handleLeave(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isSwiping, isHost]);

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

  const handleConfirmRemove = async () => {
    if (!removingParticipant || !isHost) return;
    const activeId = currentUserId || session?.user?.id || getSavedGuestIdentity().id || "";
    try {
      setIsRemovingParticipant(true);
      await removeParticipant(roomCode, removingParticipant.id, activeId);
      setParticipants((prev) => prev.filter((p) => p.id !== removingParticipant.id));
      toast.success(`Removed ${removingParticipant.name} from the meeting`);
      setRemovingParticipant(null);
    } catch (err: any) {
      toast.error("Failed to remove participant", { description: err.message });
    } finally {
      setIsRemovingParticipant(false);
    }
  };

  const sortedAndFilteredParticipants = useMemo(() => {
    // Deduplicate participants by unique ID
    const uniqueMap = new Map<string, ParticipantInfo>();
    for (const p of participants) {
      if (p.id && !uniqueMap.has(p.id)) {
        uniqueMap.set(p.id, p);
      }
    }
    const uniqueList = Array.from(uniqueMap.values());

    const q = searchPeopleQuery.toLowerCase().trim();
    const list = q
      ? uniqueList.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
      )
      : uniqueList;

    const myId = currentUserId || (session?.user ? session.user.id : getSavedGuestIdentity().id);

    return list.sort((a, b) => {
      // Current user (You) first
      if (a.id === myId) return -1;
      if (b.id === myId) return 1;
      // Host next
      const aIsHost = a.role === "host" || (meeting && a.id === meeting.hostId);
      const bIsHost = b.role === "host" || (meeting && b.id === meeting.hostId);
      if (aIsHost && !bIsHost) return -1;
      if (!aIsHost && bIsHost) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [participants, searchPeopleQuery, currentUserId, session, meeting]);

  useEffect(() => {
    if (!activeMenuParticipantId) return;
    const handleCloseMenu = () => setActiveMenuParticipantId(null);
    window.addEventListener("click", handleCloseMenu);
    return () => window.removeEventListener("click", handleCloseMenu);
  }, [activeMenuParticipantId]);

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
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border transition-all cursor-pointer active:scale-95 ${isFilled
                      ? "bg-[#7075f7]/15 dark:bg-[#7075f7]/25 border-[#7075f7]/50 text-[#7075f7] shadow-xs"
                      : "bg-[#f0f3fa] dark:bg-stone-800/80 border-[#e2e8f5] dark:border-stone-700/80 text-[#1e2538] dark:text-stone-300 hover:border-[#c8d4ee] dark:hover:border-stone-600"
                      }`}
                    aria-label={`${starValue} star rating`}
                  >
                    <Star
                      className={`w-6 h-6 sm:w-7 sm:h-7 stroke-[1.6] transition-all ${isFilled
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

  // Render Edge Case: Participant Removed by Host
  if (errorStatus === "removed") {
    return (
      <div className="w-full min-h-screen bg-stone-50 dark:bg-[#0e0f12] text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center p-6 select-none transition-colors bg-dot-grid">
        <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 shadow-xl flex flex-col items-center text-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
            <UserX className="w-7 h-7 stroke-[2]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">
              Removed from Meeting
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              {errorMessage || "You have been removed from this meeting by the host."}
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
            className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${isVideoOff ? "opacity-0 pointer-events-none" : "opacity-100"
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
              className={`w-6 h-6 rounded-full flex items-center justify-center shadow-md ${isMuted
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
              className={`relative p-2.5 rounded-full transition-all cursor-pointer ${isMuted
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
              className={`relative p-2.5 rounded-full transition-all cursor-pointer ${isVideoOff
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
    <div className={`w-full h-screen flex flex-col overflow-hidden select-none bg-dot-grid transition-colors duration-200 ${
      isDark ? "dark bg-[#0e0f12] text-stone-100" : "bg-stone-100 text-stone-900"
    }`}>
      {/* Top Navigation Bar */}
      <header className="h-16 pl-3 sm:pl-4 pr-3 sm:pr-3 flex items-center justify-between bg-transparent z-30 shrink-0">
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
            className={`hidden sm:flex -ml-1.5 w-9 h-9 rounded-xl items-center justify-center transition-colors cursor-pointer ${
              isDark
                ? "text-stone-400 hover:text-white hover:bg-stone-800/60"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/80"
            }`}
            title={isHost ? "Host Options" : "Leave Meeting"}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className={`text-sm sm:text-base font-semibold truncate max-w-[180px] sm:max-w-sm ${
              isDark ? "text-white" : "text-stone-900"
            }`}>
              {meeting?.title || "Instant Meeting"}
            </h1>
            <button
              type="button"
              onClick={handleCopyCode}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border transition-colors cursor-pointer group shadow-2xs ${
                isDark
                  ? "bg-stone-800/80 hover:bg-stone-700/80 text-stone-300 hover:text-white border-stone-700/60 hover:border-stone-600"
                  : "bg-stone-200/80 hover:bg-stone-300/80 text-stone-700 hover:text-stone-900 border-stone-300/80 hover:border-stone-400"
              }`}
              title="Click to copy meeting link"
            >
              <span>{roomCode}</span>
              {copiedCode ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Copy className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                  isDark ? "text-stone-400 group-hover:text-stone-200" : "text-stone-500 group-hover:text-stone-800"
                }`} />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Access Policy Toggle Button for Host */}
          {isHost && (
            <button
              type="button"
              onClick={handleToggleAccessPolicy}
              disabled={isUpdatingAccessPolicy}
              className={`hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer shrink-0 ${
                meeting?.accessPolicy === "approval"
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-500 dark:text-amber-300 hover:bg-amber-500/25"
                  : isDark
                    ? "bg-stone-800/80 hover:bg-stone-700/80 border-stone-700/60 text-stone-200"
                    : "bg-stone-200/80 hover:bg-stone-300/80 border-stone-300/80 text-stone-800"
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
                <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>
                {meeting?.accessPolicy === "approval" ? "Approval Required" : "Anyone Can Join"}
              </span>
            </button>
          )}

          {/* Elapsed Room Timer */}
          <div className={`hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-mono border shrink-0 ${
            isDark
              ? "bg-stone-800/60 text-stone-300 border-stone-700/60"
              : "bg-stone-200/60 text-stone-700 border-stone-300/60"
          }`}>
            <Clock className={`w-3.5 h-3.5 ${isDark ? "text-stone-400" : "text-stone-500"}`} />
            <span>{formatDuration(elapsedSeconds)}</span>
          </div>

          {/* Theme Switcher Toggle Button */}
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border shrink-0 ${
              isDark
                ? "bg-stone-800/80 hover:bg-stone-700/80 text-amber-300 border-stone-700/60"
                : "bg-white hover:bg-stone-200 text-amber-600 border-stone-300 shadow-2xs"
            }`}
            title={isDark ? "Switch to Light theme" : "Switch to Dark theme"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-stone-700" />}
          </button>

          {/* Compact Participant Avatar Box Stack: [Avatar] [Avatar] [Total] */}
          <button
            type="button"
            onClick={() => {
              if (isParticipantsOpen && panelTab === "people") {
                setIsParticipantsOpen(false);
              } else {
                setPanelTab("people");
                setIsParticipantsOpen(true);
              }
            }}
            className={`relative -translate-x-[1px] flex items-center -space-x-1.5 p-0.5 rounded-xl transition-all duration-200 cursor-pointer select-none shrink-0 ${
              isParticipantsOpen && panelTab === "people"
                ? isDark
                  ? "bg-stone-800/90 border border-stone-700/80 ring-1 ring-[#a8c7fa] shadow-md shadow-blue-500/15"
                  : "bg-white border border-stone-300 ring-1 ring-[#a8c7fa] shadow-md shadow-blue-500/15"
                : isDark
                  ? "bg-transparent border border-transparent hover:bg-stone-800/30 hover:border-stone-700/40"
                  : "bg-transparent border border-transparent hover:bg-stone-200/50 hover:border-stone-300/50"
            }`}
            title={`View participants (${participants.length} total)`}
          >
            {participants.slice(0, 2).map((p, idx) => {
              const initials = (p.name || p.email || "U")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .substring(0, 2);

              const bgGradients = [
                "from-amber-500 to-orange-600 text-white",
                "from-blue-600 to-indigo-700 text-white",
              ];
              const gradientClass = bgGradients[idx % bgGradients.length];

              return (
                <div
                  key={p.id || idx}
                  className={`relative w-8 h-8 rounded-lg ring-2 ${isDark ? "ring-[#0e0f12]" : "ring-stone-100"} overflow-hidden flex items-center justify-center text-[10.5px] font-bold shrink-0 shadow-sm bg-gradient-to-tr ${gradientClass}`}
                >
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name || "Participant"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <span style={{ display: p.image ? "none" : "flex" }} className="items-center justify-center w-full h-full">
                    {initials}
                  </span>
                </div>
              );
            })}

            {/* Overflow count box */}
            {participants.length > 2 && (
              <div className={`relative w-8 h-8 rounded-lg ring-2 ${isDark ? "ring-[#0e0f12] bg-stone-800 text-white" : "ring-stone-100 bg-stone-200 text-stone-800"} flex items-center justify-center text-[11px] font-semibold shrink-0 shadow-sm`}>
                +{participants.length - 2}
              </div>
            )}

            {/* Host Waiting-Room Badge */}
            {isHost && waitingParticipants.length > 0 && (
              <span className="absolute -top-1 -right-1 z-20 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold bg-amber-500 text-stone-950 shadow-sm flex items-center justify-center leading-none">
                +{waitingParticipants.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Video Stage + Google Meet Live Captions Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Central Stage: Video Grid */}
          <main className={`flex-1 p-2.5 sm:p-4 overflow-y-auto flex flex-col justify-center items-center w-full transition-all duration-300 min-h-0 ${
            (showQuickMicBar || showQuickCamBar) ? "pb-12 sm:pb-14" : ""
          }`}>
            <div
              className={`w-full h-full items-center justify-center gap-3 sm:gap-4 transition-all duration-300 ${
                isCaptionsActive
                  ? layoutMode === "spotlight"
                    ? "flex flex-col max-h-[56vh] sm:max-h-[60vh] max-w-4xl"
                    : participants.length === 1
                      ? "flex max-h-[56vh] sm:max-h-[60vh]"
                      : participants.length === 2
                        ? "grid grid-cols-1 md:grid-cols-2 max-h-[56vh] sm:max-h-[60vh]"
                        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-h-[56vh] sm:max-h-[60vh]"
                  : (showQuickMicBar || showQuickCamBar)
                  ? layoutMode === "spotlight"
                    ? "flex flex-col max-h-[76vh] sm:max-h-[78vh] max-w-4xl"
                    : participants.length === 1
                      ? "flex max-h-[76vh] sm:max-h-[78vh]"
                      : participants.length === 2
                        ? "grid grid-cols-1 md:grid-cols-2 max-h-[76vh] sm:max-h-[78vh]"
                        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-h-[76vh] sm:max-h-[78vh]"
                  : layoutMode === "spotlight"
                    ? "flex flex-col max-h-[85vh] max-w-4xl"
                    : participants.length === 1
                      ? "flex max-h-[85vh]"
                      : participants.length === 2
                        ? "grid grid-cols-1 md:grid-cols-2 max-h-[85vh]"
                        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-h-[85vh]"
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

              let activeStream: MediaStream | null = null;
              let isTileVideoOff = false;
              let isTileMuted = false;
              let remoteData: { socketId: string; userId: string; name: string; stream: MediaStream; isMuted?: boolean; isVideoOff?: boolean; isHandRaised?: boolean } | undefined = undefined;

              if (isCurrentUser) {
                activeStream = localStream;
                isTileVideoOff = isVideoOff;
                isTileMuted = isMuted;
              } else {
                remoteData = Array.from(remoteStreams.values()).find(
                  (r) => r.userId === p.id || r.socketId === p.id
                );
                if (remoteData) {
                  activeStream = remoteData.stream;
                  const audioTrack = remoteData.stream ? remoteData.stream.getAudioTracks()[0] : null;
                  const isAudioDisabled = audioTrack ? (!audioTrack.enabled || audioTrack.muted) : false;
                  isTileVideoOff = Boolean(remoteData.isVideoOff);
                  isTileMuted = Boolean(remoteData.isMuted) || isAudioDisabled;
                } else {
                  isTileVideoOff = true;
                  isTileMuted = true;
                }
              }

              const hasVideoTrack = activeStream && activeStream.getVideoTracks().some((t) => t.enabled);
              const showLiveVideo = !isTileVideoOff && hasVideoTrack;
              const avatarSrc = p.image ? p.image.replace(/=s\d+(-c)?$/, "=s384-c") : null;

              return (
                <div
                  key={p.id}
                  className={`relative w-full h-full min-h-[260px] sm:min-h-[320px] rounded-3xl flex flex-col items-center justify-center overflow-hidden group transition-all border ${
                    isDark
                      ? "bg-gradient-to-b from-stone-900 to-[#14151a] border-stone-800/90 shadow-2xl"
                      : "bg-gradient-to-b from-white to-stone-200/90 border-stone-300/90 shadow-md text-stone-900"
                  }`}
                >
                  {/* Live WebRTC Media Stream (Always mounted so audio plays continuously) */}
                  {activeStream && (
                    <VideoElement
                      stream={activeStream}
                      isMuted={isCurrentUser}
                      isMirrored={isCurrentUser}
                      isHidden={!showLiveVideo}
                    />
                  )}

                  {!showLiveVideo && (
                    <>
                      {/* Subtle Background Glow */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_70%)] pointer-events-none" />

                      {/* Center Avatar / Video Placeholder */}
                      <div className="flex flex-col items-center justify-center z-10">
                        <div className="relative">
                          <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 flex items-center justify-center text-2xl sm:text-3xl font-bold tracking-tight shadow-xl overflow-hidden ${
                            isDark
                              ? "bg-gradient-to-br from-stone-700 to-stone-900 border-stone-700/70 text-white"
                              : "bg-gradient-to-br from-stone-200 to-stone-300 border-stone-300 text-stone-800"
                          }`}>
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={p.name || "Participant"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Top Right Header Controls & Status Badges */}
                  <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2.5 pointer-events-auto">
                    {/* Mic Status Icon Box */}
                    {(() => {
                      const muted = isCurrentUser ? isMuted : isTileMuted;
                      const speaking = isCurrentUser
                        ? (!isMuted && isSpeaking)
                        : (!isTileMuted && (remoteSpeakingMap[p.id] || (remoteData ? remoteSpeakingMap[remoteData.socketId] : false)));
                      const statusText = muted ? "Muted" : speaking ? "Speaking" : "Mic On";
                      const colorClasses = muted
                        ? "text-red-500 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400";

                      return (
                        <div
                          title={statusText}
                          className={`group/status relative flex items-center h-8.5 px-2.5 rounded-xl backdrop-blur-md border transition-all duration-300 ease-out shadow-md ${
                            isDark
                              ? "bg-stone-950/80 border-stone-800/90 hover:border-stone-700/80 hover:bg-stone-900/90"
                              : "bg-white/95 border-stone-300/90 shadow-xs hover:border-stone-400"
                          }`}
                        >
                          <div className="flex items-center justify-center shrink-0">
                            {muted ? (
                              <MicOff className={`w-4.5 h-4.5 ${colorClasses} stroke-[2.2]`} />
                            ) : speaking ? (
                              <svg viewBox="0 0 24 24" fill="currentColor" className={`w-4.5 h-4.5 ${colorClasses} shrink-0`}>
                                <rect x="2" y="7" width="2.8" height="10" rx="1.4" className="animate-soundwave-1" />
                                <rect x="7.6" y="4" width="2.8" height="16" rx="1.4" className="animate-soundwave-2" />
                                <rect x="13.2" y="2" width="2.8" height="20" rx="1.4" className="animate-soundwave-3" />
                                <rect x="18.8" y="6" width="2.8" height="12" rx="1.4" className="animate-soundwave-4" />
                              </svg>
                            ) : (
                              <Mic className={`w-4.5 h-4.5 ${colorClasses} stroke-[2.2]`} />
                            )}
                          </div>

                          {/* Hover Text directly to the right in the same color */}
                          <span
                            className={`max-w-0 opacity-0 overflow-hidden whitespace-nowrap group-hover/status:max-w-[100px] group-hover/status:opacity-100 group-hover/status:ml-2 transition-all duration-300 ease-out text-xs font-semibold tracking-tight ${colorClasses}`}
                          >
                            {statusText}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Bottom-Left Participant Name & Hand Raised Badge */}
                  {(() => {
                    const isPHandRaised = isCurrentUser
                      ? isHandRaised
                      : Boolean(
                          remoteHandRaisedMap[p.id] ||
                          (remoteData && (remoteData.isHandRaised || remoteHandRaisedMap[remoteData.socketId] || (remoteData.userId && remoteHandRaisedMap[remoteData.userId])))
                        );
                    const participantDisplayName = p.name || (p.id.startsWith("guest_") ? "Guest" : "Participant");

                    return (
                      <div
                        className={`absolute bottom-3.5 left-3.5 z-20 flex items-center pointer-events-auto select-none rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          isPHandRaised
                            ? "p-1 pr-3.5 bg-[#a8c7fa] text-[#041e49] font-bold text-xs sm:text-sm shadow-lg shadow-blue-950/20 border border-[#a8c7fa]/80"
                            : `px-1 py-0.5 bg-transparent border border-transparent font-medium text-xs sm:text-sm ${
                                isDark || showLiveVideo ? "text-white drop-shadow-md" : "text-stone-900"
                              }`
                        }`}
                      >
                        <div
                          className={`overflow-hidden flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 ${
                            isPHandRaised
                              ? "w-6 h-6 sm:w-7 sm:h-7 opacity-100 scale-100 mr-2"
                              : "w-0 h-6 sm:h-7 opacity-0 scale-50 mr-0 pointer-events-none"
                          }`}
                        >
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-xs">
                            <Hand
                              key={isPHandRaised ? "hand-wave-active" : "hand-wave-idle"}
                              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#041e49] stroke-[2.4] ${
                                isPHandRaised ? "animate-hand-wave-once" : ""
                              }`}
                            />
                          </div>
                        </div>
                        <span className="truncate max-w-[140px] sm:max-w-[200px] transition-colors duration-300">
                          {participantDisplayName}
                        </span>
                        {isCurrentUser && (
                          <span
                            className={`text-xs shrink-0 transition-colors duration-300 ml-1 ${
                              isPHandRaised
                                ? "text-[#041e49]/80 font-semibold"
                                : isDark || showLiveVideo
                                ? "text-white/75 font-normal"
                                : "text-stone-500 font-normal"
                            }`}
                          >
                            (You)
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </main>

        {/* Google Meet Style Live Captions Section */}
        {isCaptionsActive && (
          <div className="w-full shrink-0 px-2.5 sm:px-4 pb-2.5 sm:pb-4 flex justify-center z-20 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2">
            <section
              className={`h-40 sm:h-48 md:h-52 w-full rounded-2xl sm:rounded-3xl flex flex-col justify-between px-4 sm:px-6 py-2.5 shadow-2xl select-text transition-all duration-200 border ${
                isDark
                  ? "bg-[#181a1d]/95 border-stone-700/60 text-white backdrop-blur-xl"
                  : "bg-stone-50/95 border-stone-300/80 text-stone-900 backdrop-blur-xl"
              }`}
            >
              {/* Header / Caption Controls Toolbar (Google Meet Style) */}
              <div className="w-full flex items-center justify-between gap-3 shrink-0 py-0.5">
              {/* Left: Language selector pill: [ 🌐 English ▾ ] */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowCaptionLangMenu(!showCaptionLangMenu);
                    setShowCaptionSizeMenu(false);
                  }}
                  className={`h-8 px-3.5 rounded-full border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
                    isDark
                      ? "bg-[#282a2d] hover:bg-[#35373b] active:bg-[#404347] border-stone-700/60 text-stone-200"
                      : "bg-white hover:bg-stone-100 border-stone-300 text-stone-800"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-stone-400" />
                  <span>
                    {CAPTION_LANGUAGES.find(
                      (l) =>
                        l.code === roomSettings.captionsTranslation.translationLanguage ||
                        l.name.toLowerCase() ===
                          (roomSettings.captionsTranslation.translationLanguage || "").toLowerCase()
                    )?.name || "English"}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${
                      showCaptionLangMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Popover */}
                {showCaptionLangMenu && (
                  <div className="absolute left-0 bottom-full mb-2 w-52 rounded-xl bg-[#282a2d] border border-stone-700/80 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2">
                    <div className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold px-2.5 py-1.5 border-b border-stone-700/50">
                      Caption Language
                    </div>
                    <div className="max-h-52 overflow-y-auto space-y-0.5 mt-1">
                      {CAPTION_LANGUAGES.map((lang) => {
                        const isSelected =
                          roomSettings.captionsTranslation.translationLanguage === lang.code ||
                          (roomSettings.captionsTranslation.translationLanguage || "").toLowerCase() ===
                            lang.name.toLowerCase();
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              updateRoomSettings((p) => ({
                                ...p,
                                captionsTranslation: {
                                  ...p.captionsTranslation,
                                  translationLanguage: lang.code,
                                },
                              }));
                              setShowCaptionLangMenu(false);
                              toast.success(`Captions language set to ${lang.name}`);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-stone-700/70 text-white font-semibold"
                                : "text-stone-200 hover:bg-stone-700/50"
                            }`}
                          >
                            <span>{lang.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: TT Size, Contrast, Settings */}
              <div className="flex items-center gap-1 text-stone-400">
                {/* Font Size Toggle Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCaptionSizeMenu(!showCaptionSizeMenu);
                      setShowCaptionLangMenu(false);
                    }}
                    className="w-8 h-8 rounded-full hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    title={`Font size: ${roomSettings.captionsTranslation.captionSize}`}
                  >
                    <span className="font-bold text-xs tracking-tighter">TT</span>
                  </button>

                  {showCaptionSizeMenu && (
                    <div className="absolute right-0 bottom-full mb-2 w-36 rounded-xl bg-[#282a2d] border border-stone-700/80 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2">
                      <div className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold px-2.5 py-1 border-b border-stone-700/50">
                        Text Size
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {(["small", "medium", "large", "huge"] as const).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => {
                              updateRoomSettings((p) => ({
                                ...p,
                                captionsTranslation: {
                                  ...p.captionsTranslation,
                                  captionSize: sz,
                                },
                              }));
                              setShowCaptionSizeMenu(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs capitalize text-left cursor-pointer transition-colors ${
                              roomSettings.captionsTranslation.captionSize === sz
                                ? "bg-stone-700/70 text-white font-semibold"
                                : "text-stone-200 hover:bg-stone-700/50"
                            }`}
                          >
                            <span>{sz}</span>
                            {roomSettings.captionsTranslation.captionSize === sz && (
                              <Check className="w-3.5 h-3.5 text-white shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contrast Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    setCaptionContrastMode((prev) => (prev === "normal" ? "high" : "normal"))
                  }
                  className={`w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer ${
                    captionContrastMode === "high" ? "text-amber-300" : "hover:text-white"
                  }`}
                  title="Toggle high contrast text"
                >
                  <CircleDot className="w-4 h-4" />
                </button>

                {/* Open / Close Captions Settings Tab */}
                <button
                  type="button"
                  onClick={() => {
                    if (isParticipantsOpen && panelTab === "settings" && settingsCategory === "captions") {
                      setIsParticipantsOpen(false);
                    } else {
                      setPanelTab("settings");
                      setSettingsCategory("captions");
                      setIsParticipantsOpen(true);
                    }
                  }}
                  className={`w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer ${
                    isParticipantsOpen && panelTab === "settings" && settingsCategory === "captions"
                      ? "text-blue-400 bg-white/10"
                      : "text-stone-400 hover:text-white"
                  }`}
                  title={
                    isParticipantsOpen && panelTab === "settings" && settingsCategory === "captions"
                      ? "Close caption settings"
                      : "Caption settings"
                  }
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Captions Content Stream with Sleek Scrollbar (Google Meet Style) */}
            <div
              ref={captionsContainerRef}
              className="flex-1 overflow-y-auto px-1 sm:px-2 py-2 space-y-3.5 w-full [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.35)_transparent]"
            >
              {captionMessages.length > 0 ? (
                captionMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3 sm:gap-3.5 animate-in fade-in duration-150">
                    {/* Circular Avatar */}
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden shrink-0 ring-1 ring-white/10 bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                      {msg.speakerImage ? (
                        <img
                          src={msg.speakerImage}
                          alt={msg.speakerName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span>{msg.speakerName.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>

                    {/* Speaker Name + Speech Text */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] sm:text-[13px] font-medium text-stone-300 mb-0.5 flex items-center gap-2">
                        <span>{msg.speakerName}</span>
                        {msg.userId === activeId && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-stone-400 font-normal">
                            You
                          </span>
                        )}
                      </div>
                      <p
                        className={`font-normal tracking-normal break-words leading-relaxed ${
                          roomSettings.captionsTranslation.captionSize === "tiny"
                            ? "text-[11px] sm:text-xs"
                            : roomSettings.captionsTranslation.captionSize === "small"
                            ? "text-xs sm:text-sm"
                            : roomSettings.captionsTranslation.captionSize === "large"
                            ? "text-base sm:text-lg"
                            : roomSettings.captionsTranslation.captionSize === "huge"
                            ? "text-lg sm:text-xl font-medium"
                            : "text-sm sm:text-base"
                        } ${
                          roomSettings.captionsTranslation.fontFamily === "serif"
                            ? "font-serif"
                            : roomSettings.captionsTranslation.fontFamily === "monospace"
                            ? "font-mono"
                            : roomSettings.captionsTranslation.fontFamily === "casual"
                            ? "tracking-wide font-sans"
                            : roomSettings.captionsTranslation.fontFamily === "cursive"
                            ? "italic font-serif"
                            : "font-sans"
                        } ${
                          captionContrastMode === "high"
                            ? "text-yellow-200 font-medium"
                            : roomSettings.captionsTranslation.fontColor === "yellow"
                            ? "text-yellow-300 font-medium"
                            : roomSettings.captionsTranslation.fontColor === "cyan"
                            ? "text-cyan-300 font-medium"
                            : roomSettings.captionsTranslation.fontColor === "green"
                            ? "text-emerald-300 font-medium"
                            : roomSettings.captionsTranslation.fontColor === "white"
                            ? "text-white"
                            : isDark
                            ? "text-white"
                            : "text-stone-900"
                        } ${
                          roomSettings.captionsTranslation.backgroundColor === "black"
                            ? "bg-black/90 px-2 py-0.5 rounded-md inline-block"
                            : roomSettings.captionsTranslation.backgroundColor === "dark-gray"
                            ? "bg-stone-800/90 px-2 py-0.5 rounded-md inline-block"
                            : roomSettings.captionsTranslation.backgroundColor === "blue"
                            ? "bg-blue-950/90 px-2 py-0.5 rounded-md inline-block"
                            : ""
                        }`}
                      >
                        {msg.text}
                        {!msg.isFinal && (
                          <span className="inline-block ml-1 w-1.5 h-3.5 bg-white/80 animate-pulse align-middle" />
                        )}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-center py-4 text-stone-400 text-xs sm:text-sm">
                  {!isSpeechRecognitionSupported ? (
                    <span className="text-amber-400 italic">
                      Speech recognition is not supported in this browser. You will still see captions from others.
                    </span>
                  ) : speechError === "not-allowed" ? (
                    <div className="flex items-center gap-3">
                      <span className="text-amber-300">Microphone permission needed for captions.</span>
                      <button
                        type="button"
                        onClick={() => startSpeechRecognition()}
                        className="px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs cursor-pointer"
                      >
                        Allow Microphone
                      </button>
                    </div>
                  ) : isMuted ? (
                    <span className="flex items-center gap-2 text-stone-400 italic">
                      <MicOff className="w-4 h-4 text-red-400" />
                      Microphone is muted. Unmute to speak and generate live captions.
                    </span>
                  ) : !isListening ? (
                    <div className="flex items-center gap-3">
                      <span className="text-stone-300">Speech recognition ready.</span>
                      <button
                        type="button"
                        onClick={() => startSpeechRecognition()}
                        className="px-3 py-1 rounded-full bg-white hover:bg-stone-200 text-stone-950 font-semibold text-xs cursor-pointer"
                      >
                        Start Listening
                      </button>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2 text-stone-300 font-medium">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      {isSpeaking
                        ? "Capturing voice..."
                        : "Listening... Captions will appear here when participants speak."}
                    </span>
                  )}
                </div>
              )}
              <div ref={captionsEndRef} />
            </div>
          </section>
        </div>
      )}
      </div>

        {/* Slide-out Side Drawer - Google Meet Style (People & In-call Chat) */}
        {isParticipantsOpen && (
          <aside className={`fixed inset-0 z-50 sm:static sm:z-20 w-full sm:w-[380px] h-full sm:h-[calc(100%-2rem)] sm:my-4 sm:mr-4 rounded-none sm:rounded-3xl border-0 sm:border flex flex-col shrink-0 overflow-hidden animate-in slide-in-from-right duration-200 ${
            isDark
              ? "bg-[#1e1f20] border-stone-800 shadow-2xl text-stone-100"
              : "bg-white border-stone-200 shadow-xl text-stone-900"
          }`}>
            {/* Header: Open panel title & Close */}
            <div className={`px-4 sm:px-5 py-4 border-b flex items-center justify-between shrink-0 ${
              isDark ? "border-stone-800/80" : "border-stone-200"
            }`}>
              <div className="flex items-center">
                {panelTab === "people" && (
                  <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2.5">
                    <Users className="w-5 h-5" />
                    <span>People ({participants.length})</span>
                  </h2>
                )}
                {panelTab === "chat" && (
                  <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2.5">
                    <MessageSquare className="w-5 h-5" />
                    <span>Chat</span>
                  </h2>
                )}
                {panelTab === "settings" && (
                  <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2.5">
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </h2>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsParticipantsOpen(false)}
                className="w-9 h-9 rounded-full text-stone-400 hover:text-white hover:bg-stone-800/80 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel Body: People Tab vs Chat Tab */}
            {panelTab === "people" ? (
              <div className="flex-1 overflow-y-auto flex flex-col">
                {/* Search Input: Search for people */}
                <div className="px-6 py-4">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={searchPeopleQuery}
                      onChange={(e) => setSearchPeopleQuery(e.target.value)}
                      placeholder="Search for people"
                      className="w-full pl-10 pr-9 py-2.5 rounded-lg bg-transparent border border-stone-600/70 focus:border-stone-400 focus:outline-hidden text-sm text-stone-200 placeholder-stone-400 transition-colors"
                    />
                    {searchPeopleQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchPeopleQuery("")}
                        className="absolute right-3 text-stone-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
                  {/* Waiting Room Section for Host */}
                  {isHost && waitingParticipants.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <p className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
                          WAITING TO JOIN ({waitingParticipants.length})
                        </p>
                        <button
                          type="button"
                          onClick={() => handleAdmitParticipant(undefined, true)}
                          disabled={isAdmittingAll}
                          className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer disabled:opacity-50"
                        >
                          {isAdmittingAll ? "Admitting..." : "Admit all"}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {waitingParticipants.map((wp) => (
                          <div
                            key={wp.id}
                            className="p-3 rounded-2xl border border-stone-800/80 hover:border-stone-600 bg-[#212226]/80 hover:bg-[#25272c] flex items-center justify-between gap-2 text-xs transition-all duration-200"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700/70 flex items-center justify-center text-xs font-bold text-stone-200 shrink-0">
                                {(wp.name || "G").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-white truncate text-xs">
                                  {wp.name || (wp.id.startsWith("guest_") ? "Guest" : "Participant")}
                                </p>
                                <p className="text-[10px] text-stone-400">Waiting</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleDenyParticipant(wp.id)}
                                disabled={denyingUserId === wp.id}
                                title="Deny"
                                className="p-1 rounded-md text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdmitParticipant(wp.id)}
                                disabled={admittingUserId === wp.id}
                                title="Admit"
                                className="p-1 rounded-md text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors cursor-pointer"
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

                  {/* Unique & Modern In The Meeting Section */}
                  <div className="space-y-3">
                    {/* Section Header: Count */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">
                        IN THE MEETING
                      </span>
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-800/80 border border-stone-700/50 text-[11px] font-mono text-stone-300 shadow-2xs">
                        <Users className="w-3 h-3 text-stone-400" />
                        <span>{sortedAndFilteredParticipants.length}</span>
                      </div>
                    </div>

                    {/* Participant Floating Card Tiles */}
                    <div className="space-y-2">
                      {sortedAndFilteredParticipants.length === 0 ? (
                        <div className="py-8 text-center rounded-2xl border border-stone-800/80 bg-stone-900/30 text-xs text-stone-400">
                          No matching participants found
                        </div>
                      ) : (
                        sortedAndFilteredParticipants.map((p) => {
                          const isUser =
                            p.id === currentUserId ||
                            (session?.user ? p.id === session.user.id : p.id === getSavedGuestIdentity().id);
                          const isHostUser =
                            p.role === "host" || (meeting && p.id === meeting.hostId);
                          const initials = (p.name || p.email || "U")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .substring(0, 2);

                          const remoteData = Array.from(remoteStreams.values()).find(
                            (r) => r.userId === p.id || r.socketId === p.id
                          );
                          const isItemMuted = isUser ? isMuted : (remoteData ? Boolean(remoteData.isMuted) : true);
                          const isItemSpeaking = isUser
                            ? (!isMuted && isSpeaking)
                            : (!isItemMuted && (remoteSpeakingMap[p.id] || (remoteData ? remoteSpeakingMap[remoteData.socketId] : false)));

                          return (
                            <div
                              key={p.id}
                              className={`group relative p-3 rounded-2xl border transition-all duration-200 ${isUser
                                ? "bg-[#25272c]/90 hover:bg-[#282a30] border-stone-700/80 hover:border-stone-600 shadow-xs"
                                : "bg-[#212226]/80 hover:bg-[#25272c] border-stone-800/80 hover:border-stone-700/70"
                                } flex items-center justify-between gap-3`}
                            >
                              {/* Left: Avatar + Details */}
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Avatar with Status indicator */}
                                <div className="relative shrink-0">
                                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-stone-800 border border-stone-700/70 flex items-center justify-center shadow-xs">
                                    {p.image ? (
                                      <img
                                        src={p.image}
                                        alt={p.name || "Participant"}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-xs font-bold text-stone-200 tracking-wider">
                                        {initials}
                                      </span>
                                    )}
                                  </div>
                                  {/* Audio status mini dot on avatar */}
                                  <span
                                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1e1f20] flex items-center justify-center ${isItemMuted
                                      ? "bg-stone-600"
                                      : isItemSpeaking
                                      ? "bg-emerald-500 animate-pulse ring-2 ring-emerald-400/50"
                                      : "bg-emerald-500"
                                      }`}
                                    title={isItemMuted ? "Muted" : isItemSpeaking ? "Speaking" : "Microphone on"}
                                  />
                                </div>

                                {/* Name + Badges */}
                                <div className="min-w-0 flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-stone-100 truncate">
                                      {p.name ||
                                        (p.id.startsWith("guest_") ? "Guest" : "Participant")}
                                    </p>
                                    {isUser && (
                                      <span className="px-1 py-0.5 rounded text-[8.5px] leading-none font-semibold tracking-wider bg-white/10 text-white border border-white/20 shrink-0">
                                        You
                                      </span>
                                    )}
                                    {(() => {
                                      const isPHandRaisedInList = isUser
                                        ? isHandRaised
                                        : Boolean(
                                            remoteHandRaisedMap[p.id] ||
                                            (remoteData && (remoteData.isHandRaised || remoteHandRaisedMap[remoteData.socketId] || (remoteData.userId && remoteHandRaisedMap[remoteData.userId])))
                                          );
                                      if (!isPHandRaisedInList) return null;
                                      return (
                                        <span className="inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#a8c7fa]/20 text-[#a8c7fa] border border-[#a8c7fa]/40 shrink-0">
                                          <span className="w-4 h-4 rounded-md bg-[#a8c7fa] text-[#041e49] flex items-center justify-center shrink-0">
                                            <Hand className="w-2.5 h-2.5 stroke-[2.4]" />
                                          </span>
                                          <span>Raised</span>
                                        </span>
                                      );
                                    })()}
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {isHostUser ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400/90">
                                        <Crown className="w-3 h-3 text-amber-400" />
                                        Meeting host
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-stone-400 truncate">
                                        {p.id.startsWith("guest_") ? "Guest attendee" : "Attendee"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right: Tactile Buttons (Mic button & More Menu) */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Interactive Mic Status / Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isUser) {
                                      setIsMuted(!isMuted);
                                      toast.info(
                                        isMuted ? "Microphone unmuted" : "Microphone muted"
                                      );
                                    }
                                  }}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isItemMuted
                                    ? "bg-stone-800/80 text-stone-400 border border-stone-700/50 hover:text-stone-200"
                                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                    } ${isUser ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-default"}`}
                                  title={
                                    isUser
                                      ? isMuted
                                        ? "Click to unmute"
                                        : "Click to mute"
                                      : isItemMuted
                                        ? "Participant is muted"
                                        : isItemSpeaking
                                        ? "Participant is speaking"
                                        : "Participant mic is on"
                                  }
                                >
                                  {(() => {
                                    if (isItemMuted) return <MicOff className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />;
                                    if (!isItemSpeaking) return <Mic className="w-3.5 h-3.5 text-emerald-400 stroke-[2.2]" />;
                                    return (
                                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-emerald-400 shrink-0">
                                        <rect x="2" y="7" width="2.8" height="10" rx="1.4" className="animate-soundwave-1" />
                                        <rect x="7.6" y="4" width="2.8" height="16" rx="1.4" className="animate-soundwave-2" />
                                        <rect x="13.2" y="2" width="2.8" height="20" rx="1.4" className="animate-soundwave-3" />
                                        <rect x="18.8" y="6" width="2.8" height="12" rx="1.4" className="animate-soundwave-4" />
                                      </svg>
                                    );
                                  })()}
                                </button>



                                {/* Options Menu Button */}
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuParticipantId(
                                        activeMenuParticipantId === p.id ? null : p.id
                                      );
                                    }}
                                    className="w-7 h-7 rounded-lg bg-stone-800/60 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700/40 hover:border-stone-700 transition-all flex items-center justify-center cursor-pointer"
                                    title="More options"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Dropdown Menu */}
                                  {activeMenuParticipantId === p.id && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-[#212226] border border-stone-700/80 shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
                                    >
                                      <div className="px-3 py-1.5 text-[11px] font-mono text-stone-400 border-b border-stone-700/60 truncate">
                                        {p.name || "Participant"}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          toast.info(`Pinned ${p.name || "participant"}`);
                                          setActiveMenuParticipantId(null);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-2"
                                      >
                                        <span>Pin to screen</span>
                                      </button>
                                      {isUser && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleCopyLink();
                                            setActiveMenuParticipantId(null);
                                          }}
                                          className="w-full text-left px-3 py-2 text-xs text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-2"
                                        >
                                          <span>Copy meeting link</span>
                                        </button>
                                      )}
                                      {isHost && !isUser && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveMenuParticipantId(null);
                                            setRemovingParticipant({
                                              id: p.id,
                                              name: p.name || (p.id.startsWith("guest_") ? "Guest" : "Participant"),
                                            });
                                          }}
                                          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer flex items-center gap-2"
                                        >
                                          <UserX className="w-3.5 h-3.5" />
                                          <span>Remove from meeting</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : panelTab === "chat" ? (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Messages Scroll Area */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 flex flex-col">
                  {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone-500">
                      <div className="w-12 h-12 rounded-2xl bg-stone-800/60 border border-stone-700/50 flex items-center justify-center mb-3 text-stone-400">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-stone-300">No messages yet</p>
                      <p className="text-xs text-stone-500 mt-1 max-w-[200px]">
                        Send a message to everyone in the meeting.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe =
                        msg.senderId === currentUserId ||
                        msg.senderId === session?.user?.id ||
                        msg.senderId === getSavedGuestIdentity().id;

                      const timeStr = msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "";

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-stone-400">
                            <span className="font-medium text-stone-300">
                              {isMe ? "You" : msg.senderName}
                            </span>
                            {timeStr && (
                              <span className="text-stone-500 text-[10px]">{timeStr}</span>
                            )}
                          </div>
                          <div
                            className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-xs ${isMe
                              ? "bg-[#a8c7fa] text-[#041e49] font-medium rounded-tr-xs"
                              : "bg-[#28292d] text-stone-200 border border-stone-700/70 rounded-tl-xs"
                              }`}
                          >
                            {msg.message}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Form & In-Call Notice */}
                <div className={`p-3 border-t shrink-0 space-y-1.5 ${
                  isDark ? "border-stone-800/80 bg-[#1e1f20]" : "border-stone-200 bg-stone-50"
                }`}>
                  <form
                    onSubmit={handleSendMessage}
                    className={`relative flex flex-col justify-between border rounded-2xl p-3 transition-all shadow-inner ${
                      isDark
                        ? "bg-[#28292d] border-stone-700/60 focus-within:border-white focus-within:ring-1 focus-within:ring-white/40"
                        : "bg-white border-stone-300 focus-within:border-stone-800 focus-within:ring-1 focus-within:ring-stone-800/30"
                    }`}
                  >
                    {/* Top: Auto-expanding textarea */}
                    <textarea
                      ref={chatTextareaRef}
                      rows={1}
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask anything or send a message..."
                      className={`w-full bg-transparent text-xs sm:text-sm placeholder-stone-400 focus:outline-none resize-none leading-relaxed overflow-y-auto ${
                        isDark ? "text-white" : "text-stone-900"
                      }`}
                      style={{ maxHeight: "120px", minHeight: "28px" }}
                    />

                    {/* Bottom: Utility and Action Bar (matching Perplexity/ChatGPT style) */}
                    <div className="flex items-center justify-between mt-2 pt-1">
                      {/* Left: Quick options */}
                      <div className="flex items-center gap-1.5 text-stone-400">
                        <button
                          type="button"
                          onClick={() => {
                            setChatInputText((prev) => prev ? prev + " 🤝" : "🤝 ");
                            chatTextareaRef.current?.focus();
                          }}
                          className="w-6 h-6 rounded-md hover:bg-stone-700/50 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Add symbol / emoji"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {/* Toggle Button: Audience / Recipient */}
                        <div className="relative" ref={recipientMenuRef}>
                          <button
                            type="button"
                            onClick={() => setShowRecipientDropdown((prev) => !prev)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer select-none active:scale-95 ${
                              chatRecipient === "everyone"
                                ? isDark
                                  ? "bg-stone-800/90 hover:bg-stone-700/80 border-stone-700/60 text-stone-200 hover:text-white"
                                  : "bg-stone-200/80 hover:bg-stone-300 border-stone-300 text-stone-800"
                                : isDark
                                  ? "bg-stone-700/80 hover:bg-stone-600/80 border-stone-600 text-white font-medium"
                                  : "bg-stone-200 hover:bg-stone-300 border-stone-400 text-stone-900 font-medium"
                            }`}
                            title="Choose who receives your message"
                          >
                            {chatRecipient === "everyone" ? (
                              <Globe className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                            )}
                            <span className="truncate max-w-[90px] sm:max-w-[120px]">
                              {chatRecipient === "everyone"
                                ? "Everyone"
                                : (() => {
                                    const found = participants.find((p) => p.id === chatRecipient);
                                    return found ? getParticipantDisplayName(found) : "Direct";
                                  })()}
                            </span>
                            <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform ${showRecipientDropdown ? "rotate-180" : ""}`} />
                          </button>

                          {/* Recipient Dropdown Popover */}
                          {showRecipientDropdown && (
                            <div
                              className={`absolute bottom-full left-0 mb-1.5 w-60 sm:w-64 rounded-xl border shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col ${
                                isDark ? "bg-[#25272c] border-stone-700 text-stone-200" : "bg-white border-stone-200 text-stone-800"
                              }`}
                            >
                              <div className="px-3 pt-2 pb-1.5 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-stone-400 border-b border-stone-700/40">
                                <span>Send message to:</span>
                                <span className="text-[10px] font-sans lowercase font-normal opacity-70">
                                  {selectableParticipants.length + 1} options
                                </span>
                              </div>

                              {/* Search Box */}
                              <div className="p-2 border-b border-stone-700/40">
                                <div className="relative flex items-center">
                                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 pointer-events-none" />
                                  <input
                                    type="text"
                                    value={recipientSearchQuery}
                                    onChange={(e) => setRecipientSearchQuery(e.target.value)}
                                    placeholder="Search participant..."
                                    className={`w-full pl-8 pr-7 py-1.5 rounded-lg border text-xs focus:outline-none transition-colors ${
                                      isDark
                                        ? "bg-stone-800/90 border-stone-700/70 text-white placeholder-stone-400 focus:border-white focus:ring-1 focus:ring-white/30"
                                        : "bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20"
                                    }`}
                                    autoFocus
                                  />
                                  {recipientSearchQuery && (
                                    <button
                                      type="button"
                                      onClick={() => setRecipientSearchQuery("")}
                                      className="absolute right-2 text-stone-400 hover:text-white p-0.5 cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Participant List */}
                              <div className="max-h-52 overflow-y-auto py-1">
                                {(!recipientSearchQuery || "everyone".includes(recipientSearchQuery.toLowerCase())) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setChatRecipient("everyone");
                                      setShowRecipientDropdown(false);
                                      setRecipientSearchQuery("");
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                                      chatRecipient === "everyone"
                                        ? isDark ? "bg-stone-700/60 text-white font-semibold" : "bg-stone-200 text-stone-900 font-semibold"
                                        : isDark ? "hover:bg-stone-700/40 text-stone-300" : "hover:bg-stone-100 text-stone-700"
                                    }`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                                        chatRecipient === "everyone"
                                          ? isDark
                                            ? "bg-white border-white text-stone-950"
                                            : "bg-stone-900 border-stone-900 text-white"
                                          : isDark
                                            ? "border-stone-600 bg-stone-800/40"
                                            : "border-stone-400 bg-stone-100"
                                      }`}
                                    >
                                      {chatRecipient === "everyone" && <Check className="w-3 h-3 stroke-[2.5]" />}
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                        isDark ? "bg-stone-700 text-stone-200" : "bg-stone-200 text-stone-700"
                                      }`}>
                                        <Globe className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="min-w-0 truncate">
                                        <div className="font-medium truncate">Everyone</div>
                                        <div className="text-[10px] text-stone-400 truncate">In this call</div>
                                      </div>
                                    </div>
                                  </button>
                                )}

                                {selectableParticipants.length === 0 && recipientSearchQuery && (
                                  <div className="px-3 py-4 text-center text-xs text-stone-400">
                                    No participants found
                                  </div>
                                )}

                                {selectableParticipants.map((p) => {
                                  const displayName = getParticipantDisplayName(p);
                                  const isSelected = chatRecipient === p.id;
                                  const isHost = p.role === "host" || (meeting && p.id === meeting.hostId);
                                  const initials = displayName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2) || "U";

                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          setChatRecipient("everyone");
                                        } else {
                                          setChatRecipient(p.id);
                                        }
                                        setShowRecipientDropdown(false);
                                        setRecipientSearchQuery("");
                                      }}
                                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                                        isSelected
                                          ? isDark
                                            ? "bg-stone-700/60 text-white font-semibold"
                                            : "bg-stone-200 text-stone-900 font-semibold"
                                          : isDark
                                            ? "hover:bg-stone-700/50 text-stone-300"
                                            : "hover:bg-stone-100 text-stone-700"
                                      }`}
                                    >
                                      <div
                                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                                          isSelected
                                            ? isDark
                                              ? "bg-white border-white text-stone-950"
                                              : "bg-stone-900 border-stone-900 text-white"
                                            : isDark
                                              ? "border-stone-600 bg-stone-800/40"
                                              : "border-stone-400 bg-stone-100"
                                        }`}
                                      >
                                        {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                                      </div>
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {p.image ? (
                                          <img
                                            src={p.image}
                                            alt={displayName}
                                            className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-stone-600/40"
                                          />
                                        ) : (
                                          <div className="w-6 h-6 rounded-full bg-stone-700 text-stone-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                                            {initials}
                                          </div>
                                        )}
                                        <div className="min-w-0 truncate">
                                          <div className="flex items-center gap-1.5 truncate">
                                            <span className="truncate font-medium">{displayName}</span>
                                            {isHost && (
                                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0 ${
                                                isDark
                                                  ? "bg-stone-700 text-stone-300 border border-stone-600/80"
                                                  : "bg-stone-200 text-stone-700 border border-stone-300"
                                              }`}>
                                                Host
                                              </span>
                                            )}
                                          </div>
                                          {p.email && (
                                            <div className="text-[10px] text-stone-400 truncate opacity-80">
                                              {p.email}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Circular Send Button with Up Arrow */}
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={!chatInputText.trim() || isSendingMessage}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#a8c7fa] hover:bg-[#b8d4fc] disabled:opacity-30 disabled:hover:bg-[#a8c7fa] text-[#041e49] flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:cursor-not-allowed shadow-xs active:scale-95"
                          title="Send message (Enter)"
                        >
                          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Chat In-Call Notice Banner */}
                  <div className={`px-1 text-[9px] sm:text-[9.5px] flex items-center gap-1 whitespace-nowrap tracking-tight ${
                    isDark ? "text-stone-400" : "text-stone-500"
                  }`}>
                    <Info className={`w-2.5 h-2.5 shrink-0 ${
                      isDark ? "text-stone-500" : "text-stone-400"
                    }`} />
                    <p>
                      Messages can only be seen by people in the call and are saved for this meeting.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto flex flex-col">
                {/* Settings Sub-category Tabs */}
                <div className="p-3 border-b border-stone-800/80 bg-stone-900/40 shrink-0">
                  <div className="flex items-center gap-1 bg-stone-900/90 p-1 rounded-xl border border-stone-800/70 w-full">
                    {[
                      { id: "audio", label: "Audio", icon: Mic },
                      { id: "video", label: "Video", icon: Camera },
                      { id: "isl", label: "ISL Sign", icon: Hand },
                      { id: "captions", label: "Captions", icon: Subtitles },
                      { id: "meeting", label: "Meeting", icon: Video },
                    ].map((cat) => {
                      const Icon = cat.icon;
                      const isActive = settingsCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSettingsCategory(cat.id as any)}
                          title={cat.label}
                          aria-label={cat.label}
                          className={`h-8 flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${isActive
                            ? "flex-initial px-3 bg-[#a8c7fa] text-[#041e49] font-bold shadow-xs shrink-0"
                            : "flex-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
                            }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          {isActive && <span>{cat.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Settings Content Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {settingsCategory === "audio" && (
                    <div className="space-y-4 pt-1">
                      {/* Subheader */}
                      <div className="space-y-1">
                        <h4 className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-stone-300">
                          MICROPHONE &amp; SPEAKERS
                        </h4>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          Configure your audio input, playback output, and text-to-speech speed
                        </p>
                      </div>

                      {/* Microphone Device - Outlined Fieldset */}
                      <fieldset className="relative border border-stone-600/80 rounded-xl px-3 pt-1 pb-2 bg-stone-900/40 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/30 transition-all">
                        <legend className="text-[11px] font-normal text-stone-400 px-1.5 ml-1 whitespace-nowrap">
                          Microphone
                        </legend>
                        <div className="relative flex items-center gap-2.5">
                          <Mic className="w-4 h-4 text-stone-300 shrink-0" />
                          <select
                            value={roomSettings.audioSpeech.microphone}
                            onChange={(e) =>
                              updateRoomSettings((p) => ({
                                ...p,
                                audioSpeech: { ...p.audioSpeech, microphone: e.target.value },
                              }))
                            }
                            className="w-full bg-transparent text-sm text-stone-100 focus:outline-hidden cursor-pointer py-0.5 appearance-none pr-6"
                          >
                            <option value="default" className="bg-stone-900 text-stone-100">
                              Default - Internal Microphone
                            </option>
                            <option value="external" className="bg-stone-900 text-stone-100">
                              External USB Microphone
                            </option>
                            <option value="headset" className="bg-stone-900 text-stone-100">
                              Bluetooth Headset Audio
                            </option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none absolute right-1" />
                        </div>
                      </fieldset>

                      {/* Speaker Device - Outlined Fieldset with Test Button */}
                      <fieldset className="relative border border-stone-600/80 rounded-xl pl-3 pr-1.5 pt-1.5 pb-1.5 bg-stone-900/40 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/30 transition-all">
                        <legend className="text-[11px] font-normal text-stone-400 px-1.5 ml-1 whitespace-nowrap">
                          Speakers
                        </legend>
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-stone-300 shrink-0" />
                          <div className="relative flex-1 min-w-0 flex items-center">
                            <select
                              value={roomSettings.audioSpeech.speaker}
                              onChange={(e) =>
                                updateRoomSettings((p) => ({
                                  ...p,
                                  audioSpeech: { ...p.audioSpeech, speaker: e.target.value },
                                }))
                              }
                              className="w-full bg-transparent text-sm text-stone-100 focus:outline-hidden cursor-pointer py-0.5 appearance-none pr-5 truncate"
                            >
                              <option value="default" className="bg-stone-900 text-stone-100">
                                Default - Internal Speakers
                              </option>
                              <option value="external" className="bg-stone-900 text-stone-100">
                                External Headphones / Output
                              </option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none absolute right-0.5" />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              toast.info("Testing audio output...", {
                                description: "Playing sample test chime.",
                                duration: 2000,
                              });
                            }}
                            className="h-6 px-2.5 rounded-md bg-stone-800 hover:bg-stone-700 active:bg-stone-650 border border-stone-700 text-xs font-medium text-stone-200 transition-all cursor-pointer shrink-0 flex items-center justify-center shadow-xs"
                          >
                            Test
                          </button>
                        </div>
                      </fieldset>

                      {/* Input Sensitivity Volume */}
                      <div className="space-y-2 pt-2 border-t border-stone-800/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-stone-300">Input Sensitivity Volume</span>
                          <span className="font-mono text-blue-400 font-semibold">{roomSettings.audioSpeech.volume}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={roomSettings.audioSpeech.volume}
                          onChange={(e) =>
                            updateRoomSettings((p) => ({
                              ...p,
                              audioSpeech: { ...p.audioSpeech, volume: Number(e.target.value) },
                            }))
                          }
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>

                      {/* Text-to-Speech Speed */}
                      <div className="space-y-2 pt-2 border-t border-stone-800/60">
                        <label className="text-xs font-medium text-stone-300">Text-to-Speech Speed</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                            <button
                              key={speed}
                              type="button"
                              onClick={() =>
                                updateRoomSettings((p) => ({
                                  ...p,
                                  audioSpeech: { ...p.audioSpeech, speechSpeed: speed },
                                }))
                              }
                              className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                roomSettings.audioSpeech.speechSpeed === speed
                                  ? "bg-[#a8c7fa] text-[#041e49] font-bold shadow-xs"
                                  : "bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200"
                              }`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reset Button */}
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            updateRoomSettings((p) => ({
                              ...p,
                              audioSpeech: {
                                ...p.audioSpeech,
                                microphone: "default",
                                speaker: "default",
                                volume: 80,
                                speechSpeed: 1.0,
                              },
                            }));
                            toast.info("Audio settings reset to default");
                          }}
                          className="px-5 py-2 rounded-xl bg-[#c2e7ff] hover:bg-[#b3d7ef] text-[#001d35] font-medium text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsCategory === "video" && (
                    <div className="space-y-4 pt-1">
                      {/* Mirror My Video Toggle Switch Row (matches Live captions toggle row) */}
                      <div className="py-2 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <label
                            onClick={() => {
                              const next = !roomSettings.video.mirrorCamera;
                              updateRoomSettings((p) => ({
                                ...p,
                                video: { ...p.video, mirrorCamera: next },
                              }));
                              toast.info(next ? "Self-view mirrored" : "Self-view unmirrored");
                            }}
                            className="text-sm font-semibold text-blue-400 hover:text-blue-300 cursor-pointer select-none"
                          >
                            Mirror my video
                          </label>
                          <p className="text-xs text-stone-400 leading-relaxed max-w-xs">
                            Flip your self-view horizontally to see yourself as in a mirror.
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={roomSettings.video.mirrorCamera}
                          onClick={() => {
                            const next = !roomSettings.video.mirrorCamera;
                            updateRoomSettings((p) => ({
                              ...p,
                              video: { ...p.video, mirrorCamera: next },
                            }));
                            toast.info(next ? "Self-view mirrored" : "Self-view unmirrored");
                          }}
                          className={`w-11 h-6 rounded-lg p-0.5 transition-all duration-200 ease-in-out cursor-pointer shrink-0 relative flex items-center border shadow-xs ${
                            roomSettings.video.mirrorCamera
                              ? "bg-blue-600 border-blue-500 shadow-blue-500/20"
                              : "bg-stone-800 border-stone-700 hover:bg-stone-750"
                          }`}
                        >
                          <span
                            className={`inline-block w-4.5 h-4.5 rounded-md bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                              roomSettings.video.mirrorCamera ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      {/* CUSTOMISE YOUR VIDEO */}
                      <div className="pt-3 border-t border-stone-800/80 space-y-3.5">
                        <div>
                          <h4 className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-stone-300">
                            CAMERA &amp; VIDEO QUALITY
                          </h4>
                          <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                            Configure your camera device, streaming quality, and visual effects
                          </p>
                        </div>

                        {/* Camera Device - Outlined Fieldset */}
                        <fieldset className="relative border border-stone-600/80 rounded-xl px-3 pt-1 pb-2 bg-stone-900/40 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/30 transition-all">
                          <legend className="text-[11px] font-normal text-stone-400 px-1.5 ml-1 whitespace-nowrap">
                            Camera
                          </legend>
                          <div className="relative flex items-center gap-2.5">
                            <Video className="w-4 h-4 text-stone-300 shrink-0" />
                            <select
                              value={roomSettings.video.camera}
                              onChange={(e) =>
                                updateRoomSettings((p) => ({
                                  ...p,
                                  video: { ...p.video, camera: e.target.value },
                                }))
                              }
                              className="w-full bg-transparent text-sm text-stone-100 focus:outline-hidden cursor-pointer py-0.5 appearance-none pr-6"
                            >
                              <option value="default" className="bg-stone-900 text-stone-100">
                                Default - FaceTime HD Camera
                              </option>
                              <option value="usb" className="bg-stone-900 text-stone-100">
                                External USB Webcam
                              </option>
                              <option value="virtual" className="bg-stone-900 text-stone-100">
                                Virtual Video Stream
                              </option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none absolute right-1" />
                          </div>
                        </fieldset>

                        {/* Send resolution (maximum) - Full Width Outlined Fieldset */}
                        <fieldset className="relative border border-stone-600/80 rounded-xl px-3 pt-1 pb-2 bg-stone-900/40 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/30 transition-all">
                          <legend className="text-[11px] font-normal text-stone-400 px-1.5 ml-1 whitespace-nowrap">
                            Send resolution (maximum)
                          </legend>
                          <div className="relative flex items-center">
                            <select
                              value={roomSettings.video.videoQuality || "auto"}
                              onChange={(e) =>
                                updateRoomSettings((p) => ({
                                  ...p,
                                  video: { ...p.video, videoQuality: e.target.value as any },
                                }))
                              }
                              className="w-full bg-transparent text-sm text-stone-100 focus:outline-hidden cursor-pointer py-0.5 appearance-none pr-6"
                            >
                              <option value="auto" className="bg-stone-900 text-stone-100">Auto</option>
                              <option value="1080p" className="bg-stone-900 text-stone-100">Full HD (1080p)</option>
                              <option value="720p" className="bg-stone-900 text-stone-100">High definition (720p)</option>
                              <option value="360p" className="bg-stone-900 text-stone-100">Standard definition (360p)</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none absolute right-1" />
                          </div>
                        </fieldset>

                        {/* Visual effects - Full Width Outlined Fieldset */}
                        <fieldset className="relative border border-stone-600/80 rounded-xl px-3 pt-1 pb-2 bg-stone-900/40 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/30 transition-all">
                          <legend className="text-[11px] font-normal text-stone-400 px-1.5 ml-1 whitespace-nowrap">
                            Visual effects
                          </legend>
                          <div className="relative flex items-center">
                            <select
                              value={roomSettings.video.backgroundEffect || "none"}
                              onChange={(e) =>
                                updateRoomSettings((p) => ({
                                  ...p,
                                  video: { ...p.video, backgroundEffect: e.target.value as any },
                                }))
                              }
                              className="w-full bg-transparent text-sm text-stone-100 focus:outline-hidden cursor-pointer py-0.5 appearance-none pr-6"
                            >
                              <option value="none" className="bg-stone-900 text-stone-100">None</option>
                              <option value="blur" className="bg-stone-900 text-stone-100">Blur background</option>
                              <option value="studio" className="bg-stone-900 text-stone-100">Studio lighting</option>
                              <option value="nature" className="bg-stone-900 text-stone-100">Nature background</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none absolute right-1" />
                          </div>
                        </fieldset>

                        {/* Reset Button */}
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              updateRoomSettings((p) => ({
                                ...p,
                                video: {
                                  ...p.video,
                                  camera: "default",
                                  videoQuality: "auto",
                                  backgroundEffect: "none",
                                  mirrorCamera: true,
                                },
                              }));
                              toast.info("Video settings reset to default");
                            }}
                            className="px-5 py-2 rounded-xl bg-[#c2e7ff] hover:bg-[#b3d7ef] text-[#001d35] font-medium text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsCategory === "isl" && (
                    <div className="space-y-4 pt-1">
                      {/* ISL Sign Detection Toggle Switch Row */}
                      <div className="py-2 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <label
                            onClick={() => {
                              const next = !isIslActive;
                              setIsIslActive(next);
                              toast.info(next ? "ISL AI Detection Enabled" : "ISL Detection Paused");
                            }}
                            className="text-sm font-semibold text-blue-400 hover:text-blue-300 cursor-pointer select-none"
                          >
                            Sign language detection
                          </label>
                          <p className="text-xs text-stone-400 leading-relaxed max-w-xs">
                            Translates Indian Sign Language gestures in real-time using AI vision.
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={isIslActive}
                          onClick={() => {
                            const next = !isIslActive;
                            setIsIslActive(next);
                            toast.info(next ? "ISL AI Detection Enabled" : "ISL Detection Paused");
                          }}
                          className={`w-11 h-6 rounded-lg p-0.5 transition-all duration-200 ease-in-out cursor-pointer shrink-0 relative flex items-center border shadow-xs ${
                            isIslActive
                              ? "bg-blue-600 border-blue-500 shadow-blue-500/20"
                              : "bg-stone-800 border-stone-700 hover:bg-stone-750"
                          }`}
                        >
                          <span
                            className={`inline-block w-4.5 h-4.5 rounded-md bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                              isIslActive ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      {/* CUSTOMISE SIGN LANGUAGE */}
                      <div className="pt-3 border-t border-stone-800/80 space-y-3.5">
                        <div>
                          <h4 className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-stone-300">
                            CUSTOMISE SIGN LANGUAGE
                          </h4>
                          <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                            Configure sign system language, detection sensitivity, and prediction confidence
                          </p>
                        </div>

                        {/* Sign Language System - Outlined Fieldset */}
                        <fieldset className="relative border border-stone-600/80 rounded-xl px-3 pt-1 pb-2 bg-stone-900/40 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/30 transition-all">
                          <legend className="text-[11px] font-normal text-stone-400 px-1.5 ml-1 whitespace-nowrap">
                            Sign language system
                          </legend>
                          <div className="relative flex items-center gap-2.5">
                            <Hand className="w-4 h-4 text-stone-300 shrink-0" />
                            <select
                              value={roomSettings.signLanguage.language}
                              onChange={(e) =>
                                updateRoomSettings((p) => ({
                                  ...p,
                                  signLanguage: { ...p.signLanguage, language: e.target.value as any },
                                }))
                              }
                              className="w-full bg-transparent text-sm text-stone-100 focus:outline-hidden cursor-pointer py-0.5 appearance-none pr-6"
                            >
                              <option value="isl" className="bg-stone-900 text-stone-100">
                                ISL (Indian Sign Language)
                              </option>
                              <option value="asl" className="bg-stone-900 text-stone-100">
                                ASL (American Sign Language)
                              </option>
                              <option value="bsl" className="bg-stone-900 text-stone-100">
                                BSL (British Sign Language)
                              </option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none absolute right-1" />
                          </div>
                        </fieldset>

                        {/* Detection Sensitivity */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-stone-300">Detection Sensitivity</span>
                            <span className="font-mono text-blue-400 font-semibold">
                              {roomSettings.signLanguage.detectionSensitivity}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={100}
                            value={roomSettings.signLanguage.detectionSensitivity}
                            onChange={(e) =>
                              updateRoomSettings((p) => ({
                                ...p,
                                signLanguage: {
                                  ...p.signLanguage,
                                  detectionSensitivity: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-full accent-blue-500 cursor-pointer"
                          />
                        </div>

                        {/* Prediction Confidence */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-stone-300">Prediction Confidence</span>
                            <span className="font-mono text-blue-400 font-semibold">
                              {roomSettings.signLanguage.predictionConfidence}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={20}
                            max={99}
                            value={roomSettings.signLanguage.predictionConfidence}
                            onChange={(e) =>
                              updateRoomSettings((p) => ({
                                ...p,
                                signLanguage: {
                                  ...p.signLanguage,
                                  predictionConfidence: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-full accent-blue-500 cursor-pointer"
                          />
                        </div>

                        {/* Reset Button */}
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              updateRoomSettings((p) => ({
                                ...p,
                                signLanguage: {
                                  ...p.signLanguage,
                                  language: "isl",
                                  detectionSensitivity: 80,
                                  predictionConfidence: 75,
                                },
                              }));
                              toast.info("Sign language settings reset to default");
                            }}
                            className="px-5 py-2 rounded-xl bg-[#c2e7ff] hover:bg-[#b3d7ef] text-[#001d35] font-medium text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsCategory === "captions" && (
                    <div className="space-y-4 pt-1">
                      {/* Live Captions Toggle Switch Row */}
                      <div className="py-2 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <label
                            onClick={() => {
                              const next = !isCaptionsActive;
                              setIsCaptionsActive(next);
                              if (next && !isMuted) startSpeechRecognition();
                              updateRoomSettings((p) => ({
                                ...p,
                                captionsTranslation: { ...p.captionsTranslation, enableCaptions: next },
                              }));
                              toast.info(next ? "Live Captions Enabled" : "Live Captions Disabled");
                            }}
                            className="text-sm font-semibold text-blue-400 hover:text-blue-300 cursor-pointer select-none"
                          >
                            Live captions
                          </label>
                          <p className="text-xs text-stone-400 leading-relaxed max-w-xs">
                            Shows you captions for speech in the language of the meeting.
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={isCaptionsActive}
                          onClick={() => {
                            const next = !isCaptionsActive;
                            setIsCaptionsActive(next);
                            if (next && !isMuted) startSpeechRecognition();
                            updateRoomSettings((p) => ({
                              ...p,
                              captionsTranslation: { ...p.captionsTranslation, enableCaptions: next },
                            }));
                            toast.info(next ? "Live Captions Enabled" : "Live Captions Disabled");
                          }}
                          className={`w-11 h-6 rounded-lg p-0.5 transition-all duration-200 ease-in-out cursor-pointer shrink-0 relative flex items-center border shadow-xs ${
                            isCaptionsActive
                              ? "bg-blue-600 border-blue-500 shadow-blue-500/20"
                              : "bg-stone-800 border-stone-700 hover:bg-stone-750"
                          }`}
                        >
                          <span
                            className={`inline-block w-4.5 h-4.5 rounded-md bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                              isCaptionsActive ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      {/* CUSTOMISE YOUR CAPTIONS */}
                      <div className="pt-3 border-t border-stone-800/80 space-y-3.5">
                        <div>
                          <h4 className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-stone-300">
                            CUSTOMISE YOUR CAPTIONS
                          </h4>
                          <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                            Choose your preferred settings to set how captions will appear during your calls
                          </p>
                        </div>

                        {/* Language of the meeting - Outlined Fieldset */}
                        <fieldset className="relative border border-stone-600/80 rounded-xl px-3 pt-1 pb-2 bg-stone-900/40 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/30 transition-all">
                          <legend className="text-[11px] font-normal text-stone-400 px-1.5 ml-1 whitespace-nowrap">
                            Language of the meeting
                          </legend>
                          <div className="relative flex items-center gap-2.5">
                            <Globe className="w-4 h-4 text-stone-300 shrink-0" />
                            <select
                              value={
                                roomSettings.captionsTranslation.translationLanguage === "en" ||
                                roomSettings.captionsTranslation.translationLanguage === "English"
                                  ? "en"
                                  : roomSettings.captionsTranslation.translationLanguage === "hi" ||
                                    roomSettings.captionsTranslation.translationLanguage === "Hindi"
                                  ? "hi"
                                  : roomSettings.captionsTranslation.translationLanguage === "mr" ||
                                    roomSettings.captionsTranslation.translationLanguage === "Marathi"
                                  ? "mr"
                                  : roomSettings.captionsTranslation.translationLanguage === "ta" ||
                                    roomSettings.captionsTranslation.translationLanguage === "Tamil"
                                  ? "ta"
                                  : roomSettings.captionsTranslation.translationLanguage === "te" ||
                                    roomSettings.captionsTranslation.translationLanguage === "Telugu"
                                  ? "te"
                                  : roomSettings.captionsTranslation.translationLanguage === "bn" ||
                                    roomSettings.captionsTranslation.translationLanguage === "Bengali"
                                  ? "bn"
                                  : roomSettings.captionsTranslation.translationLanguage === "gu" ||
                                    roomSettings.captionsTranslation.translationLanguage === "Gujarati"
                                  ? "gu"
                                  : roomSettings.captionsTranslation.translationLanguage === "es" ||
                                    roomSettings.captionsTranslation.translationLanguage === "Spanish"
                                  ? "es"
                                  : roomSettings.captionsTranslation.translationLanguage === "fr" ||
                                    roomSettings.captionsTranslation.translationLanguage === "French"
                                  ? "fr"
                                  : roomSettings.captionsTranslation.translationLanguage
                              }
                              onChange={(e) => {
                                const nextLang = e.target.value;
                                updateRoomSettings((p) => ({
                                  ...p,
                                  captionsTranslation: {
                                    ...p.captionsTranslation,
                                    translationLanguage: nextLang,
                                  },
                                }));
                                toast.success(
                                  `Language set to ${
                                    CAPTION_LANGUAGES.find((l) => l.code === nextLang)?.name || nextLang
                                  }`
                                );
                              }}
                              className="w-full bg-transparent text-sm text-stone-100 focus:outline-hidden cursor-pointer py-0.5 appearance-none pr-6"
                            >
                              {CAPTION_LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code} className="bg-stone-900 text-stone-100">
                                  {lang.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none absolute right-1" />
                          </div>
                        </fieldset>

                        {/* 2x2 Grid of Dropdowns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Font size */}
                          <fieldset className="relative border border-stone-600/80 rounded-xl px-3 pt-1 pb-2 bg-stone-900/40 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/30 transition-all">
                            <legend className="text-[11px] font-normal text-stone-400 px-1.5 ml-1 whitespace-nowrap">
                              Font size
                            </legend>
                            <div className="relative flex items-center">
                              <select
                                value={roomSettings.captionsTranslation.captionSize || "medium"}
                                onChange={(e) =>
                                  updateRoomSettings((p) => ({
                                    ...p,
                                    captionsTranslation: {
                                      ...p.captionsTranslation,
                                      captionSize: e.target.value as any,
                                    },
                                  }))
                                }
                                className="w-full bg-transparent text-sm text-stone-100 focus:outline-hidden cursor-pointer py-0.5 appearance-none pr-6 capitalize"
                              >
                                <option value="tiny" className="bg-stone-900 text-stone-100">Tiny</option>
                                <option value="small" className="bg-stone-900 text-stone-100">Small</option>
                                <option value="medium" className="bg-stone-900 text-stone-100">Default</option>
                                <option value="large" className="bg-stone-900 text-stone-100">Large</option>
                                <option value="huge" className="bg-stone-900 text-stone-100">Huge</option>
                              </select>
                              <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none absolute right-1" />
                            </div>
                          </fieldset>

                          {/* Font */}
                          <fieldset className="relative border border-stone-600/80 rounded-xl px-3 pt-1 pb-2 bg-stone-900/40 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/30 transition-all">
                            <legend className="text-[11px] font-normal text-stone-400 px-1.5 ml-1 whitespace-nowrap">
                              Font
                            </legend>
                            <div className="relative flex items-center">
                              <select
                                value={roomSettings.captionsTranslation.fontFamily || "default"}
                                onChange={(e) =>
                                  updateRoomSettings((p) => ({
                                    ...p,
                                    captionsTranslation: {
                                      ...p.captionsTranslation,
                                      fontFamily: e.target.value as any,
                                    },
                                  }))
                                }
                                className="w-full bg-transparent text-sm text-stone-100 focus:outline-hidden cursor-pointer py-0.5 appearance-none pr-6 capitalize"
                              >
                                <option value="default" className="bg-stone-900 text-stone-100">Default</option>
                                <option value="sans-serif" className="bg-stone-900 text-stone-100">Sans-serif</option>
                                <option value="serif" className="bg-stone-900 text-stone-100">Serif</option>
                                <option value="monospace" className="bg-stone-900 text-stone-100">Monospace</option>
                                <option value="casual" className="bg-stone-900 text-stone-100">Casual</option>
                                <option value="cursive" className="bg-stone-900 text-stone-100">Cursive</option>
                              </select>
                              <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none absolute right-1" />
                            </div>
                          </fieldset>

                          {/* Font colour */}
                          <fieldset className="relative border border-stone-600/80 rounded-xl px-3 pt-1 pb-2 bg-stone-900/40 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/30 transition-all">
                            <legend className="text-[11px] font-normal text-stone-400 px-1.5 ml-1 whitespace-nowrap">
                              Font colour
                            </legend>
                            <div className="relative flex items-center">
                              <select
                                value={roomSettings.captionsTranslation.fontColor || "default"}
                                onChange={(e) =>
                                  updateRoomSettings((p) => ({
                                    ...p,
                                    captionsTranslation: {
                                      ...p.captionsTranslation,
                                      fontColor: e.target.value as any,
                                    },
                                  }))
                                }
                                className="w-full bg-transparent text-sm text-stone-100 focus:outline-hidden cursor-pointer py-0.5 appearance-none pr-6 capitalize"
                              >
                                <option value="default" className="bg-stone-900 text-stone-100">Default</option>
                                <option value="white" className="bg-stone-900 text-stone-100">White</option>
                                <option value="yellow" className="bg-stone-900 text-stone-100">Yellow</option>
                                <option value="cyan" className="bg-stone-900 text-stone-100">Cyan</option>
                                <option value="green" className="bg-stone-900 text-stone-100">Green</option>
                              </select>
                              <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none absolute right-1" />
                            </div>
                          </fieldset>

                          {/* Background colour */}
                          <fieldset className="relative border border-stone-600/80 rounded-xl px-3 pt-1 pb-2 bg-stone-900/40 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/30 transition-all">
                            <legend className="text-[11px] font-normal text-stone-400 px-1.5 ml-1 whitespace-nowrap">
                              Background colour
                            </legend>
                            <div className="relative flex items-center">
                              <select
                                value={roomSettings.captionsTranslation.backgroundColor || "default"}
                                onChange={(e) =>
                                  updateRoomSettings((p) => ({
                                    ...p,
                                    captionsTranslation: {
                                      ...p.captionsTranslation,
                                      backgroundColor: e.target.value as any,
                                    },
                                  }))
                                }
                                className="w-full bg-transparent text-sm text-stone-100 focus:outline-hidden cursor-pointer py-0.5 appearance-none pr-6 capitalize"
                              >
                                <option value="default" className="bg-stone-900 text-stone-100">Default</option>
                                <option value="black" className="bg-stone-900 text-stone-100">Black</option>
                                <option value="dark-gray" className="bg-stone-900 text-stone-100">Dark Gray</option>
                                <option value="blue" className="bg-stone-900 text-stone-100">Blue</option>
                                <option value="transparent" className="bg-stone-900 text-stone-100">Transparent</option>
                              </select>
                              <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none absolute right-1" />
                            </div>
                          </fieldset>
                        </div>

                        {/* Reset Button */}
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              updateRoomSettings((p) => ({
                                ...p,
                                captionsTranslation: {
                                  ...p.captionsTranslation,
                                  captionSize: "medium",
                                  fontFamily: "default",
                                  fontColor: "default",
                                  backgroundColor: "default",
                                },
                              }));
                              toast.info("Captions settings reset to default");
                            }}
                            className="px-5 py-2 rounded-xl bg-[#c2e7ff] hover:bg-[#b3d7ef] text-[#001d35] font-medium text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsCategory === "meeting" && (
                    <div className="space-y-4 pt-1">
                      {/* Subheader */}
                      <div className="space-y-1">
                        <h4 className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-stone-300">
                          HOST CONTROLS &amp; ACCESS
                        </h4>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          Manage meeting entry policies, participant permissions, and waiting room
                        </p>
                      </div>

                      {/* Access Policy Outlined Fieldset */}
                      {isHost ? (
                        <div className="space-y-1.5">
                          <fieldset className="relative border border-stone-600/80 rounded-xl px-3 pt-1 pb-2 bg-stone-900/40 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/30 transition-all">
                            <legend className="text-[11px] font-normal text-stone-400 px-1.5 ml-1 whitespace-nowrap">
                              Access policy
                            </legend>
                            <div className="relative flex items-center gap-2.5">
                              {isUpdatingAccessPolicy ? (
                                <div className="w-4 h-4 rounded-full border-2 border-stone-400 border-t-transparent animate-spin shrink-0" />
                              ) : meeting?.accessPolicy === "approval" ? (
                                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                              ) : (
                                <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                              )}
                              <select
                                value={meeting?.accessPolicy === "approval" ? "approval" : "open"}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (
                                    (val === "approval" && meeting?.accessPolicy !== "approval") ||
                                    (val === "open" && meeting?.accessPolicy === "approval")
                                  ) {
                                    handleToggleAccessPolicy();
                                  }
                                }}
                                disabled={isUpdatingAccessPolicy}
                                className="w-full bg-transparent text-sm text-stone-100 focus:outline-hidden cursor-pointer py-0.5 appearance-none pr-6"
                              >
                                <option value="open" className="bg-stone-900 text-stone-100">
                                  Open Access (Anyone can join)
                                </option>
                                <option value="approval" className="bg-stone-900 text-stone-100">
                                  Approval Required (Waiting room)
                                </option>
                              </select>
                              <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none absolute right-1" />
                            </div>
                          </fieldset>
                          <p className="text-[11px] text-stone-400 leading-relaxed px-1">
                            {meeting?.accessPolicy === "approval"
                              ? "Participants must wait in the waiting room until admitted by the host."
                              : "Anyone with the meeting link can enter directly without asking."}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <fieldset className="relative border border-stone-600/80 rounded-xl px-3 pt-1 pb-2 bg-stone-900/40 transition-all">
                            <legend className="text-[11px] font-normal text-stone-400 px-1.5 ml-1 whitespace-nowrap">
                              Access policy
                            </legend>
                            <div className="relative flex items-center justify-between gap-2.5 py-0.5">
                              <div className="flex items-center gap-2 text-sm text-stone-200 min-w-0">
                                {meeting?.accessPolicy === "approval" ? (
                                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                                ) : (
                                  <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                                )}
                                <span className="truncate">
                                  {meeting?.accessPolicy === "approval"
                                    ? "Approval Required (Waiting room)"
                                    : "Open Access (Anyone can join)"}
                                </span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-stone-800 text-stone-400 border border-stone-700/80 shrink-0">
                                Host controlled
                              </span>
                            </div>
                          </fieldset>
                          <p className="text-[11px] text-stone-400 leading-relaxed px-1">
                            This meeting is currently set to{" "}
                            <strong className="text-emerald-400 font-medium">
                              {meeting?.accessPolicy === "approval" ? "Approval Required" : "Anyone Can Join"}
                            </strong>{" "}
                            by the host.
                          </p>
                        </div>
                      )}

                      {/* Default Join Preferences */}
                      <div className="pt-3 border-t border-stone-800/80 space-y-3.5">
                        <div>
                          <h4 className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-stone-300">
                            DEFAULT JOIN PREFERENCES
                          </h4>
                          <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                            Choose your starting audio and camera state when joining calls
                          </p>
                        </div>

                        {/* Always join with microphone muted Switch Row */}
                        <div className="py-2 flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <label
                              onClick={() => {
                                const next = !roomSettings.meeting.defaultMicMuted;
                                updateRoomSettings((p) => ({
                                  ...p,
                                  meeting: { ...p.meeting, defaultMicMuted: next },
                                }));
                                toast.info(next ? "Microphone muted on join" : "Microphone active on join");
                              }}
                              className="text-sm font-semibold text-blue-400 hover:text-blue-300 cursor-pointer select-none"
                            >
                              Always join with microphone muted
                            </label>
                            <p className="text-xs text-stone-400 leading-relaxed max-w-xs">
                              Automatically mute your microphone when entering any meeting.
                            </p>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={roomSettings.meeting.defaultMicMuted}
                            onClick={() => {
                              const next = !roomSettings.meeting.defaultMicMuted;
                              updateRoomSettings((p) => ({
                                ...p,
                                meeting: { ...p.meeting, defaultMicMuted: next },
                              }));
                              toast.info(next ? "Microphone muted on join" : "Microphone active on join");
                            }}
                            className={`w-11 h-6 rounded-lg p-0.5 transition-all duration-200 ease-in-out cursor-pointer shrink-0 relative flex items-center border shadow-xs ${
                              roomSettings.meeting.defaultMicMuted
                                ? "bg-blue-600 border-blue-500 shadow-blue-500/20"
                                : "bg-stone-800 border-stone-700 hover:bg-stone-750"
                            }`}
                          >
                            <span
                              className={`inline-block w-4.5 h-4.5 rounded-md bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                                roomSettings.meeting.defaultMicMuted ? "translate-x-5" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Always join with camera turned off Switch Row */}
                        <div className="py-2 flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <label
                              onClick={() => {
                                const next = !roomSettings.meeting.defaultCamOff;
                                updateRoomSettings((p) => ({
                                  ...p,
                                  meeting: { ...p.meeting, defaultCamOff: next },
                                }));
                                toast.info(next ? "Camera turned off on join" : "Camera active on join");
                              }}
                              className="text-sm font-semibold text-blue-400 hover:text-blue-300 cursor-pointer select-none"
                            >
                              Always join with camera turned off
                            </label>
                            <p className="text-xs text-stone-400 leading-relaxed max-w-xs">
                              Keep your video camera disabled when entering any meeting.
                            </p>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={roomSettings.meeting.defaultCamOff}
                            onClick={() => {
                              const next = !roomSettings.meeting.defaultCamOff;
                              updateRoomSettings((p) => ({
                                ...p,
                                meeting: { ...p.meeting, defaultCamOff: next },
                              }));
                              toast.info(next ? "Camera turned off on join" : "Camera active on join");
                            }}
                            className={`w-11 h-6 rounded-lg p-0.5 transition-all duration-200 ease-in-out cursor-pointer shrink-0 relative flex items-center border shadow-xs ${
                              roomSettings.meeting.defaultCamOff
                                ? "bg-blue-600 border-blue-500 shadow-blue-500/20"
                                : "bg-stone-800 border-stone-700 hover:bg-stone-750"
                            }`}
                          >
                            <span
                              className={`inline-block w-4.5 h-4.5 rounded-md bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                                roomSettings.meeting.defaultCamOff ? "translate-x-5" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Encrypted Meeting Info Box */}
                      <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-700/80 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <Shield className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-stone-200 text-xs sm:text-sm">End-to-End Encrypted</p>
                            <p className="text-[11px] text-stone-400 font-mono truncate">Room code: {roomCode}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95"
                          title="Copy meeting link"
                        >
                          {copiedLink ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-stone-400" />
                              <span>Copy link</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Reset Button */}
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            updateRoomSettings((p) => ({
                              ...p,
                              meeting: {
                                ...p.meeting,
                                defaultMicMuted: false,
                                defaultCamOff: false,
                              },
                            }));
                            toast.info("Meeting preferences reset to default");
                          }}
                          className="px-5 py-2 rounded-xl bg-[#c2e7ff] hover:bg-[#b3d7ef] text-[#001d35] font-medium text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>



      {/* Bottom Control Bar */}
      <footer className={`w-full h-16 sm:h-20 px-2 sm:px-6 py-1.5 backdrop-blur-md sm:backdrop-blur-none flex items-center justify-between gap-2 relative z-30 shrink-0 border-t sm:border-0 transition-colors duration-200 ${
        isDark
          ? "bg-[#121316]/90 sm:bg-transparent border-stone-800/40"
          : "bg-white/90 sm:bg-transparent border-stone-200/80"
      }`}>
        {/* Left slot: Admit Guest pill — aligned with video frame left edge */}
        <div className="hidden lg:flex items-center gap-2 min-w-0 shrink-0">
          {isHost && waitingParticipants.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-200">
              <button
                type="button"
                onClick={() => {
                  if (waitingParticipants.length === 1) {
                    handleAdmitParticipant(waitingParticipants[0].id);
                  } else {
                    handleAdmitParticipant(undefined, true);
                  }
                }}
                disabled={isAdmittingAll || (waitingParticipants[0] && admittingUserId === waitingParticipants[0].id)}
                className="inline-flex items-center gap-3 pl-1 pr-4 py-1 rounded-full bg-white hover:bg-stone-100 active:scale-95 shadow-xl shadow-black/50 text-stone-900 tracking-tight transition-all duration-150 cursor-pointer disabled:opacity-70 select-none whitespace-nowrap"
                title={
                  waitingParticipants.length === 1
                    ? `Admit ${waitingParticipants[0].name || (waitingParticipants[0].id.startsWith("guest_") ? "guest" : waitingParticipants[0].email)}`
                    : "Admit all waiting guests"
                }
              >
                <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center shrink-0 shadow-inner">
                  {admittingUserId || isAdmittingAll ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 text-white stroke-[2.4]" />
                  )}
                </div>
                <span className="font-medium text-sm whitespace-nowrap">
                  {waitingParticipants.length === 1
                    ? "Admit one guest"
                    : `Admit ${waitingParticipants.length} guests`}
                </span>
              </button>

              {waitingParticipants.length === 1 ? (
                <button
                  type="button"
                  onClick={() => handleDenyParticipant(waitingParticipants[0].id)}
                  disabled={denyingUserId === waitingParticipants[0].id}
                  className="h-10 px-3 rounded-full bg-stone-800/90 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700/80 text-xs font-medium transition-all shadow-md cursor-pointer"
                  title="Deny entry"
                >
                  {denyingUserId === waitingParticipants[0].id ? "..." : "Deny"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPanelTab("people");
                    setIsParticipantsOpen(true);
                  }}
                  className="h-10 px-3 rounded-full bg-stone-800/90 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700/80 text-xs font-medium transition-all shadow-md cursor-pointer"
                  title="View waiting guests in People tab"
                >
                  View
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center: Main Google Meet call controls */}
        <div className="flex items-center justify-center gap-1 sm:gap-2.5 mx-auto max-w-full overflow-visible py-1 px-1 select-none shrink-0">
          {/* 1. Mic Split Capsule Button */}
          <div
            className="relative"
            ref={micMenuRef}
            onMouseLeave={() => {
              if (!showMicDropdown && !showSpeakerDropdown) {
                setShowQuickMicBar(false);
              }
            }}
          >
            {!activeMicLabel && (
              <div
                title="Microphone access unavailable. Click to request permission."
                className="absolute -top-1 -right-1 z-30 w-4.5 h-4.5 rounded-full bg-amber-400 text-stone-950 font-black text-[11px] flex items-center justify-center shadow-md border-2 border-stone-900 pointer-events-auto cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRequestMediaPermission("audio");
                }}
              >
                !
              </div>
            )}
            {showQuickMicBar && (
              <div className="absolute bottom-full left-0 pb-2 z-50 pointer-events-auto">
                <div className={`border rounded-2xl shadow-2xl p-2 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none whitespace-nowrap max-w-[calc(100vw-1.5rem)] overflow-visible ${
                  isDark ? "bg-[#1e1f20] border-stone-800/90 text-stone-200" : "bg-white border-stone-200 text-stone-800"
                }`}>
                  {/* Microphone Dropdown Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (!activeMicLabel) {
                          handleRequestMediaPermission("audio");
                        } else {
                          setShowMicDropdown(!showMicDropdown);
                          setShowSpeakerDropdown(false);
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer transition-all ${
                        isDark ? "bg-stone-800/80 hover:bg-stone-700 border-stone-700/60 text-stone-200" : "bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-800"
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="max-w-[150px] sm:max-w-[200px] truncate">
                        {activeMicLabel || "Permission needed"}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-stone-400 opacity-80 shrink-0 transition-transform ${showMicDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {showMicDropdown && (
                      <div className="absolute bottom-full left-0 pb-1 z-50">
                        <div className={`w-64 border rounded-xl shadow-2xl py-1 overflow-hidden ${
                          isDark ? "bg-[#25272c] border-stone-700 text-stone-200" : "bg-white border-stone-300 text-stone-800"
                        }`}>
                          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-stone-400 border-b border-stone-700/40">
                            Select Microphone
                          </div>
                          {!activeMicLabel ? (
                            <div className="p-3 text-center space-y-2">
                              <p className="text-xs text-stone-400">Permission needed to access microphone.</p>
                              <button
                                type="button"
                                onClick={() => {
                                  handleRequestMediaPermission("audio");
                                  setShowMicDropdown(false);
                                }}
                                className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer"
                              >
                                Grant Permission
                              </button>
                            </div>
                          ) : audioInputDevices.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-stone-400">Default Microphone</div>
                          ) : (
                            audioInputDevices.map((d, i) => (
                              <button
                                key={d.deviceId || i}
                                type="button"
                                onClick={() => {
                                  switchMicrophone(d.deviceId);
                                  setShowMicDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs truncate hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors flex items-center justify-between gap-2 ${
                                  d.deviceId === selectedMicId ? "text-emerald-400 font-semibold bg-emerald-500/10" : ""
                                }`}
                              >
                                <span className="truncate">{d.label || `Microphone ${i + 1}`}</span>
                                {d.deviceId === selectedMicId && <Check className="w-3.5 h-3.5 shrink-0" />}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Speaker Dropdown Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (!activeSpeakerLabel) {
                          handleRequestMediaPermission("audio");
                        } else {
                          setShowSpeakerDropdown(!showSpeakerDropdown);
                          setShowMicDropdown(false);
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer transition-all ${
                        isDark ? "bg-stone-800/80 hover:bg-stone-700 border-stone-700/60 text-stone-200" : "bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-800"
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="max-w-[150px] sm:max-w-[200px] truncate">
                        {activeSpeakerLabel || "Permission needed"}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-stone-400 opacity-80 shrink-0 transition-transform ${showSpeakerDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {showSpeakerDropdown && (
                      <div className="absolute bottom-full left-0 pb-1 z-50">
                        <div className={`w-64 border rounded-xl shadow-2xl py-1 overflow-hidden ${
                          isDark ? "bg-[#25272c] border-stone-700 text-stone-200" : "bg-white border-stone-300 text-stone-800"
                        }`}>
                          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-stone-400 border-b border-stone-700/40">
                            Select Speaker Output
                          </div>
                          {!activeSpeakerLabel ? (
                            <div className="p-3 text-center space-y-2">
                              <p className="text-xs text-stone-400">Permission needed to access audio outputs.</p>
                              <button
                                type="button"
                                onClick={() => {
                                  handleRequestMediaPermission("audio");
                                  setShowSpeakerDropdown(false);
                                }}
                                className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer"
                              >
                                Grant Permission
                              </button>
                            </div>
                          ) : audioOutputDevices.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-stone-400">Default Speaker Output</div>
                          ) : (
                            audioOutputDevices.map((d, i) => (
                              <button
                                key={d.deviceId || i}
                                type="button"
                                onClick={() => {
                                  switchSpeaker(d.deviceId);
                                  setShowSpeakerDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs truncate hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors flex items-center justify-between gap-2 ${
                                  d.deviceId === selectedSpeakerId ? "text-emerald-400 font-semibold bg-emerald-500/10" : ""
                                }`}
                              >
                                <span className="truncate">{d.label || `Speaker ${i + 1}`}</span>
                                {d.deviceId === selectedSpeakerId && <Check className="w-3.5 h-3.5 shrink-0" />}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Settings Gear Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPanelTab("settings");
                      setSettingsCategory("audio");
                      setIsParticipantsOpen(true);
                      setShowQuickMicBar(false);
                    }}
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                      isDark ? "bg-stone-800/80 hover:bg-stone-700 border-stone-700/60 text-stone-300 hover:text-white" : "bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700"
                    }`}
                    title="Audio Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
            <div className={`h-11 rounded-2xl flex items-center p-1 transition-all overflow-hidden ${
              isMuted
                ? isDark ? "bg-[#5b1315]" : "bg-red-700"
                : isDark ? "bg-[#45474a]" : "bg-stone-300"
            }`}>
              <button
                type="button"
                onMouseEnter={() => {
                  setShowQuickMicBar(true);
                  setShowQuickCamBar(false);
                  setShowEmojiPicker(false);
                }}
                onClick={() => {
                  setShowQuickMicBar(!showQuickMicBar);
                  setShowQuickCamBar(false);
                  setShowEmojiPicker(false);
                }}
                className={`w-7 h-9 rounded-l-xl flex items-center justify-center transition-colors cursor-pointer ${
                  isDark ? "text-white/90 hover:text-white" : "text-stone-800 hover:text-stone-950"
                }`}
                title="Microphone Quick Options"
              >
                <ChevronUp className={`w-3.5 h-3.5 transition-transform ${showQuickMicBar ? "rotate-180" : ""}`} />
              </button>
              <button
                type="button"
                onClick={handleToggleMic}
                className={`h-9 px-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isMuted
                    ? isDark
                      ? "bg-[#fce8e6] text-[#5b1315] hover:bg-[#fbdcd9] shadow-sm"
                      : "bg-red-50 text-red-700 hover:bg-red-100 shadow-2xs"
                    : isDark
                      ? "bg-[#2d2f31] hover:bg-[#202224] text-white"
                      : "bg-white hover:bg-stone-100 text-stone-900 shadow-2xs"
                }`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? <MicOff className="w-4 h-4 stroke-[2.2]" /> : <Mic className="w-4 h-4 stroke-[2.2]" />}
              </button>
            </div>
          </div>

          {/* 2. Camera Split Capsule Button */}
          <div
            className="relative"
            ref={camMenuRef}
            onMouseLeave={() => {
              if (!showCamDropdown) {
                setShowQuickCamBar(false);
              }
            }}
          >
            {!activeCamLabel && (
              <div
                title="Camera access unavailable. Click to request permission."
                className="absolute -top-1 -right-1 z-30 w-4.5 h-4.5 rounded-full bg-amber-400 text-stone-950 font-black text-[11px] flex items-center justify-center shadow-md border-2 border-stone-900 pointer-events-auto cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRequestMediaPermission("video");
                }}
              >
                !
              </div>
            )}
            {showQuickCamBar && (
              <div className="absolute bottom-full -left-16 sm:-left-24 pb-2 z-50 pointer-events-auto">
                <div className={`border rounded-2xl shadow-2xl p-2 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none whitespace-nowrap max-w-[calc(100vw-1.5rem)] overflow-visible ${
                  isDark ? "bg-[#1e1f20] border-stone-800/90 text-stone-200" : "bg-white border-stone-200 text-stone-800"
                }`}>
                  {/* Camera Dropdown Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (!activeCamLabel) {
                          handleRequestMediaPermission("video");
                        } else {
                          setShowCamDropdown(!showCamDropdown);
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer transition-all ${
                        isDark ? "bg-stone-800/80 hover:bg-stone-700 border-stone-700/60 text-stone-200" : "bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-800"
                      }`}
                    >
                      <Video className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="max-w-[150px] sm:max-w-[200px] truncate">
                        {activeCamLabel || "Permission needed"}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-stone-400 opacity-80 shrink-0 transition-transform ${showCamDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {showCamDropdown && (
                      <div className="absolute bottom-full left-0 pb-1 z-50">
                        <div className={`w-64 border rounded-xl shadow-2xl py-1 overflow-hidden ${
                          isDark ? "bg-[#25272c] border-stone-700 text-stone-200" : "bg-white border-stone-300 text-stone-800"
                        }`}>
                          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-stone-400 border-b border-stone-700/40">
                            Select Camera
                          </div>
                          {!activeCamLabel ? (
                            <div className="p-3 text-center space-y-2">
                              <p className="text-xs text-stone-400">Permission needed to access camera.</p>
                              <button
                                type="button"
                                onClick={() => {
                                  handleRequestMediaPermission("video");
                                  setShowCamDropdown(false);
                                }}
                                className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer"
                              >
                                Grant Permission
                              </button>
                            </div>
                          ) : videoInputDevices.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-stone-400">Default Camera</div>
                          ) : (
                            videoInputDevices.map((d, i) => (
                              <button
                                key={d.deviceId || i}
                                type="button"
                                onClick={() => {
                                  switchCamera(d.deviceId);
                                  setShowCamDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs truncate hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors flex items-center justify-between gap-2 ${
                                  d.deviceId === selectedCamId ? "text-emerald-400 font-semibold bg-emerald-500/10" : ""
                                }`}
                              >
                                <span className="truncate">{d.label || `Camera ${i + 1}`}</span>
                                {d.deviceId === selectedCamId && <Check className="w-3.5 h-3.5 shrink-0" />}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Blur Background Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextBlur = !isBlurActive;
                      setIsBlurActive(nextBlur);
                      setRoomSettings((prev) => ({
                        ...prev,
                        video: {
                          ...prev.video,
                          backgroundEffect: nextBlur ? "blur" : "none",
                        },
                      }));
                      toast.info(nextBlur ? "Background Blur Enabled" : "Background Blur Disabled");
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer transition-all ${
                      isBlurActive
                        ? "bg-[#a8c7fa]/20 text-[#a8c7fa] border-[#a8c7fa]/40 shadow-xs font-semibold"
                        : isDark ? "bg-stone-800/80 hover:bg-stone-700 border-stone-700/60 text-stone-300" : "bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700"
                    }`}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isBlurActive ? "text-[#a8c7fa]" : "text-stone-400"}`} />
                    <span>Blur background</span>
                  </button>

                  {/* Backgrounds and Effects Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPanelTab("settings");
                      setSettingsCategory("video");
                      setIsParticipantsOpen(true);
                      setShowQuickCamBar(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer transition-all ${
                      isDark ? "bg-stone-800/80 hover:bg-stone-700 border-stone-700/60 text-stone-300 hover:text-white" : "bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700"
                    }`}
                  >
                    <span>Backgrounds and effects</span>
                  </button>

                  {/* Settings Gear Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPanelTab("settings");
                      setSettingsCategory("video");
                      setIsParticipantsOpen(true);
                      setShowQuickCamBar(false);
                    }}
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                      isDark ? "bg-stone-800/80 hover:bg-stone-700 border-stone-700/60 text-stone-300 hover:text-white" : "bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700"
                    }`}
                    title="Video Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
            <div className={`h-11 rounded-2xl flex items-center p-1 transition-all overflow-hidden ${
              isVideoOff
                ? isDark ? "bg-[#5b1315]" : "bg-red-700"
                : isDark ? "bg-[#45474a]" : "bg-stone-300"
            }`}>
              <button
                type="button"
                onMouseEnter={() => {
                  setShowQuickCamBar(true);
                  setShowQuickMicBar(false);
                  setShowEmojiPicker(false);
                }}
                onClick={() => {
                  setShowQuickCamBar(!showQuickCamBar);
                  setShowQuickMicBar(false);
                  setShowEmojiPicker(false);
                }}
                className={`w-7 h-9 rounded-l-xl flex items-center justify-center transition-colors cursor-pointer ${
                  isDark ? "text-white/90 hover:text-white" : "text-stone-800 hover:text-stone-950"
                }`}
                title="Camera Quick Options"
              >
                <ChevronUp className={`w-3.5 h-3.5 transition-transform ${showQuickCamBar ? "rotate-180" : ""}`} />
              </button>
              <button
                type="button"
                onClick={handleToggleCam}
                className={`h-9 px-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isVideoOff
                    ? isDark
                      ? "bg-[#fce8e6] text-[#5b1315] hover:bg-[#fbdcd9] shadow-sm"
                      : "bg-red-50 text-red-700 hover:bg-red-100 shadow-2xs"
                    : isDark
                      ? "bg-[#2d2f31] hover:bg-[#202224] text-white"
                      : "bg-white hover:bg-stone-100 text-stone-900 shadow-2xs"
                }`}
                title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4 stroke-[2.2]" /> : <Video className="w-4 h-4 stroke-[2.2]" />}
              </button>
            </div>
          </div>

          {/* 3. Screen Share Button (Hidden on mobile phone, available in More Options menu) */}
          <button
            type="button"
            onClick={() => {
              const next = !isScreenSharing;
              setIsScreenSharing(next);
              toast.info(next ? "Presenting screen" : "Presentation ended", {
                description: next ? "You are presenting your screen to everyone." : "Screen sharing stopped.",
              });
            }}
            className={`hidden sm:flex w-10 h-10 sm:w-11 sm:h-11 rounded-2xl items-center justify-center shrink-0 transition-all cursor-pointer shadow-md active:scale-95 ${
              isScreenSharing
                ? "bg-[#a8c7fa] hover:bg-[#b8d4fc] text-[#041e49] font-bold shadow-blue-500/20"
                : isDark
                ? "bg-[#3c4043] hover:bg-[#474b4f] active:bg-[#52565a] text-white"
                : "bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-800 border border-stone-300/80"
            }`}
            title={isScreenSharing ? "Stop presenting" : "Present now"}
          >
            <MonitorUp className={`w-4 h-4 sm:w-5 sm:h-5 ${isScreenSharing ? "text-[#041e49]" : ""}`} />
          </button>

          {/* 4. Emoji Reactions Button */}
          <div className="relative shrink-0" ref={emojiMenuRef}>
            {showEmojiPicker && (
              <div className={`absolute bottom-[calc(100%+0.75rem)] left-1/2 -translate-x-1/2 z-50 border rounded-2xl shadow-2xl p-2 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none max-w-[calc(100vw-1.5rem)] overflow-x-auto ${
                isDark ? "bg-[#1e1f20] border-stone-800/90" : "bg-white border-stone-200"
              }`}>
                {["💖", "👍", "🎉", "👏", "😂", "😮", "😢", "🤔", "👎"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      toast.info(emoji, { description: "Reaction sent", duration: 1500 });
                      setShowEmojiPicker(false);
                    }}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-base sm:text-lg transition-transform active:scale-125 cursor-pointer shrink-0 ${
                      isDark ? "hover:bg-stone-800" : "hover:bg-stone-100"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
                <div className={`w-px h-5 mx-1 ${isDark ? "bg-stone-800" : "bg-stone-200"}`} />
                <div className="w-4 h-4 rounded-full bg-amber-400 border border-amber-300 cursor-pointer shrink-0" title="Skin Tone" />
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowQuickMicBar(false);
                setShowQuickCamBar(false);
              }}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md active:scale-95 ${
                showEmojiPicker
                  ? "bg-[#a8c7fa] hover:bg-[#b8d4fc] text-[#041e49] font-bold shadow-blue-500/20"
                  : isDark ? "bg-[#3c4043] hover:bg-[#474b4f] text-white" : "bg-stone-200 hover:bg-stone-300 text-stone-800 border border-stone-300/80"
              }`}
              title="Send a reaction"
            >
              <Smile className={`w-4 h-4 sm:w-5 sm:h-5 ${showEmojiPicker ? "text-[#041e49]" : ""}`} />
            </button>
          </div>

          {/* 5. Captions / CC Button (Hidden on mobile phone, available in More Options menu) */}
          <button
            type="button"
            onClick={() => {
              const next = !isCaptionsActive;
              setIsCaptionsActive(next);
              setRoomSettings((p) => ({
                ...p,
                captionsTranslation: {
                  ...p.captionsTranslation,
                  enableCaptions: next,
                },
              }));
              if (next && !isMuted) {
                startSpeechRecognition();
              }
              toast.info(next ? "Live Captions Enabled" : "Live Captions Disabled", {
                description: next ? "Displaying real-time speech transcription." : "Captions hidden.",
              });
            }}
            className={`hidden sm:flex w-10 h-10 sm:w-11 sm:h-11 rounded-2xl items-center justify-center shrink-0 transition-all cursor-pointer shadow-md active:scale-95 ${
              isCaptionsActive
                ? "bg-[#a8c7fa] hover:bg-[#b8d4fc] text-[#041e49] font-bold shadow-blue-500/20"
                : isDark
                ? "bg-[#3c4043] hover:bg-[#474b4f] active:bg-[#52565a] text-white"
                : "bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-800 border border-stone-300/80"
            }`}
            title={isCaptionsActive ? "Turn off captions (CC)" : "Turn on captions (CC)"}
          >
            <Subtitles className={`w-4 h-4 sm:w-5 sm:h-5 ${isCaptionsActive ? "text-[#041e49]" : ""}`} />
          </button>

          {/* 6. Raise Hand Button (Only for non-host participants) */}
          {!isHost && (
            <button
              type="button"
              onClick={handleToggleHandRaise}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ease-out cursor-pointer shadow-md active:scale-95 ${
                isHandRaised
                  ? "bg-[#a8c7fa] hover:bg-[#b8d4fc] text-[#041e49] font-bold shadow-blue-500/20 shadow-lg border-0"
                  : isDark
                  ? "bg-[#3c4043] hover:bg-[#474b4f] active:bg-[#52565a] text-white"
                  : "bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-800 border border-stone-300/80"
              }`}
              title={isHandRaised ? "Lower hand" : "Raise hand"}
            >
              <Hand
                key={isHandRaised ? "btn-hand-wave" : "btn-hand-idle"}
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ease-out ${
                  isHandRaised ? "animate-hand-wave-once text-[#041e49]" : ""
                }`}
              />
            </button>
          )}

          {/* 9. In-Call Chat Button (Hidden on mobile phone, available in More Options menu) */}
          <button
            type="button"
            onClick={() => {
              if (isParticipantsOpen && panelTab === "chat") {
                setIsParticipantsOpen(false);
              } else {
                setPanelTab("chat");
                setIsParticipantsOpen(true);
                setUnreadCount(0);
              }
            }}
            className={`hidden sm:flex relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl items-center justify-center shrink-0 transition-all cursor-pointer shadow-md active:scale-95 ${
              isParticipantsOpen && panelTab === "chat"
                ? "bg-[#a8c7fa] hover:bg-[#b8d4fc] text-[#041e49] font-bold shadow-blue-500/20"
                : isDark ? "bg-[#3c4043] hover:bg-[#474b4f] text-white" : "bg-stone-200 hover:bg-stone-300 text-stone-800 border border-stone-300/80"
            }`}
            title="In-call messages"
          >
            <MessageSquare className={`w-4 h-4 sm:w-5 sm:h-5 ${isParticipantsOpen && panelTab === "chat" ? "text-[#041e49]" : ""}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#a8c7fa] text-[#041e49] shadow-md animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* 10. More options (⋮) Button */}
          <div className="relative shrink-0" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`w-9 h-10 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md active:scale-95 ${
                showMoreMenu
                  ? "bg-[#a8c7fa] hover:bg-[#b8d4fc] text-[#041e49] font-bold shadow-blue-500/20"
                  : isDark ? "bg-[#3c4043] hover:bg-[#474b4f] text-white" : "bg-stone-200 hover:bg-stone-300 text-stone-800 border border-stone-300/80"
              }`}
              title="More options"
            >
              <MoreVertical className={`w-4 h-4 sm:w-5 sm:h-5 ${showMoreMenu ? "text-[#041e49]" : ""}`} />
            </button>

            {/* Google Meet Style Popup Menu */}
            {showMoreMenu && (
              <div
                className={`absolute bottom-[calc(100%+0.75rem)] right-0 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] border rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none overflow-hidden ${
                  isDark ? "bg-[#1e1f20] border-stone-800/90 text-stone-200" : "bg-white border-stone-200 text-stone-800"
                }`}
              >
                {/* 1. Meeting Tools Section */}
                <div className={`px-4 py-2 text-xs font-medium ${isDark ? "text-stone-400" : "text-stone-500"}`}>Meeting Tools</div>
                <button
                  type="button"
                  onClick={() => {
                    setPanelTab("settings");
                    setSettingsCategory("meeting");
                    setIsParticipantsOpen(true);
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 sm:py-3 text-sm transition-colors text-left cursor-pointer ${
                    isDark ? "text-stone-200 hover:bg-stone-800/80 hover:text-white" : "text-stone-800 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <Shield className="w-5 h-5 text-stone-400 shrink-0" />
                  <span>Host controls</span>
                </button>

                {/* 2. Change layout */}
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode(layoutMode === "grid" ? "spotlight" : "grid");
                    toast.info(`Layout set to ${layoutMode === "grid" ? "Spotlight" : "Grid"}`);
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 sm:py-3 text-sm transition-colors text-left cursor-pointer ${
                    isDark ? "text-stone-200 hover:bg-stone-800/80 hover:text-white" : "text-stone-800 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <Sliders className="w-5 h-5 text-stone-400 shrink-0" />
                  <span>Change layout</span>
                </button>

                {/* 3. Full Screen */}
                <button
                  type="button"
                  onClick={() => {
                    toggleFullscreen();
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 sm:py-3 text-sm transition-colors text-left cursor-pointer ${
                    isDark ? "text-stone-200 hover:bg-stone-800/80 hover:text-white" : "text-stone-800 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5 text-stone-400 shrink-0" />
                  ) : (
                    <Maximize className="w-5 h-5 text-stone-400 shrink-0" />
                  )}
                  <span>{isFullscreen ? "Exit full screen" : "Full screen"}</span>
                </button>

                {/* 4. Backgrounds and Effects */}
                <button
                  type="button"
                  onClick={() => {
                    setPanelTab("settings");
                    setSettingsCategory("video");
                    setIsParticipantsOpen(true);
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 sm:py-3 text-sm transition-colors text-left cursor-pointer ${
                    isDark ? "text-stone-200 hover:bg-stone-800/80 hover:text-white" : "text-stone-800 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-stone-400 shrink-0" />
                  <span>Backgrounds and effects</span>
                </button>

                {/* 4b. ISL Sign Language AI Detector */}
                <button
                  type="button"
                  onClick={() => {
                    setIsIslActive(!isIslActive);
                    toast.info(isIslActive ? "ISL Detection Paused" : "ISL AI Detection Enabled", { duration: 2500 });
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 sm:py-3 text-sm transition-colors text-left cursor-pointer ${
                    isDark ? "text-stone-200 hover:bg-stone-800/80 hover:text-white" : "text-stone-800 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Sparkles className={`w-5 h-5 shrink-0 ${isIslActive ? "text-[#a8c7fa]" : "text-stone-400"}`} />
                    <span>ISL Sign Language Detector</span>
                  </div>
                  {isIslActive && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#a8c7fa]/20 text-[#a8c7fa] border border-[#a8c7fa]/40">
                      ON
                    </span>
                  )}
                </button>

                {/* 4c. Present screen */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !isScreenSharing;
                    setIsScreenSharing(next);
                    toast.info(next ? "Presenting screen" : "Presentation ended", {
                      description: next ? "You are presenting your screen to everyone." : "Screen sharing stopped.",
                    });
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 sm:py-3 text-sm transition-colors text-left cursor-pointer ${
                    isDark ? "text-stone-200 hover:bg-stone-800/80 hover:text-white" : "text-stone-800 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <MonitorUp className={`w-5 h-5 shrink-0 ${isScreenSharing ? "text-[#a8c7fa]" : "text-stone-400"}`} />
                    <span>{isScreenSharing ? "Stop presenting" : "Present screen"}</span>
                  </div>
                  {isScreenSharing && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#a8c7fa]/20 text-[#a8c7fa] border border-[#a8c7fa]/40">
                      ON
                    </span>
                  )}
                </button>

                {/* 4d. Turn on / off captions */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !isCaptionsActive;
                    setIsCaptionsActive(next);
                    setRoomSettings((p) => ({
                      ...p,
                      captionsTranslation: {
                        ...p.captionsTranslation,
                        enableCaptions: next,
                      },
                    }));
                    if (next && !isMuted) {
                      startSpeechRecognition();
                    }
                    toast.info(next ? "Live Captions Enabled" : "Live Captions Disabled", {
                      description: next ? "Displaying real-time speech transcription." : "Captions hidden.",
                    });
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 sm:py-3 text-sm transition-colors text-left cursor-pointer ${
                    isDark ? "text-stone-200 hover:bg-stone-800/80 hover:text-white" : "text-stone-800 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <Subtitles className={`w-5 h-5 shrink-0 ${isCaptionsActive ? "text-[#a8c7fa]" : "text-stone-400"}`} />
                  <span>{isCaptionsActive ? "Turn off captions" : "Turn on captions"}</span>
                </button>

                {/* 4e. In-call messages */}
                <button
                  type="button"
                  onClick={() => {
                    if (isParticipantsOpen && panelTab === "chat") {
                      setIsParticipantsOpen(false);
                    } else {
                      setPanelTab("chat");
                      setIsParticipantsOpen(true);
                      setUnreadCount(0);
                    }
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 sm:py-3 text-sm transition-colors text-left cursor-pointer ${
                    isDark ? "text-stone-200 hover:bg-stone-800/80 hover:text-white" : "text-stone-800 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <MessageSquare className="w-5 h-5 text-stone-400 shrink-0" />
                    <span>In-call messages</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#a8c7fa] text-[#041e49] shadow-md">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <div className={`my-1 border-t ${isDark ? "border-stone-800/80" : "border-stone-200"}`} />

                {/* 5. Report a Problem */}
                <button
                  type="button"
                  onClick={() => {
                    setShowProblemModal(true);
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 sm:py-3 text-sm transition-colors text-left cursor-pointer ${
                    isDark ? "text-stone-200 hover:bg-stone-800/80 hover:text-white" : "text-stone-800 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 text-stone-400 shrink-0" />
                  <span>Report a problem</span>
                </button>

                {/* 6. Report Abuse */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAbuseModal(true);
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 sm:py-3 text-sm transition-colors text-left cursor-pointer ${
                    isDark ? "text-stone-200 hover:bg-stone-800/80 hover:text-white" : "text-stone-800 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <UserX className="w-5 h-5 text-stone-400 shrink-0" />
                  <span>Report abuse</span>
                </button>

                {/* 7. Troubleshooting & Diagnostics */}
                <button
                  type="button"
                  onClick={() => {
                    setShowDiagnosticsModal(true);
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 sm:py-3 text-sm transition-colors text-left cursor-pointer ${
                    isDark ? "text-stone-200 hover:bg-stone-800/80 hover:text-white" : "text-stone-800 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <Info className="w-5 h-5 text-stone-400 shrink-0" />
                  <span>Troubleshooting &amp; help</span>
                </button>

                {/* 8. Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setPanelTab("settings");
                    setIsParticipantsOpen(true);
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 sm:py-3 text-sm transition-colors text-left cursor-pointer ${
                    isDark ? "text-stone-200 hover:bg-stone-800/80 hover:text-white" : "text-stone-800 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <Settings className="w-5 h-5 text-stone-400 shrink-0" />
                  <span>Settings</span>
                </button>
              </div>
            )}
          </div>

          {/* 11. Red End Call Box Button */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                if (isHost) {
                  handleLeave(true);
                } else {
                  handleLeave(false);
                }
              }}
              className="w-14 sm:w-16 h-10 sm:h-11 rounded-2xl bg-[#ea4335] hover:bg-[#dc2626] active:bg-[#b91c1c] text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-lg shadow-red-950/60 active:scale-95"
              title={isHost ? "End meeting for all" : "Leave meeting"}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-white shrink-0">
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
              </svg>
            </button>
          </div>
        </div>
      </footer>

      {/* Host Confirmation Modal: Remove Participant */}
      {removingParticipant && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#1e1f20] border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-semibold text-white truncate">Remove Participant</h3>
              <p className="text-xs text-stone-400 truncate mt-0.5">
                {removingParticipant.name}
              </p>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Are you sure you want to remove <strong className="text-white font-medium">{removingParticipant.name}</strong>? They will be immediately disconnected from the meeting.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setRemovingParticipant(null)}
                disabled={isRemovingParticipant}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700/80 text-stone-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={isRemovingParticipant}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isRemovingParticipant && (
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Meet Diagnostics / Troubleshooting Modal */}
      {showDiagnosticsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowDiagnosticsModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#16171e] border border-stone-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 relative text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Troubleshooting &amp; help</h2>
                  <p className="text-xs text-stone-400">Real-time system &amp; network diagnostics</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDiagnosticsModal(false)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
                <span className="text-stone-400">Network Latency</span>
                <span className="font-mono text-emerald-400 font-semibold">24 ms (Excellent)</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
                <span className="text-stone-400">Video Quality</span>
                <span className="font-mono text-stone-200">1080p FHD @ 30 FPS</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
                <span className="text-stone-400">Packet Loss</span>
                <span className="font-mono text-emerald-400">0.0%</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
                <span className="text-stone-400">Audio Codec</span>
                <span className="font-mono text-stone-200">Opus 48 kHz Stereo</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
                <span className="text-stone-400">ISL AI Gesture Engine</span>
                <span className="font-mono text-emerald-400 font-semibold">Online &amp; Active</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDiagnosticsModal(false)}
              className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-medium text-white transition-colors cursor-pointer"
            >
              Close Diagnostics
            </button>
          </div>
        </div>
      )}

      {/* Google Meet Report a Problem Modal */}
      {showProblemModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowProblemModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#16171e] border border-stone-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 relative text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <MessageSquareWarning className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Report a problem</h2>
                  <p className="text-xs text-stone-400">Send feedback or report an issue</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProblemModal(false)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-stone-300 font-medium">Describe what happened</label>
              <textarea
                rows={4}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="What issue did you experience? (e.g. video freezing, audio echo, gesture detection delay)..."
                className="w-full p-3 rounded-xl bg-stone-900 border border-stone-700/80 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
              />
              <label className="flex items-center gap-2 text-xs text-stone-400 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-0" />
                <span>Include diagnostic &amp; browser logs</span>
              </label>
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowProblemModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-medium text-stone-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success("Problem report sent", {
                    description: "Thank you for helping us improve Samvad!",
                    duration: 3000,
                  });
                  setProblemDescription("");
                  setShowProblemModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors cursor-pointer"
              >
                Send Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Meet Report Abuse Modal */}
      {showAbuseModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowAbuseModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#16171e] border border-stone-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 relative text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Report abuse</h2>
                  <p className="text-xs text-stone-400">Report inappropriate conduct</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAbuseModal(false)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-stone-300">
              <p className="text-stone-400">Please select the reason for reporting:</p>
              {[
                "Harassment or bullying",
                "Inappropriate or hateful content",
                "Spam, malware, or phishing",
                "Disrupting the video call",
                "Other violation",
              ].map((reason, idx) => (
                <label key={reason} className="flex items-center gap-2.5 p-2 rounded-lg bg-stone-900/60 border border-stone-800 hover:bg-stone-800/60 cursor-pointer">
                  <input
                    type="radio"
                    name="abuse_reason"
                    defaultChecked={idx === 0}
                    className="text-red-600 focus:ring-0"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowAbuseModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-medium text-stone-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success("Abuse report submitted", {
                    description: "Our safety team has received the report.",
                    duration: 3500,
                  });
                  setShowAbuseModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-medium text-white transition-colors cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Incoming Chat Message Toast Notification */}
      {chatToast && (
        <div
          role="alert"
          onClick={() => {
            setIsParticipantsOpen(true);
            setPanelTab("chat");
            setUnreadCount(0);
            setChatToast(null);
          }}
          className="fixed bottom-3 sm:bottom-4 left-4 sm:left-6 z-50 w-[340px] max-w-[calc(100vw-2rem)] flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white dark:bg-[#1e1f20] text-stone-900 dark:text-white border border-stone-200/90 dark:border-stone-800 shadow-[0_12px_36px_rgba(0,0,0,0.22)] hover:shadow-2xl transition-all duration-200 cursor-pointer animate-in slide-in-from-bottom-2 fade-in group select-none"
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            {chatToast.senderImage ? (
              <img
                src={chatToast.senderImage}
                alt={chatToast.senderName}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-stone-200 dark:ring-stone-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#a8c7fa] text-[#041e49] font-bold text-sm flex items-center justify-center shadow-xs">
                {chatToast.senderName
                  ? chatToast.senderName.slice(0, 2).toUpperCase()
                  : "U"}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-1">
            <p className="font-semibold text-sm text-stone-900 dark:text-white leading-tight truncate">
              {chatToast.senderName}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-500 dark:text-stone-400">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7l-4 4V6a2 2 0 0 1 2-2z"
                  className="fill-stone-900 dark:fill-white"
                />
                <circle cx="8.5" cy="11" r="1.2" className="fill-white dark:fill-stone-900" />
                <circle cx="12" cy="11" r="1.2" className="fill-white dark:fill-stone-900" />
                <circle cx="15.5" cy="11" r="1.2" className="fill-white dark:fill-stone-900" />
              </svg>
              <span className="truncate">
                <span className="text-stone-500 dark:text-stone-400">Sent a message: </span>
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {chatToast.message}
                </span>
              </span>
            </div>
          </div>

          {/* Dismiss (X) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setChatToast(null);
            }}
            className="w-6 h-6 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center transition-colors ml-1 shrink-0 cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
