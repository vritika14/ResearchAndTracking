export type AuditEventType = "Sign-in" | "Security" | "File access" | "Download" | "Settings";
export type AuditResult = "Successful" | "Blocked";

export interface AccountAuditEvent {
  id: string;
  occurredAt: string;
  event: string;
  type: AuditEventType;
  result: AuditResult;
  device: string;
  location: string;
  detail: string;
}

export const accountAuditEvents: AccountAuditEvent[] = [
  {
    id: "audit-001",
    occurredAt: "2026-07-28T09:14:00",
    event: "Signed in",
    type: "Sign-in",
    result: "Successful",
    device: "Chrome",
    location: "Sydney",
    detail: "Password + 2FA",
  },
  {
    id: "audit-002",
    occurredAt: "2026-07-27T16:42:00",
    event: "Downloaded workspace data",
    type: "Download",
    result: "Successful",
    device: "Chrome",
    location: "Sydney",
    detail: "Requested by you",
  },
  {
    id: "audit-003",
    occurredAt: "2026-07-26T12:18:00",
    event: "Changed digest time",
    type: "Settings",
    result: "Successful",
    device: "Chrome",
    location: "Sydney",
    detail: "4:30 pm",
  },
  {
    id: "audit-004",
    occurredAt: "2026-07-25T08:05:00",
    event: "Blocked sign-in attempt",
    type: "Security",
    result: "Blocked",
    device: "Unknown device",
    location: "Unknown location",
    detail: "No content accessed",
  },
  {
    id: "audit-005",
    occurredAt: "2026-07-24T17:31:00",
    event: "Opened project file",
    type: "File access",
    result: "Successful",
    device: "Chrome",
    location: "Sydney",
    detail: "Consent Forms — Cohort A–C",
  },
  {
    id: "audit-006",
    occurredAt: "2026-07-23T10:55:00",
    event: "Signed in",
    type: "Sign-in",
    result: "Successful",
    device: "Chrome",
    location: "Melbourne",
    detail: "Password + 2FA",
  },
  {
    id: "audit-007",
    occurredAt: "2026-07-22T15:22:00",
    event: "Updated password",
    type: "Security",
    result: "Successful",
    device: "Chrome",
    location: "Sydney",
    detail: "Password changed",
  },
  {
    id: "audit-008",
    occurredAt: "2026-07-21T09:00:00",
    event: "Signed in",
    type: "Sign-in",
    result: "Successful",
    device: "Safari",
    location: "Sydney",
    detail: "Password + 2FA",
  },
  {
    id: "audit-009",
    occurredAt: "2026-07-20T11:40:00",
    event: "Enabled two-factor authentication",
    type: "Security",
    result: "Successful",
    device: "Chrome",
    location: "Sydney",
    detail: "Authenticator app",
  },
  {
    id: "audit-010",
    occurredAt: "2026-07-19T08:15:00",
    event: "Signed in",
    type: "Sign-in",
    result: "Successful",
    device: "Chrome",
    location: "Sydney",
    detail: "Password + 2FA",
  },
  {
    id: "audit-011",
    occurredAt: "2026-07-18T13:04:00",
    event: "Opened project file",
    type: "File access",
    result: "Successful",
    device: "Chrome",
    location: "Sydney",
    detail: "Data Export — Wave 3",
  },
  {
    id: "audit-012",
    occurredAt: "2026-07-17T18:33:00",
    event: "Signed in",
    type: "Sign-in",
    result: "Successful",
    device: "Firefox",
    location: "Sydney",
    detail: "Password + 2FA",
  },
];
