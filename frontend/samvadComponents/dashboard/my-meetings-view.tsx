"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { 
  Video, 
  Keyboard, 
  Calendar as CalendarIcon, 
  ArrowRight, 
  Clock, 
  Copy, 
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/samvadComponents/toastMessage";
import { MeetingDetails } from "@/lib/meetings-client";

export interface MyMeetingsViewProps {
  user: any;
  meetings: MeetingDetails[];
  roomCode: string;
  setRoomCode: (val: string) => void;
  isJoiningMeeting: boolean;
  isCreatingMeeting: boolean;
  onJoinMeeting: (e: React.FormEvent) => void;
  onStartInstantMeeting: () => void;
  onSwitchToCalendar: () => void;
}

export function MyMeetingsView({
  user,
  meetings,
  roomCode,
  setRoomCode,
  isJoiningMeeting,
  isCreatingMeeting,
  onJoinMeeting,
  onStartInstantMeeting,
  onSwitchToCalendar,
}: MyMeetingsViewProps) {
  const router = useRouter();
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

  const [filter, setFilter] = useState<"active" | "scheduled" | "ended">("active");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const isThrottledRef = useRef(false);

  const handleCopyLink = (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/room/${code}`;
    navigator.clipboard?.writeText(url);
    setCopiedCode(code);
    toast.success("Meeting link copied!", {
      description: url,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Extract code if user pasted a link
    if (val.includes("/")) {
      const parts = val.split("/").filter(Boolean);
      val = parts[parts.length - 1] || val;
    }
    // Extract alphanumeric chars, max 10 digits
    const raw = val.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
    
    // Format with standard xxx-xxxx-xxx hyphens
    if (raw.length <= 3) {
      setRoomCode(val.endsWith("-") && raw.length === 3 ? `${raw}-` : raw);
    } else if (raw.length <= 7) {
      const formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
      setRoomCode(val.endsWith("-") && raw.length === 7 ? `${formatted}-` : formatted);
    } else {
      setRoomCode(`${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 10)}`);
    }
  };

  const filteredMeetings = meetings.filter((m) => m.status === filter);
  const displayedMeetings = filteredMeetings.slice(0, visibleCount);

  // Reset to 4 when filter changes
  useEffect(() => {
    setVisibleCount(4);
  }, [filter]);

  // Infinite scroll listener: loads another 4 when scrolling near the bottom
  useEffect(() => {
    const handleScroll = () => {
      if (isThrottledRef.current) return;
      if (!observerRef.current) return;

      const rect = observerRef.current.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 150) {
        isThrottledRef.current = true;
        setVisibleCount((prev) => {
          if (prev < filteredMeetings.length) {
            return Math.min(prev + 4, filteredMeetings.length);
          }
          return prev;
        });

        setTimeout(() => {
          isThrottledRef.current = false;
        }, 300);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleScroll, { passive: true });
    window.addEventListener("touchmove", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleScroll);
      window.removeEventListener("touchmove", handleScroll);
    };
  }, [filteredMeetings.length]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Greeting Section */}
      <section className="pt-2 pb-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          Welcome back, {user.name || "friend"}!
        </h1>
      </section>

      {/* Quick Meeting Actions Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Start Instant Meeting */}
        <Card className="border-2 border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-stone-900 flex flex-col justify-between rounded-3xl">
          <CardHeader>
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-3">
              <Video className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg">Start Instant Meeting</CardTitle>
            <CardDescription>
              Launch an instant room with real-time camera gestures and live captions enabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={onStartInstantMeeting}
              disabled={isCreatingMeeting}
              className="w-full gap-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200 rounded-lg cursor-pointer"
            >
              {isCreatingMeeting ? "Creating Room..." : "New Meeting"} <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: Join with Code */}
        <Card className="border-2 border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-stone-900 flex flex-col justify-between rounded-3xl">
          <CardHeader>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Keyboard className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg">Join a Meeting</CardTitle>
            <CardDescription>
              Enter a room code shared by your host to join the video session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onJoinMeeting} className="relative flex items-center w-full">
              <Input
                placeholder="Enter room code"
                value={roomCode}
                maxLength={12}
                onChange={handleRoomCodeChange}
                className="h-9.5 text-sm font-mono uppercase tracking-wider dark:bg-stone-800 dark:border-stone-700 rounded-lg pr-20 focus-visible:ring-1"
              />
              <Button 
                type="submit" 
                size="sm"
                disabled={isJoiningMeeting || !roomCode.trim()}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-3 text-xs font-semibold rounded-md transition-all ${
                  roomCode.trim()
                    ? "bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200 shadow-xs cursor-pointer active:scale-95 opacity-100"
                    : "bg-transparent hover:bg-transparent text-stone-400 dark:text-stone-500 cursor-not-allowed opacity-60 shadow-none"
                }`}
              >
                {isJoiningMeeting ? "Joining..." : "Join"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Card 3: Schedule for Later */}
        <Card className="border-2 border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-stone-900 flex flex-col justify-between rounded-3xl">
          <CardHeader>
            <div className="w-12 h-12 rounded-2xl bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] flex items-center justify-center mb-3">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg">Schedule for Later</CardTitle>
            <CardDescription>
              Plan an upcoming conference in your calendar and share automated invites with participants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={onSwitchToCalendar}
              className="w-full gap-2 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg cursor-pointer"
            >
              Open Calendar <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* My Meetings Section */}
      <section className="bg-white dark:bg-stone-900 rounded-3xl border-2 border-stone-200/80 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              My Meetings
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Your room records, active video sessions, and scheduled calls
            </p>
          </div>

          {/* Filter tabs */}
          <div className="inline-flex items-center bg-stone-100 dark:bg-stone-800 rounded-xl p-1 border border-stone-200/80 dark:border-stone-700 text-xs">
            {(["active", "scheduled", "ended"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                  filter === tab
                    ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Meeting List Cards */}
        {filteredMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center rounded-2xl bg-stone-50/60 dark:bg-stone-800/30 border border-dashed border-stone-200 dark:border-stone-800">
            {/* Illustration */}
            <div className="w-full max-w-[360px] sm:max-w-[440px] mx-auto mb-4 flex justify-center">
              <Image
                key={isDark ? "meetings-dark" : "meetings-light"}
                src={isDark ? "/no-meeting-yet-dark.svg" : "/no-meeting-yet.svg"}
                alt="No Meeting Yet"
                width={500}
                height={289}
                className="w-full h-auto object-contain"
                priority
                suppressHydrationWarning
              />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              {filter === "scheduled"
                ? "No Scheduled Meetings"
                : filter === "active"
                ? "No Active Meetings"
                : "No Past Meetings"}
            </h3>

            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1.5 max-w-sm">
              {filter === "scheduled"
                ? "You have no upcoming meetings scheduled. Plan ahead and schedule a session on your calendar."
                : filter === "active"
                ? "There are no live meetings in progress right now. Start an instant meeting to get started."
                : "You haven't completed any meetings yet. Your finished session history will appear here."}
            </p>

            {filter === "scheduled" ? (
              <Button
                onClick={onSwitchToCalendar}
                className="mt-4 rounded-xl text-xs sm:text-sm font-semibold gap-2 bg-[#ede9fe] hover:bg-[#ddd6fe] text-[#4f46e5] dark:bg-[#2e2a56] dark:text-[#c7d2fe] dark:hover:bg-[#3b3570] transition-colors cursor-pointer px-6 py-2.5 h-auto shadow-xs border border-[#c4b5fd]/40 dark:border-[#6366f1]/30"
              >
                <CalendarIcon className="w-4 h-4 stroke-[2]" />
                <span>Schedule a Meeting</span>
              </Button>
            ) : (
              <Button
                onClick={onStartInstantMeeting}
                disabled={isCreatingMeeting}
                className="mt-4 rounded-xl text-xs sm:text-sm font-semibold gap-2 bg-[#ede9fe] hover:bg-[#ddd6fe] text-[#4f46e5] dark:bg-[#2e2a56] dark:text-[#c7d2fe] dark:hover:bg-[#3b3570] transition-colors cursor-pointer px-6 py-2.5 h-auto shadow-xs border border-[#c4b5fd]/40 dark:border-[#6366f1]/30"
              >
                <Video className="w-4 h-4 stroke-[2]" />
                <span>{isCreatingMeeting ? "Creating Room..." : "Create a New Meeting"}</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-3.5">
            {displayedMeetings.map((m) => {
              const isEnded = m.status === "ended";
              const isScheduled = m.status === "scheduled";
              const formattedDate = m.scheduledAt
                ? new Date(m.scheduledAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                : new Date(m.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

              return (
                <div
                  key={m.id}
                  className="p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900/90 hover:bg-stone-50/80 dark:hover:bg-stone-800/60 hover:border-stone-300 dark:hover:border-stone-700 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                >
                  {/* Left: Icon + Title & Date */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        m.status === "active"
                          ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400"
                          : isEnded
                          ? "bg-stone-200/70 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
                          : "bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff]"
                      }`}
                    >
                      {isScheduled ? (
                        <CalendarIcon className="w-5 h-5" />
                      ) : (
                        <Video className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 truncate">
                          {m.title || "Samvad Meeting"}
                        </h4>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                            m.status === "active"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : isEnded
                              ? "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-400"
                              : "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-500 dark:text-stone-400">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700 tracking-wider">
                          {m.roomCode}
                        </span>
                        <span className="text-stone-300 dark:text-stone-600">•</span>
                        <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                          <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Copy link + Action button */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200/60 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(m.roomCode)}
                      className="inline-flex items-center gap-1 text-xs text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                      title="Copy meeting link"
                    >
                      {copiedCode === m.roomCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden md:inline">{copiedCode === m.roomCode ? "Copied" : "Copy Link"}</span>
                    </button>

                    {!isEnded ? (
                      <Button
                        size="sm"
                        onClick={() => router.push(`/room/${m.roomCode}`)}
                        className="h-8 text-xs rounded-xl gap-1.5 bg-[#7075f7] hover:bg-[#5f64f5] text-white px-3.5 shadow-xs cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>{m.status === "active" ? "Join Room" : "Start"}</span>
                      </Button>
                    ) : (
                      <span className="text-xs text-stone-400 dark:text-stone-500 italic px-2">Ended</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Scroll trigger / Load more sentinel */}
            {visibleCount < filteredMeetings.length && (
              <div ref={observerRef} className="pt-3 pb-1 flex flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 4, filteredMeetings.length))}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200/70 dark:hover:bg-stone-700/80 border border-stone-200/80 dark:border-stone-700/80 transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="w-3.5 h-3.5 border-2 border-stone-400 dark:border-stone-500 border-t-transparent rounded-full animate-spin group-hover:border-stone-600 dark:group-hover:border-stone-300" />
                  <span>Scroll or click to load more ({visibleCount} of {filteredMeetings.length})</span>
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
