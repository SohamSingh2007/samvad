"use client";

import React from "react";
import {
  useSettings,
  AccountSection,
  AppearanceSection,
  AccessibilitySection,
  SignLanguageSection,
  AudioSpeechSection,
  VideoSection,
  CaptionsSection,
  MeetingSection,
  NotificationsSection,
  PrivacySecuritySection,
  DataSection,
  AboutSection,
} from "@/samvadComponents/settings";

export default function SettingsSectionPage() {
  const { activeSection, settings, handleUpdate } = useSettings();

  switch (activeSection) {
    case "account":
      return <AccountSection settings={settings} onUpdate={handleUpdate} />;
    case "appearance":
      return <AppearanceSection settings={settings} onUpdate={handleUpdate} />;
    case "accessibility":
      return <AccessibilitySection settings={settings} onUpdate={handleUpdate} />;
    case "sign-language":
      return <SignLanguageSection settings={settings} onUpdate={handleUpdate} />;
    case "audio-speech":
      return <AudioSpeechSection settings={settings} onUpdate={handleUpdate} />;
    case "video":
      return <VideoSection settings={settings} onUpdate={handleUpdate} />;
    case "captions":
      return <CaptionsSection settings={settings} onUpdate={handleUpdate} />;
    case "meeting":
      return <MeetingSection settings={settings} onUpdate={handleUpdate} />;
    case "notifications":
      return <NotificationsSection settings={settings} onUpdate={handleUpdate} />;
    case "privacy-security":
      return <PrivacySecuritySection settings={settings} onUpdate={handleUpdate} />;
    case "data":
      return <DataSection settings={settings} onUpdate={handleUpdate} />;
    case "about":
      return <AboutSection />;
    default:
      return <AccountSection settings={settings} onUpdate={handleUpdate} />;
  }
}
