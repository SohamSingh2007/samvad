"use client";

import React from "react";
import Link from "next/link";
import { Settings } from "lucide-react";

export function SettingsButton() {
  return (
    <Link
      href="/settings"
      aria-label="Settings"
      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
      title="Settings"
    >
      <Settings className="w-5 h-5" />
    </Link>
  );
}
