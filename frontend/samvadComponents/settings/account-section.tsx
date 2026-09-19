"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Lock, 
  Upload, 
  Trash2, 
  ShieldCheck, 
  Check, 
  Clock, 
  Settings as SettingsIcon, 
  Sparkles, 
  Volume2, 
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { authClient, useSession } from "@/lib/auth-client";
import { SettingsState } from "./types";

interface AccountSectionProps {
  settings: SettingsState;
  onUpdate: (updater: (prev: SettingsState) => SettingsState) => void;
}

/**
 * Resizes and center-crops an uploaded image to a square JPEG data URL (~30-50KB)
 * for snappy network transmission and direct persistence in the user record.
 */
async function resizeImageToDataUrl(file: File, maxSize = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const { width, height } = img;

        const size = Math.min(width, height);
        const startX = (width - size) / 2;
        const startY = (height - size) / 2;

        const targetSize = Math.min(size, maxSize);
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, startX, startY, size, size, 0, 0, targetSize, targetSize);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to decode image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function AccountSection({ settings, onUpdate }: AccountSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  const [name, setName] = useState(user?.name || settings.account.name || "");
  const [isSavingName, setIsSavingName] = useState(false);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    } else if (settings.account.name) {
      setName(settings.account.name);
    }
  }, [user?.name, settings.account.name]);

  const displayName = name || user?.name || settings.account.name || "User";
  const displayEmail = user?.email || settings.account.email || "";
  const currentImage = user?.image || settings.account.image || null;

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

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recently";

  const isNameChanged =
    name.trim() !== (user?.name || settings.account.name || "").trim() &&
    name.trim().length > 0;

  // 1. Handle saving Display Name to Better Auth backend
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      toast.warning("Name cannot be empty", { description: "Please enter your full name." });
      return;
    }

    setIsSavingName(true);
    try {
      const res = await authClient.updateUser({
        name: cleanName,
      });

      if (res.error) {
        toast.error("Failed to update name", {
          description: res.error.message || "Please try again.",
        });
      } else {
        onUpdate((prev) => ({
          ...prev,
          account: { ...prev.account, name: cleanName },
        }));
        toast.success("Profile updated", {
          description: "Your display name has been saved.",
          action: { label: "Got It!" },
        });
        router.refresh();
      }
    } catch (err: any) {
      toast.error("Failed to update name", {
        description: err?.message || "Please try again.",
      });
    } finally {
      setIsSavingName(false);
    }
  };

  // 2. Handle uploading new profile photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please select an image smaller than 5MB.",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file format", {
        description: "Please upload an image file (JPG, PNG, or WEBP).",
      });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      const res = await authClient.updateUser({
        image: dataUrl,
      });

      if (res.error) {
        toast.error("Failed to upload photo", {
          description: res.error.message || "Please try again.",
        });
      } else {
        onUpdate((prev) => ({
          ...prev,
          account: { ...prev.account, image: dataUrl },
        }));
        toast.success("Profile photo updated successfully!");
        router.refresh();
      }
    } catch (err: any) {
      toast.error("Error processing photo", {
        description: err?.message || "Please choose a different photo.",
      });
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = "";
    }
  };

  // 3. Handle removing profile photo
  const handleRemovePhoto = async () => {
    setIsRemovingPhoto(true);
    try {
      const res = await authClient.updateUser({
        image: "",
      });

      if (res.error) {
        toast.error("Failed to remove photo", {
          description: res.error.message || "Please try again.",
        });
      } else {
        onUpdate((prev) => ({
          ...prev,
          account: { ...prev.account, image: null },
        }));
        toast.info("Profile photo removed");
        router.refresh();
      }
    } catch (err: any) {
      toast.error("Failed to remove photo", {
        description: err?.message || "Please try again.",
      });
    } finally {
      setIsRemovingPhoto(false);
    }
  };

  // 4. Handle changing password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      if (res.error) {
        const errMsg = res.error.message || "";
        // Check if user has no password set (social login)
        if (
          errMsg.toLowerCase().includes("no password") ||
          errMsg.toLowerCase().includes("does not have a password") ||
          errMsg.toLowerCase().includes("set a password")
        ) {
          const setRes = await (authClient as any).setPassword({
            newPassword,
          });
          if (setRes.error) {
            setPasswordError(setRes.error.message || "Failed to set password.");
            toast.error("Failed to set password", { description: setRes.error.message });
            return;
          }
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setIsChangingPassword(false);
          setPasswordError(null);
          toast.success("Password created successfully!", {
            description: "Your account is now secured with a password.",
            action: { label: "Got It!" },
          });
          return;
        }

        setPasswordError(errMsg || "Incorrect current password. Please try again.");
        toast.error("Password change failed", {
          description: errMsg || "Incorrect current password.",
        });
      } else {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsChangingPassword(false);
        setPasswordError(null);
        toast.success("Password changed successfully", {
          description: "Your password has been updated securely.",
          action: { label: "Got It!" },
        });
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to update password. Please try again.";
      setPasswordError(msg);
      toast.error("Failed to update password", { description: msg });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const initials = (name || user?.name || "U")
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2) || "SS";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          Account Settings
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Manage your personal details, profile photo, email address, and security credentials.
        </p>
      </div>

      {/* Overview Grid: Account Overview & Accessibility Features */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Account Info */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Account Overview</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Your registered Samvad identity and session information
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              Authenticated
            </div>
          </div>

          <div className="space-y-4 text-sm divide-y divide-stone-100 dark:divide-stone-800 pt-2">
            <div className="flex justify-between items-center pt-3">
              <span className="text-stone-500 dark:text-stone-400 flex items-center gap-2">
                <User className="w-4 h-4 text-stone-400 dark:text-stone-500" /> Full Name
              </span>
              <span className="font-medium text-stone-800 dark:text-stone-100">{displayName}</span>
            </div>
            <div className="flex justify-between items-center pt-3">
              <span className="text-stone-500 dark:text-stone-400 flex items-center gap-2">
                <Mail className="w-4 h-4 text-stone-400 dark:text-stone-500" /> Email Address
              </span>
              <span className="font-medium text-stone-800 dark:text-stone-100">{displayEmail}</span>
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
              <span className="font-medium text-stone-800 dark:text-stone-100">{memberSince}</span>
            </div>
          </div>
        </div>

        {/* Quick Accessibility Features */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                Accessibility Features
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Features enabled for your session</p>
            </div>

            <div className="space-y-3 pt-4 text-xs">
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700 flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
                </div>
                <div>
                  <p className="font-medium text-stone-800 dark:text-stone-100">ISL Recognition</p>
                  <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                    AI tracks hands and translates gestures in real time.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700 flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Volume2 className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
                </div>
                <div>
                  <p className="font-medium text-stone-800 dark:text-stone-100">Text-to-Speech & STT</p>
                  <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                    Dual translation between spoken audio and visual text.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-stone-100 dark:border-stone-800">
            <Link
              href="/settings/access"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Manage accessibility settings</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Profile Photo */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Profile Photo</h3>
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-500 text-white flex items-center justify-center font-bold text-2xl shadow-md overflow-hidden ring-4 ring-stone-100 dark:ring-stone-800 shrink-0">
            {currentImage ? (
              <Image
                src={currentImage}
                alt={displayName}
                width={80}
                height={80}
                unoptimized
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start items-center">
              <label className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 dark:bg-white text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-2 active:scale-98">
                {isUploadingPhoto ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload new photo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={isUploadingPhoto || isRemovingPhoto}
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>

              {currentImage && (
                <button
                  type="button"
                  disabled={isUploadingPhoto || isRemovingPhoto}
                  onClick={handleRemovePhoto}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isRemovingPhoto ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Remove</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-stone-400">Recommended: Square JPG, PNG or WEBP, max 5MB.</p>
          </div>
        </div>
      </div>

      {/* Name & Email Details */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Personal Information</h3>

        <form onSubmit={handleSaveName} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Display Name</label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className={`w-full pl-9 ${isNameChanged ? "pr-24" : "pr-3"} py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600 transition-all`}
              />
              {isNameChanged && (
                <button
                  type="submit"
                  disabled={isSavingName}
                  className="absolute inset-y-1.5 right-1.5 px-4 rounded-lg text-xs font-semibold bg-stone-900 dark:bg-white text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-stone-200 transition-all flex items-center gap-1.5 justify-center cursor-pointer shadow-xs animate-in fade-in zoom-in-95 duration-150 disabled:opacity-60"
                >
                  {isSavingName ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                disabled
                value={displayEmail}
                className="w-full pl-9 pr-24 py-2.5 bg-stone-100 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 rounded-xl text-xs sm:text-sm text-stone-500 dark:text-stone-400 cursor-not-allowed select-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Security & Password</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Change your password to keep your account safe.</p>
          </div>
          {!isChangingPassword && (
            <button
              type="button"
              onClick={() => {
                setIsChangingPassword(true);
                setPasswordError(null);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer active:scale-98"
            >
              Change password
            </button>
          )}
        </div>

        {isChangingPassword && (
          <form onSubmit={handleChangePassword} className="space-y-4 pt-4 border-t border-stone-100 dark:border-stone-800 animate-in fade-in duration-200">
            {passwordError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Current Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="Enter current password"
                  className="w-full pl-9 pr-10 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300">New Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="Min 8 characters"
                    className="w-full pl-9 pr-10 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Confirm Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-10 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isSubmittingPassword}
                onClick={() => {
                  setIsChangingPassword(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPassword}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-stone-900 dark:bg-white text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors cursor-pointer shadow-xs flex items-center gap-2 disabled:opacity-60"
              >
                {isSubmittingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
