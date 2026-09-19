"use client";

import { useEffect } from "react";

/**
 * Ensures favicon strictly matches the OS / system theme (prefers-color-scheme)
 * dynamically across all browsers, independent of in-app theme toggles.
 */
export function SystemFavicon() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const matcher = window.matchMedia("(prefers-color-scheme: dark)");

    const updateFavicon = (isDark: boolean) => {
      const targetIcon = isDark ? "/only-hand-dark.svg" : "/only-hand.svg";
      const iconLinks = document.querySelectorAll<HTMLLinkElement>(
        "link[rel~='icon'], link[rel='shortcut icon']"
      );

      if (iconLinks.length > 0) {
        iconLinks.forEach((link) => {
          link.removeAttribute("media");
          link.href = targetIcon;
        });
      } else {
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = targetIcon;
        document.head.appendChild(link);
      }
    };

    // Initialize with current system preference
    updateFavicon(matcher.matches);

    // Listen strictly for system/OS appearance changes
    const handler = (event: MediaQueryListEvent) => {
      updateFavicon(event.matches);
    };

    matcher.addEventListener("change", handler);
    return () => {
      matcher.removeEventListener("change", handler);
    };
  }, []);

  return null;
}
