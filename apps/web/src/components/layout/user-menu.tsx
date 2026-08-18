import { Building2, Check, ChevronsUpDown, LogOut, Users } from "lucide-react";
import { useAuth } from "react-oidc-context";
import { Link } from "react-router-dom";

import { useCurrentWorkspace, useMe, useSwitchWorkspace, useWorkspaces } from "@/api/hooks";
import { useSignOut } from "@/auth/sign-out";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Account + workspace switcher, shown at the bottom of the nav. Renders nothing when signed out. */
export function UserMenu() {
  const auth = useAuth();
  const me = useMe(auth.isAuthenticated);
  const workspace = useCurrentWorkspace();
  const workspaces = useWorkspaces();
  const switchWorkspace = useSwitchWorkspace();
  const signOut = useSignOut();

  if (!auth.isAuthenticated) {
    return null;
  }

  const displayName = me.data?.displayName ?? auth.user?.profile.email ?? "Account";
  const workspaceName = workspace.data?.name ?? "Current workspace";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar name={displayName} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground" title={displayName}>
              {displayName}
            </span>
            <span className="block truncate text-xs text-muted-foreground" title={workspaceName}>
              {workspaceName}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-64">
        <DropdownMenuLabel className="text-foreground">{displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {workspaces.data?.map((option) => {
          const isCurrent = option.id === workspace.data?.id;
          return (
            <DropdownMenuItem
              key={option.id}
              disabled={isCurrent || switchWorkspace.isPending}
              onSelect={(event) => {
                event.preventDefault();
                if (!isCurrent) void switchWorkspace.mutateAsync(option.id);
              }}
            >
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{option.name}</span>
              {isCurrent ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuItem asChild>
          <Link to="/workspaces">
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
            Manage workspaces
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut className="h-4 w-4 shrink-0 text-muted-foreground" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
