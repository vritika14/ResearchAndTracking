import { useAuth } from "react-oidc-context";

import { buildCognitoLogoutUrl } from "@/auth/auth-config";

/**
 * Cognito's /logout endpoint isn't a standard OIDC end_session_endpoint, so
 * we clear the local session ourselves and redirect manually rather than
 * using react-oidc-context's built-in signoutRedirect().
 */
export function useSignOut() {
  const auth = useAuth();

  return async function signOut() {
    await auth.removeUser();
    window.location.assign(buildCognitoLogoutUrl());
  };
}
