"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AdminTabId,
  AdminSidebar,
  AdminCommandPalette,
  DashboardTab,
  PerformanceTab,
  ConversationsTab,
  GuidesTab,
  HotspotsTab,
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
      case "performance":
        return <PerformanceTab />;
      case "conversations":
        return <ConversationsTab />;
      case "guides":
        return <GuidesTab />;
      case "hotspots":
        return <HotspotsTab />;
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
      <main className="flex-1 bg-[#faf9f7] dark:bg-[#121212] p-5 sm:p-7 lg:p-9 overflow-y-auto bg-dot-grid">
        <div className="w-full max-w-7xl mx-auto">
          {renderActiveTab()}
        </div>
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
