import { useState, type FormEvent, type ReactNode } from "react";
import { Check } from "lucide-react";

import { Heading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SettingToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}

function SettingToggle({ checked, onCheckedChange, label }: SettingToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-slate-200 dark:bg-slate-700",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

interface SettingRowProps {
  title: string;
  description: string;
  children: ReactNode;
}

function SettingRow({ title, description, children }: SettingRowProps) {
  return (
    <div className="flex min-h-20 items-center justify-between gap-8 border-b py-5 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">{title}</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("Dr Emma Jepsen");
  const [email, setEmail] = useState("emma.jepsen@university.edu.au");
  const [dailyDigest, setDailyDigest] = useState(true);
  const [digestTime, setDigestTime] = useState("4:30 pm");
  const [twoFactor, setTwoFactor] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);
  const [saved, setSaved] = useState(false);

  function saveChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-full">
      <form onSubmit={saveChanges} className="mx-auto w-full max-w-5xl pb-12">
        <div className="border-b pb-7">
          <Heading level="h1" className="text-slate-950 dark:text-slate-50">
            Settings
          </Heading>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage your account and preferences.
          </p>
        </div>

        <section
          aria-labelledby="profile-settings"
          className="mt-7 rounded-xl border bg-card p-6 shadow-sm sm:p-7"
        >
          <div className="mb-6">
            <h2
              id="profile-settings"
              className="text-base font-semibold text-slate-950 dark:text-slate-100"
            >
              Profile
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update the account information shown throughout the workspace.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-2">
              <label
                htmlFor="display-name"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Display name
              </label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="h-11 bg-background"
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 bg-background"
              />
            </div>
          </div>
        </section>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
          <section
            aria-labelledby="notification-settings"
            className="rounded-xl border bg-card p-6 shadow-sm sm:p-7"
          >
            <div className="border-b pb-5">
              <h2
                id="notification-settings"
                className="text-base font-semibold text-slate-950 dark:text-slate-100"
              >
                Notifications
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose when and how you receive research updates.
              </p>
            </div>

            <SettingRow
              title="Daily email digest"
              description="Receive a summary of tasks and notes each day."
            >
              <SettingToggle
                checked={dailyDigest}
                onCheckedChange={setDailyDigest}
                label="Daily email digest"
              />
            </SettingRow>

            <SettingRow title="Digest time" description="Time to send the daily digest.">
              <Input
                value={digestTime}
                onChange={(event) => setDigestTime(event.target.value)}
                aria-label="Digest time"
                disabled={!dailyDigest}
                className="h-10 w-28 bg-background text-center"
              />
            </SettingRow>
          </section>

          <section
            aria-labelledby="security-settings"
            className="rounded-xl border bg-card p-6 shadow-sm sm:p-7"
          >
            <div className="border-b pb-5">
              <h2
                id="security-settings"
                className="text-base font-semibold text-slate-950 dark:text-slate-100"
              >
                Security and visibility
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Control account protection and profile discoverability.
              </p>
            </div>

            <SettingRow
              title="Two-factor authentication"
              description="Require 2FA on every sign-in."
            >
              <SettingToggle
                checked={twoFactor}
                onCheckedChange={setTwoFactor}
                label="Two-factor authentication"
              />
            </SettingRow>

            <SettingRow title="Public profile" description="Allow others to find your profile.">
              <SettingToggle
                checked={publicProfile}
                onCheckedChange={setPublicProfile}
                label="Public profile"
              />
            </SettingRow>
          </section>
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-xl border bg-card px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-950 dark:text-slate-100">
              Save your preferences
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Changes apply to your account across this workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saved ? (
              <span role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
                Preferences updated.
              </span>
            ) : null}
            <Button type="submit" className="h-10 px-5">
              {saved ? <Check /> : null}
              {saved ? "Changes saved" : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
