import type { ReactNode } from "react";
import { AuthProvider as OidcAuthProvider, type AuthProviderProps } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

import { userManagerSettings } from "@/auth/auth-config";

interface AppAuthProviderProps {
  children: ReactNode;
}

/**
 * Wraps react-oidc-context's provider with our Cognito settings and wires
 * the post-sign-in redirect back into React Router. Must render inside
 * <BrowserRouter> (needs useNavigate).
 */
export function AppAuthProvider({ children }: AppAuthProviderProps) {
  const navigate = useNavigate();

  const onSigninCallback: AuthProviderProps["onSigninCallback"] = (user) => {
    const returnTo = (user?.state as { returnTo?: string } | undefined)?.returnTo ?? "/";
    navigate(returnTo, { replace: true });
  };

  return (
    <OidcAuthProvider {...userManagerSettings} onSigninCallback={onSigninCallback}>
      {children}
    </OidcAuthProvider>
  );
}
