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
      <div className="relative flex w-full max-w-md flex-col items-center gap-7 overflow-hidden rounded-2xl border bg-card/95 p-8 text-center shadow-lg backdrop-blur sm:p-10">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
        <div className="flex flex-col items-center gap-3">
          <Wordmark />
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">Sign in to continue managing your research projects, tasks, pipeline and notes.</p>
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
