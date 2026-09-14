"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Copy, 
  Trash2, 
  Check, 
  Clock, 
  Tag, 
  Sparkles,
  ExternalLink,
  Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/samvadComponents/toastMessage";

interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: "transcripts" | "meetings" | "personal";
  date: string;
}

const INITIAL_NOTES: NoteItem[] = [
  {
    id: "n1",
    title: "ISL Gesture Recognition Sync",
    content: "Team agreed on integrating MediaPipe landmark detector directly with WebRTC video track. 50 common Indian Sign Language signs will be classified with high accuracy.",
    category: "transcripts",
    date: "Sep 14, 2026",
  },
  {
    id: "n2",
    title: "Live Speech-to-Text Architecture",
    content: "Browser Web Speech API fallback is active. Server-side Whisper transcription will handle noisy conference environments with low-latency WebSocket streaming.",
    category: "meetings",
    date: "Sep 13, 2026",
  },
  {
    id: "n3",
    title: "Personal Scratchpad: Sprint Goals",
    content: "- Deliver Google Meet Material 3 design.\n- Finalize room join verification flows.\n- Validate E2EE WebRTC data channels.",
    category: "personal",
    date: "Sep 11, 2026",
  },
];

export interface NotesViewProps {
  user?: any;
}

export function NotesView({ user }: NotesViewProps) {
  const [notes, setNotes] = useState<NoteItem[]>(INITIAL_NOTES);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "transcripts" | "meetings" | "personal">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Note Form
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<"transcripts" | "meetings" | "personal">("meetings");

  const handleCopyNote = (note: NoteItem) => {
    navigator.clipboard?.writeText(`${note.title}\n\n${note.content}`);
    setCopiedId(note.id);
    toast.success("Note copied to clipboard!", {
      description: note.title,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast.info("Note removed", {
      description: "Note was deleted from your workspace.",
    });
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.warning("Title and content required", {
        description: "Please enter both a title and details for your note.",
      });
      return;
    }

    const created: NoteItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    };

    setNotes((prev) => [created, ...prev]);
    setNewTitle("");
    setNewContent("");
    setIsCreateOpen(false);
    toast.success("Note created!", {
      description: created.title,
    });
  };

  const filteredNotes = notes.filter((n) => {
    const matchesCategory = activeCategory === "all" || n.category === activeCategory;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (cat: NoteItem["category"]) => {
    switch (cat) {
      case "transcripts":
        return { label: "Transcript", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300" };
      case "meetings":
        return { label: "Meeting Note", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" };
      case "personal":
        return { label: "Personal", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" };
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Notes & Transcripts Section - Exact same border & card style as My Meetings */}
      <section className="bg-white dark:bg-stone-900 rounded-3xl border-2 border-stone-200/80 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 stroke-[2]" />
              </div>
              <span>Notes & Transcripts</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Your saved conference summaries, live ISL transcripts, and personal scratchpads
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Category Filter tabs styled like My Meetings */}
            <div className="inline-flex items-center bg-stone-100 dark:bg-stone-800 rounded-xl p-1 border border-stone-200/80 dark:border-stone-700 text-xs">
              {(["all", "transcripts", "meetings", "personal"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveCategory(tab)}
                  className={`px-3 py-1 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                    activeCategory === tab
                      ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold"
                      : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <Button
              onClick={() => setIsCreateOpen(true)}
              className="rounded-xl text-xs gap-1.5 bg-[#7075f7] hover:bg-[#5f64f5] text-white shadow-sm cursor-pointer h-8 px-3.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Note</span>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, minutes, or transcripts..."
            className="pl-9 rounded-xl text-xs bg-stone-50/50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700 focus:border-stone-400"
          />
        </div>

        {/* Notes Grid or Empty State */}
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-stone-50/60 dark:bg-stone-800/30 border border-dashed border-stone-200 dark:border-stone-800">
            <div className="w-14 h-14 rounded-2xl bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] flex items-center justify-center mb-3">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              {activeCategory === "all" ? "No notes yet" : `No ${activeCategory} notes`}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-sm">
              Create a new note or change your search filter to see results.
            </p>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 rounded-full text-xs gap-1.5 bg-[#7075f7] hover:bg-[#5f64f5] text-white shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Create Note
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => {
              const badge = getCategoryBadge(note.category);
              return (
                <div
                  key={note.id}
                  className="p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 hover:border-stone-300 dark:hover:border-stone-700 transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {note.date}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-2 leading-snug">
                      {note.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line line-clamp-4">
                      {note.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-stone-200/60 dark:border-stone-700/60">
                    <button
                      type="button"
                      onClick={() => handleCopyNote(note)}
                      title="Copy note"
                      className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 dark:text-stone-400 dark:hover:text-stone-100 transition-colors cursor-pointer"
                    >
                      {copiedId === note.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      title="Delete note"
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* New Note Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 border-2 border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#7075f7]" />
              <span>Create New Note</span>
            </h3>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Note Title
                </label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Design Sync Action Items"
                  className="rounded-xl text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["meetings", "transcripts", "personal"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border capitalize transition-all cursor-pointer ${
                        newCategory === cat
                          ? "bg-stone-900 text-white dark:bg-white dark:text-stone-950 border-transparent shadow-xs font-semibold"
                          : "border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Details / Notes
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your note, meeting minutes, or scratchpad ideas here..."
                  rows={5}
                  className="w-full p-3 rounded-xl text-xs sm:text-sm bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-[#7075f7] hover:bg-[#5f64f5] text-white shadow-xs cursor-pointer"
                >
                  Save Note
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
