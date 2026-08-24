import { NavLink } from "react-router-dom";

export function Wordmark() {
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
