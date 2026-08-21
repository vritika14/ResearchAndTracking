/** A task or note links to at most one of a project or a module, or neither ("General"). */
export type LinkTargetType = "project" | "module" | "none";

export function resolveLinkTargetType(entity: {
  projectId: string | null;
  moduleId: string | null;
}): LinkTargetType {
  if (entity.moduleId) return "module";
  if (entity.projectId) return "project";
  return "none";
}

export function linkTargetLabel(entity: {
  projectName: string | null;
  moduleName: string | null;
}): string {
  return entity.moduleName ?? entity.projectName ?? "General";
}
