"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Users,
  BarChart3,
  BookOpen,
  FileText,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
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
    { id: "users", label: "Users", icon: Users },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "performance", label: "Performance", icon: BarChart3 },
  ];

  const group2Items: {
    id: AdminTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: "guides", label: "Guides", icon: BookOpen },
    { id: "templates", label: "Templates", icon: FileText },
  ];

  return (
    <aside
      className={`relative flex flex-col shrink-0 bg-[#f4f3f0] dark:bg-[#1a1918] transition-all duration-300 select-none border-r border-stone-300/40 dark:border-stone-800/70 ${
        isCollapsed ? "w-16" : "w-56"
      }`}
    >
      {/* 1. Top Brand Logo Header with border line below & Theme Toggle */}
      <div
        className={`flex items-center border-b border-stone-300/40 dark:border-stone-800/70 transition-all duration-200 ${
          isCollapsed
            ? "justify-center py-3 px-0"
            : "justify-between py-2.5 px-3.5"
        }`}
      >
        <Link
          href="/admin"
          className="inline-flex items-center group transition-opacity hover:opacity-85"
          title="Samvad Admin"
        >
          {isCollapsed ? (
            <>
              <Image
                src="/only-hand.svg"
                alt="Samvad"
                width={26}
                height={26}
                className="w-6.5 h-6.5 object-contain dark:hidden"
                priority
              />
              <Image
                src="/only-hand-dark.svg"
                alt="Samvad"
                width={26}
                height={26}
                className="w-6.5 h-6.5 object-contain hidden dark:block"
                priority
              />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Image
                src="/logo-light.svg"
                alt="Samvad"
                width={108}
                height={28}
                className="h-6 w-auto object-contain dark:hidden"
                priority
              />
              <Image
                src="/logo-dark.svg"
                alt="Samvad"
                width={108}
                height={28}
                className="h-6 w-auto object-contain hidden dark:block"
                priority
              />
            </div>
          )}
        </Link>

        {/* Theme Toggle Button on the right side of the logo (expanded mode only) */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="w-8 h-8 aspect-square shrink-0 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 transition-all flex items-center justify-center cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* 2. Navigation Links List */}
      <div className="flex-1 px-2.5 pt-2.5 space-y-0.5 overflow-y-auto">
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
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] transition-all cursor-pointer ${
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
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] transition-all cursor-pointer ${
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

      {/* 4. Bottom Footer: Sidebar Toggle & Account Profile */}
      <div
        className={`${
          isCollapsed ? "p-2 px-1 flex flex-col items-center gap-1.5" : "p-2.5 space-y-1"
        }`}
      >
        {/* Theme Toggle Button (Collapsed mode: positioned above the expand button) */}
        {isCollapsed && (
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="w-8 h-8 aspect-square shrink-0 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 transition-all flex items-center justify-center cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Toggle Collapse / Expand Button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`transition-all cursor-pointer ${
            isCollapsed
              ? "w-8 h-8 aspect-square shrink-0 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 flex items-center justify-center"
              : "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 transition-colors"
          }`}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 shrink-0" />
          ) : (
            <PanelLeftClose className="w-4 h-4 shrink-0" />
          )}
          {!isCollapsed && (
            <span className="truncate">Collapse Sidebar</span>
          )}
        </button>

        {/* Divider before Account & Exit Button */}
        <div className="w-full pt-1 pb-1 px-1.5">
          <hr className="w-full border-t border-stone-300/80 dark:border-stone-700/80" />
        </div>

        {/* 3. Account Profile & Exit (Sign Out) */}
        <div
          className={`flex items-center pt-0.5 transition-all duration-200 ${
            isCollapsed
              ? "justify-center px-0"
              : "justify-between px-1"
          }`}
        >
          {!isCollapsed && (
            <div className="min-w-0 px-1">
              <h2 className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100 leading-tight truncate">
                Samvad
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight truncate font-normal">
                admin@samvad.com
              </p>
            </div>
          )}

          {/* Exit / Sign Out Button in place of collapse/expand logo */}
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              title="Sign out of Admin"
              className="w-8 h-8 aspect-square shrink-0 rounded-lg text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
