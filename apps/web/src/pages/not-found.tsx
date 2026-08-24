import { Compass } from "lucide-react";
import { Link } from "react-router-dom";

import { Heading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
        <Compass className="h-6 w-6" />
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        404
      </span>
      <Heading level="h1">Page not found</Heading>
      <p className="max-w-md text-sm text-muted-foreground">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Button asChild size="lg">
        <Link to="/">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
