import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
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
import { conferenceSubmissions, type SubmissionType } from "@/data/conference-submissions";
import { cn } from "@/lib/utils";

const TYPE_FILTERS = ["All", "Abstract", "Full paper"] as const;
const DEADLINE_FILTERS = ["All", "This week", "This month", "Later"] as const;

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
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("All");
  const [deadline, setDeadline] = useState<DeadlineFilter>("All");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return conferenceSubmissions.filter((row) => {
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
  }, [search, type, deadline]);

  const hasActiveFilters = search !== "" || type !== "All" || deadline !== "All";

  function clearFilters() {
    setSearch("");
    setType("All");
    setDeadline("All");
  }

  return (
    <Card>
      <CardHeader className="gap-4">
        <div>
          <CardTitle>Upcoming Conference Submissions</CardTitle>
          <CardDescription className="text-xs uppercase tracking-wide">
            Deadline Approaching.
          </CardDescription>
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
              <TableHead>Conference</TableHead>
              <TableHead>Submission Due</TableHead>
              <TableHead>Conference Dates</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Linked Papers</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No submissions match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
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
                  <TableCell className="text-muted-foreground">{row.conferenceDates}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={typeBadgeClass(row.type)}>
                      {row.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.linkedPapers.map((paperId) => (
                        <span
                          key={paperId}
                          className="rounded-md bg-blue-50 px-1.5 py-0.5 font-mono text-[11px] font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                        >
                          {paperId}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
