import { useAuth } from "react-oidc-context";

import { Heading } from "@/components/typography/heading";

/**
 * Renders while react-oidc-context completes the code exchange with Cognito.
 * Navigation away happens from AppAuthProvider's onSigninCallback, not here.
 */
export default function AuthCallbackPage() {
  const auth = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-lg border bg-card p-8 text-center shadow-sm">
        {auth.error ? (
          <>
            <Heading level="h3">Sign-in failed</Heading>
            <p className="text-sm text-muted-foreground">{auth.error.message}</p>
          </>
        ) : (
          <>
            <Heading level="h3">Signing you in…</Heading>
            <p className="text-sm text-muted-foreground">
              Completing sign-in with Cognito. This should only take a moment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
