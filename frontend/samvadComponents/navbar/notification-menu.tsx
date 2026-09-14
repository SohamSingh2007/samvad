"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, Video, ShieldCheck, Sparkles, CheckCheck } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  type: "meeting" | "security" | "ai";
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "AI Recognition Active",
    description: "Real-time camera sign gestures and Indian Sign Language transcription are ready.",
    time: "Just now",
    unread: true,
    type: "ai",
  },
  {
    id: "2",
    title: "Encrypted Room Created",
    description: "Instant meeting ready. Share your room code with participants to connect.",
    time: "15m ago",
    unread: true,
    type: "meeting",
  },
  {
    id: "3",
    title: "Security Session Verified",
    description: "WebRTC peer-to-peer security tunnel established with verified credentials.",
    time: "1h ago",
    unread: false,
    type: "security",
  },
];

export function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
    );
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "ai":
        return <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case "meeting":
        return <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "security":
        return <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer select-none"
      >
        <Bell className="w-5 h-5 stroke-[1.8]" />
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold bg-[#7075f7]/10 text-[#7075f7] dark:bg-[#7075f7]/20 dark:text-[#a0a3fa] rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="py-2 space-y-1 max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-stone-400 dark:text-stone-500">
                <Bell className="w-7 h-7 mx-auto mb-2 stroke-[1.5] opacity-50" />
                <p className="text-xs font-medium">No notifications right now</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleRead(item.id)}
                  className={`p-2.5 rounded-2xl transition-all cursor-pointer flex items-start gap-3 ${
                    item.unread
                      ? "bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800"
                      : "hover:bg-stone-50 dark:hover:bg-stone-800/40 opacity-75 hover:opacity-100"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-stone-400 shrink-0 font-mono">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug line-clamp-2 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  {item.unread && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7075f7] shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <span className="text-[11px] text-stone-400">
                {notifications.length} total
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-stone-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear all</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
