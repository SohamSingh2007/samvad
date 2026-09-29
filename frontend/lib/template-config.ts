"use client";

import { useState, useEffect } from "react";

export interface AboutPageTemplate {
  title: string;
  tagline: string;
  mission: string;
  story: string;
  highlights: string[];
  contactEmail: string;
}

export interface TermsPageTemplate {
  title: string;
  lastUpdated: string;
  introduction: string;
  acceptableUse: string;
  aiSignLanguageDisclaimer: string;
  privacySummary: string;
  contactEmail: string;
}

export interface SocialLinksTemplate {
  github: string;
  twitter: string;
  discord: string;
  linkedin: string;
  youtube: string;
}

export interface VerificationPageTemplate {
  title: string;
  description: string;
  codeLength: number;
  resendCooldownSeconds: number;
  successTitle: string;
  successDescription: string;
  helpLinkText: string;
}

export interface ForgotPasswordPageTemplate {
  title: string;
  description: string;
  buttonText: string;
  successTitle: string;
  successDescription: string;
  securityNotice: string;
}

export interface AppTemplatesConfig {
  about: AboutPageTemplate;
  terms: TermsPageTemplate;
  socialLinks: SocialLinksTemplate;
  verification: VerificationPageTemplate;
  forgotPassword: ForgotPasswordPageTemplate;
}

export const DEFAULT_PAGE_TEMPLATES: AppTemplatesConfig = {
  about: {
    title: "About Samvad",
    tagline: "Bridging the communication gap with real-time AI sign language translation.",
    mission: "Samvad is engineered with the core conviction that digital accessibility is a universal right. We combine state-of-the-art computer vision, speech models, and WebRTC streaming to empower real-time, bidirectional dialogue between Deaf, Hard-of-Hearing, and hearing participants.",
    story: "Born as an inclusive communication ecosystem, Samvad directly translates American Sign Language (ASL) hand landmarks and gestures into synthesized voice and captions, while rendering spoken words into instant, high-contrast visual cues without requiring expensive hardware.",
    highlights: [
      "Real-time 60fps Hand Landmark Mesh Tracking",
      "Sub-100ms Bidirectional Audio & Sign Text Translation",
      "End-to-End Encrypted WebRTC Video Rooms",
      "Certified ASL Vocabulary & Dialect Adaptation",
    ],
    contactEmail: "contact@samvad.ai",
  },
  terms: {
    title: "Terms of Service & Usage Policy",
    lastUpdated: "September 2026",
    introduction: "Welcome to Samvad. By accessing or using our real-time video conferencing, sign language interpretation tools, or web services, you agree to comply with and be bound by these Terms of Service.",
    acceptableUse: "Users agree not to misuse Samvad infrastructure for unauthorized surveillance, harassment, automated bulk scraping, or intercepting encrypted room streams. All participants must respect local recording consent standards.",
    aiSignLanguageDisclaimer: "Samvad utilizes neural vision models for ASL sign language detection and transcription. While our algorithms achieve industry-leading precision, automated translations are provided on a best-effort basis and should not substitute for certified human interpreters in high-stakes legal or critical medical proceedings.",
    privacySummary: "We uphold strict privacy-by-design principles. Peer-to-peer encrypted channels are utilized for media streams. Session transcripts are processed ephemerally in volatile memory unless a host explicitly enables meeting recording.",
    contactEmail: "legal@samvad.ai",
  },
  socialLinks: {
    github: "https://github.com/SohamSingh2007/samvad",
    twitter: "https://twitter.com/samvad_ai",
    discord: "https://discord.gg/samvad",
    linkedin: "https://linkedin.com/company/samvad-ai",
    youtube: "https://youtube.com/@samvad-ai",
  },
  verification: {
    title: "Verify your email",
    description: "We've sent a 6-digit confirmation code to your registered email address. Enter the code below to confirm your account.",
    codeLength: 6,
    resendCooldownSeconds: 45,
    successTitle: "Email Verified Successfully!",
    successDescription: "Your account is verified. Taking you to dashboard...",
    helpLinkText: "Need help? Contact support",
  },
  forgotPassword: {
    title: "Reset password",
    description: "Enter the email address associated with your account and we’ll send you instructions to reset your password.",
    buttonText: "Send Reset Link",
    successTitle: "Check your inbox",
    successDescription: "We have dispatched reset instructions to your registered email. If an account exists, you will receive an email shortly.",
    securityNotice: "Password reset tokens are valid for 15 minutes. For security, never share reset links with anyone.",
  },
};

const STORAGE_KEY = "samvad_app_page_templates";

export function getPageTemplates(): AppTemplatesConfig {
  if (typeof window === "undefined") {
    return DEFAULT_PAGE_TEMPLATES;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PAGE_TEMPLATES;
    const parsed = JSON.parse(raw);
    return {
      about: { ...DEFAULT_PAGE_TEMPLATES.about, ...parsed.about },
      terms: { ...DEFAULT_PAGE_TEMPLATES.terms, ...parsed.terms },
      socialLinks: { ...DEFAULT_PAGE_TEMPLATES.socialLinks, ...parsed.socialLinks },
      verification: { ...DEFAULT_PAGE_TEMPLATES.verification, ...parsed.verification },
      forgotPassword: { ...DEFAULT_PAGE_TEMPLATES.forgotPassword, ...parsed.forgotPassword },
    };
  } catch {
    return DEFAULT_PAGE_TEMPLATES;
  }
}

export function savePageTemplates(updates: Partial<AppTemplatesConfig>): AppTemplatesConfig {
  if (typeof window === "undefined") return DEFAULT_PAGE_TEMPLATES;
  try {
    const current = getPageTemplates();
    const updated: AppTemplatesConfig = {
      about: updates.about ? { ...current.about, ...updates.about } : current.about,
      terms: updates.terms ? { ...current.terms, ...updates.terms } : current.terms,
      socialLinks: updates.socialLinks ? { ...current.socialLinks, ...updates.socialLinks } : current.socialLinks,
      verification: updates.verification ? { ...current.verification, ...updates.verification } : current.verification,
      forgotPassword: updates.forgotPassword ? { ...current.forgotPassword, ...updates.forgotPassword } : current.forgotPassword,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("samvad:templates-updated"));
    return updated;
  } catch (e) {
    console.error("Failed to save page templates to localStorage", e);
    return getPageTemplates();
  }
}

export function resetPageTemplates(): AppTemplatesConfig {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("samvad:templates-updated"));
  }
  return DEFAULT_PAGE_TEMPLATES;
}

export function usePageTemplates() {
  const [templates, setTemplates] = useState<AppTemplatesConfig>(DEFAULT_PAGE_TEMPLATES);

  useEffect(() => {
    setTemplates(getPageTemplates());

    const handleUpdate = () => {
      setTemplates(getPageTemplates());
    };

    window.addEventListener("samvad:templates-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("samvad:templates-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return {
    templates,
    saveTemplates: savePageTemplates,
    resetTemplates: resetPageTemplates,
  };
}
