"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { 
  Video, 
  Keyboard, 
  Calendar as CalendarIcon, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Copy, 
  Check, 
  ShieldCheck, 
  User, 
  Settings, 
  Volume2,
  Tv
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

  const [filter, setFilter] = useState<"all" | "active" | "scheduled" | "ended">("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

  const filteredMeetings = meetings.filter((m) => {
    if (filter === "all") return true;
    return m.status === filter;
  });

  let preferences: any = null;
  try {
    const raw = user?.accessibilityPreferences;
    if (typeof raw === "string") {
      preferences = JSON.parse(raw);
    } else if (typeof raw === "object" && raw !== null) {
      preferences = raw;
    }
  } catch {
    preferences = null;
  }

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
            <form onSubmit={onJoinMeeting} className="flex gap-2">
              <Input
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="text-sm font-mono uppercase tracking-wider dark:bg-stone-800 dark:border-stone-700 rounded-lg"
              />
              <Button 
                type="submit" 
                variant="outline" 
                disabled={isJoiningMeeting}
                className="shrink-0 dark:border-stone-700 dark:hover:bg-stone-800 rounded-lg cursor-pointer"
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
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
              <Tv className="w-5 h-5 text-[#7075f7]" />
              <span>My Meetings</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Your room records, active video sessions, and scheduled calls
            </p>
          </div>

          {/* Filter tabs */}
          <div className="inline-flex items-center bg-stone-100 dark:bg-stone-800 rounded-xl p-1 border border-stone-200/80 dark:border-stone-700 text-xs">
            {(["all", "active", "scheduled", "ended"] as const).map((tab) => (
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
              {filter === "all"
                ? "No Meeting Yet"
                : filter === "scheduled"
                ? "No Scheduled Meetings"
                : filter === "active"
                ? "No Active Meetings"
                : filter === "ended"
                ? "No Past Meetings"
                : `No ${filter} Meetings`}
            </h3>

            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1.5 max-w-sm">
              {filter === "scheduled"
                ? "You have no upcoming meetings scheduled. Plan ahead and schedule a session on your calendar."
                : filter === "active"
                ? "There are no live meetings in progress right now. Start an instant meeting to get started."
                : filter === "ended"
                ? "You haven't completed any meetings yet. Your finished session history will appear here."
                : "Enjoy some free time or create a new meeting."}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMeetings.map((m) => {
              const isEnded = m.status === "ended";
              const isScheduled = m.status === "scheduled";
              const formattedDate = m.scheduledAt
                ? new Date(m.scheduledAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                : new Date(m.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

              return (
                <div
                  key={m.id}
                  className="p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 hover:border-stone-300 dark:hover:border-stone-700 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-stone-900 dark:text-stone-100 truncate">
                          {m.title || "Samvad Meeting"}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-stone-500 dark:text-stone-400">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize shrink-0 ${
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

                  <div className="flex items-center justify-between pt-3 border-t border-stone-200/60 dark:border-stone-700/60 text-xs">
                    <div className="flex items-center gap-1.5 font-mono uppercase font-semibold text-stone-600 dark:text-stone-300">
                      <span>{m.roomCode}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(m.roomCode)}
                        className="inline-flex items-center gap-1 text-xs text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white px-2.5 py-1 rounded-full hover:bg-stone-200/70 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                        title="Copy meeting link"
                      >
                        {copiedCode === m.roomCode ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedCode === m.roomCode ? "Copied" : "Copy Link"}</span>
                      </button>

                      {!isEnded && (
                        <Button
                          size="sm"
                          onClick={() => router.push(`/room/${m.roomCode}`)}
                          className="h-8 text-xs rounded-full gap-1.5 bg-[#7075f7] hover:bg-[#5f64f5] text-white px-3.5 shadow-xs cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>{m.status === "active" ? "Join Room" : "Start"}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Profile & Account Details */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Account Info */}
        <Card className="border-stone-200/80 dark:border-stone-800 shadow-sm bg-white dark:bg-stone-900 lg:col-span-2 rounded-3xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Account Overview</CardTitle>
                <CardDescription>Your registered Samvad identity and session information</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                Authenticated
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm divide-y divide-stone-100 dark:divide-stone-800">
            <div className="flex justify-between items-center pt-2">
              <span className="text-stone-500 dark:text-stone-400 flex items-center gap-2">
                <User className="w-4 h-4 text-stone-400 dark:text-stone-500" /> Full Name
              </span>
              <span className="font-medium text-stone-800 dark:text-stone-100">{user.name || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center pt-3">
              <span className="text-stone-500 dark:text-stone-400">Email Address</span>
              <span className="font-medium text-stone-800 dark:text-stone-100">{user.email}</span>
            </div>
            {preferences?.workspaceName && (
              <div className="flex justify-between items-center pt-3">
                <span className="text-stone-500 dark:text-stone-400">Workspace</span>
                <span className="font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded text-xs border border-emerald-100 dark:border-emerald-800">
                  {preferences.workspaceName}
                </span>
              </div>
            )}
            {preferences?.primaryMode && (
              <div className="flex justify-between items-center pt-3">
                <span className="text-stone-500 dark:text-stone-400">Primary Mode</span>
                <span className="font-medium text-stone-800 dark:text-stone-100 capitalize">
                  {preferences.primaryMode === "isl"
                    ? "Indian Sign Language (ISL)"
                    : preferences.primaryMode === "captions"
                    ? "Live Captions / STT"
                    : "Audio / Voice"}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3">
              <span className="text-stone-500 dark:text-stone-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-400 dark:text-stone-500" /> Member Since
              </span>
              <span className="font-medium text-stone-800 dark:text-stone-100">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : "Today"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Accessibility Features */}
        <Card className="border-stone-200/80 dark:border-stone-800 shadow-sm bg-white dark:bg-stone-900 rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              Accessibility Features
            </CardTitle>
            <CardDescription>Features enabled for your session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700 flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
              </div>
              <div>
                <p className="font-medium text-stone-800 dark:text-stone-100">ISL Recognition</p>
                <p className="text-stone-500 dark:text-stone-400 mt-0.5">AI tracks hands and translates gestures in real time.</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700 flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                <Volume2 className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
              </div>
              <div>
                <p className="font-medium text-stone-800 dark:text-stone-100">Text-to-Speech & STT</p>
                <p className="text-stone-500 mt-0.5">Dual translation between spoken audio and visual text.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
