import { Copy, MailPlus, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useCreateInvitation, useCurrentWorkspace, useMe, useMembers } from "@/api/hooks";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const invitationSchema = z.object({ email: z.string().trim().email("Enter a valid email address.") });
type InvitationForm = z.infer<typeof invitationSchema>;

export function WorkspaceMembers() {
  const me = useMe();
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";
  const isOwner = Boolean(me.data && workspace.data?.ownerUserId === me.data.id);
  const members = useMembers(tenantId);
  const createInvitation = useCreateInvitation(tenantId);
  const form = useForm<InvitationForm>({ defaultValues: { email: "" } });

  async function submit(values: InvitationForm) {
    const parsed = invitationSchema.safeParse(values);
    if (!parsed.success) {
      form.setError("email", { message: parsed.error.issues[0]?.message });
      return;
    }
    await createInvitation.mutateAsync(parsed.data.email).then(() => form.reset()).catch(() => undefined);
  }

  if (!workspace.data) return null;
  const createdInvitation = createInvitation.data;
  const invitationUrl = createdInvitation
    ? `${window.location.origin}/invitations/${encodeURIComponent(createdInvitation.acceptanceToken)}`
    : undefined;

  return (
    <section aria-labelledby="workspace-members" className="mx-auto mt-6 grid w-full max-w-5xl gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-primary/10 p-2 text-primary"><Users className="h-5 w-5" /></span>
            <div><CardTitle id="workspace-members">Workspace members</CardTitle><CardDescription>Active members of {workspace.data.name}.</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent>
          {members.isPending ? <LoadingState title="Loading members" /> : members.isError ? (
            <ErrorState description={members.error.message} onRetry={() => void members.refetch()} />
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {members.data.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-mono text-xs">{member.userId}{member.userId === me.data?.id ? <span className="ml-2 font-sans text-muted-foreground">(you)</span> : null}</TableCell>
                    <TableCell className="capitalize">{member.role.replace("_", " ")}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{member.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isOwner ? (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MailPlus className="h-5 w-5 text-primary" />Invite a member</CardTitle><CardDescription>Invited users always join as limited members.</CardDescription></CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3 sm:flex-row sm:items-start" onSubmit={form.handleSubmit(submit)}>
              <div className="flex-1"><label htmlFor="invitation-email" className="sr-only">Invitee email</label><Input id="invitation-email" type="email" placeholder="colleague@example.com" {...form.register("email")} />{form.formState.errors.email ? <p role="alert" className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p> : null}</div>
              <Button type="submit" disabled={createInvitation.isPending}>{createInvitation.isPending ? "Creating…" : "Create invitation"}</Button>
            </form>
            {createInvitation.isError ? <p role="alert" className="mt-3 text-sm text-destructive">{createInvitation.error.message}</p> : null}
            {invitationUrl ? (
              <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-semibold">Invitation link created</p><p className="mt-1 text-xs text-muted-foreground">This link is shown once. Send it only to {createdInvitation?.invitation.email}.</p>
                <div className="mt-3 flex gap-2"><Input aria-label="Invitation link" readOnly value={invitationUrl} className="font-mono text-xs" /><Button type="button" variant="outline" aria-label="Copy invitation link" onClick={() => void navigator.clipboard.writeText(invitationUrl)}><Copy className="h-4 w-4" /></Button></div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
