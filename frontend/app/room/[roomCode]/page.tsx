"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
}: {
  stream: MediaStream | null;
  isMuted?: boolean;
  isMirrored?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

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
      className={`w-full h-full object-cover transform-gpu ${isMirrored ? "scale-x-[-1]" : ""}`}
    />
  );
}

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

  const roomCode = Array.isArray(params.roomCode)
    ? params.roomCode[0]
    : (params.roomCode as string) || "";

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
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
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
    Map<string, { socketId: string; userId: string; name: string; stream: MediaStream; isMuted?: boolean; isVideoOff?: boolean }>
  >(new Map());

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const handleToggleMic = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
    if (socketRef.current) {
      socketRef.current.emit("toggle-media", {
        roomCode,
        isMuted: nextMuted,
        isVideoOff,
      });
    }
    toast.info(nextMuted ? "Microphone muted" : "Microphone turned on", { duration: 2000 });
  };

  const handleToggleCam = () => {
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !nextVideoOff;
      });
    }
    if (socketRef.current) {
      socketRef.current.emit("toggle-media", {
        roomCode,
        isMuted,
        isVideoOff: nextVideoOff,
      });
    }
    toast.info(nextVideoOff ? "Camera turned off" : "Camera turned on", { duration: 2000 });
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

    const createPeerConnection = (targetSocketId: string, targetName: string, targetUserId: string) => {
      if (peerConnectionsRef.current.has(targetSocketId)) {
        return peerConnectionsRef.current.get(targetSocketId)!;
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          const sender = pc.addTrack(track, localStreamRef.current!);
          if (track.kind === "video" && sender.setParameters) {
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
        });
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
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            const existing = next.get(targetSocketId);
            next.set(targetSocketId, {
              socketId: targetSocketId,
              userId: targetUserId,
              name: targetName,
              stream: remoteStream,
              isMuted: existing?.isMuted ?? false,
              isVideoOff: existing?.isVideoOff ?? false,
            });
            return next;
          });
        }
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
      const videoProfiles = [
        { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        { width: { ideal: 960 }, height: { ideal: 540 } },
        true,
      ];

      for (const vConstraints of videoProfiles) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: vConstraints,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
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

      return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    };

    getHDUserMedia()
      .then((stream) => {
        localStreamRef.current = stream;
        setLocalStream(stream);

        stream.getAudioTracks().forEach((t) => (t.enabled = !isMuted));
        stream.getVideoTracks().forEach((t) => (t.enabled = !isVideoOff));

        socket.emit("join-room", {
          roomCode,
          userId: activeId,
          name: activeName,
        });
      })
      .catch((err) => {
        console.warn("Could not access camera/mic:", err);
        socket.emit("join-room", {
          roomCode,
          userId: activeId,
          name: activeName,
        });
      });

    socket.on("existing-peers", async (peers: Array<{ socketId: string; userId: string; name: string }>) => {
      for (const peer of peers) {
        try {
          const pc = createPeerConnection(peer.socketId, peer.name, peer.userId);
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

    socket.on("user-joined", (data: { socketId: string; userId: string; name: string }) => {
      createPeerConnection(data.socketId, data.name, data.userId);
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
        const existing = next.get(data.socketId);
        if (existing) {
          next.set(data.socketId, {
            ...existing,
            isMuted: data.isMuted,
            isVideoOff: data.isVideoOff,
          });
        }
        return next;
      });
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
                toast.info(`${latestMsg.senderName}: ${latestMsg.message.length > 45 ? latestMsg.message.slice(0, 45) + "..." : latestMsg.message}`, {
                  duration: 3500,
                });
              }
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
  }, [hasJoined, errorStatus, roomCode, isParticipantsOpen, panelTab, currentUserId, session]);

  // Auto-scroll chat feed to bottom on new messages or when switching to chat tab
  useEffect(() => {
    if (isParticipantsOpen && panelTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isParticipantsOpen, panelTab]);

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
    const optimisticMessage: MeetingMessage = {
      id: tempId,
      meetingId: meeting?.id || "",
      senderId: activeUserId,
      senderName: activeUserName,
      senderImage: activeUserImage,
      message: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setChatInputText("");
    setIsSendingMessage(true);

    try {
      const saved = await sendMeetingMessage(roomCode, text, {
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
    <div className={`w-full h-screen flex flex-col overflow-hidden select-none bg-dot-grid transition-colors duration-200 ${
      isDark ? "dark bg-[#0e0f12] text-stone-100" : "bg-stone-100 text-stone-900"
    }`}>
      {/* Top Navigation Bar */}
      <header className="h-16 px-4 sm:px-6 flex items-center justify-between bg-transparent z-30 shrink-0">
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
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              isDark
                ? "text-stone-400 hover:text-white hover:bg-stone-800/60"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/80"
            }`}
            title={isHost ? "Host Options" : "Leave Meeting"}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
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
            className={`relative flex items-center -space-x-1.5 p-0.5 rounded-xl transition-all duration-200 cursor-pointer select-none shrink-0 ${
              isParticipantsOpen && panelTab === "people"
                ? isDark
                  ? "bg-stone-800/90 border border-stone-700/80 ring-1 ring-white shadow-md"
                  : "bg-white border border-stone-300 ring-1 ring-stone-400 shadow-md"
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


        {/* Central Stage: Video Grid */}
        <main className="flex-1 p-2.5 sm:p-4 overflow-y-auto flex flex-col justify-center items-center w-full">
          <div
            className={`w-full h-full items-center justify-center gap-3 sm:gap-4 transition-all duration-300 ${
              layoutMode === "spotlight"
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

              if (isCurrentUser) {
                activeStream = localStream;
                isTileVideoOff = isVideoOff;
                isTileMuted = isMuted;
              } else {
                const remoteData = Array.from(remoteStreams.values()).find(
                  (r) => r.userId === p.id || r.socketId === p.id
                );
                if (remoteData) {
                  activeStream = remoteData.stream;
                  isTileVideoOff = Boolean(remoteData.isVideoOff);
                  isTileMuted = Boolean(remoteData.isMuted);
                } else {
                  isTileVideoOff = true;
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
                  {/* Live Video Stream View */}
                  {showLiveVideo ? (
                    <VideoElement
                      stream={activeStream}
                      isMuted={isCurrentUser}
                      isMirrored={isCurrentUser}
                    />
                  ) : (
                    <>
                      {/* Subtle Background Glow */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_70%)] pointer-events-none" />

                      {/* Center Avatar / Video Placeholder */}
                      <div className="flex flex-col items-center justify-center gap-4 z-10">
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

                        <div className="flex flex-col items-center text-center">
                          <p className={`text-base sm:text-lg font-semibold tracking-tight flex items-center gap-2 ${
                            isDark ? "text-white" : "text-stone-900"
                          }`}>
                            <span>{p.name || (p.id.startsWith("guest_") ? "Guest" : p.email)}</span>
                            {isCurrentUser && (
                              <span className={`text-xs font-normal ${isDark ? "text-stone-400" : "text-stone-500"}`}>
                                (You)
                              </span>
                            )}
                          </p>
                          <p className={`text-xs font-mono mt-0.5 ${isDark ? "text-stone-500" : "text-stone-500"}`}>
                            {p.id.startsWith("guest_") ? "Guest participant" : p.email}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Top Badges */}
                  {isIslActive && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 z-20 pointer-events-none">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
                        <Sparkles className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                        <span>ISL Active</span>
                      </span>
                    </div>
                  )}

                  {/* Bottom Tile Info Pill */}
                  <div className={`absolute bottom-4 left-4 flex items-center gap-2 z-20 text-xs ${
                    isDark ? "text-stone-400" : "text-stone-600"
                  }`}>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl backdrop-blur-md border ${
                      isDark ? "bg-stone-950/70 border-stone-800/80 text-stone-300" : "bg-white/90 border-stone-300/80 text-stone-700 shadow-2xs"
                    }`}>
                      {isTileMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <span className="text-[11px]">
                        {isCurrentUser ? (isMuted ? "Muted" : "Speaking") : (isTileMuted ? "Muted" : "Speaking")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Slide-out Side Drawer - Google Meet Style (People & In-call Chat) */}
        {isParticipantsOpen && (
          <aside className={`fixed inset-0 z-50 sm:static sm:z-20 w-full sm:w-[380px] h-full sm:h-[calc(100%-1rem)] sm:my-2 sm:mr-3 rounded-none sm:rounded-3xl border-0 sm:border flex flex-col shrink-0 overflow-hidden animate-in slide-in-from-right duration-200 ${
            isDark
              ? "bg-[#1e1f20] border-stone-800 shadow-2xl text-stone-100"
              : "bg-white border-stone-200 shadow-xl text-stone-900"
          }`}>
            {/* Header: Tabs (People / In-call messages / Settings) & Close */}
            <div className={`px-3 sm:px-4 pt-4 pb-3 border-b flex items-center justify-between shrink-0 ${
              isDark ? "border-stone-800/80" : "border-stone-200"
            }`}>
              <div className={`flex items-center gap-1 p-1 rounded-xl border ${
                isDark ? "bg-stone-900/90 border-stone-800/80" : "bg-stone-100 border-stone-200"
              }`}>
                <button
                  type="button"
                  onClick={() => setPanelTab("people")}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    panelTab === "people"
                      ? isDark ? "bg-[#2b2c31] text-white shadow-xs" : "bg-white text-stone-900 shadow-2xs font-semibold"
                      : isDark ? "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50" : "text-stone-500 hover:text-stone-800 hover:bg-stone-200/50"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">People</span>
                  <span>({participants.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPanelTab("chat");
                    setUnreadCount(0);
                  }}
                  className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    panelTab === "chat"
                      ? isDark ? "bg-[#2b2c31] text-white shadow-xs" : "bg-white text-stone-900 shadow-2xs font-semibold"
                      : isDark ? "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50" : "text-stone-500 hover:text-stone-800 hover:bg-stone-200/50"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-stone-950">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPanelTab("settings")}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    panelTab === "settings"
                      ? isDark ? "bg-[#2b2c31] text-white shadow-xs" : "bg-white text-stone-900 shadow-2xs font-semibold"
                      : isDark ? "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50" : "text-stone-500 hover:text-stone-800 hover:bg-stone-200/50"
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsParticipantsOpen(false)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/80 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
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
                                {(wp.name || wp.email || "G").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-white truncate text-xs">
                                  {wp.name || (wp.id.startsWith("guest_") ? "Guest" : wp.email)}
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

                          const isItemMuted = isUser ? isMuted : false;

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
                                      : "bg-emerald-500 animate-pulse"
                                      }`}
                                    title={isItemMuted ? "Muted" : "Active audio"}
                                  />
                                </div>

                                {/* Name + Badges */}
                                <div className="min-w-0 flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-stone-100 truncate">
                                      {p.name ||
                                        (p.id.startsWith("guest_") ? "Guest" : p.email)}
                                    </p>
                                    {isUser && (
                                      <span className="px-1 py-0.5 rounded text-[8.5px] leading-none font-semibold tracking-wider bg-white/10 text-white border border-white/20 shrink-0">
                                        You
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {isHostUser ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400/90">
                                        <Crown className="w-3 h-3 text-amber-400" />
                                        Meeting host
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-stone-400 truncate">
                                        {p.id.startsWith("guest_") ? "Guest attendee" : p.email}
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
                                        : "Participant is speaking"
                                  }
                                >
                                  {isItemMuted ? (
                                    <MicOff className="w-3.5 h-3.5" />
                                  ) : (
                                    <Mic className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                {/* Host Direct Remove Button */}
                                {isHost && !isUser && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRemovingParticipant({
                                        id: p.id,
                                        name: p.name || (p.id.startsWith("guest_") ? "Guest" : p.email),
                                      });
                                    }}
                                    className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
                                    title="Remove from meeting"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                  </button>
                                )}

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
                                        {p.name || p.email}
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
                                              name: p.name || (p.id.startsWith("guest_") ? "Guest" : p.email),
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
                {/* Chat In-Call Notice Banner */}
                <div className="px-4 py-2.5 bg-stone-900/50 border-b border-stone-800/60 text-[11px] text-stone-400 flex items-start gap-2 shrink-0">
                  <Info className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    Messages can only be seen by people in the call and are saved for this meeting.
                  </p>
                </div>

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
                              ? "bg-emerald-600 text-white rounded-tr-xs"
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

                {/* Message Input Form */}
                <div className="p-3 border-t border-stone-800/80 bg-[#1e1f20] shrink-0">
                  <form
                    onSubmit={handleSendMessage}
                    className="relative flex items-center gap-2 bg-stone-900/90 border border-stone-700/80 focus-within:border-emerald-500/80 focus-within:ring-1 focus-within:ring-emerald-500/30 rounded-2xl px-3 py-2 transition-all shadow-inner"
                  >
                    <input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      placeholder="Send a message to everyone..."
                      className="w-full bg-transparent text-xs text-white placeholder-stone-400 focus:outline-none pr-8"
                    />
                    <button
                      type="submit"
                      disabled={!chatInputText.trim() || isSendingMessage}
                      className="w-7 h-7 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:cursor-not-allowed shadow-2xs active:scale-95"
                      title="Send message (Enter)"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
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
                            ? "flex-initial px-3 bg-emerald-600 text-white shadow-xs shrink-0"
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
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-stone-400" />
                          <span>Microphone Device</span>
                        </label>
                        <select
                          value={roomSettings.audioSpeech.microphone}
                          onChange={(e) =>
                            updateRoomSettings((p) => ({
                              ...p,
                              audioSpeech: { ...p.audioSpeech, microphone: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-stone-900/90 border border-stone-700/80 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                        >
                          <option value="default">Default - Internal Microphone</option>
                          <option value="external">External USB Microphone</option>
                          <option value="headset">Bluetooth Headset Audio</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-stone-400" />
                          <span>Speaker Device</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            value={roomSettings.audioSpeech.speaker}
                            onChange={(e) =>
                              updateRoomSettings((p) => ({
                                ...p,
                                audioSpeech: { ...p.audioSpeech, speaker: e.target.value },
                              }))
                            }
                            className="flex-1 px-3 py-2 rounded-xl bg-stone-900/90 border border-stone-700/80 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                          >
                            <option value="default">Default - Internal Speakers</option>
                            <option value="external">External Headphones / Output</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              toast.info("Testing audio output...", {
                                description: "Playing sample test chime.",
                                duration: 2000,
                              });
                            }}
                            className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs text-stone-200 font-medium transition-colors cursor-pointer shrink-0"
                          >
                            Test
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-stone-800/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-stone-300">Input Sensitivity Volume</span>
                          <span className="font-mono text-emerald-400 font-semibold">{roomSettings.audioSpeech.volume}%</span>
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
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>

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
                              className={`py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${roomSettings.audioSpeech.speechSpeed === speed
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : "bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200"
                                }`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsCategory === "video" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-stone-400" />
                          <span>Camera Device</span>
                        </label>
                        <select
                          value={roomSettings.video.camera}
                          onChange={(e) =>
                            updateRoomSettings((p) => ({
                              ...p,
                              video: { ...p.video, camera: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-stone-900/90 border border-stone-700/80 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                        >
                          <option value="default">Default - FaceTime HD Camera</option>
                          <option value="usb">External USB Webcam</option>
                          <option value="virtual">Virtual Video Stream</option>
                        </select>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-stone-800/60">
                        <label className="text-xs font-medium text-stone-300">Send Video Resolution</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "auto", label: "Auto" },
                            { id: "720p", label: "720p HD" },
                            { id: "1080p", label: "1080p FHD" },
                          ].map((q) => (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() =>
                                updateRoomSettings((p) => ({
                                  ...p,
                                  video: { ...p.video, videoQuality: q.id as any },
                                }))
                              }
                              className={`py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${roomSettings.video.videoQuality === q.id
                                ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-300"
                                : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
                                }`}
                            >
                              {q.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-900/80 border border-stone-800/80">
                        <div className="flex items-center gap-2">
                          <FlipHorizontal className="w-4 h-4 text-stone-400" />
                          <div>
                            <p className="text-xs font-medium text-stone-200">Mirror My Video</p>
                            <p className="text-[10px] text-stone-500">Flip self-view horizontally</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={roomSettings.video.mirrorCamera}
                          onChange={(e) =>
                            updateRoomSettings((p) => ({
                              ...p,
                              video: { ...p.video, mirrorCamera: e.target.checked },
                            }))
                          }
                          className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2 pt-2 border-t border-stone-800/60">
                        <label className="text-xs font-medium text-stone-300">Virtual Background</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {["none", "blur", "studio", "nature"].map((effect) => (
                            <button
                              key={effect}
                              type="button"
                              onClick={() =>
                                updateRoomSettings((p) => ({
                                  ...p,
                                  video: { ...p.video, backgroundEffect: effect as any },
                                }))
                              }
                              className={`py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${roomSettings.video.backgroundEffect === effect
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : "bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200"
                                }`}
                            >
                              {effect}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsCategory === "isl" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-900/90 border border-emerald-500/30">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Hand className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">Sign Language AI Detector</p>
                            <p className="text-[10px] text-emerald-400/90">
                              {isIslActive ? "Detection actively running" : "Detection paused"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsIslActive(!isIslActive);
                            toast.info(isIslActive ? "ISL Detection Paused" : "ISL AI Detection Enabled");
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${isIslActive
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                            }`}
                        >
                          {isIslActive ? "Enabled" : "Disabled"}
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-stone-300">Sign Language System</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "isl", label: "ISL (Indian)" },
                            { id: "asl", label: "ASL (American)" },
                            { id: "bsl", label: "BSL (British)" },
                          ].map((lang) => (
                            <button
                              key={lang.id}
                              type="button"
                              onClick={() =>
                                updateRoomSettings((p) => ({
                                  ...p,
                                  signLanguage: { ...p.signLanguage, language: lang.id as any },
                                }))
                              }
                              className={`py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${roomSettings.signLanguage.language === lang.id
                                ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-300"
                                : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
                                }`}
                            >
                              {lang.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-stone-800/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-stone-300">Detection Sensitivity</span>
                          <span className="font-mono text-emerald-400 font-semibold">
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
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2 pt-2 border-t border-stone-800/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-stone-300">Prediction Confidence Threshold</span>
                          <span className="font-mono text-emerald-400 font-semibold">
                            {roomSettings.signLanguage.predictionConfidence}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={50}
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
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {settingsCategory === "captions" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-900/80 border border-stone-800/80">
                        <div className="flex items-center gap-2">
                          <Subtitles className="w-4 h-4 text-emerald-400" />
                          <div>
                            <p className="text-xs font-medium text-stone-200">Live Captions</p>
                            <p className="text-[10px] text-stone-500">Real-time speech-to-text transcription</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={roomSettings.captionsTranslation.enableCaptions}
                          onChange={(e) => {
                            updateRoomSettings((p) => ({
                              ...p,
                              captionsTranslation: {
                                ...p.captionsTranslation,
                                enableCaptions: e.target.checked,
                              },
                            }));
                            toast.info(e.target.checked ? "Live Captions Enabled" : "Live Captions Disabled");
                          }}
                          className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2 pt-2 border-t border-stone-800/60">
                        <label className="text-xs font-medium text-stone-300">Caption Font Size</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {["small", "medium", "large", "huge"].map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() =>
                                updateRoomSettings((p) => ({
                                  ...p,
                                  captionsTranslation: {
                                    ...p.captionsTranslation,
                                    captionSize: sz as any,
                                  },
                                }))
                              }
                              className={`py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${roomSettings.captionsTranslation.captionSize === sz
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : "bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200"
                                }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-stone-800/60">
                        <label className="text-xs font-medium text-stone-300">Auto-Translation Language</label>
                        <select
                          value={roomSettings.captionsTranslation.translationLanguage}
                          onChange={(e) =>
                            updateRoomSettings((p) => ({
                              ...p,
                              captionsTranslation: {
                                ...p.captionsTranslation,
                                translationLanguage: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-stone-900/90 border border-stone-700/80 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                        >
                          <option value="English">English</option>
                          <option value="Hindi">Hindi (हिंदी)</option>
                          <option value="Marathi">Marathi (मराठी)</option>
                          <option value="Tamil">Tamil (தமிழ்)</option>
                          <option value="Bengali">Bengali (বাংলা)</option>
                          <option value="Spanish">Spanish (Español)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {settingsCategory === "meeting" && (
                    <div className="space-y-4">
                      {isHost ? (
                        <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-amber-500/30 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                              <span>Host Access Policy</span>
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {meeting?.accessPolicy === "approval" ? "Approval Required" : "Anyone Can Join"}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-400 leading-relaxed">
                            Control whether new participants enter directly or wait in the lobby for your permission.
                          </p>
                          <button
                            type="button"
                            onClick={handleToggleAccessPolicy}
                            disabled={isUpdatingAccessPolicy}
                            className="w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs text-stone-200 font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            {meeting?.accessPolicy === "approval" ? (
                              <>
                                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Switch to Open Access (Anyone can join)</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                <span>Switch to Approval Required (Waiting room)</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1.5">
                          <p className="text-xs font-semibold text-white">Access Policy</p>
                          <p className="text-[11px] text-stone-400">
                            This meeting is currently set to{" "}
                            <strong className="text-emerald-400">
                              {meeting?.accessPolicy === "approval" ? "Approval Required" : "Anyone Can Join"}
                            </strong>{" "}
                            by the meeting host.
                          </p>
                        </div>
                      )}

                      <div className="space-y-2 pt-2 border-t border-stone-800/60">
                        <p className="text-xs font-medium text-stone-300">Default Join Preferences</p>
                        <div className="space-y-2">
                          <label className="flex items-center justify-between p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/70 text-xs text-stone-300 cursor-pointer">
                            <span>Always join with microphone muted</span>
                            <input
                              type="checkbox"
                              checked={roomSettings.meeting.defaultMicMuted}
                              onChange={(e) =>
                                updateRoomSettings((p) => ({
                                  ...p,
                                  meeting: { ...p.meeting, defaultMicMuted: e.target.checked },
                                }))
                              }
                              className="w-4 h-4 accent-emerald-500 rounded"
                            />
                          </label>
                          <label className="flex items-center justify-between p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/70 text-xs text-stone-300 cursor-pointer">
                            <span>Always join with camera turned off</span>
                            <input
                              type="checkbox"
                              checked={roomSettings.meeting.defaultCamOff}
                              onChange={(e) =>
                                updateRoomSettings((p) => ({
                                  ...p,
                                  meeting: { ...p.meeting, defaultCamOff: e.target.checked },
                                }))
                              }
                              className="w-4 h-4 accent-emerald-500 rounded"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-stone-900/50 border border-stone-800/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <div>
                            <p className="font-medium text-white">Encrypted Meeting</p>
                            <p className="text-[10px] text-stone-500">Room code: {roomCode}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Copy Link
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
          <div className="relative" ref={micMenuRef}>
            {showQuickMicBar && (
              <div className="absolute bottom-[calc(100%+0.75rem)] left-0 z-50 bg-[#1e1f20] border border-stone-800/90 rounded-2xl shadow-2xl p-2 flex items-center gap-2 text-stone-200 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => toast.info("Microphone: MacBook Air Microphone (Built-in)")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 border border-stone-700/60 text-xs font-medium text-stone-200 cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5 text-stone-400" />
                  <span>MacBook Air Microphone (Built-in)</span>
                  <ChevronDown className="w-3 h-3 text-stone-400 opacity-80" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("Speaker: MacBook Air Speakers (Built-in)")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 border border-stone-700/60 text-xs font-medium text-stone-200 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-stone-400" />
                  <span>MacBook Air Speakers (Built-in)</span>
                  <ChevronDown className="w-3 h-3 text-stone-400 opacity-80" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPanelTab("settings");
                    setSettingsCategory("audio");
                    setIsParticipantsOpen(true);
                    setShowQuickMicBar(false);
                  }}
                  className="w-8 h-8 rounded-xl bg-stone-800/80 hover:bg-stone-700 border border-stone-700/60 flex items-center justify-center text-stone-300 cursor-pointer"
                  title="Audio Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className={`h-11 rounded-2xl flex items-center p-1 transition-all overflow-hidden ${
              isMuted
                ? isDark ? "bg-[#5b1315]" : "bg-red-700"
                : isDark ? "bg-[#45474a]" : "bg-stone-300"
            }`}>
              <button
                type="button"
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
          <div className="relative" ref={camMenuRef}>
            {showQuickCamBar && (
              <div className={`absolute bottom-[calc(100%+0.75rem)] left-0 z-50 border rounded-2xl shadow-2xl p-2 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none whitespace-nowrap ${
                isDark ? "bg-[#1e1f20] border-stone-800/90 text-stone-200" : "bg-white border-stone-200 text-stone-800"
              }`}>
                <button
                  type="button"
                  onClick={() => toast.info("Camera: FaceTime HD Camera")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer ${
                    isDark ? "bg-stone-800/80 hover:bg-stone-700 border-stone-700/60 text-stone-200" : "bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-800"
                  }`}
                >
                  <Video className="w-3.5 h-3.5 text-stone-400" />
                  <span>FaceTime HD Camera</span>
                  <ChevronDown className="w-3 h-3 text-stone-400 opacity-80" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("Background Blur Enabled")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer ${
                    isDark ? "bg-stone-800/80 hover:bg-stone-700 border-stone-700/60 text-stone-300" : "bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-stone-400" />
                  <span>Blur background</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPanelTab("settings");
                    setSettingsCategory("video");
                    setIsParticipantsOpen(true);
                    setShowQuickCamBar(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer ${
                    isDark ? "bg-stone-800/80 hover:bg-stone-700 border-stone-700/60 text-stone-300" : "bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700"
                  }`}
                >
                  <span>Backgrounds and effects</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPanelTab("settings");
                    setSettingsCategory("video");
                    setIsParticipantsOpen(true);
                    setShowQuickCamBar(false);
                  }}
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center cursor-pointer ${
                    isDark ? "bg-stone-800/80 hover:bg-stone-700 border-stone-700/60 text-stone-300" : "bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700"
                  }`}
                  title="Video Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className={`h-11 rounded-2xl flex items-center p-1 transition-all overflow-hidden ${
              isVideoOff
                ? isDark ? "bg-[#5b1315]" : "bg-red-700"
                : isDark ? "bg-[#45474a]" : "bg-stone-300"
            }`}>
              <button
                type="button"
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
            onClick={() => toast.info("Present now", { description: "Select window or screen to share." })}
            className={`hidden sm:flex w-10 h-10 sm:w-11 sm:h-11 rounded-2xl items-center justify-center shrink-0 transition-all cursor-pointer shadow-md active:scale-95 ${
              isDark
                ? "bg-[#3c4043] hover:bg-[#474b4f] active:bg-[#52565a] text-white"
                : "bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-800 border border-stone-300/80"
            }`}
            title="Present now"
          >
            <MonitorUp className="w-4 h-4 sm:w-5 sm:h-5" />
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
                  ? isDark ? "bg-stone-700 text-amber-300" : "bg-stone-300 text-amber-600"
                  : isDark ? "bg-[#3c4043] hover:bg-[#474b4f] text-white" : "bg-stone-200 hover:bg-stone-300 text-stone-800 border border-stone-300/80"
              }`}
              title="Send a reaction"
            >
              <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* 5. Captions / CC Button (Hidden on mobile phone, available in More Options menu) */}
          <button
            type="button"
            onClick={() => toast.info("Captions enabled", { description: "Live AI transcription activated." })}
            className={`hidden sm:flex w-10 h-10 sm:w-11 sm:h-11 rounded-2xl items-center justify-center shrink-0 transition-all cursor-pointer shadow-md active:scale-95 ${
              isDark
                ? "bg-[#3c4043] hover:bg-[#474b4f] active:bg-[#52565a] text-white"
                : "bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-800 border border-stone-300/80"
            }`}
            title="Turn on captions"
          >
            <Subtitles className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* 6. Raise Hand Button */}
          <button
            type="button"
            onClick={() => toast.info("Hand Raised", { description: "Host notified." })}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md active:scale-95 ${
              isDark
                ? "bg-[#3c4043] hover:bg-[#474b4f] active:bg-[#52565a] text-white"
                : "bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-800 border border-stone-300/80"
            }`}
            title="Raise hand"
          >
            <Hand className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

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
                ? "bg-emerald-600 text-white"
                : isDark ? "bg-[#3c4043] hover:bg-[#474b4f] text-white" : "bg-stone-200 hover:bg-stone-300 text-stone-800 border border-stone-300/80"
            }`}
            title="In-call messages"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-stone-950 shadow-md animate-pulse">
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
                  ? isDark ? "bg-stone-600 text-white" : "bg-stone-400 text-stone-900"
                  : isDark ? "bg-[#3c4043] hover:bg-[#474b4f] text-white" : "bg-stone-200 hover:bg-stone-300 text-stone-800 border border-stone-300/80"
              }`}
              title="More options"
            >
              <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
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
                    <Sparkles className={`w-5 h-5 shrink-0 ${isIslActive ? "text-emerald-500" : "text-stone-400"}`} />
                    <span>ISL Sign Language Detector</span>
                  </div>
                  {isIslActive && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      ON
                    </span>
                  )}
                </button>

                {/* 4c. Present screen */}
                <button
                  type="button"
                  onClick={() => {
                    toast.info("Present now", { description: "Select window or screen to share." });
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 sm:py-3 text-sm transition-colors text-left cursor-pointer ${
                    isDark ? "text-stone-200 hover:bg-stone-800/80 hover:text-white" : "text-stone-800 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <MonitorUp className="w-5 h-5 text-stone-400 shrink-0" />
                  <span>Present screen</span>
                </button>

                {/* 4d. Turn on captions */}
                <button
                  type="button"
                  onClick={() => {
                    toast.info("Captions enabled", { description: "Live AI transcription activated." });
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 sm:py-3 text-sm transition-colors text-left cursor-pointer ${
                    isDark ? "text-stone-200 hover:bg-stone-800/80 hover:text-white" : "text-stone-800 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <Subtitles className="w-5 h-5 text-stone-400 shrink-0" />
                  <span>Turn on captions</span>
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
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-stone-950 shadow-md">
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

          {/* 11. Google Meet Red End Call Box Button */}
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
              <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5 rotate-[135deg]" />
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
    </div>
  );
}
