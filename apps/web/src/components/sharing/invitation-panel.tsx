import { Check, Copy, MailPlus, Search, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import {
  useCollaboratorInvitations,
  useInviteCollaborator,
  useRevokeCollaboratorInvitation,
  useUserSearch,
  type CreatedInvitation,
  type InvitationTarget,
} from "@/api/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InvitationPanelProps {
  target: InvitationTarget;
  tenantId: string;
  entityId: string;
  entityTitle: string;
  excludedUserIds?: string[];
}

function invitationUrl(token: string) {
  return `${window.location.origin}/invitations/${encodeURIComponent(token)}`;
}

export function InvitationPanel({
  target,
  tenantId,
  entityId,
  entityTitle,
  excludedUserIds = [],
}: InvitationPanelProps) {
  const invitationsQuery = useCollaboratorInvitations(target, tenantId, entityId);
  const invite = useInviteCollaborator(target, tenantId, entityId);
  const revoke = useRevokeCollaboratorInvitation(target, tenantId, entityId);
  const [email, setEmail] = useState("");
  const [created, setCreated] = useState<CreatedInvitation | null>(null);
  const [copied, setCopied] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const userSearch = useUserSearch(email, pickerOpen);

  const pending = useMemo(
    () => (invitationsQuery.data ?? []).filter((invitation) => invitation.status === "pending"),
    [invitationsQuery.data],
  );
  const availableUsers = useMemo(() => {
    const pendingEmails = new Set(pending.map((invitation) => invitation.email.toLowerCase()));
    const unavailableUserIds = new Set(excludedUserIds);
    return (userSearch.data ?? []).filter(
      (user) =>
        !unavailableUserIds.has(user.id) &&
        !pendingEmails.has(user.email.toLowerCase()),
    );
  }, [excludedUserIds, pending, userSearch.data]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await invite.mutateAsync(email.trim().toLowerCase());
    setCreated(result);
    setEmail("");
    setPickerOpen(false);
    setCopied(false);
  }

  const link = created ? invitationUrl(created.acceptanceToken) : "";

  return (
    <div className="grid gap-4 border-t border-border/70 pt-4">
      <div>
        <p className="text-sm font-semibold">Invite by email</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Amazon SES emails a secure one-time link. The recipient appears below as pending until acceptance.
        </p>
      </div>

      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-2 sm:flex-row">
        <div
          className="relative flex-1"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setPickerOpen(false);
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            role="combobox"
            value={email}
            onFocus={() => setPickerOpen(true)}
            onChange={(event) => {
              setEmail(event.target.value);
              setPickerOpen(true);
            }}
            placeholder="Search a name or email"
            aria-label="Collaborator email"
            aria-expanded={pickerOpen && Boolean(email.trim())}
            aria-controls="collaborator-email-options"
            aria-autocomplete="list"
            autoComplete="off"
            className="pl-9"
            required
          />
          {pickerOpen && email.trim() ? (
            <div
              id="collaborator-email-options"
              role="listbox"
              aria-label="Available collaborator emails"
              className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
            >
              {userSearch.isPending ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">Searching available emails…</p>
              ) : userSearch.isError ? (
                <p className="px-3 py-2 text-sm text-destructive">Unable to search users.</p>
              ) : availableUsers.length ? (
                availableUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    role="option"
                    aria-selected={email.toLowerCase() === user.email.toLowerCase()}
                    className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setEmail(user.email);
                      setPickerOpen(false);
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{user.displayName}</span>
                      <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                    </span>
                    {email.toLowerCase() === user.email.toLowerCase() ? (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    ) : null}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  No available users found. You can still enter a complete email address.
                </p>
              )}
            </div>
          ) : null}
        </div>
        <Button type="submit" disabled={invite.isPending || !email.trim()}>
          <MailPlus className="h-4 w-4" />
          {invite.isPending ? "Sending…" : "Send invitation"}
        </Button>
      </form>
      {invite.isError ? <p className="text-xs text-destructive">{invite.error.message}</p> : null}

      {created ? (
        <div className="grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <Check className="h-4 w-4" /> Invitation emailed to {created.invitation.email}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Amazon SES sent the secure acceptance link for {entityTitle}. It remains pending until accepted.
            </p>
          </div>
          <Input value={link} readOnly aria-label="Invitation link" className="font-mono text-xs" />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(link).then(() => setCopied(true));
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Pending collaborators</p>
          <Badge variant="secondary">{pending.length}</Badge>
        </div>
        {invitationsQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Loading invitations…</p>
        ) : invitationsQuery.isError ? (
          <p className="text-sm text-destructive">{invitationsQuery.error.message}</p>
        ) : pending.length ? (
          pending.map((invitation) => (
            <div key={invitation.id} className="flex items-center justify-between gap-3 rounded-lg border bg-amber-50/60 p-3 dark:bg-amber-950/10">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{invitation.email}</p>
                <p className="text-xs text-muted-foreground">
                  Pending · expires {new Date(invitation.expiresAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`Revoke invitation for ${invitation.email}`}
                onClick={() => revoke.mutate(invitation.id)}
                disabled={revoke.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No pending invitations.</p>
        )}
        {revoke.isError ? (
          <p className="text-sm text-destructive">{revoke.error.message}</p>
        ) : null}
      </div>
    </div>
  );
}
