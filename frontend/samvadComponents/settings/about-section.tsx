"use client";

import React, { useState } from "react";
import { Info, HelpCircle, AlertOctagon, FileText, Shield, ExternalLink, Check } from "lucide-react";
import { toast } from "@/samvadComponents/toastMessage";

export function AboutSection() {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportCategory, setReportCategory] = useState("isl-accuracy");

  const [activePolicyModal, setActivePolicyModal] = useState<"terms" | "privacy" | null>(null);

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) {
      toast.warning("Please describe the issue", { description: "Include details so we can fix it." });
      return;
    }
    setShowReportModal(false);
    setReportText("");
    toast.success("Feedback submitted", {
      description: "Thank you! Our accessibility engineering team has received your report.",
      action: { label: "Got It!" },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          About Samvad
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Application version, documentation help, bug reporting, and legal compliance.
        </p>
      </div>

      {/* App Version Info Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-emerald-400 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Samvad Video Platform</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Accessible communication powered by real-time ISL AI</p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-full border border-stone-200 dark:border-stone-700">
            v2.4.0 (Latest)
          </span>
        </div>
      </div>

      {/* Support & Actions Grid */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Help & Support</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Help & Tutorials */}
          <button
            type="button"
            onClick={() => {
              toast.info("Help & Tutorials", {
                description: "User guide & gesture reference manual opened.",
                action: { label: "Got It!" },
              });
            }}
            className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-left flex items-start gap-3 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">Help & Tutorials</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Learn sign gestures and shortcut keys</p>
            </div>
          </button>

          {/* Report a Problem */}
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-left flex items-start gap-3 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">Report a Problem</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Flag translation inaccuracy or bugs</p>
            </div>
          </button>
        </div>
      </div>

      {/* Legal & Compliance */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Legal & Terms</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActivePolicyModal("terms")}
            className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-left flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-stone-500" />
              <span className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200">Terms of Service</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </button>

          <button
            type="button"
            onClick={() => setActivePolicyModal("privacy")}
            className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-left flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-stone-500" />
              <span className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200">Privacy Policy</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </button>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Report a Problem</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Help us improve the ISL translation engine and video stability.</p>

            <form onSubmit={handleSubmitReport} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Issue Category</label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100"
                >
                  <option value="isl-accuracy">ISL Sign Recognition Inaccuracy</option>
                  <option value="audio-video">Audio / Video Stuttering</option>
                  <option value="captions">Closed Captions Delay</option>
                  <option value="other">General Feedback / Bug</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Description</label>
                <textarea
                  rows={4}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Describe what happened..."
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-stone-900 dark:bg-white text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-stone-200"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Legal Modal */}
      {activePolicyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 capitalize">
              {activePolicyModal === "terms" ? "Terms of Service" : "Privacy Policy"}
            </h3>

            <div className="flex-1 overflow-y-auto text-xs text-stone-600 dark:text-stone-400 space-y-2.5 pr-2">
              <p>
                Welcome to Samvad. By using our accessible video conferencing platform, you agree to our policies regarding real-time optical gesture processing and encrypted communications.
              </p>
              <p>
                <strong>Camera & Gesture Privacy:</strong> Hand tracking and Indian Sign Language recognition are executed client-side via optimized neural network models. No raw camera feeds are recorded or stored without explicit meeting recording consent.
              </p>
              <p>
                <strong>Audio & Speech Data:</strong> Real-time text-to-speech synthesizers operate strictly within session scopes and are discarded upon call conclusion.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setActivePolicyModal(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-stone-900 dark:bg-white text-white dark:text-stone-950"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
