import { useEffect, useState } from "react";

import { modules, type ResearchModule } from "@/data/modules";

const MODULES_STORAGE_KEY = "research-in-motion.modules.v1";

export function reindexModulesAfterStageDeletion(deletedIndex: number) {
  const current = loadModules();
  const next = current.map((module) => ({
    ...module,
    stageIndex:
      module.stageIndex === deletedIndex
        ? Math.max(0, deletedIndex - 1)
        : module.stageIndex > deletedIndex
          ? module.stageIndex - 1
          : module.stageIndex,
  }));
  window.localStorage.setItem(MODULES_STORAGE_KEY, JSON.stringify(next));
}

function isResearchModule(value: unknown): value is ResearchModule {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ResearchModule>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    (typeof candidate.projectId === "string" || candidate.projectId === null) &&
    typeof candidate.status === "string" &&
    typeof candidate.stageIndex === "number" &&
    typeof candidate.dueDate === "string" &&
    typeof candidate.importance === "string"
  );
}

function loadModules() {
  if (typeof window === "undefined") return modules;
  try {
    const stored = JSON.parse(window.localStorage.getItem(MODULES_STORAGE_KEY) ?? "null");
    return Array.isArray(stored) && stored.every(isResearchModule) ? stored : modules;
  } catch {
    return modules;
  }
}

export function useModules() {
  const [moduleRows, setModuleRows] = useState<ResearchModule[]>(loadModules);

  useEffect(() => {
    window.localStorage.setItem(MODULES_STORAGE_KEY, JSON.stringify(moduleRows));
  }, [moduleRows]);

  return { moduleRows, setModuleRows };
}
