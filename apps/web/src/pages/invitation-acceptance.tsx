import { Building2, CheckCircle2, Clock3, Mail, ShieldCheck, Users, XCircle } from "lucide-react";
import { useAuth } from "react-oidc-context";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { ApiError } from "@/api/client";
import { useAcceptInvitation, useInvitationPreview } from "@/api/hooks";
import { AuthScreenBackground } from "@/components/layout/auth-screen-background";
import { Wordmark } from "@/components/layout/wordmark";
import { LoadingState } from "@/components/shared/loading-state";
import { Heading } from "@/components/typography/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function InvitationAcceptancePage() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useParams();
  const preview = useInvitationPreview(token);
  const accept = useAcceptInvitation(token ?? "");

  function signInToAccept() {
    void auth.signinRedirect({ state: { returnTo: `${location.pathname}${location.search}` } });
  }

  if (!token) return <InvitationFailure status={404} onLeave={() => navigate("/sign-in")} />;
  if (preview.isPending) {
    return (
      <InvitationFrame>
        <LoadingState title="Checking invitation" description="Confirming that this invitation is still available." />
      </InvitationFrame>
    );
  }
  if (preview.isError) {
    return (
      <InvitationFailure
        status={preview.error instanceof ApiError ? preview.error.status : 500}
        onLeave={() => navigate("/sign-in")}
        onRetry={() => void preview.refetch()}
      />
    );
  }
  if (accept.isSuccess) {
    return (
      <InvitationFrame>
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <Heading level="h2" className="mt-5">Invitation accepted</Heading>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            You are now a member of <span className="font-semibold text-foreground">{preview.data.workspaceName}</span>.
          </p>
          <Button className="mt-7 min-w-44" onClick={() => navigate("/", { replace: true })}>
            Open Workspace
          </Button>
        </div>
      </InvitationFrame>
    );
  }

  const acceptanceStatus = accept.error instanceof ApiError ? accept.error.status : undefined;
  const acceptanceMessage =
    acceptanceStatus === 403
      ? "This invitation was sent to a different email address. Sign out and use the invited account."
      : acceptanceStatus === 404
        ? "This invitation could not be found. Ask the owner for a new link."
        : acceptanceStatus === 410
          ? "This invitation has expired or has already been used."
          : accept.error?.message;

  return (
    <InvitationFrame>
      <div className="text-center">
        <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">Workspace invitation</Badge>
        <Heading level="h2" className="mt-4">You have been invited</Heading>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Join this Research in Motion workspace using the account that received the invitation.
        </p>
      </div>

      <div className="mt-7 overflow-hidden rounded-lg border">
        <div className="flex items-center gap-4 border-b bg-muted/35 p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Building2 className="h-5 w-5" /></span>
          <div className="min-w-0"><p className="truncate font-semibold">{preview.data.workspaceName}</p><p className="mt-0.5 text-xs text-muted-foreground">Research workspace</p></div>
        </div>
        <dl className="grid gap-0 sm:grid-cols-2">
          <InvitationDetail icon={Users} label="Your role" value="Limited member" />
          <InvitationDetail icon={Clock3} label="Expires" value={new Date(preview.data.expiresAt).toLocaleString()} />
        </dl>
      </div>

      <div className="mt-5 rounded-lg border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          {auth.isAuthenticated ? <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> : <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />}
          <div>
            <p className="text-sm font-semibold">{auth.isAuthenticated ? "Ready to join" : "Sign in with the invited account"}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {auth.isAuthenticated ? `Signed in as ${auth.user?.profile.email ?? "your authenticated account"}.` : `The invitation is for ${preview.data.invitedEmail}.`}
            </p>
          </div>
        </div>
      </div>

      {acceptanceMessage ? <p role="alert" className="mt-4 text-center text-sm text-destructive">{acceptanceMessage}</p> : null}
      {auth.error ? <p role="alert" className="mt-4 text-center text-sm text-destructive">{auth.error.message}</p> : null}

      <div className="mt-6 grid gap-3">
        {auth.isLoading ? (
          <Button disabled className="w-full">Checking your account…</Button>
        ) : auth.isAuthenticated ? (
          <Button className="w-full" disabled={accept.isPending} onClick={() => accept.mutate()}>
            {accept.isPending ? "Accepting…" : "Accept Invitation"}
          </Button>
        ) : (
          <Button className="w-full" onClick={signInToAccept}>Sign In to Accept</Button>
        )}
        <Button variant="ghost" className="w-full" onClick={() => navigate(auth.isAuthenticated ? "/" : "/sign-in")}>Not now</Button>
      </div>
    </InvitationFrame>
  );
}

function InvitationFailure({ status, onLeave, onRetry }: { status: number; onLeave: () => void; onRetry?: () => void }) {
  const expired = status === 410;
  const forbidden = status === 403;
  const title = expired ? "This invitation has expired" : forbidden ? "This invitation is for another account" : status === 404 ? "This invitation is unavailable" : "The invitation could not be checked";
  const description = expired ? "Ask the workspace owner to send a new invitation." : forbidden ? "Sign in with the email address that received the invitation." : status === 404 ? "The link is invalid or the invitation no longer exists." : "Try checking the invitation again.";
  return (
    <InvitationFrame><div className="flex flex-col items-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">{expired ? <Clock3 className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}</span>
      <Heading level="h2" className="mt-5">{title}</Heading><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="mt-7 flex gap-3">{onRetry ? <Button variant="outline" onClick={onRetry}>Try again</Button> : null}<Button variant={onRetry ? "default" : "outline"} onClick={onLeave}>Return to Sign In</Button></div>
    </div></InvitationFrame>
  );
}

function InvitationFrame({ children }: { children: React.ReactNode }) {
  return <AuthScreenBackground><header className="border-b bg-background/95 px-5 py-4 backdrop-blur sm:px-8"><div className="mx-auto max-w-6xl"><Wordmark /></div></header><main className="flex min-h-[calc(100vh-65px)] items-center justify-center px-4 py-10"><section className="w-full max-w-xl rounded-xl border bg-card/95 p-6 shadow-lg backdrop-blur-sm sm:p-8">{children}</section></main></AuthScreenBackground>;
}

function InvitationDetail({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return <div className="flex items-center gap-3 p-4 first:border-b sm:first:border-b-0 sm:first:border-r"><Icon className="h-4 w-4 text-muted-foreground" /><div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-0.5 text-sm font-semibold">{value}</dd></div></div>;
}
