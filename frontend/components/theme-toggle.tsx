"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-lg border border-transparent ${className}`} />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative inline-flex items-center justify-center w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-black dark:text-white hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-xs cursor-pointer ${className}`}
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-black dark:text-white" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-black dark:text-white" />
    </button>
  );
}
