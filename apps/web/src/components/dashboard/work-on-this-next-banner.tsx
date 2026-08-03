import { ArrowRight } from "lucide-react";

interface RelatedTaskPill {
  kind: "task";
  label: string;
  due: string;
}

interface RelatedProjectPill {
  kind: "project";
  label: string;
  status: string;
}

type RelatedPill = RelatedTaskPill | RelatedProjectPill;

const relatedItems: RelatedPill[] = [
  { kind: "task", label: "Order sequencing reagents", due: "Due tomorrow" },
  { kind: "task", label: "Review QC report", due: "Due Aug 2" },
  { kind: "project", label: "Enzyme Kinetics Inhibition Study", status: "Active" },
];

/** Surfaces the single most urgent item plus a few related tasks/projects. */
export function WorkOnThisNextBanner() {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 p-5 text-white shadow-sm md:flex-row md:items-center md:gap-6">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-blue-200">
        Work on This Next
      </span>
      <span className="h-px w-full shrink-0 bg-white/20 md:h-10 md:w-px" />

      <div className="flex flex-1 items-start gap-4">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 shadow-sm shadow-orange-900/40">
          <ArrowRight className="h-5 w-5 text-white" />
        </span>

        <div className="flex flex-1 flex-col gap-3">
          <div>
            <p className="text-lg font-bold leading-snug text-white">
              Validate RNA extraction protocol
            </p>
            <p className="text-sm text-blue-200">
              Genome Sequencing Pipeline v3 · Due today
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {relatedItems.map((item) =>
              item.kind === "task" ? (
                <span
                  key={item.label}
                  className="rounded-full border border-blue-300/30 bg-blue-400/20 px-3 py-1 text-xs font-medium text-blue-50"
                >
                  {item.label} · {item.due}
                </span>
              ) : (
                <span
                  key={item.label}
                  className="rounded-full border border-purple-300/30 bg-purple-400/20 px-3 py-1 text-xs font-medium text-purple-50"
                >
                  {item.label} · {item.status}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
