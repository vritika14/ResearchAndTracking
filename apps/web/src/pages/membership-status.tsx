import { Clock3, PauseCircle, UserX } from "lucide-react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { AuthStateFrame } from "@/components/auth/auth-state-frame";
import { Button } from "@/components/ui/button";

type MembershipStatus = "pending" | "suspended" | "inactive";

const membershipStates = {
  pending: {
    icon: Clock3,
    eyebrow: "Membership pending",
    title: "Your workspace access is being prepared",
    description:
      "You are signed in, but your workspace membership has not been activated yet.",
    detail: "You can try again later or contact the workspace owner if you need access urgently.",
    tone: "warning" as const,
  },
  suspended: {
    icon: PauseCircle,
    eyebrow: "Membership suspended",
    title: "Your workspace access is paused",
    description:
      "Your account is active, but this workspace membership has been temporarily suspended.",
    detail: "Contact the workspace owner or administrator to ask why access was paused and how it can be restored.",
    tone: "warning" as const,
  },
  inactive: {
    icon: UserX,
    eyebrow: "Membership inactive",
    title: "You are no longer an active member",
    description:
      "This account no longer has an active membership in the requested workspace.",
    detail: "Sign in with the account that owns the workspace if you still need access.",
    tone: "danger" as const,
  },
} satisfies Record<MembershipStatus, object>;

export default function MembershipStatusPage() {
  const navigate = useNavigate();
  const { status } = useParams();
  const [searchParams] = useSearchParams();
  const workspaceName = searchParams.get("workspace");

  if (status === "active") {
    return <Navigate to="/" replace />;
  }

  if (status !== "pending" && status !== "suspended" && status !== "inactive") {
    return <Navigate to="/access-denied" replace />;
  }

  const state = membershipStates[status];

  return (
    <AuthStateFrame
      icon={state.icon}
      eyebrow={state.eyebrow}
      title={state.title}
      description={state.description}
      tone={state.tone}
    >
      <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
        {workspaceName ? (
          <p className="mb-2 font-semibold text-foreground">Workspace: {workspaceName}</p>
        ) : null}
        <p>{state.detail}</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button variant="outline" onClick={() => navigate("/sign-in", { replace: true })}>
          Use Another Account
        </Button>
        <Button onClick={() => navigate("/", { replace: true })}>Check Access Again</Button>
      </div>
    </AuthStateFrame>
  );
}
