import { useAuth } from "react-oidc-context";
import { useLocation } from "react-router-dom";
import {
  BookOpen,
  FlaskConical,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { Wordmark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";

const HIGHLIGHTS = [
  { icon: FlaskConical, text: "Track every project from idea to publication" },
  { icon: Users, text: "Share tasks, modules and notes with collaborators" },
  { icon: TrendingUp, text: "See your pipeline and deadlines at a glance" },
];

export default function SignInPage() {
  const auth = useAuth();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? "/";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — hidden below lg, where the sign-in card takes the full screen */}
      <div className="relative isolate hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 lg:flex lg:flex-col lg:justify-between lg:p-12 lg:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.08]"
        />
        <BookOpen
          aria-hidden="true"
          className="pointer-events-none absolute right-10 top-24 h-40 w-40 -rotate-12 text-white/10"
        />

        <span className="relative z-10 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white ring-1 ring-white/25">
          <Sparkles className="h-3.5 w-3.5" />
          Built for research teams
        </span>

        <div className="relative z-10 max-w-md">
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
            Where your research momentum lives
          </h1>
          <p className="mt-4 text-base leading-7 text-white/80">
            One place to plan projects, assign tasks, organise notes, and
            follow your pipeline from first idea to publication.
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3 text-sm font-medium text-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs font-medium text-white/70">
          <ShieldCheck className="h-4 w-4" />
          Secured sign-in
        </div>
      </div>

      {/* Sign-in card */}
      <div className="relative isolate flex flex-col items-center justify-center overflow-hidden bg-accent px-4 py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-20 h-96 w-96 rounded-full bg-accent blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 [background-image:radial-gradient(hsl(var(--foreground)/0.08)_1px,transparent_1px)] [background-size:20px_20px]"
        />
        <GraduationCap
          aria-hidden="true"
          className="pointer-events-none absolute left-10 top-16 h-24 w-24 -rotate-6 text-primary/10 lg:h-28 lg:w-28"
        />
        <Sparkles
          aria-hidden="true"
          className="pointer-events-none absolute bottom-20 right-12 h-16 w-16 rotate-12 text-primary/15"
        />

        <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-7 overflow-hidden rounded-2xl border bg-card/95 p-8 text-center shadow-lg ring-1 ring-primary/10 backdrop-blur sm:p-10">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20"
          />
          <div className="flex flex-col items-center gap-3">
            <Wordmark />
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              Sign in to continue managing your research projects, tasks,
              pipeline and notes.
            </p>
          </div>
          <Button
            size="lg"
            className="w-full"
            onClick={() => auth.signinRedirect({ state: { returnTo } })}
            disabled={auth.isLoading}
          >
            {auth.isLoading ? "Redirecting…" : "Sign in"}
          </Button>
          {auth.error ? (
            <p className="text-xs text-destructive">{auth.error.message}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
