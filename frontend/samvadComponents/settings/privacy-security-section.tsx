"use client";

import React, { useState } from "react";
import { Shield, Smartphone, Laptop, Clock, Lock, UserX, Cpu, Check, AlertCircle } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { SettingsState } from "./types";

interface PrivacySecuritySectionProps {
  settings: SettingsState;
  onUpdate: (updater: (prev: SettingsState) => SettingsState) => void;
}

export function PrivacySecuritySection({ settings, onUpdate }: PrivacySecuritySectionProps) {
  const [sessions, setSessions] = useState([
    { id: "s1", device: "MacBook Pro (Chrome)", location: "Mumbai, India", isCurrent: true, time: "Active now" },
    { id: "s2", device: "iPhone 15 Pro (Safari)", location: "Mumbai, India", isCurrent: false, time: "2 hours ago" },
  ]);

  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [newBlockedUser, setNewBlockedUser] = useState("");

  const handleRevokeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Session revoked", { description: "Device has been logged out." });
  };

  const handleAddBlockedUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockedUser.trim()) return;
    setBlockedUsers((prev) => [...prev, newBlockedUser.trim()]);
    setNewBlockedUser("");
    toast.info("User blocked", { description: "They will not be able to join your calls or message you." });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          Privacy & Security
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Review active login sessions, configure two-factor authentication, and control local neural privacy.
        </p>
      </div>

      {/* Active Sessions */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Active Sessions</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Devices currently logged into your Samvad account.</p>
        </div>

        <div className="space-y-2.5">
          {sessions.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0 text-stone-700 dark:text-stone-300">
                  {item.device.includes("Mac") ? <Laptop className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">{item.device}</p>
                    {item.isCurrent && (
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        Current Device
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    {item.location} • {item.time}
                  </p>
                </div>
              </div>

              {!item.isCurrent && (
                <button
                  type="button"
                  onClick={() => handleRevokeSession(item.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition-colors"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2FA & Encryption Toggles */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5 divide-y divide-stone-100 dark:divide-stone-800">
        {/* 2FA */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 mt-0.5 text-stone-700 dark:text-stone-300">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Two-Factor Authentication (2FA)</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Require an authenticator app code during sign-in.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onUpdate((prev) => {
                const nextVal = !prev.privacySecurity.twoFactorAuth;
                toast.success(`2FA ${nextVal ? "enabled" : "disabled"}`);
                return {
                  ...prev,
                  privacySecurity: { ...prev.privacySecurity, twoFactorAuth: nextVal },
                };
              });
            }}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              settings.privacySecurity.twoFactorAuth ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                settings.privacySecurity.twoFactorAuth ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* End-to-End Encryption */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 mt-0.5 text-stone-700 dark:text-stone-300">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">End-to-End Meeting Encryption</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Audio, video, and sign language landmark frames encrypted client-side.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onUpdate((prev) => {
                const nextVal = !prev.privacySecurity.endToEndEncryption;
                toast.success(`E2EE ${nextVal ? "enabled" : "disabled"}`);
                return {
                  ...prev,
                  privacySecurity: { ...prev.privacySecurity, endToEndEncryption: nextVal },
                };
              });
            }}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              settings.privacySecurity.endToEndEncryption ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                settings.privacySecurity.endToEndEncryption ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Local AI Processing */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 mt-0.5 text-stone-700 dark:text-stone-300">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">On-Device AI Processing (Private Mode)</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Run ISL gesture recognition directly in browser via WebAssembly without sending video to cloud.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onUpdate((prev) => {
                const nextVal = !prev.privacySecurity.localAiProcessing;
                toast.success(`On-device AI ${nextVal ? "enabled" : "disabled"}`);
                return {
                  ...prev,
                  privacySecurity: { ...prev.privacySecurity, localAiProcessing: nextVal },
                };
              });
            }}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              settings.privacySecurity.localAiProcessing ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                settings.privacySecurity.localAiProcessing ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Blocked Users */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Blocked Contacts</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Prevent specific email addresses from inviting you or joining your hosted rooms.</p>
        </div>

        <form onSubmit={handleAddBlockedUser} className="flex gap-2">
          <input
            type="email"
            value={newBlockedUser}
            onChange={(e) => setNewBlockedUser(e.target.value)}
            placeholder="Enter user email to block"
            className="flex-1 px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 dark:bg-white text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shrink-0"
          >
            Block
          </button>
        </form>

        {blockedUsers.length > 0 ? (
          <div className="space-y-1.5 pt-2">
            {blockedUsers.map((email, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-xs"
              >
                <span className="font-medium text-stone-700 dark:text-stone-300">{email}</span>
                <button
                  type="button"
                  onClick={() => {
                    setBlockedUsers((prev) => prev.filter((_, i) => i !== idx));
                    toast.success("User unblocked");
                  }}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic">No blocked users</p>
        )}
      </div>
    </div>
  );
}
