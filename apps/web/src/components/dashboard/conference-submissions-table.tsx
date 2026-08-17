import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  ConferenceSubmissionDialog,
  type ConferenceSubmissionInput,
} from "@/components/dashboard/conference-submission-dialog";
import { ColumnVisibilityMenu } from "@/components/dashboard/column-visibility-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  conferenceSubmissions,
  type ConferenceSubmission,
  type SubmissionType,
} from "@/data/conference-submissions";
import { cn } from "@/lib/utils";
import { useColumnVisibility } from "@/hooks/use-column-visibility";

const TYPE_FILTERS = ["All", "Abstract", "Full paper"] as const;
const DEADLINE_FILTERS = ["All", "This week", "This month", "Later"] as const;
const CONFERENCE_COLUMNS = [
  { id: "conference", label: "Conference" },
  { id: "submissionDue", label: "Submission Due" },
  { id: "conferenceDates", label: "Conference Dates" },
  { id: "type", label: "Type" },
  { id: "linkedPapers", label: "Linked Papers" },
  { id: "actions", label: "Actions" },
] as const;

type TypeFilter = (typeof TYPE_FILTERS)[number];
type DeadlineFilter = (typeof DEADLINE_FILTERS)[number];

function typeBadgeClass(type: SubmissionType) {
  return type === "Abstract"
    ? "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
    : "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400";
}

function urgencyClass(daysRemaining: number) {
  if (daysRemaining <= 3) return "font-semibold text-destructive";
  if (daysRemaining <= 7) return "font-medium text-orange-600 dark:text-orange-400";
  return "text-muted-foreground";
}

function matchesDeadline(daysRemaining: number, filter: DeadlineFilter) {
  switch (filter) {
    case "All":
      return true;
    case "This week":
      return daysRemaining <= 7;
    case "This month":
      return daysRemaining > 7 && daysRemaining <= 30;
    case "Later":
      return daysRemaining > 30;
  }
}

export function ConferenceSubmissionsTable() {
  const [submissions, setSubmissions] = useState(conferenceSubmissions);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("All");
  const [deadline, setDeadline] = useState<DeadlineFilter>("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<ConferenceSubmission | null>(null);
  const columns = useColumnVisibility(
    CONFERENCE_COLUMNS.map((column) => column.id),
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return submissions.filter((row) => {
      if (type !== "All" && row.type !== type) return false;
      if (!matchesDeadline(row.daysRemaining, deadline)) return false;
      if (
        query &&
        !row.name.toLowerCase().includes(query) &&
        !row.acronym.toLowerCase().includes(query) &&
        !row.location.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [submissions, search, type, deadline]);

  const hasActiveFilters = search !== "" || type !== "All" || deadline !== "All";

  function clearFilters() {
    setSearch("");
    setType("All");
    setDeadline("All");
  }

  function createSubmission(input: ConferenceSubmissionInput) {
    setSubmissions((current) => [
      ...current,
      { ...input, id: `conference-${Date.now()}` },
    ]);
  }

  function updateSubmission(input: ConferenceSubmissionInput) {
    if (!editingSubmission) return;
    setSubmissions((current) =>
      current.map((submission) =>
        submission.id === editingSubmission.id
          ? { ...input, id: editingSubmission.id }
          : submission,
      ),
    );
    setEditingSubmission(null);
  }

  function deleteSubmission(submission: ConferenceSubmission) {
    if (!window.confirm(`Delete "${submission.name}"? This action cannot be undone.`)) return;
    setSubmissions((current) => current.filter((row) => row.id !== submission.id));
  }

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Upcoming Conference Submissions</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wide">
              Deadline Approaching.
            </CardDescription>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus />
            New Conference
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conference or location…"
            className="sm:max-w-xs"
          />
          <Select value={type} onValueChange={(value) => setType(value as TypeFilter)}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_FILTERS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "All" ? "All types" : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={deadline} onValueChange={(value) => setDeadline(value as DeadlineFilter)}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Deadline" />
            </SelectTrigger>
            <SelectContent>
              {DEADLINE_FILTERS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "All" ? "All deadlines" : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ColumnVisibilityMenu
            columns={CONFERENCE_COLUMNS}
            visibleColumns={columns.visibleColumns}
            onToggle={columns.toggleColumn}
          />
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.isColumnVisible("conference") ? <TableHead>Conference</TableHead> : null}
              {columns.isColumnVisible("submissionDue") ? (
                <TableHead>Submission Due</TableHead>
              ) : null}
              {columns.isColumnVisible("conferenceDates") ? (
                <TableHead>Conference Dates</TableHead>
              ) : null}
              {columns.isColumnVisible("type") ? <TableHead>Type</TableHead> : null}
              {columns.isColumnVisible("linkedPapers") ? (
                <TableHead>Linked Papers</TableHead>
              ) : null}
              {columns.isColumnVisible("actions") ? (
                <TableHead className="text-right">Actions</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.visibleColumns.size}
                  className="h-24 text-center text-muted-foreground"
                >
                  No submissions match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  {columns.isColumnVisible("conference") ? (
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
                          {row.acronym}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-semibold">{row.name}</span>
                          <span className="text-xs text-muted-foreground">{row.location}</span>
                        </div>
                      </div>
                    </TableCell>
                  ) : null}
                  {columns.isColumnVisible("submissionDue") ? (
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{row.submissionDue}</span>
                        <span className={cn("text-xs", urgencyClass(row.daysRemaining))}>
                          {row.daysRemaining <= 0
                            ? "Due today"
                            : `${row.daysRemaining} day${row.daysRemaining === 1 ? "" : "s"} left`}
                        </span>
                      </div>
                    </TableCell>
                  ) : null}
                  {columns.isColumnVisible("conferenceDates") ? (
                    <TableCell className="text-muted-foreground">
                      {row.conferenceDates}
                    </TableCell>
                  ) : null}
                  {columns.isColumnVisible("type") ? (
                    <TableCell>
                      <Badge variant="outline" className={typeBadgeClass(row.type)}>
                        {row.type}
                      </Badge>
                    </TableCell>
                  ) : null}
                  {columns.isColumnVisible("linkedPapers") ? (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.linkedPapers.map((paperId) => (
                          <span
                            key={paperId}
                            className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-primary ring-1 ring-inset ring-primary/15"
                          >
                            {paperId}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                  ) : null}
                  {columns.isColumnVisible("actions") ? (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${row.name}`}
                          onClick={() => setEditingSubmission(row)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Delete ${row.name}`}
                          onClick={() => deleteSubmission(row)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <ConferenceSubmissionDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSave={createSubmission}
      />
      <ConferenceSubmissionDialog
        open={editingSubmission !== null}
        onOpenChange={(open) => {
          if (!open) setEditingSubmission(null);
        }}
        submission={editingSubmission}
        onSave={updateSubmission}
      />
    </Card>
  );
}
