"use client";

import { useEffect, useState, useRef } from "react";
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
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [isJoiningMeeting, setIsJoiningMeeting] = useState(false);
  const toastFiredRef = useRef(false);

  const loadUserMeetings = async () => {
    try {
      setIsLoadingMeetings(true);
      const list = await getUserMeetings();
      setMeetings(list);
    } catch {
      // ignore
    } finally {
      setIsLoadingMeetings(false);
    }
  };

  useEffect(() => {
    if (toastFiredRef.current) return;
    if (typeof window === "undefined") return;

    if (sessionStorage.getItem("samvad_login_success") === "true") {
      if (!isPending && session?.user) {
        toastFiredRef.current = true;
        sessionStorage.removeItem("samvad_login_success");
        toast.success("Login successful!", {
          description: `Welcome back${session.user.name ? `, ${session.user.name}` : ""}! Your workspace is ready.`,
          action: { label: "Got It!" },
          duration: 3000,
        });
      }
    }
  }, [isPending, session]);

  useEffect(() => {
    if (session?.user?.id) {
      loadUserMeetings();
    }
  }, [session?.user?.id]);

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = roomCode.trim();
    if (!raw) {
      toast.warning("Room code required", {
        description: "Please enter a valid room code or link to join.",
      });
      return;
    }

    // Extract code if user pasted a full URL
    let cleanCode = raw;
    try {
      if (raw.includes("/")) {
        const parts = raw.split("/");
        cleanCode = parts[parts.length - 1] || parts[parts.length - 2] || raw;
      }
    } catch {}
    cleanCode = cleanCode.trim().toLowerCase();

    try {
      setIsJoiningMeeting(true);
      toast.info("Validating room...", {
        description: `Checking room code ${cleanCode.toUpperCase()}...`,
      });

      const meetingData = await getMeeting(cleanCode);
      if (meetingData.status === "ended") {
        setIsJoiningMeeting(false);
        toast.error("Meeting Ended", {
          description: "This meeting has already ended by the host.",
        });
        return;
      }

      toast.success("Connecting...", {
        description: `Joining ${meetingData.title || cleanCode}...`,
      });
      router.push(`/room/${cleanCode}`);
    } catch (err: any) {
      setIsJoiningMeeting(false);
      if (err.statusCode === 404) {
        toast.error("Meeting Not Found", {
          description: `No active meeting found with code "${cleanCode}".`,
        });
      } else {
        toast.error("Unable to join", {
          description: err.message || "Failed to validate room.",
        });
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

      const newMeeting = await createMeeting("Instant Meeting");
      loadUserMeetings();

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
  const activeCount = meetings.filter((m) => m.status === "active").length;

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
              meetingCount={activeCount}
            />
          </aside>

          {/* Main Dashboard Content - Exact same centered position like before */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-10 py-8 sm:py-12 pb-28 md:pb-12 space-y-8 min-w-0">
            {activeTab === "meetings" && (
              <MyMeetingsView
                user={user}
                meetings={meetings}
                roomCode={roomCode}
                setRoomCode={setRoomCode}
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
          meetingCount={activeCount}
          user={user}
        />
      </div>
    </AuthGuard>
  );
}
