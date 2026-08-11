import { Building2, Mail, ShieldCheck, UserRound } from "lucide-react";

import { useCurrentWorkspace, useMe } from "@/api/hooks";
import { WorkspaceMembers } from "@/components/settings/workspace-members";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Heading } from "@/components/typography/heading";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const me = useMe();
  const workspace = useCurrentWorkspace();

  if (me.isPending || workspace.isPending) {
    return (
      <LoadingState title="Loading your settings" className="min-h-[50vh]" />
    );
  }
  if (me.isError) {
    return (
      <ErrorState
        title="Your profile could not be loaded"
        description={me.error.message}
        onRetry={() => void me.refetch()}
      />
    );
  }

  return (
    <div className="min-h-full pb-12">
      <div className="mx-auto w-full max-w-5xl border-b pb-7">
        <Heading level="h1">Settings</Heading>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review your authenticated account and manage the active workspace.
        </p>
      </div>

      <div className="mx-auto mt-7 grid w-full max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>
              These details come from your authenticated Cognito account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <label htmlFor="display-name" className="text-sm font-medium">
                Display name
              </label>
              <Input
                id="display-name"
                value={me.data.displayName}
                readOnly
                className="bg-muted/30"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={me.data.email}
                  readOnly
                  className="bg-muted/30 pl-9"
                />
              </div>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Profile changes are managed by the identity provider. Contact an
              administrator if these details are incorrect.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Account status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="capitalize">
                {me.data.status}
              </Badge>
              <p className="mt-3 break-all font-mono text-xs text-muted-foreground">
                User ID: {me.data.id}
              </p>
            </CardContent>
          </Card>

          {workspace.data ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Active workspace
                </CardTitle>
                <CardDescription>{workspace.data.name}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <Badge variant="outline" className="capitalize">
                  {workspace.data.membershipRole.replace("_", " ")}
                </Badge>
                <span className="truncate text-xs text-muted-foreground">
                  {workspace.data.slug}
                </span>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <WorkspaceMembers />
    </div>
  );
}
