import { useAuth } from "react-oidc-context";
import { useLocation } from "react-router-dom";

import { AuthScreenBackground } from "@/components/layout/auth-screen-background";
import { Heading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const auth = useAuth();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? "/";

  return (
    <AuthScreenBackground className="flex items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-lg border bg-card/95 p-8 text-center shadow-lg backdrop-blur-sm">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          R&amp;T
        </span>
        <div className="flex flex-col gap-1.5">
          <Heading level="h2">Research &amp; Tracking</Heading>
          <p className="text-sm text-muted-foreground">Sign in with your account to continue.</p>
        </div>
        <Button
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
