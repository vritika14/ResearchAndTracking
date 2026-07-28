import { NavLink } from "react-router-dom";

export function Wordmark() {
  return (
    <NavLink to="/" className="flex items-center gap-2 font-extrabold text-primary">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">
        R&amp;T
      </span>
      <span>Research &amp; Tracking</span>
    </NavLink>
  );
}
