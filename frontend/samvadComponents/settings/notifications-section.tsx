"use client";

import React from "react";
import { Bell, Mail, MessageSquare, Sparkles } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { SettingsState } from "./types";

interface NotificationsSectionProps {
  settings: SettingsState;
  onUpdate: (updater: (prev: SettingsState) => SettingsState) => void;
}

export function NotificationsSection({ settings, onUpdate }: NotificationsSectionProps) {
  const handleToggle = (key: keyof SettingsState["notifications"], label: string) => {
    onUpdate((prev) => {
      const nextVal = !prev.notifications[key];
      toast.success(`${label} ${nextVal ? "enabled" : "disabled"}`);
      return {
        ...prev,
        notifications: { ...prev.notifications, [key]: nextVal },
      };
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          Notifications & Alerts
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Customize desktop and email notifications for meeting invites, reminders, chat, and AI summaries.
        </p>
      </div>

      {/* Notification items */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5 divide-y divide-stone-100 dark:divide-stone-800">
        {/* Meeting Invitations */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 mt-0.5 text-stone-700 dark:text-stone-300">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Meeting Invitations</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Receive email and push alerts when team members invite you to a call.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("meetingInvitations", "Invitations")}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              settings.notifications.meetingInvitations ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                settings.notifications.meetingInvitations ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Meeting Reminders */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 mt-0.5 text-stone-700 dark:text-stone-300">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Meeting Reminders</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Get pop-up reminders before upcoming scheduled video conferences.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("meetingReminders", "Reminders")}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              settings.notifications.meetingReminders ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                settings.notifications.meetingReminders ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 mt-0.5 text-stone-700 dark:text-stone-300">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">In-Meeting Chat & Notes</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Audio chime and banner alert when participants send text notes in calls.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("chatMessages", "Chat alerts")}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              settings.notifications.chatMessages ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                settings.notifications.chatMessages ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Feedback & Recaps */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 mt-0.5 text-stone-700 dark:text-stone-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">AI Recaps & Feedback Notifications</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Receive automated post-meeting ISL transcription summaries and action items.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("feedbackRecaps", "Recap alerts")}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              settings.notifications.feedbackRecaps ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                settings.notifications.feedbackRecaps ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
