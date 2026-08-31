import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import type { ApiConference, ApiProject, ConferenceInput } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ConferenceSubmissionInput = ConferenceInput;

interface ConferenceSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ApiProject[];
  conference?: ApiConference | null;
  onSave: (input: ConferenceSubmissionInput) => Promise<void> | void;
}

const INITIAL_FORM: ConferenceSubmissionInput = {
  acronym: "", name: "", location: "", submissionDue: "", startDate: "",
  endDate: "", submissionType: "Abstract", projectIds: [],
};

function FormField({ label, htmlFor, required, children }: {
  label: string; htmlFor: string; required?: boolean; children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}{required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>
      {children}
    </div>
  );
}

export function ConferenceSubmissionDialog({
  open, onOpenChange, projects, conference, onSave,
}: ConferenceSubmissionDialogProps) {
  const [form, setForm] = useState<ConferenceSubmissionInput>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = Boolean(conference);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setForm(conference ? {
      acronym: conference.acronym,
      name: conference.name,
      location: conference.location,
      submissionDue: conference.submissionDue,
      startDate: conference.startDate,
      endDate: conference.endDate,
      submissionType: conference.submissionType ?? "Abstract",
      projectIds: conference.projects.map((project) => project.id),
    } : INITIAL_FORM);
  }, [conference, open]);

  function toggleProject(projectId: string) {
    setForm((current) => ({
      ...current,
      projectIds: current.projectIds.includes(projectId)
        ? current.projectIds.filter((id) => id !== projectId)
        : [...current.projectIds, projectId],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.submissionDue || !form.startDate || !form.endDate) {
      setFormError("Enter the submission, start, and end dates.");
      return;
    }
    if (form.projectIds.length === 0) {
      setFormError("Select at least one project.");
      return;
    }
    if (form.endDate < form.startDate) {
      setFormError("The conference end date cannot be before its start date.");
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      await onSave({
        ...form,
        acronym: form.acronym.trim().toUpperCase(),
        name: form.name.trim(),
        location: form.location.trim(),
        submissionType: form.submissionType?.trim() || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "The conference could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit conference" : "Add a conference"}</DialogTitle>
          <DialogDescription>
            Track submission and event dates, then link the conference to one or more projects you own.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
            <FormField label="Acronym" htmlFor="conference-acronym" required>
              <Input id="conference-acronym" value={form.acronym} maxLength={20} autoFocus required
                onChange={(event) => setForm((current) => ({ ...current, acronym: event.target.value }))}
                placeholder="ASM" />
            </FormField>
            <FormField label="Conference name" htmlFor="conference-name" required>
              <Input id="conference-name" value={form.name} required
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Conference name and year" />
            </FormField>
          </div>

          <FormField label="Location" htmlFor="conference-location" required>
            <Input id="conference-location" value={form.location} required
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              placeholder="City, country" />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Submission due" htmlFor="conference-submission-due" required>
              <DatePickerInput id="conference-submission-due" label="Submission due"
                value={form.submissionDue}
                onChange={(value) => setForm((current) => ({ ...current, submissionDue: value }))} />
            </FormField>
            <FormField label="Starts" htmlFor="conference-start-date" required>
              <DatePickerInput id="conference-start-date" label="Conference start date"
                value={form.startDate}
                onChange={(value) => setForm((current) => ({ ...current, startDate: value }))} />
            </FormField>
            <FormField label="Ends" htmlFor="conference-end-date" required>
              <DatePickerInput id="conference-end-date" label="Conference end date"
                value={form.endDate}
                onChange={(value) => setForm((current) => ({ ...current, endDate: value }))} />
            </FormField>
          </div>

          <FormField label="Submission type" htmlFor="conference-type">
            <Select value={form.submissionType}
              onValueChange={(value) => setForm((current) => ({ ...current, submissionType: value }))}>
              <SelectTrigger id="conference-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Abstract">Abstract</SelectItem>
                <SelectItem value="Full paper">Full paper</SelectItem>
                <SelectItem value="Poster">Poster</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Linked projects <span className="text-destructive">*</span></legend>
            {projects.length === 0 ? (
              <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                You need to own at least one project before creating a conference.
              </p>
            ) : (
              <div className="grid max-h-40 gap-2 overflow-y-auto rounded-lg border border-border p-3 sm:grid-cols-2">
                {projects.map((project) => (
                  <label key={project.id} className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-accent">
                    <input type="checkbox" checked={form.projectIds.includes(project.id)}
                      onChange={() => toggleProject(project.id)} className="mt-0.5 h-4 w-4 accent-primary" />
                    <span className="text-sm">
                      <span className="block font-medium">{project.title}</span>
                      {project.displayId ? <span className="font-mono text-xs text-muted-foreground">{project.displayId}</span> : null}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          {formError ? <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{formError}</p> : null}

          <DialogFooter className="border-t pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={isSaving || projects.length === 0}>
              {isSaving ? "Saving…" : isEditing ? "Save Changes" : "Add Conference"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
