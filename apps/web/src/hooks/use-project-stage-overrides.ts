import { useCallback, useEffect, useState } from "react";

const PROJECT_STAGE_STORAGE_KEY = "research-in-motion.project-stages.v1";
const PROJECT_STAGE_EVENT = "research-in-motion:project-stage-change";

export type ProjectStageOverrides = Record<string, number>;

function readProjectStageOverrides(): ProjectStageOverrides {
  if (typeof window === "undefined") return {};
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(PROJECT_STAGE_STORAGE_KEY) ?? "{}",
    ) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(stored).filter(
        ([projectId, stageIndex]) =>
          projectId.length > 0 &&
          Number.isInteger(stageIndex) &&
          Number(stageIndex) >= 0,
      ),
    ) as ProjectStageOverrides;
  } catch {
    return {};
  }
}

export function useProjectStageOverrides() {
  const [stageOverrides, setStageOverrides] = useState(readProjectStageOverrides);

  useEffect(() => {
    function syncStages() {
      setStageOverrides(readProjectStageOverrides());
    }

    window.addEventListener("storage", syncStages);
    window.addEventListener(PROJECT_STAGE_EVENT, syncStages);
    return () => {
      window.removeEventListener("storage", syncStages);
      window.removeEventListener(PROJECT_STAGE_EVENT, syncStages);
    };
  }, []);

  const updateProjectStage = useCallback((projectId: string, stageIndex: number) => {
    if (stageIndex < 0) return;
    const next = { ...readProjectStageOverrides(), [projectId]: stageIndex };
    window.localStorage.setItem(PROJECT_STAGE_STORAGE_KEY, JSON.stringify(next));
    setStageOverrides(next);
    window.dispatchEvent(new Event(PROJECT_STAGE_EVENT));
  }, []);

  const updateProjectStages = useCallback((updates: ProjectStageOverrides) => {
    const next = { ...readProjectStageOverrides(), ...updates };
    window.localStorage.setItem(PROJECT_STAGE_STORAGE_KEY, JSON.stringify(next));
    setStageOverrides(next);
    window.dispatchEvent(new Event(PROJECT_STAGE_EVENT));
  }, []);

  return { stageOverrides, updateProjectStage, updateProjectStages };
}
