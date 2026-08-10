import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "react-oidc-context";

import { setApiAccessToken } from "@/api/client";
import { useMe } from "@/api/hooks";
import { createQueryClient } from "@/api/query-client";

export function ApiAuthBridge({ children }: { children: ReactNode }) {
  const auth = useAuth();
  setApiAccessToken(auth.user?.access_token);
  return (
    <SubjectQueryClient key={auth.user?.profile.sub ?? "signed-out"} enabled={auth.isAuthenticated}>
      {children}
    </SubjectQueryClient>
  );
}

function SubjectQueryClient({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}><AuthenticatedAccountBootstrap enabled={enabled}>{children}</AuthenticatedAccountBootstrap></QueryClientProvider>;
}

function AuthenticatedAccountBootstrap({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  useMe(enabled);
  return children;
}
