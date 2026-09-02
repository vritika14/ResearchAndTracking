import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

interface BackButtonProps {
  fallback: string;
  label: string;
  className?: string;
}

// react-router sets location.key to "default" when there's no prior entry in
// this tab's history (e.g. a bookmarked or freshly opened URL), so falling
// back to a fixed route avoids navigating the user out of the app.
export function BackButton({ fallback, label, className = "w-fit" }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  function handleClick() {
    if (location.key === "default") {
      navigate(fallback);
    } else {
      navigate(-1);
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" className={className} onClick={handleClick}>
      <ArrowLeft />
      {label}
    </Button>
  );
}
