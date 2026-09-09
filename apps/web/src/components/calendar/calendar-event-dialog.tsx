import { useEffect, useState, type FormEvent } from "react";

import { type ApiCalendarEvent } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface CalendarEventFormInput {
  title: string;
  eventDate: string;
}

interface CalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing event; omitted when creating a new one. */
  event?: ApiCalendarEvent | null;
  onSave: (input: CalendarEventFormInput) => Promise<void> | void;
  /** Only offered when editing, and only when the caller may delete this event. */
  onDelete?: () => Promise<void> | void;
}

const INITIAL_FORM: CalendarEventFormInput = {
  title: "",
  eventDate: "",
};

function formFromEvent(event: ApiCalendarEvent): CalendarEventFormInput {
  return {
    title: event.title,
    eventDate: event.eventDate,
  };
}

export function CalendarEventDialog({
  open,
  onOpenChange,
  event,
  onSave,
  onDelete,
}: CalendarEventDialogProps) {
  const [form, setForm] = useState<CalendarEventFormInput>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(event);

  useEffect(() => {
    if (!open) return;
    setForm(event ? formFromEvent(event) : INITIAL_FORM);
    setError(null);
  }, [open, event]);

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        title: form.title.trim(),
        eventDate: form.eventDate,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The event could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!window.confirm(`Delete "${form.title}"? This cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      await onDelete();
      onOpenChange(false);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The event could not be deleted.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit event" : "Add a calendar event"}</DialogTitle>
          <DialogDescription>
            A standalone entry on the calendar — not linked to any project, paper, task or conference.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(formEvent) => void handleSubmit(formEvent)} className="grid gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="calendar-event-title" className="text-sm font-medium">
              Title<span className="ml-1 text-destructive">*</span>
            </label>
            <Input
              id="calendar-event-title"
              value={form.title}
              onChange={(changeEvent) =>
                setForm((prev) => ({ ...prev, title: changeEvent.target.value }))
              }
              placeholder="What's happening?"
              autoFocus
              required
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="calendar-event-date" className="text-sm font-medium">
              Date<span className="ml-1 text-destructive">*</span>
            </label>
            <DatePickerInput
              id="calendar-event-date"
              label="Date"
              value={form.eventDate}
              onChange={(value) => setForm((prev) => ({ ...prev, eventDate: value }))}
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter className="border-t pt-4 sm:justify-between">
            {isEditing && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => void handleDelete()}
                disabled={isSaving || isDeleting}
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSaving || isDeleting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isSaving || isDeleting || !form.title.trim() || !form.eventDate}
              >
                {isSaving ? "Saving…" : isEditing ? "Save Changes" : "Add Event"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
