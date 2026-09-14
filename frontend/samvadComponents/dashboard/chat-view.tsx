"use client";

import React, { useState } from "react";
import { 
  MessageSquare, 
  Send, 
  Search, 
  Sparkles, 
  Hash, 
  Bot, 
  Smile, 
  Paperclip,
  CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatChannel {
  id: string;
  name: string;
  type: "channel" | "ai" | "direct";
  lastMessage: string;
  time: string;
  unread?: number;
}

interface ChatMessage {
  id: string;
  sender: string;
  isSelf: boolean;
  avatar?: string;
  text: string;
  time: string;
}

const CHANNELS: ChatChannel[] = [
  {
    id: "general",
    name: "General Team Sync",
    type: "channel",
    lastMessage: "Looking forward to tomorrow's product demo call.",
    time: "10:42 AM",
    unread: 2,
  },
  {
    id: "ai-bot",
    name: "Samvad AI Assistant",
    type: "ai",
    lastMessage: "Ready to assist with ISL transcription and meeting summaries.",
    time: "Yesterday",
  },
  {
    id: "research",
    name: "Accessibility & ISL",
    type: "channel",
    lastMessage: "Gesture model updated to 94% accuracy for 50 Indian signs.",
    time: "Sep 12",
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  general: [
    {
      id: "m1",
      sender: "Rohan Verma",
      isSelf: false,
      text: "Hey everyone! Don't forget our weekly sync at 3 PM today.",
      time: "10:30 AM",
    },
    {
      id: "m2",
      sender: "Priya Sharma",
      isSelf: false,
      text: "I have prepared the meeting notes and live captions setup on Samvad.",
      time: "10:35 AM",
    },
    {
      id: "m3",
      sender: "You",
      isSelf: true,
      text: "Awesome! I'll join from the instant meeting room.",
      time: "10:40 AM",
    },
    {
      id: "m4",
      sender: "Rohan Verma",
      isSelf: false,
      text: "Looking forward to tomorrow's product demo call.",
      time: "10:42 AM",
    },
  ],
  "ai-bot": [
    {
      id: "b1",
      sender: "Samvad AI",
      isSelf: false,
      text: "Namaste! I'm your Samvad AI Assistant. I can help summarize video meetings, transcribe sign gestures, or schedule your calendar.",
      time: "Yesterday",
    },
    {
      id: "b2",
      sender: "You",
      isSelf: true,
      text: "How does the Indian Sign Language recognition work?",
      time: "Yesterday",
    },
    {
      id: "b3",
      sender: "Samvad AI",
      isSelf: false,
      text: "Samvad runs real-time MediaPipe hand landmark tracking in your browser and classifies Indian Sign Language gestures into live captions with zero cloud latency!",
      time: "Yesterday",
    },
  ],
  research: [
    {
      id: "r1",
      sender: "Dr. Ananya Iyer",
      isSelf: false,
      text: "Gesture model updated to 94% accuracy for 50 Indian signs.",
      time: "Sep 12",
    },
  ],
};

export interface ChatViewProps {
  user?: any;
}

export function ChatView({ user }: ChatViewProps) {
  const [selectedChannelId, setSelectedChannelId] = useState("general");
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [searchQuery, setSearchQuery] = useState("");

  const activeChannel = CHANNELS.find((c) => c.id === selectedChannelId) || CHANNELS[0];
  const currentMessages = messages[selectedChannelId] || [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = messageInput.trim();
    if (!text) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: user?.name || "You",
      isSelf: true,
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => ({
      ...prev,
      [selectedChannelId]: [...(prev[selectedChannelId] || []), newMessage],
    }));
    setMessageInput("");

    // AI bot reply simulation
    if (selectedChannelId === "ai-bot") {
      setTimeout(() => {
        const botReply: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "Samvad AI",
          isSelf: false,
          text: "I received your message! All features including Live STT, Gesture detection, and Meeting transcripts are operational.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => ({
          ...prev,
          "ai-bot": [...(prev["ai-bot"] || []), botReply],
        }));
      }, 800);
    }
  };

  const filteredChannels = CHANNELS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
              <span>Chat & Channels</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Communicate with meeting participants and collaborate with team members.
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Layout: Channels Sidebar + Active Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
        {/* Left: Channel List */}
        <div className="lg:col-span-4 bg-white dark:bg-stone-900 rounded-3xl border-2 border-stone-200/80 dark:border-stone-800 shadow-sm p-4 flex flex-col gap-3 overflow-hidden">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="pl-9 rounded-xl text-xs bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700"
            />
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filteredChannels.map((c) => {
              const isSelected = c.id === selectedChannelId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedChannelId(c.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-[#c2e7ff]/60 dark:bg-[#004a77]/40 text-[#001d35] dark:text-[#c2e7ff]"
                      : "hover:bg-stone-100 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-300"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      c.type === "ai"
                        ? "bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                    }`}
                  >
                    {c.type === "ai" ? <Bot className="w-5 h-5" /> : <Hash className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold truncate">{c.name}</p>
                      <span className="text-[10px] text-stone-400 shrink-0 font-mono">{c.time}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                      {c.lastMessage}
                    </p>
                  </div>

                  {c.unread && c.unread > 0 && !isSelected && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#7075f7] text-white rounded-full leading-none shrink-0 mt-1">
                      {c.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Message Thread */}
        <div className="lg:col-span-8 bg-white dark:bg-stone-900 rounded-3xl border-2 border-stone-200/80 dark:border-stone-800 shadow-sm p-4 sm:p-5 flex flex-col justify-between overflow-hidden">
          {/* Thread Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  activeChannel.type === "ai"
                    ? "bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                }`}
              >
                {activeChannel.type === "ai" ? <Bot className="w-5 h-5" /> : <Hash className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {activeChannel.name}
                </h3>
                <p className="text-[11px] text-stone-400">
                  {activeChannel.type === "ai" ? "Always active AI assistant" : "Encrypted room channel"}
                </p>
              </div>
            </div>

            {activeChannel.type === "ai" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                <Sparkles className="w-3 h-3" />
                <span>Samvad Model 2.0</span>
              </span>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2">
            {currentMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                    {msg.sender}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">{msg.time}</span>
                </div>
                <div
                  className={`px-4 py-2.5 rounded-2xl max-w-md text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.isSelf
                      ? "bg-stone-900 text-white dark:bg-white dark:text-stone-950 rounded-tr-xs"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-tl-xs"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={`Message ${activeChannel.name}...`}
              className="flex-1 rounded-xl text-xs sm:text-sm bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700"
            />
            <Button
              type="submit"
              disabled={!messageInput.trim()}
              className="rounded-xl px-4 gap-1.5 bg-[#7075f7] hover:bg-[#5f64f5] text-white shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
