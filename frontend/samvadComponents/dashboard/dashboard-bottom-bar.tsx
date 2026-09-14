"use client";

import React from "react";
import { Video, Calendar, MessageSquare, FileText } from "lucide-react";
import { DashboardTab } from "./dashboard-nav-rail";
import { ProfileMenu } from "@/samvadComponents/navbar/profile-menu";

export interface DashboardBottomBarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  meetingCount?: number;
  user?: any;
}

export function DashboardBottomBar({
  activeTab,
  onTabChange,
  meetingCount,
  user,
}: DashboardBottomBarProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200/80 dark:border-stone-800 py-2.5 px-3 sm:px-6 flex items-center justify-around shadow-lg transition-colors select-none"
      aria-label="Mobile Bottom Navigation"
    >
      {/* 1. Meetings */}
      <button
        type="button"
        onClick={() => onTabChange("meetings")}
        className="flex flex-col items-center gap-1 cursor-pointer focus:outline-hidden group"
      >
        <div
          className={`w-12 h-7 sm:w-14 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-200 relative ${
            activeTab === "meetings"
              ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
              : "bg-transparent text-[#444746] dark:text-stone-400 group-hover:bg-stone-100 dark:group-hover:bg-stone-800"
          }`}
        >
          <Video
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${
              activeTab === "meetings" ? "stroke-[2.2]" : "stroke-[1.8]"
            }`}
          />
          {typeof meetingCount === "number" && meetingCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[9px] font-bold bg-[#7075f7] text-white rounded-full leading-tight">
              {meetingCount > 9 ? "9+" : meetingCount}
            </span>
          )}
        </div>
        <span
          className={`text-[11px] sm:text-xs tracking-tight ${
            activeTab === "meetings"
              ? "font-semibold text-[#001d35] dark:text-[#c2e7ff]"
              : "font-medium text-[#444746] dark:text-stone-400"
          }`}
        >
          Meetings
        </span>
      </button>

      {/* 2. Calendar */}
      <button
        type="button"
        onClick={() => onTabChange("calendar")}
        className="flex flex-col items-center gap-1 cursor-pointer focus:outline-hidden group"
      >
        <div
          className={`w-12 h-7 sm:w-14 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
            activeTab === "calendar"
              ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
              : "bg-transparent text-[#444746] dark:text-stone-400 group-hover:bg-stone-100 dark:group-hover:bg-stone-800"
          }`}
        >
          <Calendar
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${
              activeTab === "calendar" ? "stroke-[2.2]" : "stroke-[1.8]"
            }`}
          />
        </div>
        <span
          className={`text-[11px] sm:text-xs tracking-tight ${
            activeTab === "calendar"
              ? "font-semibold text-[#001d35] dark:text-[#c2e7ff]"
              : "font-medium text-[#444746] dark:text-stone-400"
          }`}
        >
          Calendar
        </span>
      </button>

      {/* 3. Chat */}
      <button
        type="button"
        onClick={() => onTabChange("chat")}
        className="flex flex-col items-center gap-1 cursor-pointer focus:outline-hidden group"
      >
        <div
          className={`w-12 h-7 sm:w-14 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
            activeTab === "chat"
              ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
              : "bg-transparent text-[#444746] dark:text-stone-400 group-hover:bg-stone-100 dark:group-hover:bg-stone-800"
          }`}
        >
          <MessageSquare
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${
              activeTab === "chat" ? "stroke-[2.2]" : "stroke-[1.8]"
            }`}
          />
        </div>
        <span
          className={`text-[11px] sm:text-xs tracking-tight ${
            activeTab === "chat"
              ? "font-semibold text-[#001d35] dark:text-[#c2e7ff]"
              : "font-medium text-[#444746] dark:text-stone-400"
          }`}
        >
          Chat
        </span>
      </button>

      {/* 4. Notes */}
      <button
        type="button"
        onClick={() => onTabChange("notes")}
        className="flex flex-col items-center gap-1 cursor-pointer focus:outline-hidden group"
      >
        <div
          className={`w-12 h-7 sm:w-14 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
            activeTab === "notes"
              ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
              : "bg-transparent text-[#444746] dark:text-stone-400 group-hover:bg-stone-100 dark:group-hover:bg-stone-800"
          }`}
        >
          <FileText
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${
              activeTab === "notes" ? "stroke-[2.2]" : "stroke-[1.8]"
            }`}
          />
        </div>
        <span
          className={`text-[11px] sm:text-xs tracking-tight ${
            activeTab === "notes"
              ? "font-semibold text-[#001d35] dark:text-[#c2e7ff]"
              : "font-medium text-[#444746] dark:text-stone-400"
          }`}
        >
          Notes
        </span>
      </button>

      {/* 5. Profile */}
      <div className="flex flex-col items-center">
        <ProfileMenu user={user} direction="up" showLabel />
      </div>
    </nav>
  );
}
