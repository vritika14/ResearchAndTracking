import { CheckCircle2, MailPlus, Trash2, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  useCreateInvitation,
  useCurrentWorkspace,
  useMe,
  useMembers,
  useRevokeMember,
} from "@/api/hooks";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const invitationSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});
type InvitationForm = z.infer<typeof invitationSchema>;

export function WorkspaceMembers() {
  const me = useMe();
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";
  const isOwner = Boolean(
    me.data && workspace.data?.ownerUserId === me.data.id,
  );
  const members = useMembers(tenantId);
  const createInvitation = useCreateInvitation(tenantId);
  const revokeMember = useRevokeMember(tenantId);
  const form = useForm<InvitationForm>({ defaultValues: { email: "" } });

  async function submit(values: InvitationForm) {
    const parsed = invitationSchema.safeParse(values);
    if (!parsed.success) {
      form.setError("email", { message: parsed.error.issues[0]?.message });
      return;
    }
    createInvitation.reset();
    await createInvitation
      .mutateAsync(parsed.data.email)
      .then(() => form.reset())
      .catch(() => undefined);
  }

  if (!workspace.data) return null;
  const createdInvitation = createInvitation.data;

  function removeMember(membershipId: string, memberEmail: string) {
    if (!window.confirm(`Remove ${memberEmail} from ${workspace.data?.name}?`))
      return;
    revokeMember.mutate(membershipId);
  }

  return (
    <section
      aria-labelledby="workspace-members"
      className="mx-auto mt-6 grid w-full max-w-5xl gap-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <CardTitle id="workspace-members">Workspace members</CardTitle>
              <CardDescription>
                Active members of {workspace.data.name}.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {members.isPending ? (
            <LoadingState title="Loading members" />
          ) : members.isError ? (
            <ErrorState
              description={members.error.message}
              onRetry={() => void members.refetch()}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  {isOwner ? (
                    <TableHead className="text-right">Actions</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.data.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <p className="text-sm font-medium">
                        {member.displayName}
                        {member.userId === me.data?.id ? (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            (you)
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </TableCell>
                    <TableCell className="capitalize">
                      {member.role.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {member.status}
                      </Badge>
                    </TableCell>
                    {isOwner ? (
                      <TableCell className="text-right">
                        {member.role !== "owner" ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={revokeMember.isPending}
                            onClick={() =>
                              removeMember(member.id, member.email)
                            }
                            aria-label={`Remove ${member.email}`}
                          >
                            <Trash2 className="h-4 w-4" />
                            {revokeMember.isPending &&
                            revokeMember.variables === member.id
                              ? "Removing…"
                              : "Remove"}
                          </Button>
                        ) : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {revokeMember.isError ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {revokeMember.error.message}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MailPlus className="h-5 w-5 text-primary" />
              Invite a member
            </CardTitle>
            <CardDescription>
              Invited users always join as limited members. The acceptance
              link is delivered directly by email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-start"
              onSubmit={form.handleSubmit(submit)}
            >
              <div className="flex-1">
                <label htmlFor="invitation-email" className="sr-only">
                  Invitee email
                </label>
                <Input
                  id="invitation-email"
                  type="email"
                  placeholder="colleague@example.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email ? (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                ) : null}
              </div>
              <Button type="submit" disabled={createInvitation.isPending}>
                <MailPlus className="h-4 w-4" />
                {createInvitation.isPending
                  ? "Sending invitation…"
                  : "Send invitation"}
              </Button>
            </form>
            {createInvitation.isError ? (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {createInvitation.error.message}
              </p>
            ) : null}
            {createdInvitation?.emailSent ? (
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold">Invitation sent</p>
                  <p className="mt-1 text-xs text-emerald-800">
                    The acceptance link was emailed to{" "}
                    {createdInvitation.invitation.email}.
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
