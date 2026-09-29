export type AdminTabId =
  | "dashboard"
  | "users"
  | "performance"
  | "guides"
  | "templates"
  | "feedback";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  status: "active" | "inactive" | "suspended" | "deleted";
  createdAt: string;
  updatedAt?: string;
  meetingsHosted: number;
  accessibilityPreferences?: any;
}

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
  aslEnabled?: boolean;
  islEnabled?: boolean;
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
  category: "Setup" | "AI & ASL" | "Security" | "Infrastructure" | "Best Practices";
  readTime: string;
  summary: string;
  content: string[];
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
  meetingId?: string | null;
  roomCode: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  rating: number; // 1-5
  category: string;
  comment?: string | null;
  status: "Pending" | "Under Review" | "Investigating" | "Resolved" | string;
  createdAt: string;
  // Optional backward compat helpers:
  user?: string;
  email?: string;
  meetingCode?: string;
  date?: string;
}

export interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  categoryCounts: Record<string, number>;
}
