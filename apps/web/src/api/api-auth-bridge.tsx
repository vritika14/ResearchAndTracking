import type { ReactNode } from "react";
import { useAuth } from "react-oidc-context";

import { setApiAccessToken } from "@/api/client";
import { useMe } from "@/api/hooks";

export function ApiAuthBridge({ children }: { children: ReactNode }) {
  const auth = useAuth();
  setApiAccessToken(auth.user?.access_token);
  useMe(auth.isAuthenticated);
  return children;
}
