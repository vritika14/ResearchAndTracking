import { useState } from "react";
import { Building2, CheckCircle2, Clock3, Mail, ShieldCheck, Users, XCircle } from "lucide-react";
import { useAuth } from "react-oidc-context";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { Wordmark } from "@/components/layout/wordmark";
import { Heading } from "@/components/typography/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

const invitationPreview = {
  workspaceName: "Research Operations",
  inviterName: "Dr. Emma Jepsen",
  role: "Member",
  expiresIn: "6 days",
};

export default function InvitationAcceptancePage() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const previewStatus = searchParams.get("status");
  const initialStatus: InvitationStatus =
    previewStatus === "expired" || previewStatus === "revoked" ? previewStatus : "pending";
  const [status, setStatus] = useState<InvitationStatus>(initialStatus);
  const email = auth.user?.profile.email;

  function signInToAccept() {
    void auth.signinRedirect({
      state: { returnTo: `${location.pathname}${location.search}` },
    });
  }

  if (!token || status === "expired" || status === "revoked") {
    const expired = status === "expired";
    return (
      <InvitationFrame>
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            {expired ? <Clock3 className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
          </span>
          <Heading level="h2" className="mt-5">
            {expired ? "This invitation has expired" : "This invitation is unavailable"}
          </Heading>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            {expired
              ? "Ask the workspace owner to send you a new invitation. For security, expired links cannot be reused."
              : "The invitation may have been revoked or already replaced. Contact the person who invited you for a new link."}
          </p>
          <Button variant="outline" className="mt-7" onClick={() => navigate("/sign-in") }>
            Return to Sign In
          </Button>
        </div>
      </InvitationFrame>
    );
  }

  if (status === "accepted") {
    return (
      <InvitationFrame>
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <Heading level="h2" className="mt-5">Invitation accepted</Heading>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            You are now a member of <span className="font-semibold text-foreground">{invitationPreview.workspaceName}</span>.
          </p>
          <Button className="mt-7 min-w-44" onClick={() => navigate("/", { replace: true })}>
            Open Workspace
          </Button>
        </div>
      </InvitationFrame>
    );
  }

  return (
    <InvitationFrame>
      <div className="text-center">
        <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
          Workspace invitation
        </Badge>
        <Heading level="h2" className="mt-4">You have been invited</Heading>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {invitationPreview.inviterName} invited you to collaborate in a Research &amp; Tracking workspace.
        </p>
      </div>

      <div className="mt-7 overflow-hidden rounded-lg border">
        <div className="flex items-center gap-4 border-b bg-muted/35 p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{invitationPreview.workspaceName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Research workspace</p>
          </div>
        </div>
        <dl className="grid gap-0 sm:grid-cols-2">
          <InvitationDetail icon={Users} label="Your role" value={invitationPreview.role} />
          <InvitationDetail icon={Clock3} label="Invitation expires" value={invitationPreview.expiresIn} />
        </dl>
      </div>

      <div className="mt-5 rounded-lg border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          {auth.isAuthenticated ? <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> : <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />}
          <div>
            <p className="text-sm font-semibold">
              {auth.isAuthenticated ? "Ready to join" : "Sign in with the invited account"}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {auth.isAuthenticated
                ? `You are signed in as ${email ?? "your authenticated account"}.`
                : "Authentication confirms your identity before the invitation is accepted."}
            </p>
          </div>
        </div>
      </div>

      {auth.error ? <p className="mt-4 text-center text-sm text-destructive">{auth.error.message}</p> : null}

      <div className="mt-6 grid gap-3">
        {auth.isLoading ? (
          <Button disabled className="w-full">Checking your account…</Button>
        ) : auth.isAuthenticated ? (
          <Button className="w-full" onClick={() => setStatus("accepted")}>Accept Invitation</Button>
        ) : (
          <Button className="w-full" onClick={signInToAccept}>Sign In to Accept</Button>
        )}
        <Button variant="ghost" className="w-full" onClick={() => navigate(auth.isAuthenticated ? "/" : "/sign-in")}>
          Not now
        </Button>
      </div>

      <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
        Accepting gives you the workspace role shown above. Project-specific access can still be limited by the workspace owner.
      </p>
    </InvitationFrame>
  );
}

function InvitationFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background/95 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto max-w-6xl"><Wordmark /></div>
      </header>
      <main className="flex min-h-[calc(100vh-65px)] items-center justify-center px-4 py-10">
        <section className="w-full max-w-xl rounded-xl border bg-card p-6 shadow-sm sm:p-8">{children}</section>
      </main>
    </div>
  );
}

function InvitationDetail({ icon: Icon, label, value }: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 first:border-b sm:first:border-b-0 sm:first:border-r">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
      </div>
    </div>
  );
}
