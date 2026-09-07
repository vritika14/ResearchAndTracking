import { useState } from "react";
import { Activity, ShieldAlert } from "lucide-react";

import { useAnalyticsSummary, useCurrentWorkspace } from "@/api/hooks";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeading } from "@/components/typography/heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WINDOW_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

function formatDay(day: string) {
  return new Date(`${day}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function UsagePage() {
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";
  const isOwner = workspace.data?.membershipRole === "owner";
  const [days, setDays] = useState(30);
  const summary = useAnalyticsSummary(tenantId, days, isOwner);

  if (workspace.isPending) {
    return <LoadingState title="Loading workspace" className="min-h-[50vh]" />;
  }

  if (!isOwner) {
    return (
      <div className="page-stack">
        <PageHeading
          icon={Activity}
          tone="cyan"
          eyebrow="Insights"
          title="Usage"
          description="See how your workspace uses Research in Motion."
        />
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <ShieldAlert className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Only the workspace owner can view usage analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (summary.isPending) {
    return <LoadingState title="Loading usage data" className="min-h-[50vh]" />;
  }

  if (summary.isError) {
    return (
      <ErrorState
        title="Usage data could not be loaded"
        description={summary.error.message}
        onRetry={() => void summary.refetch()}
      />
    );
  }

  const maxByName = Math.max(1, ...summary.data.byName.map((row) => row.count));
  const maxByDay = Math.max(1, ...summary.data.byDay.map((row) => row.count));

  return (
    <div className="page-stack">
      <PageHeading
        icon={Activity}
        tone="cyan"
        eyebrow="Insights"
        title="Usage"
        description="First-party usage analytics for this workspace — page views and key actions your members take. Visible only to you as the owner."
        actions={
          <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
            <SelectTrigger className="w-44" aria-label="Time window">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WINDOW_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Total events</CardDescription>
            <CardTitle className="text-4xl">{summary.data.totalEvents}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Event types recorded</CardDescription>
            <CardTitle className="text-4xl">{summary.data.byName.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily activity</CardTitle>
          <CardDescription>Events per day over the selected window.</CardDescription>
        </CardHeader>
        <CardContent>
          {summary.data.byDay.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No activity recorded yet.
            </p>
          ) : (
            <div
              role="img"
              aria-label="Events per day"
              className="flex h-40 items-end gap-1 overflow-x-auto"
            >
              {summary.data.byDay.map((row) => (
                <div
                  key={row.day}
                  title={`${formatDay(row.day)}: ${row.count} event${row.count === 1 ? "" : "s"}`}
                  className="flex min-w-[6px] flex-1 flex-col items-center justify-end"
                >
                  <div
                    className="w-full rounded-t bg-primary/70"
                    style={{ height: `${Math.max(4, (row.count / maxByDay) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Events by type</CardTitle>
          <CardDescription>Which actions members take most often.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {summary.data.byName.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No events recorded yet.
            </p>
          ) : (
            summary.data.byName.map((row) => (
              <div key={row.name} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm font-medium">{row.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(row.count / maxByName) * 100}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm text-muted-foreground">
                  {row.count}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
