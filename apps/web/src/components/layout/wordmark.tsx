import { NavLink } from "react-router-dom";

interface WordmarkProps {
  /** Icon-only mark for narrow rails (the compact sidebar) instead of the full text lockup. */
  compact?: boolean;
}

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={
        compact
          ? "relative block h-9 w-9 overflow-hidden rounded-[var(--radius)] bg-white shadow-sm ring-1 ring-blue-200/70"
          : "relative block h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-blue-200/70 transition-transform group-hover:-rotate-2"
      }
    >
      <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-[155%] w-[155%] max-w-none -translate-x-1/2 object-contain"
      />
    </span>
  );
}

export function Wordmark({ compact = false }: WordmarkProps) {
  if (compact) {
    return (
      <NavLink
        to="/"
        aria-label="Research in Motion"
        title="Research in Motion"
        className="block rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <LogoMark compact />
      </NavLink>
    );
  }

  return (
    <NavLink
      to="/"
      aria-label="Research in Motion"
      className="group flex items-center gap-2.5 rounded-lg text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-[0.95rem] font-bold tracking-tight">Research</span>
        <span className="mt-1 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">in Motion</span>
      </span>
    </NavLink>
  );
}
