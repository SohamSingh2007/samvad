"use client";

import React from "react";
import { Video, Calendar, MessageSquare, FileText } from "lucide-react";

export type DashboardTab = "meetings" | "calendar" | "chat" | "notes";

export interface DashboardNavRailProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  meetingCount?: number;
  className?: string;
}

export function DashboardNavRail({
  activeTab,
  onTabChange,
  meetingCount,
  className = "",
}: DashboardNavRailProps) {
  return (
    <div
      className={`select-none shrink-0 flex flex-col items-center gap-6 sm:gap-7 ${className}`}
      aria-label="Dashboard Switcher"
    >
      {/* Item 1: Meetings */}
      <button
        type="button"
        onClick={() => onTabChange("meetings")}
        className="flex flex-col items-center gap-1 cursor-pointer group focus:outline-hidden"
        title="Meetings"
      >
        <div
          className={`w-14 h-8 sm:w-16 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-200 relative ${
            activeTab === "meetings"
              ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] shadow-xs"
              : "bg-transparent text-[#444746] dark:text-stone-400 group-hover:bg-stone-100 dark:group-hover:bg-stone-800"
          }`}
        >
          <Video
            className={`w-5 h-5 transition-transform duration-200 ${
              activeTab === "meetings" ? "stroke-[2.2]" : "stroke-[1.8] group-hover:scale-110"
            }`}
          />
          {typeof meetingCount === "number" && meetingCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold bg-[#7075f7] text-white rounded-full leading-tight">
              {meetingCount > 9 ? "9+" : meetingCount}
            </span>
          )}
        </div>
        <span
          className={`text-xs tracking-tight transition-colors ${
            activeTab === "meetings"
              ? "font-semibold text-[#001d35] dark:text-[#c2e7ff]"
              : "font-medium text-[#444746] dark:text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200"
          }`}
        >
          Meetings
        </span>
      </button>

      {/* Item 2: Calendar */}
      <button
        type="button"
        onClick={() => onTabChange("calendar")}
        className="flex flex-col items-center gap-1 cursor-pointer group focus:outline-hidden"
        title="Calendar"
      >
        <div
          className={`w-14 h-8 sm:w-16 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
            activeTab === "calendar"
              ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] shadow-xs"
              : "bg-transparent text-[#444746] dark:text-stone-400 group-hover:bg-stone-100 dark:group-hover:bg-stone-800"
          }`}
        >
          <Calendar
            className={`w-5 h-5 transition-transform duration-200 ${
              activeTab === "calendar" ? "stroke-[2.2]" : "stroke-[1.8] group-hover:scale-110"
            }`}
          />
        </div>
        <span
          className={`text-xs tracking-tight transition-colors ${
            activeTab === "calendar"
              ? "font-semibold text-[#001d35] dark:text-[#c2e7ff]"
              : "font-medium text-[#444746] dark:text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200"
          }`}
        >
          Calendar
        </span>
      </button>

      {/* Item 3: Chat */}
      <button
        type="button"
        onClick={() => onTabChange("chat")}
        className="flex flex-col items-center gap-1 cursor-pointer group focus:outline-hidden"
        title="Chat"
      >
        <div
          className={`w-14 h-8 sm:w-16 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
            activeTab === "chat"
              ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] shadow-xs"
              : "bg-transparent text-[#444746] dark:text-stone-400 group-hover:bg-stone-100 dark:group-hover:bg-stone-800"
          }`}
        >
          <MessageSquare
            className={`w-5 h-5 transition-transform duration-200 ${
              activeTab === "chat" ? "stroke-[2.2]" : "stroke-[1.8] group-hover:scale-110"
            }`}
          />
        </div>
        <span
          className={`text-xs tracking-tight transition-colors ${
            activeTab === "chat"
              ? "font-semibold text-[#001d35] dark:text-[#c2e7ff]"
              : "font-medium text-[#444746] dark:text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200"
          }`}
        >
          Chat
        </span>
      </button>

      {/* Item 4: Notes */}
      <button
        type="button"
        onClick={() => onTabChange("notes")}
        className="flex flex-col items-center gap-1 cursor-pointer group focus:outline-hidden"
        title="Notes"
      >
        <div
          className={`w-14 h-8 sm:w-16 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
            activeTab === "notes"
              ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] shadow-xs"
              : "bg-transparent text-[#444746] dark:text-stone-400 group-hover:bg-stone-100 dark:group-hover:bg-stone-800"
          }`}
        >
          <FileText
            className={`w-5 h-5 transition-transform duration-200 ${
              activeTab === "notes" ? "stroke-[2.2]" : "stroke-[1.8] group-hover:scale-110"
            }`}
          />
        </div>
        <span
          className={`text-xs tracking-tight transition-colors ${
            activeTab === "notes"
              ? "font-semibold text-[#001d35] dark:text-[#c2e7ff]"
              : "font-medium text-[#444746] dark:text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200"
          }`}
        >
          Notes
        </span>
      </button>
    </div>
  );
}
