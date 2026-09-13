"use client";

import React from "react";
import { Mic, Video, Clock, Bell, Check } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { SettingsState } from "./types";

interface MeetingSectionProps {
  settings: SettingsState;
  onUpdate: (updater: (prev: SettingsState) => SettingsState) => void;
}

export function MeetingSection({ settings, onUpdate }: MeetingSectionProps) {
  const handleToggle = (key: keyof SettingsState["meeting"], label: string) => {
    onUpdate((prev) => {
      const nextVal = !prev.meeting[key];
      toast.success(`${label} ${nextVal ? "enabled" : "disabled"}`);
      return {
        ...prev,
        meeting: { ...prev.meeting, [key]: nextVal },
      };
    });
  };

  const handleReminderChange = (val: SettingsState["meeting"]["meetingReminders"]) => {
    onUpdate((prev) => ({
      ...prev,
      meeting: { ...prev.meeting, meetingReminders: val },
    }));
    toast.success(`Meeting reminder set to ${val === "none" ? "off" : val + " before"}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          Meeting Preferences
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Control default hardware states upon entering a call and scheduled meeting reminders.
        </p>
      </div>

      {/* Default Call Entry States */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5 divide-y divide-stone-100 dark:divide-stone-800">
        {/* Join with Mic Muted */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 mt-0.5 text-stone-700 dark:text-stone-300">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Always Mute Microphone on Join</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Prevent accidental background noise when entering busy meetings.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("defaultMicMuted", "Mute on join")}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              settings.meeting.defaultMicMuted ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                settings.meeting.defaultMicMuted ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Join with Camera Off */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 mt-0.5 text-stone-700 dark:text-stone-300">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Always Turn Camera Off on Join</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Join call with camera disabled until manually activated.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("defaultCamOff", "Camera off on join")}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              settings.meeting.defaultCamOff ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                settings.meeting.defaultCamOff ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Quick Join Confirmation Prompts */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 mt-0.5 text-stone-700 dark:text-stone-300">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Green Room Pre-Join Check</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Display camera self-preview and audio test screen before entering the room.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("joinWithVideo", "Pre-join check")}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              settings.meeting.joinWithVideo ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                settings.meeting.joinWithVideo ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Meeting Reminders */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-stone-500" />
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Upcoming Meeting Alerts</h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Receive notification pings before scheduled calendar sessions start.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: "none", label: "Off" },
            { id: "5m", label: "5 mins before" },
            { id: "10m", label: "10 mins before" },
            { id: "15m", label: "15 mins before" },
          ].map((item) => {
            const isSelected = settings.meeting.meetingReminders === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleReminderChange(item.id as any)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-semibold shadow-xs"
                    : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                }`}
              >
                <span className="text-xs sm:text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
