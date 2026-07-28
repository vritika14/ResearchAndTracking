import { Link } from "react-router-dom";
import { FileInput, FileOutput } from "lucide-react";

import { PageHeading } from "@/components/typography/heading";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const links = [
  {
    to: "/daily-notes/input",
    title: "Input",
    description: "Capture new daily notes and lab observations.",
    icon: FileInput,
  },
  {
    to: "/daily-notes/output",
    title: "Output",
    description: "Review previously logged daily notes.",
    icon: FileOutput,
  },
];

export default function DailyNotesPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Workflows"
        title="Daily Notes"
        description="Capture day-to-day research observations and review past entries."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map(({ to, title, description, icon: Icon }) => (
          <Link key={to} to={to} className="block">
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <Icon className="h-5 w-5 text-primary" />
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
