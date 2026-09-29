"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Edit3,
  Filter,
  ChevronDown,
  X,
  AlertCircle
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
    title: "ASL Gesture Recognition Sync",
    content: "Team agreed on integrating MediaPipe landmark detector directly with WebRTC video track. 50 common American Sign Language signs will be classified with high accuracy.",
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
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // New Note Form
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<"transcripts" | "meetings" | "personal">("meetings");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const createFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCreateOpen) {
      createFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      titleInputRef.current?.focus();
    }
  }, [isCreateOpen]);

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

  const handleRequestClose = () => {
    const hasUnsavedContent = newTitle.trim().length > 0 || newContent.trim().length > 0;
    if (hasUnsavedContent) {
      setShowUnsavedPrompt(true);
    } else {
      setIsCreateOpen(false);
      setNewTitle("");
      setNewContent("");
    }
  };

  const handleDiscardAndClose = () => {
    setShowUnsavedPrompt(false);
    setIsCreateOpen(false);
    setNewTitle("");
    setNewContent("");
    toast.info("Changes discarded");
  };

  const handleSaveAndClose = () => {
    const title = newTitle.trim() || "Untitled Note";
    const content = newContent.trim();

    const created: NoteItem = {
      id: Date.now().toString(),
      title,
      content,
      category: newCategory,
      date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    };

    setNotes((prev) => [created, ...prev]);
    setShowUnsavedPrompt(false);
    setIsCreateOpen(false);
    setNewTitle("");
    setNewContent("");
    toast.success("Note saved!", {
      description: created.title,
    });
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newContent.trim()) {
      toast.warning("Title or content required", {
        description: "Please enter a title or details for your note.",
      });
      return;
    }

    const created: NoteItem = {
      id: Date.now().toString(),
      title: newTitle.trim() || "Untitled Note",
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
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Header Banner - Outside the card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Notes & Transcripts
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Your saved conference summaries, live ASL transcripts, and personal scratchpads
          </p>
        </div>

        <Button
          onClick={() => {
            if (isCreateOpen) {
              handleRequestClose();
            } else {
              setIsCreateOpen(true);
            }
          }}
          className="rounded-lg text-xs gap-1.5 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200 shadow-sm cursor-pointer h-9 px-4 font-semibold shrink-0"
        >
          {isCreateOpen ? (
            <>
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>Close</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Note</span>
            </>
          )}
        </Button>
      </div>

      {/* Main Grid: Notes (Left) + Create Note Box (Right) */}
      <div className={`grid grid-cols-1 ${isCreateOpen ? "lg:grid-cols-12" : "grid-cols-1"} gap-6 items-start`}>
        {/* Notes & Transcripts Content Section */}
        <section
          className={`${
            isCreateOpen ? "lg:col-span-7 xl:col-span-7" : "w-full"
          } bg-white dark:bg-stone-900 rounded-3xl border-2 border-stone-200/80 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-6 transition-all`}
        >
          {/* Search Bar (Left) + Filter Dropdown (Right) */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, minutes, or transcripts..."
                className="pl-9 h-9 rounded-lg text-xs bg-stone-50/50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700 focus:border-stone-400 w-full"
              />
            </div>

            {/* Filter Dropdown Menu */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsFilterMenuOpen((prev) => !prev)}
                className={`h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer shadow-2xs ${
                  activeCategory !== "all" || isFilterMenuOpen
                    ? "bg-stone-200 dark:bg-stone-700 border-stone-300 dark:border-stone-600 text-stone-900 dark:text-white"
                    : "bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700 border-stone-200/90 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
                }`}
                title="Filter by category"
              >
                <Filter className="w-3.5 h-3.5" />
                <span className="capitalize">{activeCategory === "all" ? "Filter" : activeCategory}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isFilterMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {isFilterMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsFilterMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xl dark:shadow-2xl p-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1 text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      Filter by category
                    </div>
                    {[
                      { id: "all", label: "All Notes" },
                      { id: "transcripts", label: "Transcripts" },
                      { id: "meetings", label: "Meetings" },
                      { id: "personal", label: "Personal" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setActiveCategory(opt.id as any);
                          setIsFilterMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center justify-between ${
                          activeCategory === opt.id
                            ? "bg-stone-200 dark:bg-stone-800 text-stone-950 dark:text-white font-semibold"
                            : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-white"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {activeCategory === opt.id && <Check className="w-3.5 h-3.5 text-stone-900 dark:text-white" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes Grid or Empty State */}
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-stone-50/60 dark:bg-stone-800/30 border border-dashed border-stone-200 dark:border-stone-800">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
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
                className="mt-4 rounded-xl text-xs gap-1.5 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Create Note
              </Button>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 ${
                isCreateOpen ? "sm:grid-cols-1 md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"
              } gap-4`}
            >
              {filteredNotes.map((note) => {
                const badge = getCategoryBadge(note.category);
                return (
                  <div
                    key={note.id}
                    className="p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 hover:border-stone-300 dark:hover:border-stone-700 transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-end mb-2.5">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-2 leading-snug">
                        {note.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line line-clamp-4">
                        {note.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-200/60 dark:border-stone-700/60">
                      <span className="text-[11px] text-stone-400 font-mono flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {note.date}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyNote(note)}
                          title="Copy note"
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 dark:text-stone-400 dark:hover:text-stone-100 transition-colors cursor-pointer"
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
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Side: Create Note Card ("outside in rightside") */}
        {isCreateOpen && (
          <aside
            ref={createFormRef}
            className="lg:col-span-5 xl:col-span-5 bg-white dark:bg-stone-900 rounded-2xl border-2 border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-sm space-y-4 lg:sticky lg:top-6 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Edit3 className="w-4.5 h-4.5 text-stone-900 dark:text-white" />
                <span>Create New Note</span>
              </h3>
              <button
                type="button"
                onClick={handleRequestClose}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title="Close form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Note Title
                </label>
                <Input
                  ref={titleInputRef}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Design Sync Action Items..."
                  className="rounded-lg text-xs sm:text-sm h-9.5 bg-stone-50/60 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus-visible:ring-1 focus-visible:ring-stone-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["meetings", "transcripts", "personal"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`h-8.5 px-2 rounded-lg text-xs font-medium border capitalize transition-all cursor-pointer flex items-center justify-center ${
                        newCategory === cat
                          ? "bg-stone-900 text-white dark:bg-white dark:text-stone-950 border-transparent shadow-xs font-semibold"
                          : "border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
                      }`}
                    >
                      {cat === "transcripts" ? "Transcript" : cat === "meetings" ? "Meeting" : "Personal"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Details / Notes
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your note, meeting minutes, or scratchpad ideas here..."
                  rows={6}
                  className="w-full p-3 rounded-lg text-xs sm:text-sm bg-stone-50/60 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-400 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 leading-relaxed resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRequestClose}
                  className="rounded-lg text-xs h-8.5 px-3.5 cursor-pointer border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!newTitle.trim() && !newContent.trim()}
                  className="rounded-lg text-xs h-8.5 px-4 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200 font-semibold shadow-xs cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save Note
                </Button>
              </div>
            </form>
          </aside>
        )}
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      {showUnsavedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-stone-900 dark:text-white">
                  Unsaved Note
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                  You have unsaved changes. Do you want to save this note or discard it?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setShowUnsavedPrompt(false)}
                className="h-8.5 px-3 rounded-lg text-xs font-medium border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDiscardAndClose}
                className="h-8.5 px-3 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
              >
                Discard (Unsave)
              </button>
              <button
                type="button"
                onClick={handleSaveAndClose}
                className="h-8.5 px-3.5 rounded-lg text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200 transition-colors cursor-pointer shadow-xs"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
