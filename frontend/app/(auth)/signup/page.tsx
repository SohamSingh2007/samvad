"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signUp, signIn, getAuthBaseURL } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle,
  Building2,
  Users,
  GraduationCap,
  Sparkles,
  Volume2,
  Subtitles,
  Hand
} from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { markLoggedIn } from "@/lib/session";

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Account Credentials
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: Workspace Information
  const [workspaceName, setWorkspaceName] = useState("");
  const [usageType, setUsageType] = useState<"personal" | "team" | "education">("personal");

  // Step 3: Accessibility Preferences
  const [primaryMode, setPrimaryMode] = useState<"isl" | "captions" | "voice">("isl");
  const [highContrast, setHighContrast] = useState(false);

  // Status & Loading
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Clear loading state when navigating back via bfcache or returning focus
  useEffect(() => {
    const handleReset = () => {
      setSocialLoading(null);
      setLoading(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleReset();
      }
    };

    window.addEventListener("pageshow", handleReset);
    window.addEventListener("focus", handleReset);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handleReset);
      window.removeEventListener("focus", handleReset);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim()) {
      const msg = "Please enter your first name.";
      setError(msg);
      toast.error("First name required", {
        description: msg,
        action: { label: "Fixing!" },
      });
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      const msg = "Please enter a valid email address.";
      setError(msg);
      toast.error("Invalid email", {
        description: msg,
        action: { label: "Fixing!" },
      });
      return;
    }
    if (password.length < 8) {
      const msg = "Password must be at least 8 characters long.";
      setError(msg);
      toast.error("Password too short", {
        description: msg,
        action: { label: "Fixing!" },
      });
      return;
    }
    if (password !== confirmPassword) {
      const msg = "Passwords do not match.";
      setError(msg);
      toast.error("Password mismatch", {
        description: msg,
        action: { label: "Fixing!" },
      });
      return;
    }

    if (!workspaceName) {
      setWorkspaceName(`${firstName}'s Workspace`);
    }

    setCurrentStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!workspaceName.trim()) {
      const msg = "Please enter a workspace name.";
      setError(msg);
      toast.error("Workspace required", {
        description: msg,
        action: { label: "Fixing!" },
      });
      return;
    }
    setCurrentStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const accessibilityPreferences = JSON.stringify({
      workspaceName: workspaceName.trim(),
      usageType,
      primaryMode,
      highContrast,
      completedOnboarding: true,
      registeredAt: new Date().toISOString(),
    });

    try {
      const res = await signUp.email({
        name: fullName || "Samvad User",
        email: email.trim(),
        password,
        accessibilityPreferences,
      } as any);

      if (res.error) {
        const msg = res.error.message || "An error occurred during account creation.";
        setError(msg);
        toast.error("Registration failed", {
          description: msg,
          action: { label: "Fixing!" },
        });
        setLoading(false);
      } else {
        markLoggedIn();
        if (typeof window !== "undefined") {
          sessionStorage.setItem("samvad_login_success", "true");
        }
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to connect to authentication server. Please try again.";
      setError(msg);
      toast.error("Connection error", {
        description: msg,
      });
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "github") => {
    try {
      setSocialLoading(provider);
      setError("");

      const apiBase =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
          ? "http://localhost:4000"
          : "https://samvad-api.qixolabs.com";

      const callbackURL = `${window.location.origin}/dashboard`;
      const errorCallbackURL = `${window.location.origin}/signup`;

      const response = await fetch(`${apiBase}/api/auth/sign-in/social`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          provider,
          callbackURL,
          errorCallbackURL,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to initiate ${provider} sign-in`);
      }

      const data = await response.json();
      if (data?.url) {
        markLoggedIn();
        if (typeof window !== "undefined") {
          sessionStorage.setItem("samvad_login_success", "true");
        }
        window.location.assign(data.url);
        return;
      }
      throw new Error("No authorization URL returned from server.");
    } catch (err: any) {
      console.error("Social signup error:", err);
      const msg = err?.message || `${provider} login is not configured yet. Please sign up with email.`;
      setError(msg);
      toast.error(`${provider === "google" ? "Google" : "GitHub"} sign-in`, {
        description: msg,
      });
      setSocialLoading(null);
    }
  };

  return (
    <div className="w-full min-h-screen lg:h-screen lg:max-h-screen bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 grid lg:grid-cols-2 lg:overflow-hidden transition-colors duration-200 bg-dot-grid">
      {/* Left Form Panel - Perfectly fitted to 100vh with zero scrolling */}
      <div className="flex flex-col justify-between px-6 py-4 sm:px-10 sm:py-5 lg:px-12 lg:py-6 xl:px-16 xl:py-7 min-h-screen lg:h-screen lg:max-h-screen overflow-y-auto lg:overflow-y-hidden w-full">
        {/* Top Header & Step Indicator - At top position, aligned with form boundaries */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto flex items-center justify-between pb-1">
          <Link
            href="/"
            className="inline-flex items-center group"
          >
            <Image
              src="/logo-light.svg"
              alt="Samvad"
              width={130}
              height={34}
              className="h-8 w-auto object-contain dark:hidden transition-opacity group-hover:opacity-80"
              priority
            />
            <Image
              src="/logo-dark.svg"
              alt="Samvad"
              width={130}
              height={34}
              className="h-8 w-auto object-contain hidden dark:block transition-opacity group-hover:opacity-80"
              priority
            />
          </Link>

          <div className="flex items-center gap-2.5">
            {/* Step Tracker Pills */}
            <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-full text-xs font-medium text-stone-600 dark:text-stone-300">
              <span className={`w-1.5 h-1.5 rounded-full ${currentStep >= 1 ? "bg-stone-950 dark:bg-white" : "bg-stone-300 dark:bg-stone-600"}`} />
              <span className={`w-1.5 h-1.5 rounded-full ${currentStep >= 2 ? "bg-stone-950 dark:bg-white" : "bg-stone-300 dark:bg-stone-600"}`} />
              <span className={`w-1.5 h-1.5 rounded-full ${currentStep === 3 ? "bg-stone-950 dark:bg-white" : "bg-stone-300 dark:bg-stone-600"}`} />
              <span className="ml-1 text-[11px] font-mono text-stone-500 dark:text-stone-400">Step {currentStep} of 3</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Centered Form Body */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto py-2 sm:py-4">
          {/* Error Notice */}
          {error && (
            <div className="p-2.5 mb-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200/80 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
              <p>{error}</p>
            </div>
          )}

          {/* STEP 1: Account Credentials */}
          {currentStep === 1 && (
            <div className="animate-in fade-in duration-200">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-950 dark:text-stone-100 mb-1">
                Create an account
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-3">
                Your work, your team, your flow — all in one place.
              </p>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                <button
                  type="button"
                  onClick={() => handleSocialSignIn("google")}
                  disabled={loading || !!socialLoading}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all shadow-sm cursor-pointer"
                >
                  {socialLoading === "google" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-500" />
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>Sign Up With Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialSignIn("github")}
                  disabled={loading || !!socialLoading}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all shadow-sm cursor-pointer"
                >
                  {socialLoading === "github" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-500" />
                  ) : (
                    <svg className="w-3.5 h-3.5 fill-current text-stone-900 dark:text-white" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  )}
                  <span>Sign Up With GitHub</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-stone-200 dark:border-stone-800 w-full" />
                <span className="bg-white dark:bg-stone-950 px-2.5 text-[11px] text-stone-400 dark:text-stone-500 font-medium">
                  Or
                </span>
              </div>

              {/* Compact 3-Row Form */}
              <form onSubmit={handleStep1Next} className="space-y-2.5">
                {/* Row 1: First Name & Last Name */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-stone-700 dark:text-stone-300">First Name</label>
                    <Input
                      placeholder="e.g. Soham"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-9 rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-400 text-xs shadow-sm dark:text-stone-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-stone-700 dark:text-stone-300">Last Name</label>
                    <Input
                      placeholder="e.g. Singh"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-9 rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-400 text-xs shadow-sm dark:text-stone-100"
                    />
                  </div>
                </div>

                {/* Row 2: Email */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-stone-700 dark:text-stone-300">Email address</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-400 text-xs shadow-sm dark:text-stone-100"
                  />
                </div>

                {/* Row 3: Password & Confirm Password side-by-side */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-stone-700 dark:text-stone-300">Password</label>
                    <div className="relative flex items-center">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimum 8 characters"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-9 rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-400 text-xs pr-9 shadow-sm dark:text-stone-100"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100/70 dark:hover:bg-stone-800 transition-colors cursor-pointer z-10"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-stone-700 dark:text-stone-300">Confirm</label>
                    <div className="relative flex items-center">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repeat password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-9 rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-400 text-xs pr-9 shadow-sm dark:text-stone-100"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100/70 dark:hover:bg-stone-800 transition-colors cursor-pointer z-10"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 rounded-lg bg-stone-950 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200 font-medium text-xs sm:text-sm transition-all shadow-md mt-1 cursor-pointer gap-1.5"
                >
                  Continue to Workspace <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
          )}

          {/* STEP 2: Workspace & Use Case */}
          {/* STEP 2: Workspace Setup */}
          {currentStep === 2 && (
            <div className="animate-in fade-in duration-200">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-950 dark:text-stone-100 mb-1">
                Set up your workspace
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-3">
                Personalize your workspace name and how you plan to use Samvad.
              </p>

              <form onSubmit={handleStep2Next} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-stone-700 dark:text-stone-300">
                    Workspace Name
                  </label>
                  <Input
                    placeholder="e.g. My Inclusive Team"
                    required
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="h-9 rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-400 text-xs shadow-sm dark:text-stone-100"
                  />
                </div>

                <div className="space-y-1.5 pt-0.5">
                  <label className="block text-[11px] font-medium text-stone-700 dark:text-stone-300">
                    How do you plan to use Samvad?
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {/* Personal */}
                    <div
                      onClick={() => setUsageType("personal")}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                        usageType === "personal"
                          ? "bg-stone-50 dark:bg-stone-900 border-stone-900 dark:border-stone-100 shadow-sm"
                          : "border-stone-200 dark:border-stone-800 hover:bg-stone-50/70 dark:hover:bg-stone-900/50"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                        usageType === "personal" ? "bg-stone-950 dark:bg-white text-white dark:text-stone-950" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                      }`}>
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 leading-tight">Personal & Friends</p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">Individual video calls and conversations</p>
                      </div>
                    </div>

                    {/* Team */}
                    <div
                      onClick={() => setUsageType("team")}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                        usageType === "team"
                          ? "bg-stone-50 dark:bg-stone-900 border-stone-900 dark:border-stone-100 shadow-sm"
                          : "border-stone-200 dark:border-stone-800 hover:bg-stone-50/70 dark:hover:bg-stone-900/50"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                        usageType === "team" ? "bg-stone-950 dark:bg-white text-white dark:text-stone-950" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                      }`}>
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 leading-tight">Workplace & Enterprise</p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">Professional collaboration and conferences</p>
                      </div>
                    </div>

                    {/* Education */}
                    <div
                      onClick={() => setUsageType("education")}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                        usageType === "education"
                          ? "bg-stone-50 dark:bg-stone-900 border-stone-900 dark:border-stone-100 shadow-sm"
                          : "border-stone-200 dark:border-stone-800 hover:bg-stone-50/70 dark:hover:bg-stone-900/50"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                        usageType === "education" ? "bg-stone-950 dark:bg-white text-white dark:text-stone-950" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                      }`}>
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 leading-tight">Education & Learning</p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">Students, teachers, and interpreters</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="h-10 rounded-lg border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 px-4 text-xs cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" /> Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-10 rounded-lg bg-stone-950 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200 font-medium text-xs sm:text-sm transition-all shadow-md gap-2 cursor-pointer"
                  >
                    Continue to Accessibility <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Accessibility Profile */}
          {currentStep === 3 && (
            <div className="animate-in fade-in duration-200">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-950 dark:text-stone-100 mb-1">
                Set up your profile
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-3">
                Choose your communication mode for AI gestures and live captions.
              </p>

              <form onSubmit={handleFinalSubmit} className="space-y-2.5">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-stone-700 dark:text-stone-300">
                    Primary Communication Preference
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {/* ISL */}
                    <div
                      onClick={() => setPrimaryMode("isl")}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                        primaryMode === "isl"
                          ? "bg-stone-50 dark:bg-stone-900 border-stone-900 dark:border-stone-100 shadow-sm"
                          : "border-stone-200 dark:border-stone-800 hover:bg-stone-50/70 dark:hover:bg-stone-900/50"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                        primaryMode === "isl" ? "bg-stone-950 dark:bg-white text-white dark:text-stone-950" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                      }`}>
                        <Hand className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 leading-tight">Sign Language (ISL)</p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">Camera tracks gestures and translates to voice</p>
                      </div>
                    </div>

                    {/* Captions */}
                    <div
                      onClick={() => setPrimaryMode("captions")}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                        primaryMode === "captions"
                          ? "bg-stone-50 dark:bg-stone-900 border-stone-900 dark:border-stone-100 shadow-sm"
                          : "border-stone-200 dark:border-stone-800 hover:bg-stone-50/70 dark:hover:bg-stone-900/50"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                        primaryMode === "captions" ? "bg-stone-950 dark:bg-white text-white dark:text-stone-950" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                      }`}>
                        <Subtitles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 leading-tight">Live Captions & Speech-to-Text</p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">Instant on-screen subtitles for speech</p>
                      </div>
                    </div>

                    {/* Voice */}
                    <div
                      onClick={() => setPrimaryMode("voice")}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                        primaryMode === "voice"
                          ? "bg-stone-50 dark:bg-stone-900 border-stone-900 dark:border-stone-100 shadow-sm"
                          : "border-stone-200 dark:border-stone-800 hover:bg-stone-50/70 dark:hover:bg-stone-900/50"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                        primaryMode === "voice" ? "bg-stone-950 dark:bg-white text-white dark:text-stone-950" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                      }`}>
                        <Volume2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 leading-tight">Voice & Audio Translation</p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">Read text messages aloud with voice synthesis</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* High Contrast Toggle */}
                <div
                  onClick={() => setHighContrast(!highContrast)}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900 transition-all"
                >
                  <div>
                    <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 leading-tight">High Contrast Captions</p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">Bold yellow & black subtitles for clarity</p>
                  </div>
                  <div className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center ${
                    highContrast ? "bg-stone-950 dark:bg-white justify-end" : "bg-stone-300 dark:bg-stone-700 justify-start"
                  }`}>
                    <div className="w-4 h-4 rounded-full bg-white dark:bg-stone-950 shadow-sm" />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    disabled={loading}
                    className="h-10 rounded-lg border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 px-4 text-xs cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" /> Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-10 rounded-lg bg-stone-950 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200 font-medium text-xs sm:text-sm transition-all shadow-md gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      <>
                        Complete Registration
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Switch to Login */}
          <div className="mt-3 text-center text-xs text-stone-500 dark:text-stone-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-stone-950 dark:text-white hover:underline">
              Log In
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-center gap-4 text-[11px] text-stone-400 dark:text-stone-500">
          <Link href="#" className="hover:text-stone-700 dark:hover:text-stone-300 transition-colors">Help</Link>
          <span>·</span>
          <Link href="#" className="hover:text-stone-700 dark:hover:text-stone-300 transition-colors">Terms</Link>
          <span>·</span>
          <Link href="#" className="hover:text-stone-700 dark:hover:text-stone-300 transition-colors">Privacy</Link>
        </div>
      </div>

      {/* Right Visual Panel - Full Viewport Height Architectural Garden */}
      <div className="hidden lg:relative lg:block bg-stone-950 overflow-hidden h-screen max-h-screen">
        <Image
          src="/image-auth3.png"
          alt="Samvad Visual Showcase"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
