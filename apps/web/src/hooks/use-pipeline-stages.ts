import { useCallback, useEffect, useState } from "react";

import { RESEARCH_PIPELINE_STAGES, type PipelineStageInfo } from "@/data/pipeline-rows";

const PIPELINE_STAGES_STORAGE_KEY = "research-in-motion.pipeline-stages.v1";
const PIPELINE_STAGES_EVENT = "research-in-motion:pipeline-stages-change";

function isPipelineStage(value: unknown): value is PipelineStageInfo {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PipelineStageInfo>;
  return typeof candidate.name === "string" && candidate.name.trim().length > 0 &&
    typeof candidate.description === "string";
}

function readPipelineStages() {
  if (typeof window === "undefined") return RESEARCH_PIPELINE_STAGES;
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(PIPELINE_STAGES_STORAGE_KEY) ?? "null",
    );
    return Array.isArray(stored) && stored.length > 0 && stored.every(isPipelineStage)
      ? stored
      : RESEARCH_PIPELINE_STAGES;
  } catch {
    return RESEARCH_PIPELINE_STAGES;
  }
}

export function usePipelineStages() {
  const [pipelineStages, setPipelineStagesState] = useState<PipelineStageInfo[]>(readPipelineStages);

  useEffect(() => {
    function syncStages() {
      setPipelineStagesState(readPipelineStages());
    }
    window.addEventListener("storage", syncStages);
    window.addEventListener(PIPELINE_STAGES_EVENT, syncStages);
    return () => {
      window.removeEventListener("storage", syncStages);
      window.removeEventListener(PIPELINE_STAGES_EVENT, syncStages);
    };
  }, []);

  const setPipelineStages = useCallback((stages: PipelineStageInfo[]) => {
    if (stages.length === 0) return;
    window.localStorage.setItem(PIPELINE_STAGES_STORAGE_KEY, JSON.stringify(stages));
    setPipelineStagesState(stages);
    window.dispatchEvent(new Event(PIPELINE_STAGES_EVENT));
  }, []);

  return { pipelineStages, setPipelineStages };
}
