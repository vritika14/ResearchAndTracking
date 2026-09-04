import { useMemo, useState, type ReactNode } from "react";
import {
  Boxes,
  CheckSquare2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  FolderKanban,
  GitBranch,
  Network,
  NotebookPen,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  useCurrentWorkspace,
  useModules,
  useNotes,
  useProjects,
  useTasks,
  type ApiModule,
  type ApiNote,
  type ApiProject,
  type ApiTask,
} from "@/api/hooks";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeading } from "@/components/typography/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type LinkedItem = ApiTask | ApiNote;
type MapView = "tree" | "bubbles";

type BubbleNode = {
  key: string;
  sourceId: string;
  kind: "project" | "module" | "task" | "note";
  title: string;
  href: string;
};

type BubblePosition = BubbleNode & { x: number; y: number };

function matchesSearch(value: string | null | undefined, search: string) {
  return !search || value?.toLowerCase().includes(search);
}

function ItemNode({ item, kind }: { item: LinkedItem; kind: "task" | "note" }) {
  const Icon = kind === "task" ? CheckSquare2 : NotebookPen;
  const href = kind === "task" ? `/tasks/${item.id}` : `/daily-notes/${item.id}`;
  return (
    <Link
      to={href}
      className={cn(
        "group flex min-w-48 items-start gap-2 rounded-xl border bg-card px-3 py-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        kind === "task"
          ? "border-amber-200 dark:border-amber-900"
          : "border-emerald-200 dark:border-emerald-900",
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", kind === "task" ? "text-amber-600" : "text-emerald-600")} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium group-hover:text-primary">{item.title}</span>
        <span className="block text-xs capitalize text-muted-foreground">{kind}</span>
      </span>
    </Link>
  );
}

function LeafCollection({ tasks, notes }: { tasks: ApiTask[]; notes: ApiNote[] }) {
  if (tasks.length === 0 && notes.length === 0) {
    return <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">No linked tasks or notes</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {tasks.map((task) => <ItemNode key={task.id} item={task} kind="task" />)}
      {notes.map((note) => <ItemNode key={note.id} item={note} kind="note" />)}
    </div>
  );
}

function Branch({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative ml-4 border-l-2 border-border/80 pl-6 before:absolute before:left-0 before:top-6 before:w-6 before:border-t-2 before:border-border/80", className)}>
      {children}
    </div>
  );
}

function bubbleLabel(title: string) {
  return title.length > 20 ? `${title.slice(0, 18)}…` : title;
}

const bubbleStyles = {
  project: { circle: "fill-blue-100 stroke-blue-600 dark:fill-blue-950", text: "fill-blue-800 dark:fill-blue-200", label: "Project" },
  module: { circle: "fill-violet-100 stroke-violet-600 dark:fill-violet-950", text: "fill-violet-800 dark:fill-violet-200", label: "Module" },
  task: { circle: "fill-amber-100 stroke-amber-500 dark:fill-amber-950", text: "fill-amber-800 dark:fill-amber-200", label: "Task" },
  note: { circle: "fill-emerald-100 stroke-emerald-600 dark:fill-emerald-950", text: "fill-emerald-800 dark:fill-emerald-200", label: "Note" },
} as const;

function BubbleRelationshipMap({
  workspaceName,
  projects,
  modules,
  tasks,
  notes,
  projectFilter,
  search,
}: {
  workspaceName: string;
  projects: ApiProject[];
  modules: ApiModule[];
  tasks: ApiTask[];
  notes: ApiNote[];
  projectFilter: string;
  search: string;
}) {
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());

  function toggleCollapse(key: string) {
    setCollapsedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const projectScope = new Set(projects.filter((project) => projectFilter === "all" || project.id === projectFilter).map((project) => project.id));
  const scopedProjects = projects.filter((project) => projectScope.has(project.id));
  const scopedModules = modules.filter((module) => module.projectId ? projectScope.has(module.projectId) : projectFilter === "all");
  const scopedModuleIds = new Set(scopedModules.map((module) => module.id));
  const scopedTasks = tasks.filter((task) => projectFilter === "all" || (task.projectId ? projectScope.has(task.projectId) : Boolean(task.moduleId && scopedModuleIds.has(task.moduleId))));
  const scopedNotes = notes.filter((note) => projectFilter === "all" || (note.projectId ? projectScope.has(note.projectId) : Boolean(note.moduleId && scopedModuleIds.has(note.moduleId))));

  const directlyMatchedProjects = new Set(scopedProjects.filter((project) => matchesSearch(project.title, search)).map((project) => project.id));
  const directlyMatchedModules = new Set(scopedModules.filter((module) => matchesSearch(module.title, search)).map((module) => module.id));
  const directlyMatchedTasks = new Set(scopedTasks.filter((task) => matchesSearch(task.title, search)).map((task) => task.id));
  const directlyMatchedNotes = new Set(scopedNotes.filter((note) => matchesSearch(note.title, search)).map((note) => note.id));

  const visibleTasks = scopedTasks.filter((task) => directlyMatchedTasks.has(task.id) || Boolean(task.projectId && directlyMatchedProjects.has(task.projectId)) || Boolean(task.moduleId && directlyMatchedModules.has(task.moduleId)));
  const visibleNotes = scopedNotes.filter((note) => directlyMatchedNotes.has(note.id) || Boolean(note.projectId && directlyMatchedProjects.has(note.projectId)) || Boolean(note.moduleId && directlyMatchedModules.has(note.moduleId)));
  const visibleTaskModuleIds = new Set(visibleTasks.map((task) => task.moduleId).filter((id): id is string => Boolean(id)));
  const visibleNoteModuleIds = new Set(visibleNotes.map((note) => note.moduleId).filter((id): id is string => Boolean(id)));
  const visibleModules = scopedModules.filter((module) => directlyMatchedModules.has(module.id) || Boolean(module.projectId && directlyMatchedProjects.has(module.projectId)) || visibleTaskModuleIds.has(module.id) || visibleNoteModuleIds.has(module.id));
  const visibleModuleIds = new Set(visibleModules.map((module) => module.id));
  const visibleModuleById = new Map(visibleModules.map((module) => [module.id, module]));
  const visibleProjects = scopedProjects.filter((project) => directlyMatchedProjects.has(project.id)
    || visibleModules.some((module) => module.projectId === project.id)
    || visibleTasks.some((task) => task.projectId === project.id || Boolean(task.moduleId && visibleModuleIds.has(task.moduleId) && visibleModuleById.get(task.moduleId)?.projectId === project.id))
    || visibleNotes.some((note) => note.projectId === project.id || Boolean(note.moduleId && visibleModuleIds.has(note.moduleId) && visibleModuleById.get(note.moduleId)?.projectId === project.id)));

  const projectHasChildren = new Set<string>();
  const moduleHasChildren = new Set<string>();
  for (const module of visibleModules) {
    if (module.projectId) projectHasChildren.add(module.projectId);
  }
  for (const task of visibleTasks) {
    if (task.moduleId) moduleHasChildren.add(task.moduleId);
    else if (task.projectId) projectHasChildren.add(task.projectId);
  }
  for (const note of visibleNotes) {
    if (note.moduleId) moduleHasChildren.add(note.moduleId);
    else if (note.projectId) projectHasChildren.add(note.projectId);
  }

  function isCollapsedDescendant(moduleId?: string | null, projectId?: string | null) {
    if (moduleId) {
      if (collapsedKeys.has(`module-${moduleId}`)) return true;
      const parentProjectId = visibleModuleById.get(moduleId)?.projectId;
      return Boolean(parentProjectId && collapsedKeys.has(`project-${parentProjectId}`));
    }
    if (projectId) return collapsedKeys.has(`project-${projectId}`);
    return false;
  }

  const displayedModules = visibleModules.filter((module) => !(module.projectId && collapsedKeys.has(`project-${module.projectId}`)));
  const displayedTasks = visibleTasks.filter((task) => !isCollapsedDescendant(task.moduleId, task.projectId));
  const displayedNotes = visibleNotes.filter((note) => !isCollapsedDescendant(note.moduleId, note.projectId));

  const projectNodes: BubbleNode[] = visibleProjects.map((project) => ({ key: `project-${project.id}`, sourceId: project.id, kind: "project", title: project.title, href: `/projects/${project.id}` }));
  const moduleNodes: BubbleNode[] = displayedModules.map((module) => ({ key: `module-${module.id}`, sourceId: module.id, kind: "module", title: module.title, href: `/modules/${module.id}` }));
  const leafNodes: BubbleNode[] = [
    ...displayedTasks.map((task) => ({ key: `task-${task.id}`, sourceId: task.id, kind: "task" as const, title: task.title, href: `/tasks/${task.id}` })),
    ...displayedNotes.map((note) => ({ key: `note-${note.id}`, sourceId: note.id, kind: "note" as const, title: note.title, href: `/daily-notes/${note.id}` })),
  ];
  const rowCount = Math.max(projectNodes.length, moduleNodes.length, leafNodes.length, 4);
  const height = Math.max(520, rowCount * 105 + 80);

  function positionColumn(nodes: BubbleNode[], x: number): BubblePosition[] {
    const step = height / (nodes.length + 1);
    return nodes.map((node, index) => ({ ...node, x, y: step * (index + 1) }));
  }

  const positioned = [
    ...positionColumn(projectNodes, 340),
    ...positionColumn(moduleNodes, 650),
    ...positionColumn(leafNodes, 970),
  ];
  const positionByKey = new Map(positioned.map((node) => [node.key, node]));
  const root = { x: 90, y: height / 2 };
  const rootKey = "root";
  const rootLabel = `Workspace: ${workspaceName}`;
  const labelByKey = new Map<string, string>([[rootKey, rootLabel]]);
  for (const node of positioned) {
    labelByKey.set(node.key, `${bubbleStyles[node.kind].label}: ${node.title}`);
  }

  function parentKeyFor(moduleId?: string | null, projectId?: string | null) {
    if (moduleId) return `module-${moduleId}`;
    if (projectId) return `project-${projectId}`;
    return rootKey;
  }

  const edges: { from: { x: number; y: number }; to: { x: number; y: number }; key: string; label: string }[] = [];

  function addEdge(edgeKey: string, parentKey: string, targetKey: string) {
    const target = positionByKey.get(targetKey);
    const parent = parentKey === rootKey ? root : positionByKey.get(parentKey);
    const parentLabel = labelByKey.get(parentKey);
    const targetLabel = labelByKey.get(targetKey);
    if (target && parent && parentLabel && targetLabel) {
      edges.push({ from: parent, to: target, key: edgeKey, label: `${parentLabel} → ${targetLabel}` });
    }
  }

  for (const project of visibleProjects) {
    addEdge(`root-project-${project.id}`, rootKey, `project-${project.id}`);
  }
  for (const module of displayedModules) {
    addEdge(`module-${module.id}`, parentKeyFor(null, module.projectId), `module-${module.id}`);
  }
  for (const task of displayedTasks) {
    addEdge(`task-${task.id}`, parentKeyFor(task.moduleId, task.projectId), `task-${task.id}`);
  }
  for (const note of displayedNotes) {
    addEdge(`note-${note.id}`, parentKeyFor(note.moduleId, note.projectId), `note-${note.id}`);
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-muted/10 shadow-inner">
      <svg role="group" aria-label="Bubble relationship map" viewBox={`0 0 1100 ${height}`} className="min-w-[1100px]" style={{ height }}>
        <title>Bubble relationship map for {workspaceName}</title>
        {edges.map((edge) => {
          const path = `M ${edge.from.x + 40} ${edge.from.y} C ${edge.from.x + 120} ${edge.from.y}, ${edge.to.x - 120} ${edge.to.y}, ${edge.to.x - 40} ${edge.to.y}`;
          return (
            <g key={edge.key} className="group/edge" aria-hidden="true">
              <path
                d={path}
                fill="none"
                className="stroke-muted-foreground/40 transition-all duration-150 group-hover/edge:stroke-primary group-hover/edge:drop-shadow-sm"
                strokeWidth="2"
              />
              <path
                d={path}
                fill="none"
                className="cursor-pointer stroke-transparent [pointer-events:stroke]"
                strokeWidth="18"
              >
                <title>{edge.label}</title>
              </path>
            </g>
          );
        })}

        <g transform={`translate(${root.x} ${root.y})`}>
          <circle r="44" className="fill-violet-600 stroke-violet-700" strokeWidth="3" />
          <text textAnchor="middle" y="4" className="fill-white text-[10px] font-semibold uppercase">Workspace</text>
          <text textAnchor="middle" y="64" className="fill-foreground text-xs font-semibold">{bubbleLabel(workspaceName)}</text>
        </g>

        {positioned.map((node) => {
          const style = bubbleStyles[node.kind];
          const isCollapsed = collapsedKeys.has(node.key);
          const canToggle = (node.kind === "project" && projectHasChildren.has(node.sourceId))
            || (node.kind === "module" && moduleHasChildren.has(node.sourceId));
          return (
            <g key={node.key} transform={`translate(${node.x} ${node.y})`}>
              <Link to={node.href} aria-label={`${style.label}: ${node.title}`}>
                <g className="group cursor-pointer focus:outline-none">
                  <title>{style.label}: {node.title}</title>
                  <circle r="38" className={cn("transition group-hover:brightness-95 group-focus:stroke-[4px]", style.circle)} strokeWidth="3" />
                  <text textAnchor="middle" y="4" className={cn("text-[10px] font-semibold uppercase", style.text)}>{style.label}</text>
                  <text textAnchor="middle" y="58" className="fill-foreground text-xs font-medium">{bubbleLabel(node.title)}</text>
                </g>
              </Link>
              {canToggle ? (
                <g
                  role="button"
                  tabIndex={0}
                  aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${style.label.toLowerCase()} ${node.title}`}
                  aria-expanded={!isCollapsed}
                  className="cursor-pointer outline-none"
                  transform="translate(28 -28)"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleCollapse(node.key);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleCollapse(node.key);
                    }
                  }}
                >
                  <circle r="11" className="fill-card stroke-border transition hover:stroke-primary focus-visible:stroke-ring" strokeWidth="1.5" />
                  <text textAnchor="middle" y="4" className="select-none fill-foreground text-xs font-bold">{isCollapsed ? "+" : "−"}</text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ModuleBranch({
  module,
  tasks,
  notes,
  defaultExpanded,
}: {
  module: ApiModule;
  tasks: ApiTask[];
  notes: ApiNote[];
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <Branch>
      <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-900 dark:bg-violet-950/20">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            aria-label={`${expanded ? "Collapse" : "Expand"} ${module.title}`}
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          <Link to={`/modules/${module.id}`} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white"><Boxes className="h-4 w-4" /></span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold hover:text-primary">{module.title}</span>
              <span className="block text-xs text-muted-foreground">Module · {tasks.length} tasks · {notes.length} notes</span>
            </span>
          </Link>
        </div>
        {expanded ? <div className="mt-3 border-t border-violet-200/70 pt-3 dark:border-violet-900/70"><LeafCollection tasks={tasks} notes={notes} /></div> : null}
      </div>
    </Branch>
  );
}

function ProjectTree({
  project,
  modules,
  tasks,
  notes,
  search,
}: {
  project: ApiProject;
  modules: ApiModule[];
  tasks: ApiTask[];
  notes: ApiNote[];
  search: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const projectMatches = matchesSearch(project.title, search);
  const directTasks = tasks.filter((task) => task.projectId === project.id && !task.moduleId && (projectMatches || matchesSearch(task.title, search)));
  const directNotes = notes.filter((note) => note.projectId === project.id && !note.moduleId && (projectMatches || matchesSearch(note.title, search)));
  const visibleModules = modules.filter((module) => {
    if (module.projectId !== project.id) return false;
    if (projectMatches || matchesSearch(module.title, search)) return true;
    return tasks.some((task) => task.moduleId === module.id && matchesSearch(task.title, search))
      || notes.some((note) => note.moduleId === module.id && matchesSearch(note.title, search));
  });

  return (
    <section className="rounded-2xl border border-blue-200/80 bg-card p-4 shadow-sm dark:border-blue-900/70">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label={`${expanded ? "Collapse" : "Expand"} ${project.title}`}
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        <Link to={`/projects/${project.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm"><FolderKanban className="h-5 w-5" /></span>
          <span className="min-w-0">
            <span className="block truncate font-semibold hover:text-primary">{project.title}</span>
            <span className="block text-xs text-muted-foreground">Project · {visibleModules.length} modules</span>
          </span>
          {project.status ? <Badge variant="outline" className="ml-auto hidden sm:inline-flex">{project.status}</Badge> : null}
        </Link>
      </div>

      {expanded ? (
        <div className="mt-3 space-y-3">
          {(directTasks.length > 0 || directNotes.length > 0) ? (
            <Branch>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/30">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Directly linked to project</p>
                <LeafCollection tasks={directTasks} notes={directNotes} />
              </div>
            </Branch>
          ) : null}
          {visibleModules.map((module) => (
            <ModuleBranch
              key={module.id}
              module={module}
              tasks={tasks.filter((task) => task.moduleId === module.id && (projectMatches || matchesSearch(module.title, search) || matchesSearch(task.title, search)))}
              notes={notes.filter((note) => note.moduleId === module.id && (projectMatches || matchesSearch(module.title, search) || matchesSearch(note.title, search)))}
              defaultExpanded
            />
          ))}
          {visibleModules.length === 0 && directTasks.length === 0 && directNotes.length === 0 ? (
            <p className="ml-10 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">No matching connections in this project.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default function MindMapPage() {
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";
  const projectsQuery = useProjects(tenantId);
  const allProjects = projectsQuery.data?.data ?? [];
  const modulesQuery = useModules(tenantId);
  const tasksQuery = useTasks(tenantId);
  const notesQuery = useNotes(tenantId);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [view, setView] = useState<MapView>("tree");
  const normalizedSearch = search.trim().toLowerCase();

  const projects = useMemo(() => allProjects.filter((project) => {
    if (projectFilter !== "all" && project.id !== projectFilter) return false;
    if (!normalizedSearch || matchesSearch(project.title, normalizedSearch)) return true;
    const moduleIds = new Set((modulesQuery.data ?? []).filter((module) => module.projectId === project.id).map((module) => module.id));
    return (modulesQuery.data ?? []).some((module) => module.projectId === project.id && matchesSearch(module.title, normalizedSearch))
      || (tasksQuery.data ?? []).some((task) => (task.projectId === project.id || (task.moduleId && moduleIds.has(task.moduleId))) && matchesSearch(task.title, normalizedSearch))
      || (notesQuery.data ?? []).some((note) => (note.projectId === project.id || (note.moduleId && moduleIds.has(note.moduleId))) && matchesSearch(note.title, normalizedSearch));
    }), [modulesQuery.data, normalizedSearch, notesQuery.data, projectFilter, allProjects, tasksQuery.data]);

  const independentModules = (modulesQuery.data ?? []).filter((module) => !module.projectId && (
    matchesSearch(module.title, normalizedSearch)
    || (tasksQuery.data ?? []).some((task) => task.moduleId === module.id && matchesSearch(task.title, normalizedSearch))
    || (notesQuery.data ?? []).some((note) => note.moduleId === module.id && matchesSearch(note.title, normalizedSearch))
  ));
  const unassignedTasks = (tasksQuery.data ?? []).filter((task) => !task.projectId && !task.moduleId && matchesSearch(task.title, normalizedSearch));
  const unassignedNotes = (notesQuery.data ?? []).filter((note) => !note.projectId && !note.moduleId && matchesSearch(note.title, normalizedSearch));
  const showStandalone = projectFilter === "all";

  if (workspace.isPending || projectsQuery.isPending || modulesQuery.isPending || tasksQuery.isPending || notesQuery.isPending) {
    return <LoadingState title="Building mind map" className="min-h-[50vh]" />;
  }

  if (projectsQuery.isError || modulesQuery.isError || tasksQuery.isError || notesQuery.isError) {
    const error = projectsQuery.error ?? modulesQuery.error ?? tasksQuery.error ?? notesQuery.error;
    return <ErrorState title="Mind map could not be loaded" description={error?.message ?? "Please try again."} onRetry={() => void Promise.all([projectsQuery.refetch(), modulesQuery.refetch(), tasksQuery.refetch(), notesQuery.refetch()])} />;
  }

  return (
    <div className="page-stack">
      <PageHeading
        icon={Network}
        tone="violet"
        eyebrow="Relationships"
        title="Mind map"
        description="Explore how projects, modules, tasks, and notes connect. Select any node to open its details."
      />

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the map" aria-label="Search the mind map" className="pl-9" />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger aria-label="Filter mind map by project" className="w-full sm:w-56">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {allProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Choose how relationships are displayed.</p>
        <div className="flex rounded-lg border bg-card p-1" aria-label="Mind map view">
          <Button type="button" size="sm" variant={view === "tree" ? "default" : "ghost"} aria-pressed={view === "tree"} onClick={() => setView("tree")}><GitBranch className="mr-1.5 h-4 w-4" />Tree</Button>
          <Button type="button" size="sm" variant={view === "bubbles" ? "default" : "ghost"} aria-pressed={view === "bubbles"} onClick={() => setView("bubbles")}><CircleDot className="mr-1.5 h-4 w-4" />Bubbles</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 rounded-xl border border-dashed bg-muted/20 px-4 py-3 text-xs text-muted-foreground" aria-label="Mind map legend">
        <span className="inline-flex items-center gap-1.5"><FolderKanban className="h-4 w-4 text-blue-600" /> Project</span>
        <span className="inline-flex items-center gap-1.5"><Boxes className="h-4 w-4 text-violet-600" /> Module</span>
        <span className="inline-flex items-center gap-1.5"><CheckSquare2 className="h-4 w-4 text-amber-600" /> Task</span>
        <span className="inline-flex items-center gap-1.5"><NotebookPen className="h-4 w-4 text-emerald-600" /> Note</span>
      </div>

      {view === "bubbles" ? (
        <BubbleRelationshipMap
          workspaceName={workspace.data?.name ?? "Workspace"}
          projects={allProjects}
          modules={modulesQuery.data ?? []}
          tasks={tasksQuery.data ?? []}
          notes={notesQuery.data ?? []}
          projectFilter={projectFilter}
          search={normalizedSearch}
        />
      ) : <div className="relative space-y-4 rounded-2xl border bg-muted/10 p-4 sm:p-6">
        <div className="flex items-center gap-3 rounded-2xl border-2 border-violet-300 bg-violet-50 p-4 shadow-sm dark:border-violet-800 dark:bg-violet-950/30">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white"><Network className="h-5 w-5" /></span>
          <span><span className="block font-semibold">{workspace.data?.name ?? "Workspace"}</span><span className="block text-xs text-muted-foreground">Research workspace</span></span>
        </div>

        <div className="ml-5 space-y-4 border-l-2 border-border pl-5 sm:ml-8 sm:pl-8">
          {projects.map((project) => <ProjectTree key={project.id} project={project} modules={modulesQuery.data ?? []} tasks={tasksQuery.data ?? []} notes={notesQuery.data ?? []} search={normalizedSearch} />)}

          {showStandalone && independentModules.map((module) => (
            <ModuleBranch key={module.id} module={module} tasks={(tasksQuery.data ?? []).filter((task) => task.moduleId === module.id && (matchesSearch(module.title, normalizedSearch) || matchesSearch(task.title, normalizedSearch)))} notes={(notesQuery.data ?? []).filter((note) => note.moduleId === module.id && (matchesSearch(module.title, normalizedSearch) || matchesSearch(note.title, normalizedSearch)))} defaultExpanded />
          ))}

          {showStandalone && (unassignedTasks.length > 0 || unassignedNotes.length > 0) ? (
            <Branch className="ml-0">
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="mb-3 font-semibold">Unassigned items</p>
                <LeafCollection tasks={unassignedTasks} notes={unassignedNotes} />
              </div>
            </Branch>
          ) : null}

          {projects.length === 0 && (!showStandalone || (independentModules.length === 0 && unassignedTasks.length === 0 && unassignedNotes.length === 0)) ? (
            <div className="rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">No connections match the current filters.</div>
          ) : null}
        </div>
      </div>}
    </div>
  );
}
