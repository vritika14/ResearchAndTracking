import { useForm } from "react-hook-form";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Crown,
  Plus,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import {
  useCreateWorkspace,
  useCurrentWorkspace,
  useSwitchWorkspace,
  useWorkspaces,
} from "@/api/hooks";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Heading } from "@/components/typography/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const workspaceSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(100),
});

type WorkspaceForm = z.infer<typeof workspaceSchema>;

export default function WorkspacesPage() {
  const navigate = useNavigate();
  const workspaces = useWorkspaces();
  const current = useCurrentWorkspace();
  const switchWorkspace = useSwitchWorkspace();
  const createWorkspace = useCreateWorkspace();
  const form = useForm<WorkspaceForm>({ defaultValues: { name: "" } });

  async function switchTo(workspaceId: string) {
    await switchWorkspace.mutateAsync(workspaceId);
    navigate("/", { replace: true });
  }

  async function create(values: WorkspaceForm) {
    const parsed = workspaceSchema.safeParse(values);
    if (!parsed.success) {
      form.setError("name", { message: parsed.error.issues[0]?.message });
      return;
    }

    await createWorkspace
      .mutateAsync(parsed.data.name)
      .then(() => form.reset())
      .catch(() => undefined);
  }

  if (workspaces.isPending || current.isPending) {
    return (
      <LoadingState title="Loading your workspaces" className="min-h-[50vh]" />
    );
  }
  if (workspaces.isError) {
    return (
      <ErrorState
        title="Your workspaces could not be loaded"
        description={workspaces.error.message}
        onRetry={() => void workspaces.refetch()}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl pb-12">
      <div className="flex flex-col gap-4 border-b pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Heading level="h1">Workspaces</Heading>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            View every research workspace you can access and choose which one is
            active.
          </p>
        </div>
        <Badge variant="outline" className="w-fit px-3 py-1">
          {workspaces.data.length}{" "}
          {workspaces.data.length === 1 ? "workspace" : "workspaces"}
        </Badge>
      </div>

      <section aria-labelledby="available-workspaces" className="mt-7">
        <h2
          id="available-workspaces"
          className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Available to you
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.data.map((workspace) => {
            const isCurrent = workspace.id === current.data?.id;
            const isOwner = workspace.membershipRole === "owner";
            const isSwitching =
              switchWorkspace.isPending &&
              switchWorkspace.variables === workspace.id;

            return (
              <Card
                key={workspace.id}
                className={
                  isCurrent ? "border-primary/50 shadow-md" : undefined
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-xl bg-primary/10 p-3 text-primary">
                      <Building2 className="h-5 w-5" />
                    </span>
                    {isCurrent ? (
                      <Badge className="gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Current
                      </Badge>
                    ) : null}
                  </div>
                  <CardTitle className="pt-2">{workspace.name}</CardTitle>
                  <CardDescription className="truncate">
                    {workspace.slug}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
                    {isOwner ? (
                      <Crown className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Users className="h-4 w-4" />
                    )}
                    <span>{isOwner ? "Owner" : "Limited member"}</span>
                  </div>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent || switchWorkspace.isPending}
                    onClick={() => void switchTo(workspace.id)}
                  >
                    {isCurrent
                      ? "Active workspace"
                      : isSwitching
                        ? "Switching…"
                        : "Switch workspace"}
                    {!isCurrent && !isSwitching ? (
                      <ArrowRight className="h-4 w-4" />
                    ) : null}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {switchWorkspace.isError ? (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {switchWorkspace.error.message}
          </p>
        ) : null}
      </section>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create another workspace
          </CardTitle>
          <CardDescription>
            You will become the owner and the new workspace will become active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-start"
            onSubmit={form.handleSubmit(create)}
          >
            <div className="flex-1">
              <label htmlFor="new-workspace-name" className="sr-only">
                Workspace name
              </label>
              <Input
                id="new-workspace-name"
                placeholder="Workspace name"
                {...form.register("name")}
              />
              {form.formState.errors.name ? (
                <p role="alert" className="mt-1 text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" disabled={createWorkspace.isPending}>
              {createWorkspace.isPending ? "Creating…" : "Create workspace"}
            </Button>
          </form>
          {createWorkspace.isError ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {createWorkspace.error.message}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
