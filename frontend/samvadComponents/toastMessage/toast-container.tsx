"use client";

import React, { useEffect, useState } from "react";
import { ToastItem, subscribeToasts } from "./toast";
import { ToastMessage } from "./toast-message";

export interface ToastContainerProps {
  position?: "top-right" | "top-center" | "bottom-right" | "bottom-center";
}

export function ToastContainer({ position = "bottom-right" }: ToastContainerProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = subscribeToasts((newToasts) => {
      setToasts(newToasts);
    });
    return unsubscribe;
  }, []);

  if (!mounted || toasts.length === 0) {
    return null;
  }

  const isBottom = position.startsWith("bottom");

  const getPositionClasses = () => {
    switch (position) {
      case "top-right":
        return "top-4 right-4 sm:top-6 sm:right-6 items-end";
      case "bottom-center":
        return "bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 items-center";
      case "top-center":
        return "top-4 sm:top-6 left-1/2 -translate-x-1/2 items-center";
      case "bottom-right":
      default:
        return "bottom-4 right-4 sm:bottom-6 sm:right-6 items-end";
    }
  };

  const MAX_STACK_VISIBLE = 3;

  return (
    <aside
      aria-label="Notifications"
      aria-live="polite"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed z-[100] pointer-events-none flex flex-col ${getPositionClasses()}`}
    >
      {/* Stacked Card Deck Wrapper */}
      <div
        className="relative pointer-events-auto w-[360px] sm:w-[420px] max-w-[calc(100vw-2rem)] transition-all duration-300 ease-out"
        style={{
          height: isHovered && toasts.length > 1
            ? `${Math.min(toasts.length, 5) * 74}px`
            : "70px",
        }}
      >
        {/* Subtle Stack Count Pill when 2+ cards are stacked and collapsed */}
        {!isHovered && toasts.length > 1 && (
          <div className="absolute -top-3 right-3 z-[60] px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#222226] text-stone-200 border border-white/20 shadow-md flex items-center gap-1.5 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{toasts.length} stacked</span>
          </div>
        )}

        {toasts.map((toast, index) => {
          // index 0 is newest (on top of the deck)
          const isFront = index === 0;
          const isVisible = isHovered ? index < 5 : index < MAX_STACK_VISIBLE;

          // Stacking calculations matching Reference Image 2:
          // Cards peek out with subtle vertical shift and scale reduction
          const translateY = isHovered
            ? (isBottom ? -index * 74 : index * 74)
            : (isBottom ? -index * 12 : index * 12);

          const scale = isHovered
            ? 1
            : index === 0
            ? 1
            : index === 1
            ? 0.95
            : index === 2
            ? 0.90
            : 0.85;

          const opacity = !isVisible
            ? 0
            : isHovered
            ? 1
            : index === 0
            ? 1
            : index === 1
            ? 0.92
            : 0.78;

          const filter = isHovered || isFront
            ? "none"
            : index === 1
            ? "brightness(0.88)"
            : "brightness(0.76)";

          const zIndex = 50 - index;

          return (
            <div
              key={toast.id}
              className="absolute left-0 right-0 origin-bottom transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                [isBottom ? "bottom" : "top"]: 0,
                transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
                zIndex,
                opacity,
                filter,
                pointerEvents: isHovered || isFront ? "auto" : "none",
              }}
            >
              <ToastMessage toast={toast} isStacked={!isHovered && !isFront} />
            </div>
          );
        })}
      </div>
    </aside>
  );
}
