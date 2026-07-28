import { Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/app-layout";
import DashboardPage from "@/pages/dashboard";
import ProjectsPage from "@/pages/projects";
import TasksPage from "@/pages/tasks";
import DailyNotesPage from "@/pages/daily-notes";
import DailyNotesInputPage from "@/pages/daily-notes-input";
import DailyNotesOutputPage from "@/pages/daily-notes-output";
import SecureRecordsPage from "@/pages/secure-records";
import AccessLogPage from "@/pages/access-log";
import SettingsPage from "@/pages/settings";
import NotFoundPage from "@/pages/not-found";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="daily-notes" element={<DailyNotesPage />} />
        <Route path="daily-notes/input" element={<DailyNotesInputPage />} />
        <Route path="daily-notes/output" element={<DailyNotesOutputPage />} />
        <Route path="secure-records" element={<SecureRecordsPage />} />
        <Route path="access-log" element={<AccessLogPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
