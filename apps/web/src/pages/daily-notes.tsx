import { useMemo, useState } from "react";
import { ArrowUpDown, Pencil, Plus, Save, Trash2, X } from "lucide-react";

import { Heading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { dailyNotes, type DailyNote } from "@/data/daily-notes";
import { cn } from "@/lib/utils";

const ALL_PROJECTS = "All projects";

interface NoteDraft {
  title: string;
  projectName: string;
  tags: string;
  content: string;
}

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

function draftFromNote(note: DailyNote): NoteDraft {
  return {
    title: note.title,
    projectName: note.projectName,
    tags: note.tags.join(", "),
    content: note.content,
  };
}

export default function DailyNotesPage() {
  const [notes, setNotes] = useState<DailyNote[]>(dailyNotes);
  const [selectedId, setSelectedId] = useState(dailyNotes[0].id);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [projectFilter, setProjectFilter] = useState(ALL_PROJECTS);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<NoteDraft>(() => draftFromNote(dailyNotes[0]));

  const projectOptions = useMemo(
    () => Array.from(new Set(dailyNotes.map((note) => note.projectName))),
    [],
  );

  const visibleNotes = useMemo(() => {
    const filtered = notes.filter(
      (note) => projectFilter === ALL_PROJECTS || note.projectName === projectFilter,
    );
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return sortOrder === "newest" ? sorted.reverse() : sorted;
  }, [notes, projectFilter, sortOrder]);

  const selectedNote = visibleNotes.find((note) => note.id === selectedId) ?? visibleNotes[0];
  const isEditing = editingId !== null;

  function selectNote(id: string) {
    setSelectedId(id);
    setEditingId(null);
  }

  function startAdding() {
    setEditingId("new");
    setDraft({
      title: "",
      projectName:
        projectFilter === ALL_PROJECTS ? (projectOptions[0] ?? "") : projectFilter,
      tags: "",
      content: "",
    });
  }

  function startEditing() {
    if (!selectedNote) return;
    setEditingId(selectedNote.id);
    setDraft(draftFromNote(selectedNote));
  }

  function cancelEditing() {
    setEditingId(null);
  }

  function saveNote() {
    const projectName = draft.projectName || projectOptions[0] || "No project selected";
    const projectId =
      dailyNotes.find((note) => note.projectName === projectName)?.projectId ?? "PRJ-000";
    const tags = draft.tags
      .split(",")
      .map((tag) => tag.trim().replace(/^#/, ""))
      .filter(Boolean);

    if (editingId === "new") {
      const newNote: DailyNote = {
        id: `note-${Date.now()}`,
        title: draft.title.trim() || "Untitled note",
        projectId,
        projectName,
        createdAt: new Date().toISOString(),
        tags,
        content: draft.content.trim(),
      };
      setNotes((current) => [newNote, ...current]);
      setSelectedId(newNote.id);
    } else if (editingId) {
      setNotes((current) =>
        current.map((note) =>
          note.id === editingId
            ? {
                ...note,
                title: draft.title.trim() || "Untitled note",
                projectId,
                projectName,
                tags,
                content: draft.content.trim(),
              }
            : note,
        ),
      );
    }

    setEditingId(null);
  }

  function deleteSelectedNote() {
    if (!selectedNote) return;
    const remainingNotes = notes.filter((note) => note.id !== selectedNote.id);
    setNotes(remainingNotes);
    setSelectedId(remainingNotes[0]?.id ?? "");
    setEditingId(null);
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

        <section className="min-h-[620px] flex-1 rounded-lg border bg-card p-6">
          <div className="mb-8 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {editingId === "new" ? "Create note" : "Selected note"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {editingId === "new"
                  ? "Capture a new research update."
                  : "Review or update the selected daily note."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={cancelEditing}>
                    <X />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveNote}>
                    <Save />
                    Save note
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" onClick={startAdding}>
                    <Plus />
                    Add note
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startEditing}
                    disabled={!selectedNote}
                  >
                    <Pencil />
                    Edit note
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteSelectedNote}
                    disabled={!selectedNote}
                  >
                    <Trash2 />
                    Delete note
                  </Button>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="flex max-w-4xl flex-col gap-6">
              <div className="grid gap-2">
                <label htmlFor="note-title" className="text-xs font-semibold text-muted-foreground">
                  Note title
                </label>
                <Input
                  id="note-title"
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Enter a note title"
                  className="h-11 text-lg font-semibold"
                  autoFocus
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Attached project
                  </label>
                  <Select
                    value={draft.projectName}
                    onValueChange={(projectName) =>
                      setDraft((current) => ({ ...current, projectName }))
                    }
                  >
                    <SelectTrigger>
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

                <div className="grid gap-2">
                  <label htmlFor="note-tags" className="text-xs font-semibold text-muted-foreground">
                    Tags
                  </label>
                  <Input
                    id="note-tags"
                    value={draft.tags}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, tags: event.target.value }))
                    }
                    placeholder="research, analysis, follow-up"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="note-content"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Note
                </label>
                <Textarea
                  id="note-content"
                  value={draft.content}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, content: event.target.value }))
                  }
                  placeholder="Write the note…"
                  className="min-h-[220px] resize-y p-4 text-sm leading-relaxed"
                />
              </div>
            </div>
          ) : selectedNote ? (
            <article className="max-w-4xl">
              <Heading level="h1">{selectedNote.title}</Heading>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                <span className="font-medium text-primary">{selectedNote.projectName}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{formatDate(selectedNote.createdAt)}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{formatTime(selectedNote.createdAt)}</span>
              </div>

              {selectedNote.tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedNote.tags.map((tag) => (
                    <span key={tag} className="text-sm font-medium text-primary">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <p className="mt-8 whitespace-pre-wrap text-[15px] leading-7 text-foreground/90">
                {selectedNote.content || "This note does not have any content yet."}
              </p>
            </article>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center">
              <Heading level="h3">No note selected</Heading>
              <p className="text-sm text-muted-foreground">
                Add a note to begin capturing research updates.
              </p>
              <Button onClick={startAdding}>
                <Plus />
                Add note
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
