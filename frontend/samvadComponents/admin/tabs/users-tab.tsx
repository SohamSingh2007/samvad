"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Users,
  Search,
  Download,
  RefreshCw,
  Mail,
  ShieldCheck,
  Shield,
  Video,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  UserCheck,
  Sparkles,
  Layers,
  Eye,
  Ban,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import Image from "next/image";
import { toast } from "@/samvadComponents/toastMessage";
import { AdminUser, MetricCardData } from "../types";

export function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
  const pageSizeRef = useRef<HTMLDivElement>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Ban & Delete state
  const [isBanning, setIsBanning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Close custom menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target as Node)) {
        setIsPageSizeOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isPageSizeOpen || isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPageSizeOpen, isFilterOpen]);

  // Fetch users from API
  const fetchUsersData = async () => {
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data);
          return;
        }
      }
      throw new Error("Invalid response format");
    } catch (err) {
      console.error("Failed to load users from backend:", err);
      // Fallback demo users if server is unavailable
      setUsers([
        {
          id: "usr_admin_01",
          name: "System Admin",
          email: "admin@samvad.com",
          emailVerified: true,
          status: "active",
          createdAt: "2026-09-13T07:22:05.061Z",
          meetingsHosted: 24,
          accessibilityPreferences: {
            aslTranslation: true,
            highContrastCaptions: true,
            captionsFontSize: "large",
          },
        },
        {
          id: "usr_soham_02",
          name: "Soham Singh",
          email: "singhsoham1307@gmail.com",
          emailVerified: true,
          status: "active",
          createdAt: "2026-09-11T12:48:00.722Z",
          meetingsHosted: 16,
          accessibilityPreferences: {
            aslTranslation: true,
            highContrastCaptions: false,
          },
        },
        {
          id: "usr_priya_03",
          name: "Priya Sharma",
          email: "priya@samvad.com",
          emailVerified: false,
          status: "active",
          createdAt: "2026-09-10T12:34:16.459Z",
          meetingsHosted: 3,
        },
        {
          id: "usr_arjun_04",
          name: "Arjun Patel",
          email: "arjun@samvad.com",
          emailVerified: false,
          status: "active",
          createdAt: "2026-09-11T08:13:21.492Z",
          meetingsHosted: 1,
        },
      ]);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 500));
    try {
      await Promise.all([fetchUsersData(), minDelay]);
      toast.success("User directory refreshed");
    } catch {
      await minDelay;
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanToggle = async () => {
    if (!selectedUser) return;
    setIsBanning(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/ban`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update ban status");

      const newStatus = data.banned ? "suspended" : "active";
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, status: newStatus } : u))
      );
      setSelectedUser((prev) => (prev ? { ...prev, status: newStatus } : null));
      toast.success(data.message || (data.banned ? "User has been banned" : "User has been unbanned"));
      setShowBanConfirm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update ban status");
    } finally {
      setIsBanning(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete user");

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, status: "deleted" as const } : u))
      );
      setSelectedUser((prev) => (prev ? { ...prev, status: "deleted" as const } : null));
      toast.success("User account marked as deleted. Record retained for data.");
      setShowDeleteConfirm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestoreUser = async () => {
    if (!selectedUser) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to restore user");

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, status: "active" as const } : u))
      );
      setSelectedUser((prev) => (prev ? { ...prev, status: "active" as const } : null));
      toast.success("User account restored successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to restore user");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchUsersData();
      setIsLoading(false);
    };
    init();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics computation
  const metrics: MetricCardData[] = useMemo(() => {
    const total = users.length;
    const verified = users.filter((u) => u.emailVerified).length;
    const hosts = users.filter((u) => (u.meetingsHosted || 0) > 0).length;
    const aslUsers = users.filter(
      (u) =>
        u.accessibilityPreferences &&
        (typeof u.accessibilityPreferences === "object"
          ? (u.accessibilityPreferences as any).aslTranslation ||
            u.accessibilityPreferences.islTranslation ||
            (u.accessibilityPreferences as any).primaryMode === "asl" ||
            u.accessibilityPreferences.primaryMode === "isl"
          : false)
    ).length;

    return [
      {
        id: "total-users",
        title: "Total Registered",
        value: total.toString(),
        change: "+100%",
        isPositive: true,
        period: "all-time",
        subtext: "Accounts created across Samvad",
      },
      {
        id: "verified-users",
        title: "Email Verified",
        value: total > 0 ? `${Math.round((verified / total) * 100)}%` : "0%",
        change: `${verified} users`,
        isPositive: true,
        period: "active status",
        subtext: "OAuth & magic-link verified",
      },
      {
        id: "active-hosts",
        title: "Meeting Hosts",
        value: hosts.toString(),
        change: total > 0 ? `${Math.round((hosts / total) * 100)}%` : "0%",
        isPositive: true,
        period: "organizers",
        subtext: "Users who have created rooms",
      },
      {
        id: "asl-enabled",
        title: "ASL Profiles",
        value: aslUsers > 0 ? aslUsers.toString() : "4",
        change: "Active",
        isPositive: true,
        period: "accessibility",
        subtext: "American Sign Language configured",
      },
    ];
  }, [users]);

  // Filtering users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (roleFilter === "verified") return u.emailVerified && u.status !== "suspended" && u.status !== "deleted";
      if (roleFilter === "unverified") return !u.emailVerified && u.status !== "suspended" && u.status !== "deleted";
      if (roleFilter === "banned") return u.status === "suspended";
      if (roleFilter === "deleted") return u.status === "deleted";
      if (roleFilter === "admin") return u.email === "admin@samvad.com";
      if (roleFilter === "host") return (u.meetingsHosted || 0) > 0 && u.status !== "deleted";

      return true;
    });
  }, [users, searchQuery, roleFilter]);

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  // Pagination calculations (10 users per page)
  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, validCurrentPage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(validCurrentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (validCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (validCurrentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  // CSV Export
  const handleExportCSV = () => {
    if (users.length === 0) return;
    const headers = ["ID", "Name", "Email", "Verified", "Meetings Hosted", "Created At"];
    const rows = users.map((u) => [
      u.id,
      `"${u.name || ""}"`,
      u.email,
      u.emailVerified ? "Yes" : "No",
      u.meetingsHosted || 0,
      new Date(u.createdAt).toISOString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `samvad_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("User directory exported as CSV");
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarBg = (email: string) => {
    const colors = [
      "from-orange-500 to-amber-600",
      "from-blue-500 to-indigo-600",
      "from-emerald-500 to-teal-600",
      "from-purple-500 to-violet-600",
      "from-rose-500 to-pink-600",
      "from-cyan-500 to-sky-600",
    ];
    let hash = 0;
    for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80 dark:border-stone-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            User Management
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Directory of registered participants, meeting hosts, and administrator privileges
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/80 hover:bg-stone-50 dark:hover:bg-stone-700/60 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/80 hover:bg-stone-50 dark:hover:bg-stone-700/60 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className="p-4 rounded-md bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {metric.title}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50">
                {metric.change}
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                {metric.value}
              </div>
              <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
                {metric.subtext}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Control & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name, email or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 h-10 rounded-md text-xs sm:text-sm bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-600 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Dropdown */}
        <div className="relative shrink-0" ref={filterRef}>
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`inline-flex items-center gap-2 px-3.5 h-10 rounded-md text-xs font-medium border transition-colors cursor-pointer shadow-2xs ${
              roleFilter !== "all"
                ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-stone-300 dark:border-stone-700 font-semibold"
                : "bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800/80 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
            }`}
          >
            <Filter className={`w-3.5 h-3.5 ${roleFilter !== "all" ? "text-stone-900 dark:text-stone-100" : "text-stone-400"}`} />
            <span>
              {
                [
                  { id: "all", label: "All Users" },
                  { id: "verified", label: "Verified" },
                  { id: "unverified", label: "Unverified" },
                  { id: "banned", label: "Banned" },
                  { id: "deleted", label: "Deleted" },
                  { id: "host", label: "Hosts" },
                  { id: "admin", label: "Admins" },
                ].find((t) => t.id === roleFilter)?.label || "Filter"
              }
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`} />
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-stone-400 dark:text-stone-500">
                Filter by
              </div>
              {[
                { id: "all", label: "All Users" },
                { id: "verified", label: "Verified" },
                { id: "unverified", label: "Unverified" },
                { id: "banned", label: "Banned" },
                { id: "deleted", label: "Deleted" },
                { id: "host", label: "Hosts" },
                { id: "admin", label: "Admins" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setRoleFilter(tab.id);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                    roleFilter === tab.id
                      ? "text-stone-900 dark:text-white font-semibold bg-stone-100 dark:bg-stone-800"
                      : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-100"
                  }`}
                >
                  <span>{tab.label}</span>
                  {roleFilter === tab.id && (
                    <Check className="w-3.5 h-3.5 text-stone-900 dark:text-white" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Users Table */}
      <div className="rounded-md bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 text-stone-500 dark:text-stone-400 font-medium">
                <th className="py-3 px-4 text-center min-w-[240px]">User</th>
                <th className="py-3 px-4 text-center min-w-[130px]">Status</th>
                <th className="py-3 px-4 text-center min-w-[150px]">Meetings Hosted</th>
                <th className="py-3 px-4 text-center min-w-[140px]">Joined Date</th>
                <th className="py-3 px-4 text-center min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/60 dark:divide-stone-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    <div className="w-6 h-6 border-2 border-stone-300 dark:border-stone-700 border-t-stone-900 dark:border-t-stone-100 rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading registered users...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
                      No users match your criteria
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      Try adjusting your search terms or filter selection
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isAdmin = user.email === "admin@samvad.com";
                  const isHost = (user.meetingsHosted || 0) > 0;

                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer group"
                    >
                      {/* User Info */}
                      <td className="py-3 px-4 text-left">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name || "User"}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-md object-cover shrink-0 ring-1 ring-stone-200 dark:ring-stone-700"
                            />
                          ) : (
                            <div
                              className={`w-8 h-8 rounded-md shrink-0 flex items-center justify-center font-semibold text-white text-[11px] bg-gradient-to-br ${getAvatarBg(
                                user.email
                              )} shadow-2xs`}
                            >
                              {getInitials(user.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                                {user.name || "Anonymous User"}
                              </span>
                              {isAdmin && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-[11px]">
                              <span className="truncate max-w-[200px] sm:max-w-[260px]">
                                {user.email}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(user.email, "Email");
                                }}
                                title="Copy Email"
                                className="opacity-0 group-hover:opacity-100 hover:text-stone-900 dark:hover:text-stone-200 transition-opacity"
                              >
                                {copiedId === user.email ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center">
                          {user.status === "deleted" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700/80">
                              <Trash2 className="w-3 h-3 text-stone-400" /> Deleted
                            </span>
                          ) : user.status === "suspended" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200/60 dark:border-red-900/50">
                              <Ban className="w-3 h-3" /> Banned
                            </span>
                          ) : user.emailVerified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700/80">
                              <Clock className="w-3 h-3" /> Unverified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Meetings Hosted */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
                          <Video className="w-3.5 h-3.5 text-stone-400" />
                          <span>{user.meetingsHosted || 0}</span>
                          <span className="text-[11px] text-stone-400 font-normal">
                            {(user.meetingsHosted || 0) === 1 ? "meeting" : "meetings"}
                          </span>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-center text-stone-500 dark:text-stone-400">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                            title="View Profile Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer Controls */}
        <div className="py-3 px-4 bg-stone-50/70 dark:bg-stone-900/60 border-t border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-400">
          {/* Left: Summary & Per Page */}
          <div className="flex items-center gap-3">
            <span>
              Showing <span className="font-semibold text-stone-900 dark:text-stone-100">{startIndex}</span>–
              <span className="font-semibold text-stone-900 dark:text-stone-100">{endIndex}</span> of{" "}
              <span className="font-semibold text-stone-900 dark:text-stone-100">{totalItems}</span> users
            </span>

            <span className="text-stone-300 dark:text-stone-700 select-none">|</span>

            <div className="flex items-center gap-2">
              <span className="text-stone-500 dark:text-stone-400">Per page:</span>
              <div ref={pageSizeRef} className="relative inline-flex items-center">
                <button
                  type="button"
                  onClick={() => setIsPageSizeOpen(!isPageSizeOpen)}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-lg text-xs font-medium bg-white dark:bg-stone-800 border border-stone-300/80 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:border-stone-400 dark:hover:border-stone-600 shadow-2xs transition-colors cursor-pointer"
                >
                  <span>{pageSize}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-150 ${
                      isPageSizeOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Custom Popover Dropdown Menu */}
                {isPageSizeOpen && (
                  <div className="absolute bottom-full left-0 mb-1.5 w-24 py-1 rounded-xl bg-white dark:bg-[#1c1b1a] border border-stone-200/90 dark:border-stone-700/80 shadow-xl shadow-black/10 dark:shadow-black/40 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {[10, 25, 50, 100].map((size) => {
                      const isSelected = pageSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setPageSize(size);
                            setCurrentPage(1);
                            setIsPageSizeOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white font-semibold"
                              : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/70 hover:text-stone-900 dark:hover:text-stone-100"
                          }`}
                        >
                          <span>{size}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-stone-900 dark:text-white" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Page Navigation Buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                title="First page"
                className="w-8 h-8 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 border border-transparent hover:border-stone-300/60 dark:hover:border-stone-700 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                title="Previous page"
                className="w-8 h-8 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 border border-transparent hover:border-stone-300/60 dark:hover:border-stone-700 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {getPageNumbers().map((page, idx) => {
                  if (typeof page === "string") {
                    return (
                      <span key={`ellipsis-${idx}`} className="w-6 text-center text-stone-400 select-none">
                        ...
                      </span>
                    );
                  }
                  const isActive = page === validCurrentPage;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer ${
                        isActive
                          ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold shadow-xs cursor-default"
                          : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 font-medium"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                title="Next page"
                className="w-8 h-8 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 border border-transparent hover:border-stone-300/60 dark:hover:border-stone-700 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage === totalPages}
                title="Last page"
                className="w-8 h-8 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 border border-transparent hover:border-stone-300/60 dark:hover:border-stone-700 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Slide-Over User Inspector Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-200/80 dark:border-stone-800">
              <div className="flex items-center gap-3">
                {selectedUser.image ? (
                  <Image
                    src={selectedUser.image}
                    alt={selectedUser.name || "User"}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-md object-cover ring-2 ring-stone-200 dark:ring-stone-700"
                  />
                ) : (
                  <div
                    className={`w-12 h-12 rounded-md flex items-center justify-center font-bold text-white text-base bg-gradient-to-br ${getAvatarBg(
                      selectedUser.email
                    )} shadow-xs`}
                  >
                    {getInitials(selectedUser.name)}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    {selectedUser.name || "Anonymous User"}
                    {selectedUser.status === "deleted" ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 border border-stone-200 dark:border-stone-700">
                        Deleted
                      </span>
                    ) : selectedUser.status === "suspended" ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                        Banned
                      </span>
                    ) : selectedUser.emailVerified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : null}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {selectedUser.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Attributes */}
            <div className="space-y-3 text-xs">
              {/* User ID - Full Width */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-stone-400">User ID:</span>
                <div className="p-3 rounded-md bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between font-mono text-[11px] text-stone-800 dark:text-stone-200">
                  <span className="break-all select-all font-mono">{selectedUser.id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedUser.id, "User ID")}
                    title="Copy User ID"
                    className="p-1 rounded-md text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-stone-700/50 transition-colors ml-2 shrink-0 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Other Stats in 2 Columns */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-stone-400">Meetings Hosted:</span>
                  <div className="p-3 rounded-md bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 font-semibold text-stone-800 dark:text-stone-200">
                    {selectedUser.meetingsHosted || 0} sessions
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-stone-400">Registration Date:</span>
                  <div className="p-3 rounded-md bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 font-semibold text-stone-800 dark:text-stone-200">
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                      : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-3 border-t border-stone-200/80 dark:border-stone-800">
              {/* Delete Confirmation Box */}
              {showDeleteConfirm && (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 space-y-2 animate-in fade-in duration-100">
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Delete this user account?</span>
                  </div>
                  <p className="text-[11px] text-red-600 dark:text-red-300">
                    Active sessions and credentials will be revoked immediately so the user cannot sign in. Account record will be retained for our data.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="px-2.5 py-1 rounded-md text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteUser}
                      disabled={isDeleting}
                      className="px-3 py-1 rounded-md text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      {isDeleting ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3" />
                          <span>Confirm Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Ban Confirmation Box */}
              {showBanConfirm && (
                <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 space-y-2 animate-in fade-in duration-100">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{selectedUser.status === "suspended" ? "Unban this user?" : "Ban this user?"}</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    {selectedUser.status === "suspended"
                      ? "The user will regain full access to sign in and use the platform."
                      : "The user will be immediately logged out and blocked from signing in or joining meetings."}
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowBanConfirm(false)}
                      disabled={isBanning}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBanToggle}
                      disabled={isBanning}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      {isBanning ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Ban className="w-3 h-3" />
                          <span>{selectedUser.status === "suspended" ? "Confirm Unban" : "Confirm Ban"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {selectedUser.email !== "admin@samvad.com" && (
                    <>
                      {selectedUser.status !== "deleted" && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowBanConfirm(!showBanConfirm);
                            setShowDeleteConfirm(false);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            selectedUser.status === "suspended"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100"
                              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100"
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>{selectedUser.status === "suspended" ? "Unban Account" : "Ban Account"}</span>
                        </button>
                      )}

                      {selectedUser.status === "deleted" ? (
                        <button
                          type="button"
                          onClick={handleRestoreUser}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isDeleting ? "animate-spin" : ""}`} />
                          <span>Restore Account</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setShowDeleteConfirm(!showDeleteConfirm);
                            setShowBanConfirm(false);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Account</span>
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${selectedUser.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Contact</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
