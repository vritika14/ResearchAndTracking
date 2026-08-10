import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useMe } from "@/api/hooks";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";

export function RequireApiSession() {
  const location = useLocation();
  const me = useMe();

  if (me.isPending) {
    return <LoadingState title="Loading your account" className="m-8 min-h-[calc(100vh-4rem)]" />;
  }
  if (me.isError) {
    return (
      <ErrorState
        title="Your account could not be loaded"
        description={me.error.message}
        onRetry={() => void me.refetch()}
        className="m-8 min-h-[calc(100vh-4rem)]"
      />
    );
  }
  if (me.data.status !== "active" && !location.pathname.startsWith("/membership-status/")) {
    return <Navigate to={`/membership-status/${me.data.status}`} replace />;
  }
  return <Outlet />;
}
