import { useMemo, useRef, useState } from "react";
import { ArrowDownToLine, ArrowUpDown, Link2, Lock, Pencil } from "lucide-react";

import { Heading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { dailyNotes } from "@/data/daily-notes";
import { cn } from "@/lib/utils";

const ALL_PROJECTS = "All projects";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DailyNotesPage() {
  const [selectedId, setSelectedId] = useState(dailyNotes[0].id);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [projectFilter, setProjectFilter] = useState(ALL_PROJECTS);
  const [attachedOverride, setAttachedOverride] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFileName, setDroppedFileName] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const projectOptions = useMemo(
    () => Array.from(new Set(dailyNotes.map((note) => note.projectName))),
    [],
  );

  const visibleNotes = useMemo(() => {
    const filtered = dailyNotes.filter(
      (note) => projectFilter === ALL_PROJECTS || note.projectName === projectFilter,
    );
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return sortOrder === "newest" ? sorted.reverse() : sorted;
  }, [projectFilter, sortOrder]);

  const selectedNote = visibleNotes.find((note) => note.id === selectedId) ?? visibleNotes[0];

  function selectNote(id: string) {
    setSelectedId(id);
    setAttachedOverride(null);
    setCopyState("idle");
  }

  function handleCopyLink() {
    if (!selectedNote) return;
    const url = `${window.location.origin}/daily-notes?note=${selectedNote.id}`;
    navigator.clipboard?.writeText(url).catch(() => undefined);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1500);
  }

  function handleEdit() {
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="rounded-xl bg-muted/40 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <aside className="flex w-full flex-col gap-4 rounded-lg border bg-card p-4 lg:w-80 lg:shrink-0">
          <Heading level="h3">Daily Notes</Heading>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
            className="flex items-center gap-1.5 self-start text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowUpDown className="h-3 w-3" />
            Sort: {sortOrder === "newest" ? "Newest" : "Oldest"}
          </button>

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PROJECTS}>{ALL_PROJECTS}</SelectItem>
              {projectOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-col gap-1 lg:max-h-[560px] lg:overflow-y-auto">
            {visibleNotes.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No notes for this project.
              </p>
            ) : (
              visibleNotes.map((note) => {
                const isSelected = selectedNote?.id === note.id;
                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => selectNote(note.id)}
                    className={cn(
                      "flex flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                      isSelected ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-muted",
                    )}
                  >
                    <span className="text-sm font-semibold leading-snug">{note.title}</span>
                    <span className="text-xs font-medium text-primary">{note.projectName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(note.createdAt)} · {formatTime(note.createdAt)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {selectedNote ? (
          <section className="flex flex-1 flex-col gap-6 rounded-lg border bg-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <Heading level="h1">{selectedNote.title}</Heading>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Pencil />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <Link2 />
                  {copyState === "copied" ? "Copied!" : "Copy link to share"}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Attached Project
              </span>
              <Select
                value={attachedOverride ?? selectedNote.projectName}
                onValueChange={setAttachedOverride}
              >
                <SelectTrigger className="w-auto min-w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectOptions.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
              <span className="text-muted-foreground">{formatDate(selectedNote.createdAt)}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{formatTime(selectedNote.createdAt)}</span>
              <span className="text-muted-foreground">·</span>
              <div className="flex flex-wrap gap-2">
                {selectedNote.tags.map((tag) => (
                  <span key={tag} className="font-medium text-primary">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <p className="max-w-3xl text-sm leading-relaxed text-foreground/90">
              {selectedNote.content}
            </p>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (file) setDroppedFileName(file.name);
              }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                isDragging ? "border-primary bg-blue-50 dark:bg-blue-500/10" : "border-border",
              )}
            >
              <ArrowDownToLine className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">Drag and drop an email or attachment here</p>
              <p className="max-w-md text-xs text-muted-foreground">
                Imported email content can be selectively retained — review and choose what to
                keep before it's added to this note.
              </p>
              {droppedFileName ? (
                <p className="text-xs font-medium text-primary">Received: {droppedFileName}</p>
              ) : null}
            </div>

            <Textarea
              ref={textareaRef}
              placeholder="Continue writing…"
              className="min-h-[160px] resize-y p-4 text-sm"
            />

            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Lock className="h-3.5 w-3.5" />
              This note stays private unless you choose to share it.
            </p>
          </section>
        ) : (
          <section className="flex flex-1 items-center justify-center rounded-lg border bg-card p-12 text-sm text-muted-foreground">
            No notes match this filter.
          </section>
        )}
      </div>
    </div>
  );
}
