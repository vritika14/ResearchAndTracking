import { Navigate, Outlet } from "react-router-dom";

import { useCurrentWorkspace } from "@/api/hooks";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";

export function RequireWorkspace({ shouldExist }: { shouldExist: boolean }) {
  const workspace = useCurrentWorkspace();

  if (workspace.isPending) {
    return <LoadingState title="Loading your workspace" className="m-8 min-h-[calc(100vh-4rem)]" />;
  }
  if (workspace.isError) {
    return (
      <ErrorState
        title="Your workspace could not be loaded"
        description={workspace.error.message}
        onRetry={() => void workspace.refetch()}
        className="m-8 min-h-[calc(100vh-4rem)]"
      />
    );
  }
  if (shouldExist && !workspace.data) return <Navigate to="/onboarding" replace />;
  if (!shouldExist && workspace.data) return <Navigate to="/" replace />;
  return <Outlet />;
}
