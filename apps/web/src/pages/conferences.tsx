import { Presentation } from "lucide-react";

import { ConferenceSubmissionsTable } from "@/components/dashboard/conference-submissions-table";
import { PageHeading } from "@/components/typography/heading";

export default function ConferencesPage() {
  return (
    <div className="page-stack">
      <PageHeading
        icon={Presentation}
        tone="rose"
        eyebrow="Dissemination"
        title="Conferences"
        description="Manage conference deadlines, event dates, submission types, and linked research projects."
      />
      <ConferenceSubmissionsTable showPast />
    </div>
  );
}
