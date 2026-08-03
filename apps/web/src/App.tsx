import { Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/app-layout";
import DashboardPage from "@/pages/dashboard";
import ProjectsPage from "@/pages/projects";
import ProjectDetailPage from "@/pages/project-detail";
import TasksPage from "@/pages/tasks";
import DailyNotesPage from "@/pages/daily-notes";
import PipelinePage from "@/pages/pipeline";
import AccountAuditPage from "@/pages/account-audit";
import SettingsPage from "@/pages/settings";
import FutureFeaturePage from "@/pages/future-feature";
import NotFoundPage from "@/pages/not-found";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="daily-notes" element={<DailyNotesPage />} />
        <Route path="pipeline" element={<PipelinePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/account-audit" element={<AccountAuditPage />} />
        <Route path="future/:feature" element={<FutureFeaturePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
