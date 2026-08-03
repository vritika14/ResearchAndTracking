import { PIPELINE_STAGES } from "@/data/pipeline-projects";
import { cn } from "@/lib/utils";

const PIPELINE_GRADIENT = "linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #22c55e 100%)";

function stagePosition(stageIndex: number) {
  return (stageIndex / (PIPELINE_STAGES.length - 1)) * 100;
}

interface PipelineBarProps {
  stageIndex: number;
  completion: number;
}

/**
 * Horizontal stage/progress bar for one project row. The fill is clipped from a
 * full-width gradient (rather than sized from a shrunk div) so the colour at the
 * fill's edge always reflects true position on the red→orange→green track,
 * independent of how short the completed segment is.
 */
export function PipelineBar({ stageIndex, completion }: PipelineBarProps) {
  const clamped = Math.max(0, Math.min(100, completion));

  return (
    <div className="relative flex h-6 w-full items-center">
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 w-full rounded-full"
          style={{
            background: PIPELINE_GRADIENT,
            clipPath: `inset(0 ${100 - clamped}% 0 0)`,
          }}
        />
      </div>
      {PIPELINE_STAGES.map((stage, index) => (
        <div
          key={stage}
          className={cn(
            "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full",
            index === stageIndex
              ? "h-3.5 w-3.5 border-2 border-blue-600 bg-background shadow-sm"
              : "h-1.5 w-1.5 bg-border",
          )}
          style={{ left: `${stagePosition(index)}%` }}
        />
      ))}
    </div>
  );
}

/** Stage labels positioned above the bars, aligned to the same ticks as PipelineBar's markers. */
export function PipelineStageRuler() {
  const lastIndex = PIPELINE_STAGES.length - 1;

  return (
    <div className="relative h-4 w-full text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {PIPELINE_STAGES.map((stage, index) => (
        <span
          key={stage}
          className={cn(
            "absolute top-0 whitespace-nowrap",
            index === 0 && "left-0",
            index === lastIndex && "right-0",
            index > 0 && index < lastIndex && "-translate-x-1/2",
          )}
          style={index > 0 && index < lastIndex ? { left: `${stagePosition(index)}%` } : undefined}
        >
          {stage}
        </span>
      ))}
    </div>
  );
}
