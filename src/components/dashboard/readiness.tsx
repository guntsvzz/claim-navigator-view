import { cn } from "@/lib/utils";
import { Radio, PenLine, Sparkles, FlaskConical } from "lucide-react";

export type Readiness = "live" | "manual" | "ai" | "sample" | "none";

const meta: Record<
  "live" | "manual" | "ai" | "sample",
  { label: string; className: string; icon: typeof Radio }
> = {
  live: {
    label: "Live",
    className: "bg-success/15 text-success border-success/30",
    icon: Radio,
  },
  manual: {
    label: "Manual",
    className: "bg-info/15 text-info border-info/30",
    icon: PenLine,
  },
  ai: {
    label: "AI",
    className: "bg-primary/15 text-primary border-primary/30",
    icon: Sparkles,
  },
  sample: {
    label: "Sample",
    className: "bg-transparent text-muted-foreground border-border",
    icon: FlaskConical,
  },
};

export function ReadinessBadge({
  state,
  className,
}: {
  state: Readiness;
  className?: string;
}) {
  if (state === "none") return null;
  const m = meta[state as keyof typeof meta];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        m.className,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

export function ReadinessLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground",
        className,
      )}
    >
      <span className="font-semibold uppercase tracking-wider">Data readiness:</span>
      <span className="inline-flex items-center gap-1.5">
        <ReadinessBadge state="live" />
        <span>Real data from a system</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ReadinessBadge state="manual" />
        <span>Entered by KAM / BD</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ReadinessBadge state="ai" />
        <span>AI-suggested</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ReadinessBadge state="sample" />
        <span>Demo placeholder</span>
      </span>
    </div>
  );
}
