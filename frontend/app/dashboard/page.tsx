"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { toast } from "@/samvadComponents/toastMessage";
import { SamvadNavbar } from "@/samvadComponents/navbar";
import { AuthGuard } from "@/samvadComponents/auth";
import {
  DashboardNavRail,
  DashboardBottomBar,
  DashboardTab,
  CalendarView,
  MyMeetingsView,
  ChatView,
  NotesView,
} from "@/samvadComponents/dashboard";
import {
  createMeeting,
  getMeeting,
  getUserMeetings,
  MeetingDetails,
} from "@/lib/meetings-client";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [activeTab, setActiveTab] = useState<DashboardTab>("meetings");
  const [meetings, setMeetings] = useState<MeetingDetails[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [isJoiningMeeting, setIsJoiningMeeting] = useState(false);
  const toastFiredRef = useRef(false);

  const userId = session?.user?.id;

  const handleSetRoomCode = (val: string) => {
    setRoomCode(val);
    if (joinError) setJoinError(null);
  };

  const loadUserMeetings = useCallback(
    async (overrideUserId?: string) => {
      try {
        setIsLoadingMeetings(true);
        const uid = overrideUserId || userId;
        const list = await getUserMeetings(uid);
        setMeetings(list);
      } catch {
        // silent fallback
      } finally {
        setIsLoadingMeetings(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (!toastFiredRef.current && session?.user) {
      toastFiredRef.current = true;
      toast.success("Welcome back!", {
        description: `Signed in as ${session.user.name || session.user.email}.`,
      });
    }
  }, [session]);

  useEffect(() => {
    if (userId && !isPending) {
      loadUserMeetings();
    }
  }, [userId, isPending, loadUserMeetings]);

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    const raw = roomCode.trim();
    if (!raw) {
      setJoinError("Please enter a room code or meeting link.");
      return;
    }

    // Extract code if user pasted a full URL
    let cleanCode = raw;
    try {
      if (raw.includes("/")) {
        const parts = raw.split("/").filter(Boolean);
        cleanCode = parts[parts.length - 1] || parts[parts.length - 2] || raw;
      }
    } catch {}

    const alphanumeric = cleanCode.replace(/[^a-zA-Z0-9]/g, "");
    if (alphanumeric.length < 10) {
      setJoinError("Invalid room code. It must be 10 characters (e.g. ABC-DEFG-HIJ).");
      return;
    }

    cleanCode = cleanCode.trim().toLowerCase();
    if (!cleanCode.includes("-") && cleanCode.length === 10) {
      cleanCode = `${cleanCode.slice(0, 3)}-${cleanCode.slice(3, 7)}-${cleanCode.slice(7, 10)}`;
    }

    try {
      setIsJoiningMeeting(true);

      const meetingData = await getMeeting(cleanCode);
      if (meetingData.status === "ended") {
        setIsJoiningMeeting(false);
        setJoinError("This meeting has already ended by the host.");
        return;
      }

      toast.success("Connecting...", {
        description: `Joining ${meetingData.title || cleanCode.toUpperCase()}...`,
      });
      router.push(`/room/${cleanCode}`);
    } catch (err: any) {
      setIsJoiningMeeting(false);
      if (err.statusCode === 404) {
        setJoinError(`Meeting not found. No room exists with code "${cleanCode.toUpperCase()}".`);
      } else {
        setJoinError(err.message || "Failed to validate room. Please try again.");
      }
    }
  };

  const handleStartInstantMeeting = async () => {
    if (isCreatingMeeting) return;
    try {
      setIsCreatingMeeting(true);
      toast.info("Creating room...", {
        description: "Setting up your meeting and database record...",
      });

      const newMeeting = await createMeeting({
        title: "Instant Meeting",
        userId: session?.user?.id,
      });
      loadUserMeetings(session?.user?.id);

      toast.success("Meeting ready!", {
        description: `Redirecting to room ${newMeeting.roomCode.toUpperCase()}...`,
      });
      router.push(`/room/${newMeeting.roomCode}`);
    } catch (err: any) {
      setIsCreatingMeeting(false);
      toast.error("Failed to start meeting", {
        description: err.message || "Could not create meeting. Please try again.",
      });
    }
  };

  if (!session?.user) {
    return (
      <AuthGuard loadingMessage="Loading your workspace...">
        <div />
      </AuthGuard>
    );
  }

  const user = session.user;

  return (
    <AuthGuard loadingMessage="Loading your workspace...">
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200 bg-dot-grid">
        {/* Top Navigation */}
        <SamvadNavbar user={user} onStartInstantMeeting={handleStartInstantMeeting} />

        {/* Dashboard Layout Container */}
        <div className="flex-1 flex w-full -mt-[1px]">
          {/* Left-Side Navigation Switcher: Visible on desktop (md+) */}
          <aside className="hidden md:flex flex-col items-start pl-6 sm:pl-10 w-28 lg:w-32 shrink-0 pt-10 sm:pt-[56px] sticky top-[63px] sm:top-[67px] h-[calc(100vh-67px)] z-20 select-none">
            <DashboardNavRail
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </aside>

          {/* Main Dashboard Content - Exact same centered position like before */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-10 py-8 sm:py-12 pb-28 md:pb-12 space-y-8 min-w-0">
            {activeTab === "meetings" && (
              <MyMeetingsView
                user={user}
                meetings={meetings}
                roomCode={roomCode}
                setRoomCode={handleSetRoomCode}
                joinError={joinError}
                setJoinError={setJoinError}
                isJoiningMeeting={isJoiningMeeting}
                isCreatingMeeting={isCreatingMeeting}
                onJoinMeeting={handleJoinMeeting}
                onStartInstantMeeting={handleStartInstantMeeting}
                onSwitchToCalendar={() => setActiveTab("calendar")}
              />
            )}
            {activeTab === "calendar" && (
              <CalendarView
                meetings={meetings}
                onMeetingScheduled={loadUserMeetings}
                onStartInstantMeeting={handleStartInstantMeeting}
              />
            )}
            {activeTab === "chat" && <ChatView user={user} />}
            {activeTab === "notes" && <NotesView user={user} />}
          </main>

          {/* Right balancing spacer so the main content remains symmetrically centered on the screen */}
          <div className="hidden md:block w-28 lg:w-32 shrink-0 pointer-events-none" aria-hidden="true" />
        </div>

        {/* Mobile & Small Screens Bottom Bar: Sidebar items (Meetings, Calendar) + Profile */}
        <DashboardBottomBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={user}
        />
      </div>
    </AuthGuard>
  );
}
