"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { UserFeedbackItem } from "../types";

export function FeedbackTab() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [feedbackList, setFeedbackList] = useState<UserFeedbackItem[]>([
    {
      id: "fb-1",
      user: "Nikhil Mehra",
      email: "nikhil.m@inclusivecorp.in",
      meetingCode: "sam-tech-829",
      rating: 5,
      category: "Sign Language AI",
      comment:
        "The real-time Indian Sign Language detection is a complete game changer for our deaf engineers. Almost zero latency during technical standups!",
      date: "Today at 3:10 PM",
      status: "Resolved",
    },
    {
      id: "fb-2",
      user: "Aarti Sundaram",
      email: "aarti.s@chennai-edu.org",
      meetingCode: "sam-edu-754",
      rating: 5,
      category: "Captions",
      comment:
        "Dual English and Tamil live subtitling was extremely accurate for our guest lecture. Very clear font rendering.",
      date: "Today at 1:45 PM",
      status: "Resolved",
    },
    {
      id: "fb-3",
      user: "Devendra Kulkarni",
      email: "dev.k@fintech-mumbai.com",
      meetingCode: "sam-exec-109",
      rating: 4,
      category: "Audio Clarity",
      comment:
        "Crisp noise suppression on laptop microphones. Would appreciate an option to boost quiet speakers automatically.",
      date: "Yesterday at 5:20 PM",
      status: "Under Review",
    },
    {
      id: "fb-4",
      user: "Sanya Gupta",
      email: "sanya@delhi-design.io",
      meetingCode: "sam-des-401",
      rating: 5,
      category: "General",
      comment:
        "The Google Meet style navbar with matching 42px height elements and sleek dark mode looks exceptionally premium.",
      date: "Yesterday at 11:15 AM",
      status: "Resolved",
    },
    {
      id: "fb-5",
      user: "Harish Chandra",
      email: "harish@telehealth-care.in",
      meetingCode: "sam-med-220",
      rating: 4,
      category: "Sign Language AI",
      comment:
        "Quick finger spelling in low light sometimes dropped two letters. Frontal lighting fixed it, but maybe add a low-light alert prompt.",
      date: "2 days ago",
      status: "Investigating",
    },
  ]);

  const categories = ["All", "Sign Language AI", "Captions", "Audio Clarity", "General"];

  const filteredFeedbacks = feedbackList.filter((fb) =>
    selectedCategory === "All" ? true : fb.category === selectedCategory
  );

  const handleResolve = (id: string) => {
    setFeedbackList((prev) =>
      prev.map((fb) => (fb.id === id ? { ...fb, status: "Resolved" } : fb))
    );
    toast.success("Feedback Marked Resolved", {
      description: "Status updated and synced with support dashboard.",
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            User Feedback & Experience Ratings
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Post-meeting feedback, accessibility ratings, and feature requests submitted by participants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>4.8 / 5.0 Average Satisfaction</span>
          </div>
        </div>
      </div>

      {/* 2. Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs"
                : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. Feedback Cards List */}
      <div className="space-y-3">
        {filteredFeedbacks.map((fb) => (
          <div
            key={fb.id}
            className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center font-bold text-xs">
                  {fb.user[0]}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {fb.user}
                  </h3>
                  <p className="text-[11px] text-stone-400 font-mono">
                    {fb.email} • Room: {fb.meetingCode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                {/* Rating Stars */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < fb.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-stone-200 dark:text-stone-700"
                      }`}
                    />
                  ))}
                </div>

                {/* Status Badge */}
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    fb.status === "Resolved"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                      : fb.status === "Investigating"
                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                      : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                  }`}
                >
                  {fb.status}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              "{fb.comment}"
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                  {fb.category}
                </span>
                <span className="text-[11px] text-stone-400">{fb.date}</span>
              </div>

              {fb.status !== "Resolved" && (
                <button
                  type="button"
                  onClick={() => handleResolve(fb.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Mark as Resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
