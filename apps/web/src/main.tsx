import { StrictMode, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { useAuth } from "react-oidc-context";
import { BrowserRouter } from "react-router-dom";

import { ApiAuthBridge } from "@/api/api-auth-bridge";
import { createQueryClient } from "@/api/query-client";
import { cognitoRedirectUri } from "@/auth/auth-config";
import { AppAuthProvider } from "@/auth/auth-provider";
import { ColorThemeProvider } from "@/theme/color-theme";
import { DesignThemeProvider } from "@/theme/design-theme";
import App from "./App";
import "./index.css";

const configuredOrigin = new URL(cognitoRedirectUri).origin;

if (window.location.origin !== configuredOrigin) {
  window.location.replace(`${configuredOrigin}${window.location.pathname}${window.location.search}`);
} else {
  createRoot(document.getElementById("root")!).render(
    <DesignThemeProvider>
      <ColorThemeProvider>
        <BrowserRouter>
          <AppAuthProvider>
            <AuthenticatedQueryRoot />
          </AppAuthProvider>
        </BrowserRouter>
      </ColorThemeProvider>
    </DesignThemeProvider>,
  );
}

export function AuthenticatedQueryRoot() {
  const auth = useAuth();

  return (
    <SubjectQueryRoot key={auth.user?.profile.sub ?? "signed-out"}>
      <StrictMode>
        <ApiAuthBridge>
          <App />
        </ApiAuthBridge>
      </StrictMode>
    </SubjectQueryRoot>
  );
}

export function SubjectQueryRoot({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
