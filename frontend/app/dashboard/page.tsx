"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { 
  Video, 
  Calendar, 
  Keyboard, 
  LogOut, 
  Sparkles, 
  ShieldCheck, 
  User, 
  Clock, 
  ArrowRight,
  Settings,
  Volume2,
  Copy
} from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { SamvadNavbar } from "@/samvadComponents/navbar";
import { AuthGuard } from "@/samvadComponents/auth";
import { markLoggedOut } from "@/lib/session";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending, error } = useSession();
  const [roomCode, setRoomCode] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const toastFiredRef = useRef(false);

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

  const handleSignOut = async () => {
    setIsSigningOut(true);
    markLoggedOut();
    try {
      await signOut();
    } catch {}
    window.location.replace("/login?signed_out=true");
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      toast.warning("Room code required", {
        description: "Please enter a valid 6-character room code to join.",
      });
      return;
    }
    toast.success("Joining meeting...", {
      description: `Connecting to room ${roomCode.trim().toUpperCase()}...`,
      action: { label: "Got It!" },
    });
    router.push(`/meeting/${roomCode.trim()}`);
  };

  const handleStartInstantMeeting = () => {
    const randomCode = Math.random().toString(36).substring(2, 8);
    toast.success("Starting instant meeting...", {
      description: "Setting up your camera and Indian Sign Language detection...",
      action: { label: "Got It!" },
    });
    router.push(`/meeting/${randomCode}`);
  };

  if (!session?.user) {
    return (
      <AuthGuard loadingMessage="Loading your workspace...">
        <div />
      </AuthGuard>
    );
  }

  const user = session.user;
  const userInitials = (user.name || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  let preferences: any = null;
  try {
    const raw = (user as any)?.accessibilityPreferences;
    if (typeof raw === "string") {
      preferences = JSON.parse(raw);
    } else if (typeof raw === "object" && raw !== null) {
      preferences = raw;
    }
  } catch {
    preferences = null;
  }

  return (
    <AuthGuard loadingMessage="Loading your workspace...">
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200">
        {/* Top Google Meet Style Navigation */}
        <SamvadNavbar user={user} onStartInstantMeeting={handleStartInstantMeeting} />

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Hero Greeting Section */}
        <section className="bg-gradient-to-br from-stone-900 via-stone-800 to-zinc-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/10 via-rose-500/10 to-purple-500/10 blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-stone-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              AI-Powered Accessibility Active
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-white">
              Welcome back, {user.name || "friend"}!
            </h1>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              Start an instant meeting with real-time Indian Sign Language (ISL) recognition, 
              or join an existing room with full speech-to-text translation.
            </p>
          </div>
        </section>

        {/* Quick Meeting Actions Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Start Instant Meeting */}
          <Card className="border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-stone-900 flex flex-col justify-between">
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
                onClick={handleStartInstantMeeting} 
                className="w-full gap-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
              >
                New Meeting <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Join with Code */}
          <Card className="border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-stone-900 flex flex-col justify-between">
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <Keyboard className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">Join a Meeting</CardTitle>
              <CardDescription>
                Enter a 6-character room code shared by your host to join the video session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinMeeting} className="flex gap-2">
                <Input
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="text-sm font-mono uppercase tracking-wider dark:bg-stone-800 dark:border-stone-700"
                />
                <Button type="submit" variant="outline" className="shrink-0 dark:border-stone-700 dark:hover:bg-stone-800">
                  Join
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Card 3: Schedule a Meeting */}
          <Card className="border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-stone-900 flex flex-col justify-between">
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">Schedule for Later</CardTitle>
              <CardDescription>
                Plan an upcoming conference and share automated calendar invites with participants.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Meeting scheduler", {
                    description: "Calendar scheduling and room reservations will be available in the next release.",
                    action: { label: "Got It!" },
                  })
                }
                className="w-full gap-2 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer"
              >
                Schedule Meeting
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Profile & Account Details */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Account Info */}
          <Card className="border-stone-200/80 dark:border-stone-800 shadow-sm bg-white dark:bg-stone-900 lg:col-span-2">
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
              <div className="flex justify-between items-center pt-3">
                <span className="text-stone-500 dark:text-stone-400">User ID</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(user.id);
                    toast.success("User ID copied!", {
                      description: "Copied to clipboard successfully.",
                    });
                  }}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-stone-600 dark:text-stone-300 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                  title="Click to copy ID"
                >
                  <span>{user.id}</span>
                  <Copy className="w-3 h-3 text-stone-400" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Accessibility Features */}
          <Card className="border-stone-200/80 dark:border-stone-800 shadow-sm bg-white dark:bg-stone-900">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                Accessibility Features
              </CardTitle>
              <CardDescription>Features enabled for your session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700 flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
                </div>
                <div>
                  <p className="font-medium text-stone-800 dark:text-stone-100">ISL Recognition</p>
                  <p className="text-stone-500 dark:text-stone-400 mt-0.5">AI tracks hands and translates gestures in real time.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700 flex items-start gap-3">
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
      </main>
      </div>
    </AuthGuard>
  );
}
