export type SettingsSectionId =
  | "account"
  | "appearance"
  | "accessibility"
  | "sign-language"
  | "audio-speech"
  | "video"
  | "captions"
  | "meeting"
  | "notifications"
  | "privacy-security"
  | "data"
  | "about";

export interface SettingsState {
  // 1. Account
  account: {
    name: string;
    email: string;
    image: string | null;
  };
  // 2. Appearance
  appearance: {
    theme: "light" | "dark" | "system";
    accentColor: "blue" | "emerald" | "amber" | "rose" | "purple" | "stone";
  };
  // 3. Accessibility
  accessibility: {
    fontSize: "small" | "medium" | "large" | "x-large";
    highContrast: boolean;
    reduceAnimations: boolean;
    captionsEnabled: boolean;
  };
  // 4. Sign Language
  signLanguage: {
    language: "isl" | "asl" | "bsl";
    detectionSensitivity: number; // 0 to 100
    cameraDevice: string;
    predictionConfidence: number; // 50 to 99%
  };
  // 5. Audio & Speech
  audioSpeech: {
    microphone: string;
    speaker: string;
    ttsVoice: string;
    speechSpeed: number; // 0.75, 1.0, 1.25, 1.5
    volume: number; // 0 to 100
  };
  // 6. Video
  video: {
    camera: string;
    videoQuality: "auto" | "360p" | "720p" | "1080p";
    mirrorCamera: boolean;
    backgroundEffect: "none" | "blur" | "studio" | "nature";
  };
  // 7. Captions & Translation
  captionsTranslation: {
    enableCaptions: boolean;
    captionSize: "small" | "medium" | "large" | "huge";
    translationLanguage: string;
    autoTranslate: boolean;
  };
  // 8. Meeting
  meeting: {
    defaultMicMuted: boolean;
    defaultCamOff: boolean;
    joinWithVideo: boolean;
    joinWithMic: boolean;
    meetingReminders: "none" | "5m" | "10m" | "15m";
    defaultAccessPolicy: "open" | "approval";
  };
  // 9. Notifications
  notifications: {
    meetingInvitations: boolean;
    meetingReminders: boolean;
    chatMessages: boolean;
    feedbackRecaps: boolean;
  };
  // 10. Privacy & Security
  privacySecurity: {
    twoFactorAuth: boolean;
    endToEndEncryption: boolean;
    localAiProcessing: boolean;
  };
  // 11. Data
  data: {
    autoCloudRecordings: boolean;
  };
}

export const DEFAULT_SETTINGS: SettingsState = {
  account: {
    name: "Soham Singh",
    email: "sohamsingh@samvad.com",
    image: null,
  },
  appearance: {
    theme: "system",
    accentColor: "blue",
  },
  accessibility: {
    fontSize: "medium",
    highContrast: false,
    reduceAnimations: false,
    captionsEnabled: true,
  },
  signLanguage: {
    language: "isl",
    detectionSensitivity: 80,
    cameraDevice: "default",
    predictionConfidence: 85,
  },
  audioSpeech: {
    microphone: "default",
    speaker: "default",
    ttsVoice: "natural-in",
    speechSpeed: 1.0,
    volume: 80,
  },
  video: {
    camera: "default",
    videoQuality: "720p",
    mirrorCamera: true,
    backgroundEffect: "none",
  },
  captionsTranslation: {
    enableCaptions: true,
    captionSize: "medium",
    translationLanguage: "en",
    autoTranslate: true,
  },
  meeting: {
    defaultMicMuted: false,
    defaultCamOff: false,
    joinWithVideo: true,
    joinWithMic: true,
    meetingReminders: "10m",
    defaultAccessPolicy: "open",
  },
  notifications: {
    meetingInvitations: true,
    meetingReminders: true,
    chatMessages: true,
    feedbackRecaps: true,
  },
  privacySecurity: {
    twoFactorAuth: false,
    endToEndEncryption: true,
    localAiProcessing: true,
  },
  data: {
    autoCloudRecordings: true,
  },
};
