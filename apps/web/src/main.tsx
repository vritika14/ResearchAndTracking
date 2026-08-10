import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { ApiAuthBridge } from "@/api/api-auth-bridge";
import { cognitoRedirectUri } from "@/auth/auth-config";
import { AppAuthProvider } from "@/auth/auth-provider";
import App from "./App";
import "./index.css";

const configuredOrigin = new URL(cognitoRedirectUri).origin;

if (window.location.origin !== configuredOrigin) {
  window.location.replace(`${configuredOrigin}${window.location.pathname}${window.location.search}`);
} else {
  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <AppAuthProvider>
        <StrictMode>
          <ApiAuthBridge>
            <App />
          </ApiAuthBridge>
        </StrictMode>
      </AppAuthProvider>
    </BrowserRouter>,
  );
}
