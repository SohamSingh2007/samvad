"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Search, 
  Sparkles, 
  Hash, 
  Bot, 
  Smile, 
  Plus,
  Paperclip,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Reply,
  Star,
  Pin,
  Forward,
  Copy,
  Flag,
  Trash2,
  CheckSquare,
  X,
  Check,
  Users,
  UserPlus,
  User,
  MoreHorizontal,
  MessageSquare,
  ArrowUpDown,
  GripVertical,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/samvadComponents/toastMessage";

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
  image?: string;
  time: string;
  date?: string;
  reactions?: string[];
  isStarred?: boolean;
  isPinned?: boolean;
  replyTo?: {
    sender: string;
    text: string;
  };
}

const INITIAL_CHANNELS: ChatChannel[] = [
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
    time: "10:00 AM",
  },
  {
    id: "research",
    name: "Accessibility & ISL",
    type: "channel",
    lastMessage: "That's fantastic progress! We should test it in tomorrow's demo.",
    time: "09:30 AM",
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
      date: "Yesterday",
    },
    {
      id: "m2",
      sender: "Priya Sharma",
      isSelf: false,
      text: "I have prepared the meeting notes and live captions setup on Samvad.",
      time: "10:35 AM",
      date: "Yesterday",
    },
    {
      id: "m3",
      sender: "You",
      isSelf: true,
      text: "Awesome! I'll join from the instant meeting room.",
      time: "10:40 AM",
      date: "Today",
    },
    {
      id: "m4",
      sender: "Rohan Verma",
      isSelf: false,
      text: "Looking forward to tomorrow's product demo call.",
      time: "10:42 AM",
      date: "Today",
    },
  ],
  "ai-bot": [
    {
      id: "b1",
      sender: "Samvad AI",
      isSelf: false,
      text: "Namaste! I'm your Samvad AI Assistant. I can help summarize video meetings, transcribe sign gestures, or schedule your calendar.",
      time: "02:15 PM",
      date: "Yesterday",
    },
    {
      id: "b2",
      sender: "You",
      isSelf: true,
      text: "How does the Indian Sign Language recognition work?",
      time: "02:18 PM",
      date: "Yesterday",
    },
    {
      id: "b3",
      sender: "Samvad AI",
      isSelf: false,
      text: "Samvad runs real-time MediaPipe hand landmark tracking in your browser and classifies Indian Sign Language gestures into live captions with zero cloud latency!",
      time: "10:00 AM",
      date: "Today",
    },
  ],
  research: [
    {
      id: "r1",
      sender: "Dr. Ananya Iyer",
      isSelf: false,
      text: "Gesture model updated to 94% accuracy for 50 Indian signs.",
      time: "04:15 PM",
      date: "Sep 12, 2026",
    },
    {
      id: "r2",
      sender: "You",
      isSelf: true,
      text: "That's fantastic progress! We should test it in tomorrow's demo.",
      time: "09:30 AM",
      date: "Today",
    },
  ],
};

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const MORE_REACTIONS = [
  "🎉", "🔥", "👏", "💯", "✨", "🥳",
  "🤔", "👀", "🤝", "🚀", "💡", "⚡",
  "😍", "🤩", "🙌", "💪", "😎", "🫡",
  "😴", "🤯", "😭", "😡", "💩", "🎯",
  "🌟", "✅", "💔", "💐", "🥂", "🍿",
  "🌸", "👌", "✌️", "🤞", "🤙", "🤐"
];

export interface ChatViewProps {
  user?: any;
}

export function ChatView({ user }: ChatViewProps) {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [searchQuery, setSearchQuery] = useState("");

  // Interaction states for message context menu
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const [activeMenuMsg, setActiveMenuMsg] = useState<ChatMessage | null>(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [showMoreReactionsMsgId, setShowMoreReactionsMsgId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());

  const closeContextMenu = () => {
    setActiveMenuMsgId(null);
    setActiveMenuMsg(null);
  };

  const [channels, setChannels] = useState<ChatChannel[]>(INITIAL_CHANNELS);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRearranging, setIsRearranging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [modalType, setModalType] = useState<"group" | "direct">("group");
  const [modalInputName, setModalInputName] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const activeChannel = channels.find((c) => c.id === selectedChannelId) || null;
  const currentMessages = selectedChannelId ? (messages[selectedChannelId] || []) : [];

  // Load saved channel order
  useEffect(() => {
    try {
      const saved = localStorage.getItem("samvad_channels_order");
      if (saved) {
        const orderIds: string[] = JSON.parse(saved);
        setChannels((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          const reordered: ChatChannel[] = [];
          for (const id of orderIds) {
            const item = map.get(id);
            if (item) {
              reordered.push(item);
              map.delete(id);
            }
          }
          return [...reordered, ...Array.from(map.values())];
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const saveChannelsOrder = (list: ChatChannel[]) => {
    try {
      localStorage.setItem("samvad_channels_order", JSON.stringify(list.map((c) => c.id)));
    } catch {
      // ignore
    }
  };

  const moveChannel = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= channels.length) return;

    setChannels((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      saveChannelsOrder(updated);
      return updated;
    });
  };

  const handleSortChannels = (sortType: "unread" | "alphabetical" | "recent" | "reset") => {
    setChannels((prev) => {
      let sorted = [...prev];
      if (sortType === "alphabetical") {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        toast.success("Sorted alphabetically (A-Z)");
      } else if (sortType === "unread") {
        sorted.sort((a, b) => (b.unread || 0) - (a.unread || 0));
        toast.success("Sorted by unread chats first");
      } else if (sortType === "recent") {
        sorted = [...INITIAL_CHANNELS].filter((c) => prev.some((p) => p.id === c.id));
        const others = prev.filter((p) => !sorted.some((s) => s.id === p.id));
        sorted = [...sorted, ...others];
        toast.success("Sorted by recent activity");
      } else if (sortType === "reset") {
        sorted = [...INITIAL_CHANNELS];
        toast.info("Reset to default order");
      }
      saveChannelsOrder(sorted);
      return sorted;
    });
  };

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    setChannels((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedIndex, 1);
      updated.splice(dropIndex, 0, moved);
      saveChannelsOrder(updated);
      return updated;
    });
    setDraggedIndex(null);
    setDragOverIndex(null);
    toast.success("Chats rearranged");
  };

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeContextMenu();
        setActiveReactionMsgId(null);
        setShowMoreReactionsMsgId(null);
        setIsPlusMenuOpen(false);
        setIsMoreMenuOpen(false);
        setIsModalOpen(false);
        setIsRearranging(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close context menu on outside click without blocking scroll
  useEffect(() => {
    if (!activeMenuMsgId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-message-menu]")) return;
      closeContextMenu();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuMsgId]);

  // Auto-scroll to show full menu when context menu opens and is not completely visible
  useEffect(() => {
    if (!activeMenuMsgId) return;

    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const menuEl = container.querySelector("[data-message-menu]") as HTMLElement | null;
        if (!menuEl) return;

        const containerRect = container.getBoundingClientRect();
        const menuRect = menuEl.getBoundingClientRect();

        // If bottom of menu is cut off below visible area of messages container
        const overflowBottom = menuRect.bottom - containerRect.bottom;
        if (overflowBottom > -8) {
          container.scrollBy({
            top: overflowBottom + 24,
            behavior: "smooth",
          });
        } else if (menuRect.top < containerRect.top) {
          // If top of menu is cut off above visible area
          container.scrollBy({
            top: menuRect.top - containerRect.top - 16,
            behavior: "smooth",
          });
        }
      });
    }, 60);

    return () => clearTimeout(timer);
  }, [activeMenuMsgId]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannelId) return;
    const text = messageInput.trim();
    if (!text && !selectedImage) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: user?.name || "You",
      isSelf: true,
      text,
      image: selectedImage || undefined,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: "Today",
      replyTo: replyingTo ? { sender: replyingTo.sender, text: replyingTo.text } : undefined,
    };

    setMessages((prev) => ({
      ...prev,
      [selectedChannelId]: [...(prev[selectedChannelId] || []), newMessage],
    }));
    setMessageInput("");
    setSelectedImage(null);
    setReplyingTo(null);

    // AI bot reply simulation
    if (selectedChannelId === "ai-bot") {
      setTimeout(() => {
        const botReply: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "Samvad AI",
          isSelf: false,
          text: "I received your message! All features including Live STT, Gesture detection, and Meeting transcripts are operational.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          date: "Today",
        };
        setMessages((prev) => ({
          ...prev,
          "ai-bot": [...(prev["ai-bot"] || []), botReply],
        }));
      }, 800);
    }
  };

  const handleReply = (msg: ChatMessage) => {
    setReplyingTo(msg);
    closeContextMenu();
    inputRef.current?.focus();
  };

  const handleToggleReaction = (msgId: string, emoji: string) => {
    if (!selectedChannelId) return;
    setMessages((prev) => {
      const list = prev[selectedChannelId] || [];
      return {
        ...prev,
        [selectedChannelId]: list.map((m) => {
          if (m.id !== msgId) return m;
          const current = m.reactions || [];
          const exists = current.includes(emoji);
          // Allow only one reaction per chat: remove if same emoji clicked, otherwise replace with the new emoji
          const updated = exists ? [] : [emoji];
          return { ...m, reactions: updated };
        }),
      };
    });
  };

  const handleToggleStar = (msgId: string) => {
    if (!selectedChannelId) return;
    setMessages((prev) => {
      const list = prev[selectedChannelId] || [];
      return {
        ...prev,
        [selectedChannelId]: list.map((m) => {
          if (m.id !== msgId) return m;
          const next = !m.isStarred;
          toast.success(next ? "Message starred" : "Message unstarred");
          return { ...m, isStarred: next };
        }),
      };
    });
    closeContextMenu();
  };

  const handleTogglePin = (msgId: string) => {
    if (!selectedChannelId) return;
    setMessages((prev) => {
      const list = prev[selectedChannelId] || [];
      return {
        ...prev,
        [selectedChannelId]: list.map((m) => {
          if (m.id !== msgId) return m;
          const next = !m.isPinned;
          toast.success(next ? "Message pinned" : "Message unpinned");
          return { ...m, isPinned: next };
        }),
      };
    });
    closeContextMenu();
  };

  const handleForward = (msg: ChatMessage) => {
    navigator.clipboard?.writeText(msg.text);
    toast.success("Message copied for forwarding");
    closeContextMenu();
  };

  const handleCopy = (msg: ChatMessage) => {
    navigator.clipboard?.writeText(msg.text);
    toast.success("Message copied to clipboard");
    closeContextMenu();
  };

  const handleReport = (msgId: string) => {
    toast.info("Message reported to moderators");
    closeContextMenu();
  };

  const handleDelete = (msgId: string) => {
    if (!selectedChannelId) return;
    setMessages((prev) => ({
      ...prev,
      [selectedChannelId]: (prev[selectedChannelId] || []).filter((m) => m.id !== msgId),
    }));
    toast.info("Message deleted");
    closeContextMenu();
  };

  const handleStartSelection = (msgId: string) => {
    setIsSelectionMode(true);
    setSelectedMsgIds(new Set([msgId]));
    closeContextMenu();
  };

  const handleOpenContextMenu = (e: React.MouseEvent<HTMLButtonElement>, msg: ChatMessage) => {
    e.stopPropagation();
    if (activeMenuMsgId === msg.id) {
      closeContextMenu();
      return;
    }

    setActiveMenuMsgId(msg.id);
    setActiveMenuMsg(msg);
    setActiveReactionMsgId(null);
    setShowMoreReactionsMsgId(null);
  };

  const toggleSelectMessage = (msgId: string) => {
    setSelectedMsgIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
      } else {
        next.add(msgId);
      }
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedChannelId || selectedMsgIds.size === 0) return;
    setMessages((prev) => ({
      ...prev,
      [selectedChannelId]: (prev[selectedChannelId] || []).filter((m) => !selectedMsgIds.has(m.id)),
    }));
    toast.info(`${selectedMsgIds.size} message(s) deleted`);
    setIsSelectionMode(false);
    setSelectedMsgIds(new Set());
  };

  const handleCopySelected = () => {
    const textToCopy = currentMessages
      .filter((m) => selectedMsgIds.has(m.id))
      .map((m) => `[${m.time}] ${m.sender}: ${m.text}`)
      .join("\n");
    if (textToCopy) {
      navigator.clipboard?.writeText(textToCopy);
      toast.success(`${selectedMsgIds.size} message(s) copied`);
    }
    setIsSelectionMode(false);
    setSelectedMsgIds(new Set());
  };

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full flex-1 flex flex-col animate-in fade-in duration-300">
      {/* Main Chat Layout: Channels Sidebar + Active Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100dvh-132px)] sm:h-[calc(100dvh-164px)] min-h-[580px]">
        {/* Left: Channel List */}
        <div className="lg:col-span-4 bg-white dark:bg-stone-900 rounded-3xl border-2 border-stone-200/80 dark:border-stone-800 shadow-sm p-4 flex flex-col gap-3 overflow-hidden">
          {isRearranging ? (
            /* Rearrange Header right here in the sidebar */
            <div className="animate-in fade-in duration-200 pb-3 border-b border-stone-200/80 dark:border-stone-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white flex items-center justify-center shrink-0">
                    <ArrowUpDown className="w-4 h-4 text-stone-900 dark:text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100 leading-tight">
                      Rearrange Chats
                    </h4>
                    <p className="text-[10px] text-stone-400 leading-tight">
                      Drag to reorder
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsRearranging(false);
                    toast.success("Chat order saved");
                  }}
                  className="h-8 px-3.5 rounded-lg text-xs font-semibold bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 cursor-pointer transition-colors shadow-2xs"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Top Bar: More (...) on left, New Chat (+) on right, without 'Chats' title */}
              <div className="flex items-center justify-between">
                {/* Options Button (...) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs ${
                      isMoreMenuOpen
                        ? "bg-stone-200 dark:bg-stone-700 border-stone-300 dark:border-stone-600 text-stone-900 dark:text-white"
                        : "bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
                    }`}
                    title="More options"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {isMoreMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsMoreMenuOpen(false)}
                      />
                      <div className="absolute left-0 top-full mt-2 w-48 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xl dark:shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setChannels((prev) => prev.map((c) => ({ ...c, unread: 0 })));
                            toast.success("All conversations marked as read");
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-2.5 text-stone-700 dark:text-stone-300"
                        >
                          <CheckCheck className="w-4 h-4 text-stone-700 dark:text-white" />
                          <span>Mark all as read</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            toast.info("Starred messages filter active");
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-2.5 text-stone-700 dark:text-stone-300"
                        >
                          <Star className="w-4 h-4 text-stone-700 dark:text-white" />
                          <span>Starred messages</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setSearchQuery("");
                            setIsRearranging(true);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-2.5 text-stone-700 dark:text-stone-300"
                        >
                          <ArrowUpDown className="w-4 h-4 text-stone-700 dark:text-white" />
                          <span>Rearrange</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* New Chat / Add Button (+) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPlusMenuOpen((prev) => !prev)}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs ${
                      isPlusMenuOpen
                        ? "bg-stone-200 dark:bg-stone-700 border-stone-300 dark:border-stone-600 text-stone-900 dark:text-white"
                        : "bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
                    }`}
                    title="Create or Add"
                  >
                    <Plus className={`w-4 h-4 transition-transform duration-200 ${isPlusMenuOpen ? "rotate-45" : ""}`} />
                  </button>

                  {/* Plus Dropdown Menu */}
                  {isPlusMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsPlusMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xl dark:shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={() => {
                            setIsPlusMenuOpen(false);
                            setModalType("group");
                            setIsModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-3"
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900 dark:text-stone-100">Create Group</div>
                            <div className="text-[10px] text-stone-400 font-normal">Team channel or project sync</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsPlusMenuOpen(false);
                            setModalType("direct");
                            setIsModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-3"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <UserPlus className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900 dark:text-stone-100">Add People / Direct</div>
                            <div className="text-[10px] text-stone-400 font-normal">Direct message with someone</div>
                          </div>
                        </button>

                        <div className="my-1 border-t border-stone-200 dark:border-stone-800" />

                        <button
                          type="button"
                          onClick={() => {
                            setIsPlusMenuOpen(false);
                            setSelectedChannelId("ai-bot");
                            toast.info("Switched to Samvad AI Assistant");
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-3"
                        >
                          <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900 dark:text-stone-100">Samvad AI Chat</div>
                            <div className="text-[10px] text-stone-400 font-normal">Instant Q&A & ISL assistant</div>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Search bar (Full-width underneath top bar) */}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-9 rounded-xl h-10 text-xs bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 focus-visible:border-stone-600 dark:focus-visible:border-white/40 focus-visible:ring-0 w-full"
                />
              </div>
            </>
          )}

          {/* Conversation List */}
          <div
            onClick={(e) => {
              if (isRearranging) return;
              const target = e.target as HTMLElement | null;
              if (target && !target.closest("button") && !target.closest("input")) {
                setSelectedChannelId(null);
              }
            }}
            className="flex-1 overflow-y-auto space-y-1.5 py-0.5 scrollbar-thin [&::-webkit-scrollbar]:w-[2.5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-300 dark:[&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-stone-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/50 w-full"
          >
            {isRearranging ? (
              channels.map((c, index) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={() => handleDrop(index)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all select-none cursor-grab active:cursor-grabbing ${
                    draggedIndex === index
                      ? "opacity-50 border-blue-500 dark:border-blue-400 ring-2 ring-inset ring-blue-500/40 bg-blue-50/50 dark:bg-blue-950/30"
                      : dragOverIndex === index
                      ? "border-blue-400 dark:border-blue-500 ring-1 ring-inset ring-blue-400/40 bg-stone-100 dark:bg-stone-800"
                      : "border-stone-200/90 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/40 hover:bg-stone-100 dark:hover:bg-stone-800/80"
                  }`}
                >
                  {/* Drag Grip Handle */}
                  <div className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 shrink-0">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Position number */}
                  <span className="text-[10px] font-mono font-medium text-stone-400 w-3.5 shrink-0">
                    {index + 1}
                  </span>

                  {/* Icon */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      c.type === "ai"
                        ? "bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400"
                        : c.type === "direct"
                        ? "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                        : "bg-stone-200/70 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
                    }`}
                  >
                    {c.type === "ai" ? (
                      <Bot className="w-3.5 h-3.5" />
                    ) : c.type === "direct" ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <Hash className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Name and unread badge */}
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                      {c.name}
                    </span>
                    {typeof c.unread === "number" && c.unread > 0 ? (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#7075f7] text-white rounded-full leading-tight shrink-0">
                        {c.unread}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              filteredChannels.map((c) => {
                const isSelected = c.id === selectedChannelId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedChannelId((prev) => (prev === c.id ? null : c.id))}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-stone-200 dark:bg-stone-800 text-stone-950 dark:text-white border border-stone-300 dark:border-stone-700 shadow-2xs"
                        : "hover:bg-stone-100 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-300 border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        c.type === "ai"
                          ? "bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400"
                          : c.type === "direct"
                          ? "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                          : isSelected
                          ? "bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 shadow-2xs"
                          : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                      }`}
                    >
                      {c.type === "ai" ? (
                        <Bot className="w-5 h-5" />
                      ) : c.type === "direct" ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Hash className="w-4 h-4" />
                      )}
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

                    {typeof c.unread === "number" && c.unread > 0 && !isSelected ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#7075f7] text-white rounded-full leading-none shrink-0 mt-1">
                        {c.unread}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Message Thread or Empty Selection State */}
        {!activeChannel ? (
          <div className="lg:col-span-8 bg-white dark:bg-stone-900 rounded-3xl border-2 border-stone-200/80 dark:border-stone-800 shadow-sm p-6 sm:p-12 flex flex-col items-center justify-center text-center overflow-hidden relative select-none">
            <div className="text-stone-400 dark:text-stone-500 mb-3.5 flex items-center justify-center">
              <MessageSquare className="w-12 h-12 stroke-[1.4]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 mb-1.5">
              There is no selected chat
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm leading-relaxed">
              Select a chat to start conversation, or click <span className="font-semibold text-stone-700 dark:text-stone-200">+</span> to add people or create groups.
            </p>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-white dark:bg-stone-900 rounded-3xl border-2 border-stone-200/80 dark:border-stone-800 shadow-sm p-4 sm:p-5 flex flex-col justify-between overflow-hidden relative">
            {/* Thread Header */}
            <div data-no-deselect className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activeChannel.type === "ai"
                      ? "bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400"
                      : activeChannel.type === "direct"
                      ? "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                  }`}
                >
                  {activeChannel.type === "ai" ? (
                    <Bot className="w-5 h-5" />
                  ) : activeChannel.type === "direct" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Hash className="w-4 h-4" />
                  )}
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

              <div className="flex items-center gap-2">
                {activeChannel.type === "ai" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                    <Sparkles className="w-3 h-3" />
                    <span>Samvad Model 2.0</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedChannelId(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  title="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

          {/* Selection Mode Bar */}
          {isSelectionMode && (
            <div className="flex items-center justify-between px-3 py-2 bg-stone-100 dark:bg-stone-800 rounded-xl my-2 border border-stone-300 dark:border-stone-700 animate-in fade-in duration-150">
              <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                {selectedMsgIds.size} message(s) selected
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySelected}
                  disabled={selectedMsgIds.size === 0}
                  className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={selectedMsgIds.size === 0}
                  className="px-2.5 py-1 text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedMsgIds(new Set());
                  }}
                  className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-700/50 cursor-pointer"
                  title="Cancel selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto pt-4 pb-6 space-y-3 px-4 mb-4 relative scrollbar-thin [&::-webkit-scrollbar]:w-[2.5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-300 dark:[&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-stone-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/50"
          >
            {currentMessages.map((msg, index) => {
              const isSelectedInMode = selectedMsgIds.has(msg.id);
              const isNearBottom = index >= Math.max(0, currentMessages.length - 2);
              const activeReaction = msg.reactions?.[0];

              const msgDate = msg.date || "Today";
              const prevMsgDate = index > 0 ? (currentMessages[index - 1].date || "Today") : null;
              const isNewDate = index === 0 || msgDate !== prevMsgDate;

              return (
                <React.Fragment key={msg.id}>
                  {/* WhatsApp-style centered date tag */}
                  {isNewDate && (
                    <div className="flex justify-center my-3 select-none pointer-events-none sticky top-1 z-10">
                      <span className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-stone-200/90 dark:bg-stone-800/90 text-stone-600 dark:text-stone-300 border border-stone-300/50 dark:border-stone-700/60 shadow-2xs backdrop-blur-xs">
                        {msgDate}
                      </span>
                    </div>
                  )}

                  <div
                    className={`flex flex-col relative ${msg.isSelf ? "items-end" : "items-start"} ${
                      msg.reactions && msg.reactions.length > 0 ? "mb-2.5" : ""
                    }`}
                  >
                  {/* Sender & timestamp header */}
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                      {msg.sender}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">{msg.time}</span>
                    {msg.isStarred && (
                      <span title="Starred">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400 inline" />
                      </span>
                    )}
                    {msg.isPinned && (
                      <span title="Pinned">
                        <Pin className="w-3 h-3 text-[#7075f7] fill-[#7075f7] inline" />
                      </span>
                    )}
                  </div>

                  {/* Bubble wrapper with selection checkbox & action buttons */}
                  <div className={`relative flex items-center gap-2 max-w-md sm:max-w-lg group/message ${
                    msg.isSelf ? "flex-row-reverse" : "flex-row"
                  }`}>
                    {isSelectionMode && (
                      <div
                        onClick={() => toggleSelectMessage(msg.id)}
                        className={`w-4.5 h-4.5 rounded border flex items-center justify-center cursor-pointer shrink-0 transition-colors ${
                          isSelectedInMode
                            ? "bg-white border-white text-stone-950"
                            : "border-stone-500 bg-stone-800/40"
                        }`}
                      >
                        {isSelectedInMode && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    )}

                    {/* Bubble container */}
                    <div data-message-bubble className="relative group/bubble">
                      <div
                        onClick={() => {
                          if (isSelectionMode) {
                            toggleSelectMessage(msg.id);
                          }
                        }}
                        className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all relative ${
                          isSelectionMode ? "cursor-pointer select-none" : "select-text"
                        } ${
                          msg.isSelf
                            ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-white rounded-tr-xs"
                            : "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-tl-xs"
                        }`}
                      >
                        {/* Reply Quote Header */}
                        {msg.replyTo && (
                          <div
                            className={`mb-2 px-2.5 py-1.5 rounded-lg border-l-4 text-xs ${
                              msg.isSelf
                                ? "bg-[#b0deff] text-[#001d35] border-[#004a77] dark:bg-[#00385c] dark:text-[#c2e7ff] dark:border-[#c2e7ff]"
                                : "bg-stone-200 dark:bg-stone-700 border-[#7075f7] text-stone-700 dark:text-stone-300"
                            }`}
                          >
                            <div className="font-semibold text-[10px] opacity-80">{msg.replyTo.sender}</div>
                            <div className="truncate text-[11px] opacity-90">{msg.replyTo.text}</div>
                          </div>
                        )}

                        {/* Image attachment in bubble */}
                        {msg.image && (
                          <div className="mb-2 max-w-xs sm:max-w-sm overflow-hidden rounded-xl">
                            <img
                              src={msg.image}
                              alt="Attachment"
                              className="w-full h-auto max-h-64 object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(msg.image, "_blank");
                              }}
                            />
                          </div>
                        )}

                        {msg.text && <div>{msg.text}</div>}
                      </div>

                      {/* Floating reaction badge on message bubble */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div
                          className={`absolute -bottom-2.5 z-20 flex items-center ${
                            msg.isSelf ? "right-2" : "left-2"
                          }`}
                        >
                          {msg.reactions.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleReaction(msg.id, emoji);
                              }}
                              className="px-1.5 py-0.5 rounded-full text-xs bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-700 shadow-xs flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform select-none"
                              title="Click to remove reaction"
                            >
                              <span>{emoji}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Emoji Quick Picker Popup */}
                      {activeReactionMsgId === msg.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => {
                              setActiveReactionMsgId(null);
                              setShowMoreReactionsMsgId(null);
                            }}
                          />
                          <div
                            className={`absolute z-50 flex items-center gap-1 p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xl dark:shadow-2xl animate-in fade-in zoom-in-95 duration-100 ${
                              isNearBottom ? "bottom-full mb-1.5" : "top-full mt-1.5"
                            } ${msg.isSelf ? "right-0" : "left-0"}`}
                          >
                            {/* If the active reaction is outside QUICK_REACTIONS, prepend it */}
                            {(activeReaction && !QUICK_REACTIONS.includes(activeReaction)
                              ? [activeReaction, ...QUICK_REACTIONS]
                              : QUICK_REACTIONS
                            ).map((emoji) => {
                              const isActive = activeReaction === emoji;
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleReaction(msg.id, emoji);
                                    setActiveReactionMsgId(null);
                                    setShowMoreReactionsMsgId(null);
                                  }}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:scale-125 transition-all cursor-pointer select-none ${
                                    isActive
                                      ? "bg-stone-200/90 dark:bg-stone-700/90 ring-1.5 ring-stone-400 dark:ring-stone-500 scale-105"
                                      : "hover:bg-stone-200/80 dark:hover:bg-white/15"
                                  }`}
                                  title={isActive ? "Remove reaction" : emoji}
                                >
                                  {emoji}
                                </button>
                              );
                            })}

                            {/* Plus button for More reactions */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowMoreReactionsMsgId((prev) => (prev === msg.id ? null : msg.id));
                              }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer select-none ${
                                showMoreReactionsMsgId === msg.id
                                  ? "bg-stone-200 dark:bg-stone-700 text-stone-950 dark:text-white"
                                  : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/80 dark:hover:bg-white/15"
                              }`}
                              title="More reactions"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Extended Emoji Picker Popup */}
                          {showMoreReactionsMsgId === msg.id && (
                            <div
                              className={`absolute z-60 w-64 p-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-2xl animate-in fade-in zoom-in-95 duration-100 ${
                                isNearBottom ? "bottom-full mb-12" : "top-full mt-12"
                              } ${msg.isSelf ? "right-0" : "left-0"}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between px-1 mb-2">
                                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                                  More Reactions
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setShowMoreReactionsMsgId(null)}
                                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto pr-1">
                                {MORE_REACTIONS.map((emoji) => {
                                  const isMoreActive = activeReaction === emoji;
                                  return (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleReaction(msg.id, emoji);
                                        setShowMoreReactionsMsgId(null);
                                        setActiveReactionMsgId(null);
                                      }}
                                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-base hover:scale-125 transition-all cursor-pointer select-none ${
                                        isMoreActive
                                          ? "bg-stone-200/90 dark:bg-stone-700/90 ring-1.5 ring-stone-400 dark:ring-stone-500 scale-105"
                                          : "hover:bg-stone-100 dark:hover:bg-stone-800"
                                      }`}
                                      title={emoji}
                                    >
                                      {emoji}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* WhatsApp Style Message Context Menu Dropdown - Always opens in the bottom below the bubble */}
                      {activeMenuMsgId === msg.id && (
                        <div
                          data-message-menu
                          className={`absolute z-50 w-44 sm:w-48 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xl dark:shadow-2xl p-1.5 pb-3.5 text-stone-800 dark:text-stone-200 animate-in fade-in zoom-in-95 duration-100 top-full mt-1.5 mb-4 ${
                            msg.isSelf ? "right-0" : "left-0"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReply(msg);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span>Reply</span>
                            <Reply className="w-3.5 h-3.5 text-stone-400" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              closeContextMenu();
                              setActiveReactionMsgId(msg.id);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span>React</span>
                            <Smile className="w-3.5 h-3.5 text-stone-400" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStar(msg.id);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span>{msg.isStarred ? "Unstar" : "Star"}</span>
                            <Star
                              className={`w-3.5 h-3.5 ${
                                msg.isStarred ? "text-amber-400 fill-amber-400" : "text-stone-400"
                              }`}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePin(msg.id);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span>{msg.isPinned ? "Unpin" : "Pin"}</span>
                            <Pin
                              className={`w-3.5 h-3.5 ${
                                msg.isPinned ? "text-[#7075f7] fill-[#7075f7]" : "text-stone-400"
                              }`}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleForward(msg);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span>Forward</span>
                            <Forward className="w-3.5 h-3.5 text-stone-400" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(msg);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span>Copy</span>
                            <Copy className="w-3.5 h-3.5 text-stone-400" />
                          </button>

                          <div className="my-1 border-t border-stone-200 dark:border-stone-800" />

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartSelection(msg.id);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span>Select messages</span>
                            <CheckSquare className="w-3.5 h-3.5 text-stone-400" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReport(msg.id);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span>Report</span>
                            <Flag className="w-3.5 h-3.5 text-stone-400" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(msg.id);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span>Delete</span>
                            <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons on Bubble (React Emoji & Chevron) - Visible strictly on message hover */}
                    {!isSelectionMode && (
                      <div
                        className={`flex items-center gap-1 shrink-0 transition-all duration-150 ${
                          activeMenuMsgId === msg.id || activeReactionMsgId === msg.id || showMoreReactionsMsgId === msg.id
                            ? "opacity-100 scale-100 pointer-events-auto"
                            : "opacity-0 scale-90 pointer-events-none group-hover/message:opacity-100 group-hover/message:scale-100 group-hover/message:pointer-events-auto"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveReactionMsgId((prev) => (prev === msg.id ? null : msg.id));
                            closeContextMenu();
                            setShowMoreReactionsMsgId(null);
                          }}
                          className="w-6.5 h-6.5 rounded-full bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                          title="React"
                        >
                          <Smile className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenContextMenu(e, msg)}
                          className={`w-6.5 h-6.5 rounded-full border transition-colors cursor-pointer shadow-xs flex items-center justify-center ${
                            activeMenuMsgId === msg.id
                              ? "bg-stone-200 dark:bg-stone-600 border-stone-400 dark:border-stone-500 text-stone-900 dark:text-white"
                              : "bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
                          }`}
                          title="Menu"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                </React.Fragment>
              );
            })}
            {/* Dynamic spacer for breathing room so bottom menus have scroll space */}
            <div className={`pointer-events-none transition-all duration-200 ${activeMenuMsgId ? "h-72" : "h-4"}`} />
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Context Preview Header */}
          {replyingTo && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800/80 border-l-4 border-[#7075f7] text-xs mb-2 animate-in fade-in duration-100">
              <div className="min-w-0 pr-2">
                <div className="text-[10px] font-semibold text-[#7075f7] dark:text-[#a8c7fa]">
                  Replying to {replyingTo.sender}
                </div>
                <div className="truncate text-stone-600 dark:text-stone-300 text-[11px]">
                  {replyingTo.text}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 text-stone-400 hover:text-white rounded-full hover:bg-stone-700/50 cursor-pointer shrink-0"
                title="Cancel reply"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Selected Image Preview Header */}
          {selectedImage && (
            <div className="relative mb-2 inline-flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-stone-100 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 shadow-xs animate-in fade-in duration-100">
              <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-stone-300 dark:border-stone-600 shrink-0">
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="text-xs text-stone-700 dark:text-stone-200 font-medium">
                Photo attached
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="ml-1 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-white rounded-full hover:bg-stone-200 dark:hover:bg-stone-700/60 cursor-pointer"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer shrink-0 shadow-2xs"
              title="Add image"
            >
              <Plus className="w-4.5 h-4.5" />
            </button>

            <Input
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={replyingTo ? `Replying to ${replyingTo.sender}...` : selectedImage ? "Add a caption..." : `Message ${activeChannel.name}...`}
              className="flex-1 rounded-xl h-10 box-border px-3.5 text-xs sm:text-sm bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 focus-visible:border-stone-600 dark:focus-visible:border-white/40 focus-visible:ring-0 focus:ring-0 focus-visible:ring-transparent focus:ring-transparent focus-visible:outline-none focus:outline-none shadow-none focus-visible:shadow-none"
            />
            <button
              type="submit"
              disabled={!messageInput.trim() && !selectedImage}
              className="h-10 px-4 rounded-xl gap-1.5 bg-white text-stone-950 hover:bg-stone-100 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200 font-semibold text-xs sm:text-sm shadow-xs cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center shrink-0 border border-stone-200/80 dark:border-transparent box-border"
            >
              <Send className="w-4 h-4 stroke-[2.2]" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
        )}
      </div>



      {/* Modal for Create Group & Add People */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                {modalType === "group" ? (
                  <>
                    <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Create New Group</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Add People / New Chat</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setModalInputName("");
                }}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-white p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const name = modalInputName.trim();
                if (!name) return;
                const newId = `c-${Date.now()}`;
                const newChannel: ChatChannel = {
                  id: newId,
                  name,
                  type: modalType === "group" ? "channel" : "direct",
                  lastMessage: modalType === "group" ? "Group created" : "Chat started",
                  time: "Just now",
                };
                setChannels((prev) => [newChannel, ...prev]);
                setSelectedChannelId(newId);
                setIsModalOpen(false);
                setModalInputName("");
                toast.success(
                  modalType === "group"
                    ? `Group "${name}" created successfully`
                    : `Direct chat with "${name}" started`
                );
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                  {modalType === "group" ? "Group / Channel Name" : "Participant Name or Email"}
                </label>
                <Input
                  autoFocus
                  value={modalInputName}
                  onChange={(e) => setModalInputName(e.target.value)}
                  placeholder={
                    modalType === "group"
                      ? "e.g. Design Sync, Sprint Planning..."
                      : "e.g. Ananya Sharma, rahul@college.edu..."
                  }
                  className="rounded-xl text-xs bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setModalInputName("");
                  }}
                  className="h-9 px-3.5 rounded-xl text-xs border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!modalInputName.trim()}
                  className={`h-9 px-4 rounded-xl text-xs font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs ${
                    modalType === "group"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-[#7075f7] hover:bg-[#5f64f5]"
                  }`}
                >
                  {modalType === "group" ? "Create Group" : "Start Chat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
