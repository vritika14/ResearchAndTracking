import { useAuth } from "react-oidc-context";
import { useLocation } from "react-router-dom";

import { AuthScreenBackground } from "@/components/layout/auth-screen-background";
import { Wordmark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const auth = useAuth();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? "/";

  return (
    <AuthScreenBackground className="flex items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border bg-card p-10 text-center shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <Wordmark />
          <p className="text-sm text-muted-foreground">Sign in with your account to continue.</p>
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={() => auth.signinRedirect({ state: { returnTo } })}
          disabled={auth.isLoading}
        >
          {auth.isLoading ? "Redirecting…" : "Sign in"}
        </Button>
        {auth.error ? <p className="text-xs text-destructive">{auth.error.message}</p> : null}
      </div>
    </AuthScreenBackground>
  );
}
