import { useState, type FormEvent } from "react";
import { Building2, Check, CheckCircle2, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

import { AuthScreenBackground } from "@/components/layout/auth-screen-background";
import { Wordmark } from "@/components/layout/wordmark";
import { Heading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const onboardingSteps = [
  {
    title: "Account secured",
    description: "Your Cognito account is ready.",
    icon: ShieldCheck,
    complete: true,
  },
  {
    title: "Create your workspace",
    description: "Name the research space your team will use.",
    icon: Building2,
    complete: false,
  },
  {
    title: "Invite collaborators",
    description: "Add your team after setup is complete.",
    icon: Users,
    complete: false,
  },
];

export default function WorkspaceOnboardingPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const suggestedName = auth.user?.profile.name ?? auth.user?.profile.email?.split("@")[0] ?? "";
  const [displayName, setDisplayName] = useState(suggestedName);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [created, setCreated] = useState(false);

  function updateWorkspaceName(value: string) {
    setWorkspaceName(value);
    if (!slugEdited) setWorkspaceSlug(slugify(value));
  }

  function updateSlug(value: string) {
    setSlugEdited(true);
    setWorkspaceSlug(slugify(value));
  }

  function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreated(true);
  }

  return (
    <AuthScreenBackground>
      <header className="border-b bg-background/95 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Wordmark />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            First-time setup
          </span>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8">
        <aside className="hidden rounded-xl bg-background/70 p-6 backdrop-blur-sm lg:block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Welcome aboard
          </span>
          <Heading level="h1" className="mt-3 max-w-lg text-4xl leading-tight">
            Set up a focused home for your research.
          </Heading>
          <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
            Your workspace keeps projects, tasks, notes and collaborators together while preserving
            clear ownership and access boundaries.
          </p>

          <ol className="mt-9 grid gap-5">
            {onboardingSteps.map((step, index) => {
              const Icon = step.icon;
              const active = index === 1 && !created;
              return (
                <li key={step.title} className="flex items-start gap-4">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                      step.complete || active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground"
                    }`}
                  >
                    {step.complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <div className="pt-0.5">
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>

        <section className="mx-auto w-full max-w-2xl rounded-xl border bg-card/95 p-6 shadow-lg backdrop-blur-sm sm:p-8">
          {created ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <Heading level="h2" className="mt-5">
                Your workspace is ready
              </Heading>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                <span className="font-semibold text-foreground">{workspaceName}</span> has been set
                up for {displayName}. You can now begin adding projects and inviting collaborators.
              </p>
              <Button className="mt-7 min-w-44" onClick={() => navigate("/", { replace: true })}>
                Open Workspace
              </Button>
            </div>
          ) : (
            <>
              <div className="border-b pb-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Step 1 of 1
                </span>
                <Heading level="h2" className="mt-2">
                  Create your workspace
                </Heading>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  These details identify your workspace to you and future collaborators.
                </p>
              </div>

              <form onSubmit={createWorkspace} className="mt-6 grid gap-5">
                <div className="grid gap-2">
                  <label htmlFor="onboarding-display-name" className="text-sm font-medium">
                    Your display name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="onboarding-display-name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="e.g. Dr. Emma Jepsen"
                    className="h-11"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Shown to collaborators and alongside your activity.
                  </p>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="onboarding-workspace-name" className="text-sm font-medium">
                    Workspace name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="onboarding-workspace-name"
                    value={workspaceName}
                    onChange={(event) => updateWorkspaceName(event.target.value)}
                    placeholder="e.g. Translational Research Lab"
                    className="h-11"
                    autoFocus
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <label htmlFor="onboarding-workspace-slug" className="text-sm font-medium">
                    Workspace identifier <span className="text-destructive">*</span>
                  </label>
                  <div className="flex h-11 overflow-hidden rounded-md border border-input bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring">
                    <span className="flex items-center border-r bg-muted/60 px-3 text-sm text-muted-foreground">
                      research.app/
                    </span>
                    <input
                      id="onboarding-workspace-slug"
                      value={workspaceSlug}
                      onChange={(event) => updateSlug(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                      placeholder="translational-research-lab"
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters, numbers and hyphens only. You can change this before saving.
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/35 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">You will be the workspace owner</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Owners can manage workspace settings and invitations. Project access remains
                        separately controlled.
                      </p>
                    </div>
                  </div>
                </div>

                <Button type="submit" size="lg" className="mt-1 w-full">
                  Create Workspace
                </Button>
              </form>
            </>
          )}
        </section>
      </main>
    </AuthScreenBackground>
  );
}
