"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { ToastItem, dismissToast } from "./toast";
import { SuccessBadge, ErrorBadge, WarningBadge, InfoBadge } from "./toast-badges";

export function ToastMessage({ toast }: { toast: ToastItem }) {
  const [isClosing, setIsClosing] = useState(false);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      dismissToast(toast.id);
    }, 200);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toast.action?.onClick) {
      toast.action.onClick(e);
    }
    handleDismiss();
  };

  const renderBadge = () => {
    switch (toast.type) {
      case "success":
        return <SuccessBadge className="w-5 h-5" />;
      case "error":
        return <ErrorBadge className="w-5 h-5" />;
      case "warning":
        return <WarningBadge className="w-5 h-5" />;
      case "info":
      default:
        return <InfoBadge className="w-5 h-5" />;
    }
  };

  const hasDescription = Boolean(toast.description);

  return (
    <div
      role="alert"
      className={`relative group flex items-center justify-between gap-3.5 sm:gap-4 px-4 sm:px-5 py-3 rounded-2xl bg-[#141417]/95 text-white border border-white/[0.12] shadow-[0_20px_45px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-xl transition-all duration-200 select-none overflow-hidden ${
        isClosing
          ? "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          : "opacity-100 scale-100 translate-y-0"
      } ${hasDescription ? "w-full max-w-[420px]" : "w-auto max-w-[460px] rounded-full"}`}
    >
      {/* Top Specular Sheen (matching Image 1 glassmorphism) */}
      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/[0.09] via-transparent to-transparent pointer-events-none" />

      {/* Left Icon & Text Content */}
      <div className="flex items-center gap-3 sm:gap-3.5 relative z-10 flex-1 min-w-0">
        <div className="shrink-0">{renderBadge()}</div>

        <div className="flex-1 min-w-0">
          <p
            className={`font-semibold text-white tracking-tight leading-snug truncate ${
              hasDescription ? "text-sm" : "text-[13px] sm:text-sm font-medium"
            }`}
          >
            {toast.title}
          </p>
          {hasDescription && (
            <p className="text-xs text-stone-400 font-normal leading-normal mt-0.5 break-words">
              {toast.description}
            </p>
          )}
        </div>
      </div>

      {/* Right Actions & Close */}
      <div className="flex items-center gap-2 relative z-10 shrink-0">
        {toast.action && (
          <>
            {/* Single line divider (matching Image 2) */}
            {!hasDescription && (
              <div className="h-3.5 w-px bg-white/25 mx-1 shrink-0" />
            )}

            {/* Action button */}
            <button
              type="button"
              onClick={handleActionClick}
              className={`transition-all active:scale-95 cursor-pointer whitespace-nowrap ${
                toast.action.variant === "solid" || (!toast.action.variant && toast.type === "error")
                  ? "px-4 py-1.5 rounded-full text-xs font-bold bg-white text-stone-950 hover:bg-stone-200 shadow-md"
                  : !hasDescription
                  ? "text-[13px] font-medium text-white hover:text-stone-300 hover:underline px-1"
                  : "px-4 py-1.5 rounded-full text-xs font-medium bg-white/[0.12] hover:bg-white/[0.18] text-white border border-white/15 shadow-sm"
              }`}
            >
              {toast.action.label}
            </button>
          </>
        )}

        {/* Dismiss Button - only shown when no action is present */}
        {toast.dismissible && !toast.action && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors opacity-70 hover:opacity-100 cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
