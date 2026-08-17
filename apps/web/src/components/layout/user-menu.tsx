import { useAuth } from "react-oidc-context";

import { useCurrentWorkspace } from "@/api/hooks";
import { useSignOut } from "@/auth/sign-out";
import { Button } from "@/components/ui/button";

/** Shows the current workspace name plus a sign-out control. Renders nothing when signed out. */
export function UserMenu() {
  const auth = useAuth();
  const workspace = useCurrentWorkspace();
  const signOut = useSignOut();

  if (!auth.isAuthenticated) {
    return null;
  }

  const workspaceName = workspace.data?.name ?? "Current workspace";

  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className="truncate text-xs text-muted-foreground"
        title={workspaceName}
      >
        {workspaceName}
      </span>
      <Button variant="ghost" size="sm" onClick={() => void signOut()}>
        Sign out
      </Button>
    </div>
  );
}
