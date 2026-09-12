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
        return "bottom-4 sm:bottom-6 inset-x-0 items-center justify-center";
      case "top-center":
        return "top-4 sm:top-6 inset-x-0 items-center justify-center";
      case "bottom-right":
      default:
        return "bottom-4 right-4 sm:bottom-6 sm:right-6 items-end";
    }
  };

  return (
    <div
      aria-live="polite"
      className={`fixed z-[100] pointer-events-none flex gap-2.5 px-4 max-w-full ${
        isBottom ? "flex-col-reverse" : "flex-col"
      } ${getPositionClasses()}`}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto transition-all duration-200">
          <ToastMessage toast={toast} />
        </div>
      ))}
    </div>
  );
}
