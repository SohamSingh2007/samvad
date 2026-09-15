"use client";

import React from "react";
import { SamvadNavbar } from "@/samvadComponents/navbar";

export default function NavbarPreviewPage() {
  const sampleUser = {
    id: "usr_samvad_101",
    name: "Soham Singh",
    email: "sohamsingh@samvad.com",
    image: "https://lh3.googleusercontent.com/a/ACg8ocKmsF4aVn4c39cK-xBYnV2louAvLn7obIQmlrFyDP3sHuwRJp7-=s96-c",
  };

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors bg-dot-grid">
      <SamvadNavbar user={sampleUser} />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full space-y-6">
        <div className="text-center space-y-2 py-12">
          <h1 className="text-4xl font-semibold tracking-tight">Google Meet Style Navbar for Samvad</h1>
          <p className="text-stone-500 dark:text-stone-400 text-base max-w-xl mx-auto">
            Accurate implementation of Google Meet top navigation with Samvad branding, interactive code join input, "New" meeting menu, "In-person notes", apps grid, settings, and profile popover.
          </p>
        </div>
      </main>
    </div>
  );
}
