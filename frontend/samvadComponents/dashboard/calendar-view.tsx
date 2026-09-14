"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Video, 
  Copy, 
  Check, 
  CalendarDays,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/samvadComponents/toastMessage";
import { scheduleMeeting, MeetingDetails } from "@/lib/meetings-client";

export interface CalendarViewProps {
  meetings: MeetingDetails[];
  onMeetingScheduled?: () => void;
  onStartInstantMeeting?: () => void;
}

export function CalendarView({
  meetings,
  onMeetingScheduled,
  onStartInstantMeeting,
}: CalendarViewProps) {
  const router = useRouter();

  // Selected date state (defaults to today)
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Schedule modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [scheduleDateInput, setScheduleDateInput] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Month navigation
  const prevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const jumpToToday = () => {
    const today = new Date();
    setCurrentMonthDate(today);
    setSelectedDate(today);
    setScheduleDateInput(today.toISOString().split("T")[0]);
  };

  // Month metadata
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthName = currentMonthDate.toLocaleString("default", { month: "long" });

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Group meetings by Date string (YYYY-MM-DD)
  const meetingsByDate = useMemo(() => {
    const map = new Map<string, MeetingDetails[]>();
    for (const m of meetings) {
      const dateSource = m.scheduledAt || m.createdAt;
      if (!dateSource) continue;
      try {
        const d = new Date(dateSource);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const existing = map.get(key) || [];
        existing.push(m);
        map.set(key, existing);
      } catch {}
    }
    return map;
  }, [meetings]);

  // Selected date key
  const selectedDateKey = useMemo(() => {
    return `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
  }, [selectedDate]);

  const selectedDateMeetings = meetingsByDate.get(selectedDateKey) || [];

  // Today key
  const todayKey = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  }, []);

  const handleCopyLink = (roomCode: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/room/${roomCode}`;
    navigator.clipboard?.writeText(url);
    setCopiedCode(roomCode);
    toast.success("Meeting link copied!", {
      description: url,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenSchedule = (date?: Date) => {
    const target = date || selectedDate;
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, "0");
    const dd = String(target.getDate()).padStart(2, "0");
    setScheduleDateInput(`${yyyy}-${mm}-${dd}`);
    setScheduleTitle("");
    setScheduleTime("10:00");
    setIsScheduleOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = scheduleTitle.trim() || "Scheduled Meeting";
    if (!scheduleDateInput || !scheduleTime) {
      toast.warning("Date & Time required", {
        description: "Please choose a valid date and start time for your meeting.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const scheduledIso = new Date(`${scheduleDateInput}T${scheduleTime}:00`).toISOString();
      const res = await scheduleMeeting(trimmedTitle, scheduledIso);

      toast.success("Meeting Scheduled!", {
        description: `Room ${res.roomCode.toUpperCase()} scheduled for ${scheduleDateInput} at ${scheduleTime}`,
      });

      setIsScheduleOpen(false);
      onMeetingScheduled?.();
    } catch (err: any) {
      toast.error("Failed to schedule", {
        description: err.message || "Please check your network and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-3xl border-2 border-stone-200/80 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
              <span>{monthName} {year}</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Manage your upcoming conferences and schedule new Samvad sessions.
            </p>
          </div>
        </div>

        {/* Navigation & Schedule Action */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center bg-stone-100 dark:bg-stone-800 rounded-xl p-1 border border-stone-200/80 dark:border-stone-700">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={jumpToToday}
              className="px-3 py-1 text-xs font-semibold rounded-lg hover:bg-white dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={() => handleOpenSchedule()}
            className="rounded-lg gap-2 bg-[#7075f7] hover:bg-[#5f64f5] text-white shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Schedule Meeting</span>
            <span className="sm:hidden">Schedule</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Calendar Month Grid (Left/Top) & Selected Day Schedule (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Month Grid */}
        <div className="lg:col-span-7 bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-3xl border-2 border-stone-200/80 dark:border-stone-800 shadow-sm">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Prev month fill days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => {
              const dayNum = daysInPrevMonth - firstDayOfMonth + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="aspect-square p-1 rounded-2xl flex flex-col items-center justify-center text-xs text-stone-300 dark:text-stone-700 select-none opacity-50"
                >
                  {dayNum}
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateObj = new Date(year, month, dayNum);
              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDateKey;
              const dayMeetings = meetingsByDate.get(dateKey) || [];
              const hasMeetings = dayMeetings.length > 0;

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => setSelectedDate(dateObj)}
                  className={`aspect-square p-1 rounded-2xl flex flex-col items-center justify-between border transition-all cursor-pointer relative group ${
                    isSelected
                      ? "border-[#7075f7] bg-[#7075f7]/10 dark:bg-[#7075f7]/20 shadow-xs"
                      : isToday
                      ? "border-sky-400 bg-sky-50/50 dark:bg-sky-950/20 text-sky-900 dark:text-sky-300 hover:border-sky-500"
                      : "border-stone-100 dark:border-stone-800/80 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-300"
                  }`}
                >
                  <span
                    className={`text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                      isSelected
                        ? "bg-[#7075f7] text-white"
                        : isToday
                        ? "bg-sky-500 text-white"
                        : "text-stone-800 dark:text-stone-200"
                    }`}
                  >
                    {dayNum}
                  </span>

                  {/* Meeting badge dot */}
                  {hasMeetings && (
                    <div className="flex items-center gap-0.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7075f7] animate-pulse" />
                      {dayMeetings.length > 1 && (
                        <span className="text-[9px] font-bold text-[#7075f7] leading-none">
                          {dayMeetings.length}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7075f7]" />
              <span>Scheduled Meeting</span>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Date Schedule & Details */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-3xl border-2 border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <p className="text-xs font-semibold text-[#7075f7] uppercase tracking-wider">
                {selectedDate.toLocaleDateString(undefined, { weekday: "long" })}
              </p>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </h3>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenSchedule(selectedDate)}
              className="rounded-full text-xs gap-1.5 dark:border-stone-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </Button>
          </div>

          {/* Schedule List for this Day */}
          <div className="space-y-3 min-h-[260px] flex flex-col justify-start">
            {selectedDateMeetings.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-stone-50/50 dark:bg-stone-800/30 border border-dashed border-stone-200 dark:border-stone-800">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mb-3">
                  <CalendarDays className="w-6 h-6 stroke-[1.5]" />
                </div>
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  No meetings on this day
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xs">
                  You have a free schedule! Click below to plan a new video conference.
                </p>
                <Button
                  size="sm"
                  onClick={() => handleOpenSchedule(selectedDate)}
                  className="mt-4 rounded-full text-xs gap-1.5 bg-[#7075f7] hover:bg-[#5f64f5] text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Schedule for this day
                </Button>
              </div>
            ) : (
              selectedDateMeetings.map((m) => {
                const timeString = m.scheduledAt
                  ? new Date(m.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                const isEnded = m.status === "ended";

                return (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/50 hover:bg-stone-100/70 dark:hover:bg-stone-800 transition-colors flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                          {m.title || "Samvad Meeting"}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>{timeString}</span>
                          <span className="text-stone-300 dark:text-stone-700">•</span>
                          <span className="font-mono uppercase font-semibold text-stone-600 dark:text-stone-300">
                            {m.roomCode}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                          m.status === "active"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                            : isEnded
                            ? "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-400"
                            : "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(m.roomCode)}
                        className="inline-flex items-center gap-1 text-xs text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white px-2.5 py-1 rounded-full hover:bg-stone-200/70 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                        title="Copy meeting link"
                      >
                        {copiedCode === m.roomCode ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedCode === m.roomCode ? "Copied" : "Copy"}</span>
                      </button>

                      {!isEnded && (
                        <Button
                          size="sm"
                          onClick={() => router.push(`/room/${m.roomCode}`)}
                          className="h-7 text-xs rounded-full gap-1 bg-[#7075f7] hover:bg-[#5f64f5] text-white px-3 cursor-pointer"
                        >
                          <Video className="w-3 h-3" />
                          <span>Join</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Schedule Meeting Modal Dialog */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    Schedule a Meeting
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Set up your conference room in advance
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-full text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Meeting Title
                </label>
                <Input
                  type="text"
                  required
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  placeholder="e.g. Design Sync, Sprint Planning"
                  className="dark:bg-stone-800 dark:border-stone-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    Date
                  </label>
                  <Input
                    type="date"
                    required
                    value={scheduleDateInput}
                    onChange={(e) => setScheduleDateInput(e.target.value)}
                    className="dark:bg-stone-800 dark:border-stone-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    Time
                  </label>
                  <Input
                    type="time"
                    required
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="dark:bg-stone-800 dark:border-stone-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsScheduleOpen(false)}
                  className="rounded-full text-xs dark:border-stone-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full text-xs bg-[#7075f7] hover:bg-[#5f64f5] text-white shadow-sm"
                >
                  {isSubmitting ? "Scheduling..." : "Save Meeting"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
