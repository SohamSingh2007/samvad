"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, RotateCcw, Sliders, Search } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { SamvadNavbar } from "@/samvadComponents/navbar";
import { toast } from "@/samvadComponents/toastMessage";
import { AuthGuard } from "@/samvadComponents/auth";
import {
  SettingsState,
  DEFAULT_SETTINGS,
  SettingsSidebar,
  SETTINGS_SECTIONS,
  SECTION_TO_ROUTE,
  resolveSectionFromRoute,
  SettingsContext,
} from "@/samvadComponents/settings";

const STORAGE_KEY = "samvad_user_settings_v1";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const rawSection =
    typeof params?.section === "string"
      ? params.section
      : Array.isArray(params?.section)
      ? params.section[0]
      : undefined;
  const activeSection = resolveSectionFromRoute(rawSection);

  const { data: session } = useSession();
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [, setIsLoaded] = useState(false);
  const [, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  // Detect scroll position to switch background from transparent to solid white
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      setIsScrolled(scrollY > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load preferences from localStorage or current session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } else if (session?.user) {
        setSettings((prev) => ({
          ...prev,
          account: {
            name: session.user.name || prev.account.name,
            email: session.user.email || prev.account.email,
            image: session.user.image || prev.account.image,
          },
        }));
      }
    } catch {
      // ignore storage access errors
    } finally {
      setIsLoaded(true);
    }
  }, [session]);

  // Sync user profile when session loads
  useEffect(() => {
    if (session?.user) {
      setSettings((prev) => ({
        ...prev,
        account: {
          name: session.user.name || prev.account.name,
          email: session.user.email || prev.account.email,
          image: session.user.image || prev.account.image,
        },
      }));
    }
  }, [session?.user]);

  // Update handler
  const handleUpdate = (updater: (prev: SettingsState) => SettingsState) => {
    setSettings((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      setHasChanges(true);
      return next;
    });
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch {
      // ignore
    }
    setHasChanges(false);
    toast.info("Settings reset", {
      description: "Restored all preferences to system defaults.",
      action: { label: "Got It!" },
    });
  };

  const currentSectionDef = SETTINGS_SECTIONS.find((s) => s.id === activeSection);
  const ActiveSectionIcon = currentSectionDef?.icon;

  return (
    <AuthGuard loadingMessage="Verifying settings access...">
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200 bg-dot-grid">
        {/* Top Navbar */}
        <SamvadNavbar user={session?.user} />

        {/* Full-Width Subheader / Menu Bar (Edge to Edge across entire viewport) */}
        <div
          className={`w-full sticky top-16 sm:top-[68px] z-30 transition-all duration-300 ease-out border-b ${
            isScrolled
              ? "bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md border-stone-200/60 dark:border-stone-800/60 shadow-xs"
              : "bg-transparent border-transparent shadow-none"
          }`}
        >
          <div className="w-full px-6 sm:px-10 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {/* Back to Dashboard Button Pill */}
              <Link
                href="/dashboard"
                className="h-8.5 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 bg-stone-100 hover:bg-stone-200/70 dark:bg-stone-800/80 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700/80 transition-all shrink-0 cursor-pointer shadow-2xs group"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Link>

              {/* Subtle Divider */}
              <div className="h-4 w-px bg-stone-200 dark:bg-stone-800 shrink-0" aria-hidden="true" />

              {/* Breadcrumbs Path */}
              <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm select-none min-w-0" aria-label="Breadcrumbs">
                <Link
                  href="/settings/accounts"
                  className="inline-flex items-center gap-1.5 font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors shrink-0"
                >
                  <Sliders className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                  <span>Settings</span>
                </Link>
                <span className="text-stone-300 dark:text-stone-700 select-none font-normal">/</span>
                {currentSectionDef && (
                  <div className="inline-flex items-center gap-1.5 font-semibold text-stone-900 dark:text-stone-100 truncate">
                    {ActiveSectionIcon && (
                      <ActiveSectionIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                    <span className="truncate">{currentSectionDef.shortLabel || currentSectionDef.label}</span>
                  </div>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="relative w-full sm:w-56 md:w-60 h-8.5">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search settings..."
                  className="w-full h-full pl-8.5 pr-3 bg-stone-100 dark:bg-stone-800/70 hover:bg-stone-200/60 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700/80 focus:border-stone-400 dark:focus:border-stone-500 rounded-full text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none transition-all"
                />
              </div>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="h-8.5 px-3.5 rounded-full text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-700/80 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset all to defaults</span>
              </button>
            </div>
          </div>

          {/* Mobile Horizontal Section Tabs (< md screens) */}
          <div className="md:hidden px-4 pb-2.5 pt-1 border-t border-stone-200/60 dark:border-stone-800/60">
            <div className="flex items-start gap-2 overflow-x-auto pb-1 scrollbar-none">
              {SETTINGS_SECTIONS.filter((sec) =>
                sec.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (sec.shortLabel && sec.shortLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
                sec.description.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                const routePath = `/settings/${SECTION_TO_ROUTE[sec.id] || sec.id}`;

                return (
                  <Link
                    key={sec.id}
                    href={routePath}
                    scroll={false}
                    title={`${sec.label}: ${sec.description}`}
                    className="flex flex-col items-center justify-center shrink-0 min-w-[62px] cursor-pointer group focus:outline-none"
                  >
                    <div
                      className={`w-13 h-7.5 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isActive
                          ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] shadow-xs"
                          : "text-stone-500 dark:text-[#c4c7c5] hover:bg-stone-200/60 dark:hover:bg-stone-800/60"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`mt-1 text-[10.5px] leading-tight text-center max-w-[68px] truncate transition-colors ${
                        isActive
                          ? "font-semibold text-stone-900 dark:text-[#c2e7ff]"
                          : "font-normal text-stone-500 dark:text-[#c4c7c5]"
                      }`}
                    >
                      {sec.shortLabel || sec.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Settings Layout Container (Left Rail + Center Workspace + Right Rail) */}
        <div className="flex-1 flex w-full justify-between">
          {/* Left Navigation Rail: Aligned with the SAMVAD logo at pl-6 sm:pl-10 */}
          <aside className="hidden md:flex flex-col items-start justify-center pl-6 sm:pl-10 w-24 lg:w-28 shrink-0 sticky top-[124px] sm:top-[132px] h-[calc(100vh-132px)] overflow-y-auto scrollbar-none z-20 select-none py-4">
            <div className="my-auto w-full">
              <SettingsSidebar
                column="left"
                activeSection={activeSection}
                searchQuery={searchQuery}
              />
            </div>
          </aside>

          {/* Main Settings Content Area */}
          <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 min-w-0">
            {/* Active Content Workspace */}
            <SettingsContext.Provider
              value={{
                settings,
                handleUpdate,
                handleResetDefaults,
                activeSection,
                searchQuery,
                setSearchQuery,
              }}
            >
              <main className="w-full min-w-0 bg-transparent">
                {children}
              </main>
            </SettingsContext.Provider>
          </div>

          {/* Right Navigation Rail: Aligned with the Profile avatar at pr-6 sm:pr-10 */}
          <aside className="hidden md:flex flex-col items-end justify-center pr-6 sm:pr-10 w-24 lg:w-28 shrink-0 sticky top-[124px] sm:top-[132px] h-[calc(100vh-132px)] overflow-y-auto scrollbar-none z-20 select-none py-4">
            <div className="my-auto w-full">
              <SettingsSidebar
                column="right"
                activeSection={activeSection}
                searchQuery={searchQuery}
              />
            </div>
          </aside>
        </div>
      </div>
    </AuthGuard>
  );
}
