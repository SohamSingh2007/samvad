"use client";

import React, { useState } from "react";
import { Database, Download, Trash2, Clock, Film, AlertTriangle } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";
import { SettingsState } from "./types";

interface DataSectionProps {
  settings: SettingsState;
  onUpdate: (updater: (prev: SettingsState) => SettingsState) => void;
}

export function DataSection({ settings, onUpdate }: DataSectionProps) {
  const [history, setHistory] = useState([
    { id: "m1", title: "Product Team Sync (ISL Translated)", date: "Sep 12, 2026", duration: "32 mins", participants: 4 },
    { id: "m2", title: "Accessibility Sprint Review", date: "Sep 10, 2026", duration: "45 mins", participants: 6 },
    { id: "m3", title: "Design Feedback Call", date: "Sep 08, 2026", duration: "18 mins", participants: 2 },
  ]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleDownloadData = () => {
    const dataBlob = new Blob([JSON.stringify({ settings, history, exportedAt: new Date().toISOString() }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `samvad-user-data-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export complete", {
      description: "Your meeting metadata and account preferences have been downloaded.",
      action: { label: "Got It!" },
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    toast.success("History cleared", { description: "Your meeting call logs have been deleted." });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Type DELETE to confirm", { description: "Please enter the confirmation text exactly." });
      return;
    }
    setShowDeleteModal(false);
    toast.error("Account scheduled for deletion", {
      description: "You will be logged out shortly.",
      duration: 3000,
    });
    setTimeout(() => {
      window.location.href = "/login";
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          Data & Storage
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Access your past call logs, cloud meeting recordings, data export, and account deletion.
        </p>
      </div>

      {/* Meeting History */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Meeting History</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Past video meetings and transcripts.</p>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-xs font-medium text-stone-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Clear all history
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <div className="space-y-2.5">
            {history.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0 text-stone-600 dark:text-stone-300">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">{m.title}</p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      {m.date} • {m.duration} • {m.participants} participants
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic py-3 text-center">No past meetings found</p>
        )}
      </div>

      {/* Recordings Manager */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-stone-500" />
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Meeting Recordings</h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Cloud storage for video meetings and synced ISL text subtitles.
        </p>

        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-stone-600 dark:text-stone-400">Cloud Storage Used</span>
            <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">1.2 GB of 15 GB</span>
          </div>
          <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
            <div className="h-full w-[8%] bg-blue-600 rounded-full" />
          </div>
        </div>
      </div>

      {/* Download Data Export */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Download Account Data</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Export your preferences, past meeting metadata, and ISL accuracy logs.</p>
        </div>
        <button
          type="button"
          onClick={handleDownloadData}
          className="px-4 py-2 rounded-full text-xs font-semibold bg-stone-900 dark:bg-white text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Export Data
        </button>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="p-5 sm:p-6 rounded-3xl bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="text-sm font-semibold">Danger Zone</h3>
        </div>
        <p className="text-xs text-red-700/80 dark:text-red-300/80 leading-relaxed">
          Permanently delete your Samvad profile, personalized sign language models, past meeting transcripts, and recordings. This action cannot be undone.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-xs"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Are you absolutely sure?</h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              This will permanently delete your account and all associated meeting history. Please type{" "}
              <strong className="font-mono text-stone-900 dark:text-stone-100">DELETE</strong> to confirm.
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-full text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
