import { useEffect, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  LayoutTemplate,
  Mail,
  Palette,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useCurrentWorkspace, useMe, useUpdateMe } from "@/api/hooks";
import { WorkspaceMembers } from "@/components/settings/workspace-members";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeading } from "@/components/typography/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { COLOR_THEMES, type ColorTheme, useColorTheme } from "@/theme/color-theme";
import { DESIGN_THEMES, useDesignTheme } from "@/theme/design-theme";

export default function SettingsPage() {
  const me = useMe();
  const workspace = useCurrentWorkspace();
  const designTheme = useDesignTheme();
  const colorTheme = useColorTheme();
  const updateProfile = useUpdateMe();
  const [profile, setProfile] = useState({
    displayName: "",
    jobTitle: "",
    institution: "",
    department: "",
    phone: "",
    researchInterests: "",
  });

  useEffect(() => {
    if (!me.data) return;
    setProfile({
      displayName: me.data.displayName,
      jobTitle: me.data.jobTitle ?? "",
      institution: me.data.institution ?? "",
      department: me.data.department ?? "",
      phone: me.data.phone ?? "",
      researchInterests: me.data.researchInterests ?? "",
    });
  }, [me.data]);

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateProfile.mutate(profile);
  }

  if (me.isPending || workspace.isPending) {
    return (
      <LoadingState title="Loading your settings" className="min-h-[50vh]" />
    );
  }
  if (me.isError) {
    return (
      <ErrorState
        title="Your profile could not be loaded"
        description={me.error.message}
        onRetry={() => void me.refetch()}
      />
    );
  }

  return (
    <div className="min-h-full pb-12">
      <div className="mx-auto w-full max-w-5xl">
        <PageHeading
          icon={SettingsIcon}
          title="Settings"
          description="Review your authenticated account and manage the active workspace."
        />
      </div>

      {me.data.profileComplete ? null : (
        <div
          role="alert"
          className="mx-auto mt-7 flex w-full max-w-5xl items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold">Complete your profile</p>
            <p className="mt-1 text-sm">
              Add your job title, institution, and department. The alert beside Settings will
              disappear when these required details are saved.
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto mt-7 grid w-full max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>
              Your name and email are collected during registration. Add your professional
              details here after signing in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="grid gap-5">
              <div className="grid gap-2">
                <label htmlFor="display-name" className="text-sm font-medium">
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="display-name"
                  value={profile.displayName}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, displayName: event.target.value }))
                  }
                  minLength={2}
                  maxLength={100}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={me.data.email}
                    readOnly
                    className="bg-muted/30 pl-9"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="job-title" className="text-sm font-medium">
                    Job title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="job-title"
                    value={profile.jobTitle}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, jobTitle: event.target.value }))
                    }
                    placeholder="Research Fellow"
                    maxLength={120}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="institution" className="text-sm font-medium">
                    Institution <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="institution"
                    value={profile.institution}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, institution: event.target.value }))
                    }
                    placeholder="University or organisation"
                    maxLength={200}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="department" className="text-sm font-medium">
                    Department <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="department"
                    value={profile.department}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, department: event.target.value }))
                    }
                    placeholder="School or department"
                    maxLength={200}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="phone" className="text-sm font-medium">Phone (optional)</label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, phone: event.target.value }))
                    }
                    placeholder="+61 400 000 000"
                    maxLength={40}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="research-interests" className="text-sm font-medium">
                  Research interests (optional)
                </label>
                <Textarea
                  id="research-interests"
                  value={profile.researchInterests}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, researchInterests: event.target.value }))
                  }
                  placeholder="Research areas, methods, or topics"
                  maxLength={1000}
                  rows={3}
                />
              </div>
              {updateProfile.isError ? (
                <p role="alert" className="text-sm text-destructive">
                  {updateProfile.error.message}
                </p>
              ) : null}
              {updateProfile.isSuccess && me.data.profileComplete ? (
                <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Profile saved.
                </p>
              ) : null}
              <Button type="submit" className="w-fit" disabled={updateProfile.isPending}>
                <Save />
                {updateProfile.isPending ? "Saving…" : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Account status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="capitalize">
                {me.data.status}
              </Badge>
              <p className="mt-3 break-all font-mono text-xs text-muted-foreground">
                User ID: {me.data.id}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-primary" />
                Design theme
              </CardTitle>
              <CardDescription>
                Pick the overall look and feel — layout, navigation, colors, and typography all
                change together.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {DESIGN_THEMES.map((option) => {
                const isSelected = designTheme.theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => designTheme.setTheme(option.value)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50",
                      isSelected && "border-primary ring-1 ring-primary",
                    )}
                  >
                    <div
                      data-design-theme={option.value}
                      aria-hidden="true"
                      className="pointer-events-none flex h-14 w-20 shrink-0 overflow-hidden rounded-[var(--radius)] border bg-background"
                    >
                      {option.layout === "topnav" ? (
                        <div className="flex w-full flex-col">
                          <div className="h-3 w-full bg-primary" />
                          <div className="flex-1 p-1.5">
                            <div className="h-full rounded-[var(--radius)] border bg-card shadow-sm" />
                          </div>
                        </div>
                      ) : option.layout === "sidebar-compact" ? (
                        <div className="flex h-full w-full">
                          <div className="flex h-full w-3.5 flex-col items-center gap-1 bg-primary py-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80" />
                            <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground/50" />
                            <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground/50" />
                          </div>
                          <div className="flex-1 p-1.5">
                            <div className="h-full rounded-[var(--radius)] border bg-card shadow-sm" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full w-full">
                          <div className="h-full w-4 bg-primary" />
                          <div className="flex-1 p-1.5">
                            <div className="h-full rounded-[var(--radius)] border bg-card shadow-sm" />
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-foreground">
                          {option.label}
                        </span>
                        {isSelected ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        ) : null}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
              <p className="text-xs leading-5 text-muted-foreground">
                This preference is saved in this browser and applied immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Color theme
              </CardTitle>
              <CardDescription>
                Choose the accent color used throughout your workspace, independent of the design
                theme above.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <label htmlFor="color-theme" className="text-sm font-medium">
                Theme
              </label>
              <Select
                value={colorTheme.theme}
                onValueChange={(value) => colorTheme.setTheme(value as ColorTheme)}
              >
                <SelectTrigger id="color-theme">
                  <SelectValue placeholder="Select a color theme" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_THEMES.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      {theme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-5 text-muted-foreground">
                This preference is saved in this browser and applied immediately.
              </p>
            </CardContent>
          </Card>

          {workspace.data ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Active workspace
                </CardTitle>
                <CardDescription>{workspace.data.name}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <Badge variant="outline" className="capitalize">
                  {workspace.data.membershipRole.replace("_", " ")}
                </Badge>
                <span className="truncate text-xs text-muted-foreground">
                  {workspace.data.slug}
                </span>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <WorkspaceMembers />
    </div>
  );
}
