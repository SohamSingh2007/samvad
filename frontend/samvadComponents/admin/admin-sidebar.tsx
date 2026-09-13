"use client";

import React from "react";
import Link from "next/link";
import {
  Home,
  BarChart3,
  MessageSquareMore,
  BookOpen,
  Radio,
  FileText,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  ArrowLeft,
  Settings,
  Sun,
  Moon,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";
import { AdminTabId } from "./types";

export interface AdminSidebarProps {
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSearch: () => void;
  onSignOut?: () => void;
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  onSignOut,
}: AdminSidebarProps) {
  const { theme, setTheme } = useTheme();

  const group1Items: { id: AdminTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "performance", label: "Performance", icon: BarChart3 },
    { id: "conversations", label: "Conversations", icon: MessageSquareMore },
  ];

  const group2Items: {
    id: AdminTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: "guides", label: "Guides", icon: BookOpen },
    { id: "hotspots", label: "Hotspots", icon: Radio },
    { id: "templates", label: "Templates", icon: FileText, badge: "10" },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
  ];

  return (
    <aside
      className={`relative flex flex-col shrink-0 bg-[#f4f3f0] dark:bg-[#1a1918] transition-all duration-300 select-none border-r border-stone-300/40 dark:border-stone-800/70 ${
        isCollapsed ? "w-18" : "w-64 sm:w-70"
      }`}
    >
      {/* 1. Header: Brand Logo & Title & Collapse Toggle */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Black Squircle Brand Icon */}
          <div className="w-9 h-9 rounded-xl bg-black dark:bg-stone-900 border border-stone-800/40 dark:border-stone-700/60 text-white flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden">
            {/* Custom stylized Iris/Spiral Icon matching reference */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-white"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
              <path d="M7 12a5 5 0 0 0 10 0" />
            </svg>
          </div>

          {!isCollapsed && (
            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100 leading-tight truncate">
                Samvad
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight truncate font-normal">
                admin@samvad.com
              </p>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button [|] */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 transition-colors cursor-pointer shrink-0"
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* 2. Navigation Links List */}
      <div className="flex-1 px-3 pt-1 space-y-1 overflow-y-auto">
        {/* Group 1 */}
        {group1Items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              title={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all cursor-pointer ${
                isCollapsed ? "justify-center px-0" : ""
              } ${
                isActive
                  ? "bg-white dark:bg-stone-800/95 text-stone-900 dark:text-white font-medium shadow-xs shadow-black/[0.03]"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 font-normal"
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] shrink-0 stroke-[1.9] ${
                  isActive ? "text-stone-900 dark:text-white" : "text-stone-500 dark:text-stone-400"
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}

        {/* Subtle Divider Line */}
        <div className="pt-2 pb-1">
          <hr className="border-t border-stone-300/60 dark:border-stone-800" />
        </div>

        {/* Group 2 */}
        {group2Items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              title={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all cursor-pointer ${
                isCollapsed ? "justify-center px-0" : ""
              } ${
                isActive
                  ? "bg-white dark:bg-stone-800/95 text-stone-900 dark:text-white font-medium shadow-xs shadow-black/[0.03]"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 font-normal"
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] shrink-0 stroke-[1.9] ${
                  isActive ? "text-stone-900 dark:text-white" : "text-stone-500 dark:text-stone-400"
                }`}
              />
              {!isCollapsed && (
                <>
                  <span className="truncate flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#c25e2e] text-white shrink-0 shadow-2xs leading-none">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Bottom Footer: Return Links & Theme Toggle */}
      <div className="p-3 border-t border-stone-300/40 dark:border-stone-800/60 space-y-1">
        {/* Return to Main App */}
        <Link
          href="/dashboard"
          title="Back to User Dashboard"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/40 dark:hover:bg-stone-800/40 transition-colors ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="truncate">Meeting Dashboard</span>}
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          title="User Settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/40 dark:hover:bg-stone-800/40 transition-colors ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="truncate">System Settings</span>}
        </Link>

        {/* Admin Sign Out */}
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            title="Sign out of Admin"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer ${
              isCollapsed ? "justify-center px-0" : ""
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate font-medium">Sign Out Admin</span>}
          </button>
        )}

        {/* Theme Toggle & Role Badge */}
        <div
          className={`pt-2 flex items-center ${
            isCollapsed ? "justify-center" : "justify-between px-2"
          }`}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Admin Mode
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 transition-colors cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
