import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConferenceSubmission, SubmissionType } from "@/data/conference-submissions";

export type ConferenceSubmissionInput = Omit<ConferenceSubmission, "id">;

interface ConferenceSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission?: ConferenceSubmission | null;
  onSave: (submission: ConferenceSubmissionInput) => void;
}

const INITIAL_FORM: ConferenceSubmissionInput = {
  acronym: "",
  name: "",
  location: "",
  submissionDue: "",
  daysRemaining: 1,
  conferenceDates: "",
  type: "Abstract",
  linkedPapers: [],
};

function FormField({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>
      {children}
    </div>
  );
}

export function ConferenceSubmissionDialog({
  open,
  onOpenChange,
  submission,
  onSave,
}: ConferenceSubmissionDialogProps) {
  const [form, setForm] = useState<ConferenceSubmissionInput>(INITIAL_FORM);
  const [linkedPapers, setLinkedPapers] = useState("");
  const isEditing = Boolean(submission);

  useEffect(() => {
    if (!open) return;
    if (submission) {
      setForm({
        acronym: submission.acronym,
        name: submission.name,
        location: submission.location,
        submissionDue: submission.submissionDue,
        daysRemaining: submission.daysRemaining,
        conferenceDates: submission.conferenceDates,
        type: submission.type,
        linkedPapers: submission.linkedPapers,
      });
      setLinkedPapers(submission.linkedPapers.join(", "));
    } else {
      setForm(INITIAL_FORM);
      setLinkedPapers("");
    }
  }, [open, submission]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      ...form,
      acronym: form.acronym.trim().toUpperCase(),
      name: form.name.trim(),
      location: form.location.trim(),
      submissionDue: form.submissionDue.trim(),
      conferenceDates: form.conferenceDates.trim(),
      linkedPapers: linkedPapers
        .split(",")
        .map((paper) => paper.trim())
        .filter(Boolean),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit conference" : "Add a conference"}</DialogTitle>
          <DialogDescription>
            Track the submission deadline, conference dates, and any linked papers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <FormField label="Acronym" htmlFor="conference-acronym" required>
              <Input
                id="conference-acronym"
                value={form.acronym}
                onChange={(event) =>
                  setForm((current) => ({ ...current, acronym: event.target.value }))
                }
                placeholder="ASM"
                maxLength={8}
                autoFocus
                required
              />
            </FormField>
            <FormField label="Conference name" htmlFor="conference-name" required>
              <Input
                id="conference-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Conference name and year"
                required
              />
            </FormField>
          </div>

          <FormField label="Location" htmlFor="conference-location" required>
            <Input
              id="conference-location"
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({ ...current, location: event.target.value }))
              }
              placeholder="City, country"
              required
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Submission due" htmlFor="conference-submission-due" required>
              <Input
                id="conference-submission-due"
                value={form.submissionDue}
                onChange={(event) =>
                  setForm((current) => ({ ...current, submissionDue: event.target.value }))
                }
                placeholder="Aug 1, 2026"
                required
              />
            </FormField>
            <FormField label="Days remaining" htmlFor="conference-days-remaining" required>
              <Input
                id="conference-days-remaining"
                type="number"
                min="0"
                value={form.daysRemaining}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    daysRemaining: Math.max(0, Number(event.target.value)),
                  }))
                }
                required
              />
            </FormField>
            <FormField label="Conference dates" htmlFor="conference-dates" required>
              <Input
                id="conference-dates"
                value={form.conferenceDates}
                onChange={(event) =>
                  setForm((current) => ({ ...current, conferenceDates: event.target.value }))
                }
                placeholder="Jun 4–8, 2027"
                required
              />
            </FormField>
            <FormField label="Submission type" htmlFor="conference-type">
              <Select
                value={form.type}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, type: value as SubmissionType }))
                }
              >
                <SelectTrigger id="conference-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Abstract">Abstract</SelectItem>
                  <SelectItem value="Full paper">Full paper</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Linked papers" htmlFor="conference-linked-papers">
            <Input
              id="conference-linked-papers"
              value={linkedPapers}
              onChange={(event) => setLinkedPapers(event.target.value)}
              placeholder="PRJ-101, PRJ-105"
            />
            <span className="text-xs text-muted-foreground">Separate multiple paper IDs with commas.</span>
          </FormField>

          <DialogFooter className="border-t pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">{isEditing ? "Save Changes" : "Add Conference"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
