"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import {
  MessageSquare,
  Star,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Check,
  AlertCircle,
  ThumbsUp,
  Sparkles,
  Download,
  RefreshCw,
  Trash2,
  ExternalLink,
  ChevronDown,
  Copy,
  Layers,
  X,
  Eye,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { UserFeedbackItem, FeedbackStats } from "../types";

function getAvatarBg(email?: string | null): string {
  if (!email) return "from-stone-600 to-stone-800";
  const colors = [
    "from-blue-600 to-indigo-700",
    "from-emerald-600 to-teal-700",
    "from-amber-600 to-orange-700",
    "from-purple-600 to-indigo-800",
    "from-rose-600 to-pink-700",
    "from-cyan-600 to-blue-700",
    "from-violet-600 to-purple-800",
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name?: string | null): string {
  if (!name || name.trim() === "") return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatFeedbackDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return "Just now";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return String(dateStr);
  }
}

export function FeedbackTab() {
  const [feedbacks, setFeedbacks] = useState<UserFeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    totalFeedback: 0,
    averageRating: 5.0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    categoryCounts: {},
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Connecting...");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedRating, setSelectedRating] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");

  // Selection & Modals
  const [selectedFeedback, setSelectedFeedback] = useState<UserFeedbackItem | null>(null);
  // Status update state
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFeedbackData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/feedback", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch feedback");
      const data = await res.json();
      setFeedbacks(data.feedbacks || []);
      if (data.stats) setStats(data.stats);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      if (isManual) {
        toast.error("Failed to load feedback", {
          description: err.message || "Could not retrieve feedback from backend.",
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeedbackData(true);
    // Real-time polling every 5 seconds for live feedback streaming
    const pollInterval = setInterval(() => {
      fetchFeedbackData(false);
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`${label} Copied`, {
      description: "Copied to clipboard.",
      duration: 1500,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/feedback/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setFeedbacks((prev) =>
        prev.map((fb) => (fb.id === id ? { ...fb, status: newStatus } : fb))
      );
      if (selectedFeedback && selectedFeedback.id === id) {
        setSelectedFeedback((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      toast.success("Status Updated", {
        description: `Feedback marked as ${newStatus}.`,
      });
    } catch (err: any) {
      toast.error("Update Failed", { description: err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/feedback/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete feedback");

      setFeedbacks((prev) => prev.filter((fb) => fb.id !== id));
      if (selectedFeedback?.id === id) setSelectedFeedback(null);

      toast.success("Feedback Deleted", {
        description: "The feedback record was removed from the database.",
      });
    } catch (err: any) {
      toast.error("Delete Failed", { description: err.message });
    } finally {
      setDeletingId(null);
    }
  };


  const handleExportCSV = () => {
    if (feedbacks.length === 0) {
      toast.error("No Data", { description: "No feedback entries to export." });
      return;
    }

    const headers = ["ID", "Room Code", "User Name", "Email", "Rating", "Category", "Status", "Comment", "Created At"];
    const rows = feedbacks.map((fb) => [
      `"${fb.id}"`,
      `"${fb.roomCode}"`,
      `"${fb.userName || fb.user || "Anonymous"}"`,
      `"${fb.userEmail || fb.email || ""}"`,
      fb.rating,
      `"${fb.category || "General"}"`,
      `"${fb.status || "Pending"}"`,
      `"${(fb.comment || "").replace(/"/g, '""')}"`,
      `"${new Date(fb.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `samvad-meeting-feedbacks-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export Complete", {
      description: `Exported ${feedbacks.length} feedback records to CSV.`,
    });
  };

  // Categories list
  const availableCategories = useMemo(() => {
    const set = new Set<string>(["All", "Sign Language AI", "Captions", "Audio Clarity", "Video Quality", "General"]);
    feedbacks.forEach((fb) => {
      if (fb.category) set.add(fb.category);
    });
    return Array.from(set);
  }, [feedbacks]);

  // Filtered and Sorted feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks
      .filter((fb) => {
        // Category filter
        if (selectedCategory !== "All" && fb.category !== selectedCategory) {
          return false;
        }
        // Rating filter
        if (selectedRating !== "All" && String(fb.rating) !== selectedRating) {
          return false;
        }
        // Status filter
        if (selectedStatus !== "All" && fb.status !== selectedStatus) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const name = (fb.userName || fb.user || "").toLowerCase();
          const email = (fb.userEmail || fb.email || "").toLowerCase();
          const room = (fb.roomCode || "").toLowerCase();
          const comment = (fb.comment || "").toLowerCase();
          return name.includes(q) || email.includes(q) || room.includes(q) || comment.includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortBy === "highest") {
          return (b.rating || 0) - (a.rating || 0);
        }
        if (sortBy === "lowest") {
          return (a.rating || 0) - (b.rating || 0);
        }
        return 0;
      });
  }, [feedbacks, selectedCategory, selectedRating, selectedStatus, searchQuery, sortBy]);

  // Calculate dynamic stats
  const resolvedCount = useMemo(
    () => feedbacks.filter((fb) => fb.status === "Resolved").length,
    [feedbacks]
  );
  const resolvedRate = feedbacks.length > 0 ? Math.round((resolvedCount / feedbacks.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Meeting Feedbacks
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Real-time participant ratings, ASL accessibility reviews, and post-conference feedback.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">

          <button
            type="button"
            onClick={() => fetchFeedbackData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/80 hover:bg-stone-50 dark:hover:bg-stone-700/60 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Feedback"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-stone-900 dark:text-stone-100" : ""}`} />
            <span>{isRefreshing ? "Syncing..." : "Sync"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/80 hover:bg-stone-50 dark:hover:bg-stone-700/60 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Average Rating */}
        <div className="p-4 rounded-md bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Average Satisfaction
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>{stats.averageRating ? stats.averageRating.toFixed(1) : "5.0"} / 5</span>
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>{stats.averageRating ? stats.averageRating.toFixed(1) : "5.0"}</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= Math.round(stats.averageRating || 5)
                      ? "fill-amber-400 text-amber-400"
                      : "text-stone-200 dark:text-stone-700"
                      }`}
                  />
                ))}
              </div>
            </div>
            <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
              Based on {stats.totalFeedback || feedbacks.length} verified meeting reviews
            </div>
          </div>
        </div>

        {/* Card 2: Total Feedback */}
        <div className="p-4 rounded-md bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Total Submissions
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50">
              Active DB
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-mono">
              {stats.totalFeedback || feedbacks.length}
            </div>
            <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
              Live feedback committed to database
            </div>
          </div>
        </div>

        {/* Card 3: Resolved Rate */}
        <div className="p-4 rounded-md bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Resolution Rate
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50">
              {resolvedCount} resolved
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-mono">
              {resolvedRate}%
            </div>
            <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
              Feedback inquiries closed or addressed
            </div>
          </div>
        </div>

        {/* Card 4: Top Category */}
        <div className="p-4 rounded-md bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Leading Category
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/50">
              Primary
            </span>
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-stone-900 dark:text-stone-100 truncate">
              {Object.keys(stats.categoryCounts || {}).length > 0
                ? Object.entries(stats.categoryCounts).sort((a, b) => b[1] - a[1])[0][0]
                : "Sign Language AI"}
            </div>
            <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
              Most frequent evaluation topic
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search, Filter & Sort Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by participant name, email, room code, or comment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 h-9 rounded-md text-xs sm:text-sm bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-600 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter & Sort Dropdowns */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Rating Filter */}
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="px-2.5 h-9 rounded-md text-xs bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-600 shadow-2xs cursor-pointer"
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars ★★★★★</option>
            <option value="4">4 Stars ★★★★☆</option>
            <option value="3">3 Stars ★★★☆☆</option>
            <option value="2">2 Stars ★★☆☆☆</option>
            <option value="1">1 Star ★☆☆☆☆</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 h-9 rounded-md text-xs bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-600 shadow-2xs cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Sort By Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 h-9 rounded-md text-xs bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-600 shadow-2xs cursor-pointer font-medium"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="highest">Sort: Highest Rating</option>
            <option value="lowest">Sort: Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* 5. Category Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {availableCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${selectedCategory === cat
              ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs"
              : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 6. Feedback List Content */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-20 text-center rounded-lg bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80">
            <div className="w-6 h-6 border-2 border-stone-300 dark:border-stone-700 border-t-stone-900 dark:border-t-stone-100 rounded animate-spin mx-auto mb-2" />
            <p className="text-xs text-stone-400">Loading meeting feedbacks from database...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="py-16 text-center rounded-lg bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 space-y-2">
            <MessageSquare className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
            <div className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              No Feedback Entries Found
            </div>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== "All" || selectedRating !== "All" || selectedStatus !== "All"
                ? "Try adjusting your filters or search keywords to view other feedback records."
                : "Participant ratings and reviews submitted after meetings will automatically populate here."}
            </p>
            {(searchQuery || selectedCategory !== "All" || selectedRating !== "All" || selectedStatus !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedRating("All");
                  setSelectedStatus("All");
                  setSortBy("newest");
                }}
                className="mt-2 text-xs text-[#c25e2e] hover:underline font-medium cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          filteredFeedbacks.map((fb) => {
            const userName = fb.userName || fb.user || "Anonymous User";
            const userEmail = fb.userEmail || fb.email || "guest.user@samvad.internal";

            return (
              <div
                key={fb.id}
                onClick={() => setSelectedFeedback(fb)}
                className="p-5 rounded-md bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 shadow-xs hover:border-stone-300 dark:hover:border-stone-700 transition-all cursor-pointer space-y-3 group"
              >
                {/* Header: User Info, Stars & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {fb.userImage ? (
                      <Image
                        src={fb.userImage}
                        alt={userName}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-md object-cover ring-1 ring-stone-200 dark:ring-stone-700 shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-md shrink-0 flex items-center justify-center font-semibold text-white text-xs bg-gradient-to-br ${getAvatarBg(
                          userEmail
                        )} shadow-2xs`}
                      >
                        {getInitials(userName)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate">
                          {userName}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                          {fb.roomCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-xs">
                        <span className="truncate max-w-[220px] sm:max-w-[320px]">{userEmail}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(userEmail, "Email");
                          }}
                          title="Copy Email"
                          className="opacity-0 group-hover:opacity-100 hover:text-stone-900 dark:hover:text-stone-200 transition-opacity"
                        >
                          {copiedId === userEmail ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars & Status Badge */}
                  <div className="flex items-center gap-3 self-start sm:self-center">
                    {/* Stars */}
                    <div className="flex items-center gap-1 bg-amber-50/60 dark:bg-amber-950/30 px-2 py-1 rounded border border-amber-200/50 dark:border-amber-900/40">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < fb.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-stone-200 dark:text-stone-700"
                              }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 ml-1">
                        {fb.rating}.0
                      </span>
                    </div>

                    {/* Status Badge in Little Box Shape */}
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded border ${fb.status === "Resolved"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/50"
                        : fb.status === "Investigating"
                          ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/50"
                          : fb.status === "Under Review"
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/50"
                            : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/50"
                        }`}
                    >
                      {fb.status}
                    </span>
                  </div>
                </div>

                {/* Comment Text */}
                {fb.comment ? (
                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed pl-3 border-l-2 border-stone-200 dark:border-stone-800">
                    "{fb.comment}"
                  </p>
                ) : (
                  <p className="text-xs text-stone-400 italic pl-3 border-l-2 border-stone-200 dark:border-stone-800">
                    No written comment provided with this star rating.
                  </p>
                )}

                {/* Footer: Category, Date, and Fast Action buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800/80 text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded border border-stone-200/80 dark:border-stone-700/80">
                      {fb.category || "General"}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {formatFeedbackDate(fb.createdAt || fb.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Fast Status Switch Dropdown */}
                    <select
                      value={fb.status || "Pending"}
                      onChange={(e) => handleUpdateStatus(fb.id, e.target.value)}
                      disabled={updatingId === fb.id}
                      className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 cursor-pointer disabled:opacity-50"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Investigating">Investigating</option>
                      <option value="Resolved">Resolved</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleDeleteFeedback(fb.id)}
                      disabled={deletingId === fb.id}
                      title="Delete Feedback"
                      className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 7. Feedback Detail Modal */}
      {selectedFeedback && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setSelectedFeedback(null)}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-200/80 dark:border-stone-800">
              <div className="flex items-center gap-3">
                {selectedFeedback.userImage ? (
                  <Image
                    src={selectedFeedback.userImage}
                    alt={selectedFeedback.userName || "User"}
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-md object-cover ring-1 ring-stone-200 dark:ring-stone-700"
                  />
                ) : (
                  <div
                    className={`w-11 h-11 rounded-md flex items-center justify-center font-bold text-white text-sm bg-gradient-to-br ${getAvatarBg(
                      selectedFeedback.userEmail
                    )} shadow-xs`}
                  >
                    {getInitials(selectedFeedback.userName || selectedFeedback.user)}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    {selectedFeedback.userName || selectedFeedback.user || "Anonymous Participant"}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 border border-stone-200 dark:border-stone-700">
                      {selectedFeedback.status}
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {selectedFeedback.userEmail || selectedFeedback.email || "No email provided"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFeedback(null)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rating & Room Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-stone-400">Rating Given:</span>
                <div className="p-3 rounded-md bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between font-bold text-stone-800 dark:text-stone-200">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < selectedFeedback.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-stone-200 dark:text-stone-700"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">{selectedFeedback.rating} / 5</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-stone-400">Meeting Room Code:</span>
                <div className="p-3 rounded-md bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 font-mono font-semibold text-stone-800 dark:text-stone-200 flex items-center justify-between">
                  <span>{selectedFeedback.roomCode}</span>
                  <a
                    href={`/room/${selectedFeedback.roomCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#c25e2e] hover:underline"
                    title="Open Room"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Comment Body */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[11px] font-medium text-stone-400">User's Feedback Comment:</span>
              <div className="p-3.5 rounded-md bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 text-stone-800 dark:text-stone-200 text-sm leading-relaxed">
                {selectedFeedback.comment ? (
                  `"${selectedFeedback.comment}"`
                ) : (
                  <span className="text-stone-400 italic">No comment text provided.</span>
                )}
              </div>
            </div>

            {/* Extra Metadata */}
            <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800">
              <span>Category: <strong className="text-stone-700 dark:text-stone-300 font-semibold">{selectedFeedback.category}</strong></span>
              <span>Submitted: {new Date(selectedFeedback.createdAt).toLocaleString()}</span>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {(["Pending", "Under Review", "Investigating", "Resolved"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleUpdateStatus(selectedFeedback.id, st)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors cursor-pointer ${selectedFeedback.status === st
                      ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-transparent shadow-2xs"
                      : "bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700"
                      }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleDeleteFeedback(selectedFeedback.id)}
                className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                title="Delete this record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
