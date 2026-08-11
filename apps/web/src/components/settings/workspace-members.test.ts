import { describe, expect, it } from "vitest";

import { buildInvitationEmailHref } from "@/components/settings/invitation-email";

describe("buildInvitationEmailHref", () => {
  it("addresses the invitee and includes the workspace and acceptance link", () => {
    const href = buildInvitationEmailHref({
      email: "researcher@example.com",
      workspaceName: "Research Operations",
      invitationUrl: "http://localhost:5173/invitations/secret-token",
      expiresAt: "2026-08-14T00:00:00.000Z",
    });
    const [recipient, query] = href.slice("mailto:".length).split("?");
    const params = new URLSearchParams(query);

    expect(decodeURIComponent(recipient)).toBe("researcher@example.com");
    expect(params.get("subject")).toBe(
      "Invitation to join Research Operations",
    );
    expect(params.get("body")).toContain(
      "http://localhost:5173/invitations/secret-token",
    );
    expect(params.get("body")).toContain("Sign in with researcher@example.com");
  });
});
