"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Volume2
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending, error } = useSession();
  const [roomCode, setRoomCode] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [isPending, session, router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    window.location.href = "/login";
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    router.push(`/meeting/${roomCode.trim()}`);
  };

  const handleStartInstantMeeting = () => {
    const randomCode = Math.random().toString(36).substring(2, 8);
    router.push(`/meeting/${randomCode}`);
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-white font-bold font-serif italic animate-pulse">
            S
          </div>
          <p className="text-sm font-medium text-stone-500 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
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
    const raw = (user as any).accessibilityPreferences;
    if (typeof raw === "string") {
      preferences = JSON.parse(raw);
    } else if (typeof raw === "object" && raw !== null) {
      preferences = raw;
    }
  } catch {
    preferences = null;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white font-bold font-serif italic">
              S
            </div>
            <span className="font-serif font-semibold text-xl tracking-tight">Samvad</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-xs font-medium text-stone-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Live & Accessible
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
              <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-semibold">
                {userInitials}
              </div>
              <div className="hidden md:block text-left text-xs">
                <p className="font-medium text-stone-800 leading-tight">{user.name}</p>
                <p className="text-stone-400 truncate max-w-[140px]">{user.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-stone-500 hover:text-stone-900 hover:bg-stone-100 ml-1 text-xs gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isSigningOut ? "Signing out..." : "Sign out"}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

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
          <Card className="border-stone-200/80 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
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
                className="w-full gap-2 bg-stone-900 hover:bg-stone-800 text-white"
              >
                New Meeting <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Join with Code */}
          <Card className="border-stone-200/80 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
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
                  className="text-sm font-mono uppercase tracking-wider"
                />
                <Button type="submit" variant="outline" className="shrink-0">
                  Join
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Card 3: Schedule a Meeting */}
          <Card className="border-stone-200/80 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">Schedule for Later</CardTitle>
              <CardDescription>
                Plan an upcoming conference and share automated calendar invites with participants.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full gap-2 border-stone-200 hover:bg-stone-50 text-stone-700">
                Schedule Meeting
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Profile & Account Details */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Account Info */}
          <Card className="border-stone-200/80 shadow-sm bg-white lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Account Overview</CardTitle>
                  <CardDescription>Your registered Samvad identity and session information</CardDescription>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Authenticated
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm divide-y divide-stone-100">
              <div className="flex justify-between items-center pt-2">
                <span className="text-stone-500 flex items-center gap-2">
                  <User className="w-4 h-4 text-stone-400" /> Full Name
                </span>
                <span className="font-medium text-stone-800">{user.name || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center pt-3">
                <span className="text-stone-500">Email Address</span>
                <span className="font-medium text-stone-800">{user.email}</span>
              </div>
              {preferences?.workspaceName && (
                <div className="flex justify-between items-center pt-3">
                  <span className="text-stone-500">Workspace</span>
                  <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                    {preferences.workspaceName}
                  </span>
                </div>
              )}
              {preferences?.primaryMode && (
                <div className="flex justify-between items-center pt-3">
                  <span className="text-stone-500">Primary Mode</span>
                  <span className="font-medium text-stone-800 capitalize">
                    {preferences.primaryMode === "isl"
                      ? "Indian Sign Language (ISL)"
                      : preferences.primaryMode === "captions"
                      ? "Live Captions / STT"
                      : "Audio / Voice"}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3">
                <span className="text-stone-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-stone-400" /> Member Since
                </span>
                <span className="font-medium text-stone-800">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : "Today"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3">
                <span className="text-stone-500">User ID</span>
                <span className="font-mono text-xs text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                  {user.id}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Accessibility Features */}
          <Card className="border-stone-200/80 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4 text-stone-500" />
                Accessibility Features
              </CardTitle>
              <CardDescription>Features enabled for your session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-stone-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-stone-700" />
                </div>
                <div>
                  <p className="font-medium text-stone-800">ISL Recognition</p>
                  <p className="text-stone-500 mt-0.5">AI tracks hands and translates gestures in real time.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-stone-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Volume2 className="w-3.5 h-3.5 text-stone-700" />
                </div>
                <div>
                  <p className="font-medium text-stone-800">Text-to-Speech & STT</p>
                  <p className="text-stone-500 mt-0.5">Dual translation between spoken audio and visual text.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
