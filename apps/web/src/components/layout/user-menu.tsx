import { useAuth } from "react-oidc-context";

import { useSignOut } from "@/auth/sign-out";
import { Button } from "@/components/ui/button";

/** Shows the signed-in user's email plus a sign-out control. Renders nothing when signed out. */
export function UserMenu() {
  const auth = useAuth();
  const signOut = useSignOut();

  if (!auth.isAuthenticated) {
    return null;
  }

  const email = auth.user?.profile.email ?? "Signed in";

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="truncate text-xs text-muted-foreground" title={email}>
        {email}
      </span>
      <Button variant="ghost" size="sm" onClick={() => void signOut()}>
        Sign out
      </Button>
    </div>
  );
}
