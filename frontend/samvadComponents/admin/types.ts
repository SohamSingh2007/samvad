export type AdminTabId =
  | "dashboard"
  | "performance"
  | "conversations"
  | "guides"
  | "hotspots"
  | "templates"
  | "feedback";

export interface MetricCardData {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  period: string;
  subtext?: string;
}

export interface LiveRoom {
  id: string;
  title: string;
  roomCode: string;
  hostName: string;
  hostAvatar?: string;
  participantsCount: number;
  duration: string;
  islEnabled: boolean;
  status: "live" | "starting" | "ended";
  encryption: "e2ee" | "standard";
}

export interface PerformanceMetric {
  name: string;
  value: string;
  benchmark: string;
  status: "optimal" | "warning" | "critical";
  trend: number[]; // Sparkline data points
}

export interface ConversationLog {
  id: string;
  meetingId: string;
  meetingTitle: string;
  host: string;
  timestamp: string;
  duration: string;
  participants: number;
  snippet: string;
  gesturesDetected: number;
  audioQuality: "Excellent" | "Good" | "Fair";
  captionsAccuracy: string;
  transcriptSample: {
    speaker: string;
    text: string;
    gesture?: string;
    time: string;
  }[];
}

export interface AdminGuide {
  id: string;
  title: string;
  category: "Setup" | "AI & ISL" | "Security" | "Infrastructure" | "Best Practices";
  readTime: string;
  summary: string;
  content: string[];
}

export interface HotspotLocation {
  id: string;
  region: string;
  country: string;
  activeMeetings: number;
  totalUsers: number;
  sharePercentage: number;
  latencyMs: number;
}

export interface MeetingTemplate {
  id: string;
  title: string;
  description: string;
  category: "Accessibility" | "Team & Agile" | "Executive" | "Education" | "Support";
  recommendedParticipants: string;
  features: string[];
  isPopular?: boolean;
  iconType: string;
}

export interface UserFeedbackItem {
  id: string;
  user: string;
  email: string;
  meetingCode: string;
  rating: number; // 1-5
  category: "Sign Language AI" | "Audio Clarity" | "Video Stream" | "Captions" | "General";
  comment: string;
  date: string;
  status: "Under Review" | "Resolved" | "Investigating";
}
