import { Link } from "react-router-dom";

import { Heading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        404
      </span>
      <Heading level="h1">Page not found</Heading>
      <p className="max-w-md text-sm text-muted-foreground">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Button asChild>
        <Link to="/">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
