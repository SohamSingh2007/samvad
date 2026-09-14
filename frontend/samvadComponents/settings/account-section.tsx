"use client";

import React, { useState } from "react";
import Image from "next/image";
import { User, Mail, Lock, Upload, Trash2, ShieldCheck, Check } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { SettingsState } from "./types";

interface AccountSectionProps {
  settings: SettingsState;
  onUpdate: (updater: (prev: SettingsState) => SettingsState) => void;
}

export function AccountSection({ settings, onUpdate }: AccountSectionProps) {
  const [name, setName] = useState(settings.account.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning("Name cannot be empty", { description: "Please enter your full name." });
      return;
    }
    onUpdate((prev) => ({
      ...prev,
      account: { ...prev.account, name: name.trim() },
    }));
    toast.success("Profile updated", {
      description: "Your display name has been saved.",
      action: { label: "Got It!" },
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Current password required", { description: "Enter your current password to continue." });
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password too short", { description: "New password must be at least 8 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match", { description: "Please ensure both password fields match." });
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsChangingPassword(false);
    toast.success("Password changed", {
      description: "Your password has been updated securely.",
      action: { label: "Got It!" },
    });
  };

  const initials = (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

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

      {/* Profile Photo */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Profile Photo</h3>
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-500 text-white flex items-center justify-center font-bold text-2xl shadow-md overflow-hidden ring-4 ring-stone-100 dark:ring-stone-800">
            {settings.account.image ? (
              <Image
                src={settings.account.image}
                alt={name}
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
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <label className="px-4 py-2 rounded-full text-xs font-semibold bg-stone-900 dark:bg-white text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-3.5 h-3.5" />
                Upload new photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      onUpdate((prev) => ({
                        ...prev,
                        account: { ...prev.account, image: url },
                      }));
                      toast.success("Profile photo updated");
                    }
                  }}
                />
              </label>
              {settings.account.image && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdate((prev) => ({
                      ...prev,
                      account: { ...prev.account, image: null },
                    }));
                    toast.info("Profile photo removed");
                  }}
                  className="px-3.5 py-2 rounded-full text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition-colors inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
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
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-stone-900 dark:bg-white text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shrink-0"
              >
                Save
              </button>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Email Address</label>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                disabled
                value={settings.account.email}
                className="w-full pl-9 pr-3 py-2 bg-stone-100 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 rounded-xl text-xs sm:text-sm text-stone-500 cursor-not-allowed"
              />
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
          <button
            type="button"
            onClick={() => setIsChangingPassword(!isChangingPassword)}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
          >
            {isChangingPassword ? "Cancel" : "Change password"}
          </button>
        </div>

        {isChangingPassword && (
          <form onSubmit={handleChangePassword} className="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800 animate-in fade-in duration-200">
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-stone-900 dark:bg-white text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
              >
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
