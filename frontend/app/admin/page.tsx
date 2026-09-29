"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AdminTabId,
  AdminSidebar,
  AdminCommandPalette,
  DashboardTab,
  UsersTab,
  PerformanceTab,
  GuidesTab,
  TemplatesTab,
  FeedbackTab,
} from "@/samvadComponents/admin";
import { useSession, signOut } from "@/lib/auth-client";
import { toast } from "@/samvadComponents/toastMessage";
import { AuthGuard } from "@/samvadComponents/auth";
import { clearStoredSession, markLoggedOut } from "@/lib/session";

function AdminPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const mainRef = useRef<HTMLElement>(null);

  const initialTab = (searchParams.get("tab") as AdminTabId) || "dashboard";
  const [activeTab, setActiveTab] = useState<AdminTabId>(initialTab);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as AdminTabId;
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTab]);

  const handleSelectTab = (tab: AdminTabId) => {
    setActiveTab(tab);
    router.replace(`/admin?tab=${tab}`);
  };

  const handleSignOutAdmin = async () => {
    markLoggedOut();
    clearStoredSession();
    try {
      await signOut();
    } catch {}
    window.location.replace("/login?signed_out=true");
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab />;
      case "users":
        return <UsersTab />;
      case "performance":
        return <PerformanceTab />;
      case "guides":
        return <GuidesTab />;
      case "templates":
        return <TemplatesTab />;
      case "feedback":
        return <FeedbackTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="w-full h-screen bg-[#faf9f7] dark:bg-[#121212] text-stone-900 dark:text-stone-100 flex overflow-hidden transition-colors">
      {/* Left Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
        onSignOut={handleSignOutAdmin}
      />

      {/* Main Content Workspace - Edge to Edge Full Page */}
      <main ref={mainRef} className="flex-1 bg-[#faf9f7] dark:bg-[#121212] p-5 sm:p-7 lg:p-9 overflow-y-auto bg-dot-grid">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-7xl mx-auto"
          >
            {renderActiveTab()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global ⌘K Command Palette */}
      <AdminCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={handleSelectTab}
      />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen bg-[#faf9f7] dark:bg-[#121212] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-stone-400 border-t-stone-900 animate-spin" />
        </div>
      }
    >
      <AuthGuard requireAdmin={true} loadingMessage="Verifying administrator session...">
        <AdminPageContent />
      </AuthGuard>
    </Suspense>
  );
}
