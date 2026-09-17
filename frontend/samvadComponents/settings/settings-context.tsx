"use client";

import React, { createContext, useContext } from "react";
import { SettingsState, SettingsSectionId } from "./types";

export interface SettingsContextType {
  settings: SettingsState;
  handleUpdate: (updater: (prev: SettingsState) => SettingsState) => void;
  handleResetDefaults: () => void;
  activeSection: SettingsSectionId;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const SettingsContext = createContext<SettingsContextType | null>(null);

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider (SettingsLayout)");
  }
  return ctx;
}
