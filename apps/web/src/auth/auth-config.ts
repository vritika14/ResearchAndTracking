import { InMemoryWebStorage, WebStorageStateStore, type UserManagerSettings } from "oidc-client-ts";

function requireEnv(name: string): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Copy apps/web/.env.example to apps/web/.env and fill in your Cognito values.`,
    );
  }
  return value;
}

export const cognitoDomain = requireEnv("VITE_COGNITO_DOMAIN");
export const cognitoClientId = requireEnv("VITE_COGNITO_CLIENT_ID");
export const cognitoLogoutUri = requireEnv("VITE_COGNITO_LOGOUT_URI");

/**
 * Tokens (id/access/refresh) live in memory only — never written to
 * localStorage, sessionStorage, or cookies. A hard page refresh loses the
 * session; the user signs in again.
 *
 * The PKCE code_verifier and CSRF state nonce are a separate, short-lived
 * artifact that must survive the full-page redirect to Cognito and back —
 * that can't live in the in-memory store below, since the JS heap is torn
 * down mid-redirect. oidc-client-ts's default stateStore (sessionStorage)
 * holds just those two values and deletes them once the callback consumes
 * them; no tokens are ever written there.
 */
const inMemoryUserStore = new InMemoryWebStorage();

export const userManagerSettings: UserManagerSettings = {
  authority: requireEnv("VITE_COGNITO_AUTHORITY"),
  client_id: cognitoClientId,
  redirect_uri: requireEnv("VITE_COGNITO_REDIRECT_URI"),
  scope: requireEnv("VITE_COGNITO_SCOPE"),
  response_type: "code",
  automaticSilentRenew: true,
  loadUserInfo: true,
  userStore: new WebStorageStateStore({ store: inMemoryUserStore }),
};

/**
 * Cognito's Hosted UI logout isn't a standard OIDC end_session_endpoint —
 * it takes client_id + logout_uri, not id_token_hint + post_logout_redirect_uri —
 * so this is built by hand rather than relying on discovery metadata.
 * logout_uri must exactly match an entry in the app client's logout_urls.
 */
export function buildCognitoLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: cognitoClientId,
    logout_uri: cognitoLogoutUri,
  });
  return `https://${cognitoDomain}/logout?${params.toString()}`;
}
