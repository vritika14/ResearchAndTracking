export function buildInvitationEmailHref({
  email,
  workspaceName,
  invitationUrl,
  expiresAt,
}: {
  email: string;
  workspaceName: string;
  invitationUrl: string;
  expiresAt: string;
}) {
  const subject = `Invitation to join ${workspaceName}`;
  const body = [
    "Hello,",
    "",
    `You have been invited to join the ${workspaceName} workspace as a limited member.`,
    "",
    "Accept your invitation using this link:",
    invitationUrl,
    "",
    `Sign in with ${email}. This invitation expires ${new Date(expiresAt).toLocaleString()}.`,
  ].join("\n");

  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
