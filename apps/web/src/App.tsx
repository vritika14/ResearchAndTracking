import { Route, Routes } from "react-router-dom";

import { RequireAuth } from "@/auth/require-auth";
import { RequireApiSession } from "@/auth/require-api-session";
import { RequireWorkspace } from "@/auth/require-workspace";
import { AppLayout } from "@/components/layout/app-layout";
import DashboardPage from "@/pages/dashboard";
import ProjectsPage from "@/pages/projects";
import ModulesPage from "@/pages/modules";
import ModuleDetailPage from "@/pages/module-detail";
import ProjectDetailPage from "@/pages/project-detail";
import TasksPage from "@/pages/tasks";
import TaskDetailPage from "@/pages/task-detail";
import DailyNotesPage from "@/pages/daily-notes";
import PipelinePage from "@/pages/pipeline";
import AccountAuditPage from "@/pages/account-audit";
import SettingsPage from "@/pages/settings";
import FutureFeaturePage from "@/pages/future-feature";
import SignInPage from "@/pages/sign-in";
import AuthCallbackPage from "@/pages/auth-callback";
import InvitationAcceptancePage from "@/pages/invitation-acceptance";
import WorkspaceOnboardingPage from "@/pages/workspace-onboarding";
import WorkspacesPage from "@/pages/workspaces";
import SessionExpiredPage from "@/pages/session-expired";
import AccessDeniedPage from "@/pages/access-denied";
import MembershipStatusPage from "@/pages/membership-status";
import NotFoundPage from "@/pages/not-found";

export default function App() {
  return (
    <Routes>
      <Route path="sign-in" element={<SignInPage />} />
      <Route path="auth/callback" element={<AuthCallbackPage />} />
      <Route path="invitations/:token" element={<InvitationAcceptancePage />} />
      <Route path="session-expired" element={<SessionExpiredPage />} />
      <Route path="access-denied" element={<AccessDeniedPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<RequireApiSession />}>
          <Route
            path="membership-status/:status"
            element={<MembershipStatusPage />}
          />
          <Route element={<RequireWorkspace shouldExist={false} />}>
            <Route path="onboarding" element={<WorkspaceOnboardingPage />} />
          </Route>
          <Route element={<RequireWorkspace shouldExist />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="modules" element={<ModulesPage />} />
              <Route path="modules/:moduleId" element={<ModuleDetailPage />} />
              <Route
                path="projects/:projectId"
                element={<ProjectDetailPage />}
              />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="tasks/:taskCode" element={<TaskDetailPage />} />
              <Route path="daily-notes" element={<DailyNotesPage />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="workspaces" element={<WorkspacesPage />} />
              <Route
                path="settings/account-audit"
                element={<AccountAuditPage />}
              />
              <Route path="future/:feature" element={<FutureFeaturePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
