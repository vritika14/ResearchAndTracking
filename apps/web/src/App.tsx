import { Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/app-layout";
import DashboardPage from "@/pages/dashboard";
import ProjectsPage from "@/pages/projects";
import TasksPage from "@/pages/tasks";
import DailyNotesPage from "@/pages/daily-notes";
import RecordsPage from "@/pages/records";
import NotFoundPage from "@/pages/not-found";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="daily-notes" element={<DailyNotesPage />} />
        <Route path="records" element={<RecordsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
