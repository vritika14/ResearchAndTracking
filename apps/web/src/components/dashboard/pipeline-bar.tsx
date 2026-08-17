import { cn } from "@/lib/utils";

const PIPELINE_GRADIENT =
  "linear-gradient(to right, hsl(var(--pipeline-start)) 0%, hsl(var(--pipeline-middle)) 50%, hsl(var(--pipeline-end)) 100%)";

function stagePosition(stageIndex: number, stageCount: number) {
  return stageCount <= 1 ? 0 : (stageIndex / (stageCount - 1)) * 100;
}

interface PipelineBarProps {
  stageIndex: number;
  stageCount: number;
}

/**
 * Horizontal stage bar for one project row. Its endpoint is derived from the
 * project's stage position, while the full-width gradient keeps the colour at
 * that endpoint aligned with the stage ruler.
 */
export function PipelineBar({ stageIndex, stageCount }: PipelineBarProps) {
  const clampedIndex = Math.max(0, Math.min(stageCount - 1, stageIndex));
  const progress = stageCount <= 1 ? 100 : stagePosition(clampedIndex, stageCount);

  return (
    <div
      role="progressbar"
      aria-label={`Pipeline stage ${clampedIndex + 1} of ${Math.max(stageCount, 1)}`}
      aria-valuemin={1}
      aria-valuemax={Math.max(stageCount, 1)}
      aria-valuenow={clampedIndex + 1}
      className="relative flex h-6 w-full items-center"
    >
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          data-testid="pipeline-stage-fill"
          className="absolute inset-y-0 left-0 w-full rounded-full"
          style={{
            background: PIPELINE_GRADIENT,
            clipPath: `inset(0 ${100 - progress}% 0 0)`,
          }}
        />
      </div>
    </div>
  );
}

/** Stage labels positioned above the bars at their corresponding progress points. */
export function PipelineStageRuler({ stages }: { stages: readonly string[] }) {
  const lastIndex = stages.length - 1;

  return (
    <div className="relative h-9 w-full text-[9px] font-medium uppercase tracking-wide text-primary/70">
      {stages.map((stage, index) => (
        <span
          key={stage}
          className={cn(
            "absolute top-0 w-28 whitespace-normal text-center leading-tight",
            index === 0 && "left-0 text-left",
            index === lastIndex && "right-0 text-right",
            index > 0 && index < lastIndex && "-translate-x-1/2",
          )}
          style={index > 0 && index < lastIndex ? { left: `${stagePosition(index, stages.length)}%` } : undefined}
        >
          {stage}
        </span>
      ))}
    </div>
  );
}
