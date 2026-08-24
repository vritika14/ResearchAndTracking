import { NavLink } from "react-router-dom";

interface WordmarkProps {
  /** Icon-only mark for narrow rails (the compact sidebar) instead of the full text lockup. */
  compact?: boolean;
}

export function Wordmark({ compact = false }: WordmarkProps) {
  if (compact) {
    return (
      <NavLink
        to="/"
        aria-label="Research in Motion"
        title="Research in Motion"
        className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-primary text-sm font-semibold text-primary-foreground"
      >
        R
      </NavLink>
    );
  }

  return (
    <NavLink to="/" className="flex items-baseline gap-1.5 text-foreground">
      <span className="text-[1.05rem] font-semibold leading-none tracking-tight">
        Research
      </span>
      <span className="text-[1.05rem] font-light leading-none tracking-tight text-muted-foreground">
        in Motion
      </span>
    </NavLink>
  );
}
