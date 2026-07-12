import { cn } from "@/lib/utils";
import { Radio, PenLine, CircleDashed, Info } from "lucide-react";

export type Readiness = "live" | "manual" | "none";

const meta: Record<
  Readiness,
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
  none: {
    label: "No source yet",
    className: "border-dashed border-border bg-muted/50 text-muted-foreground",
    icon: CircleDashed,
  },
};

export function ReadinessBadge({
  state,
  className,
}: {
  state: Readiness;
  className?: string;
}) {
  const m = meta[state];
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
        <ReadinessBadge state="none" />
        <span>Data source not confirmed</span>
      </span>
    </div>
  );
}

/** Muted strip shown at the top of a panel whose data has no confirmed source. */
export function SampleBanner({
  label = "Sample layout — no confirmed data source. ยังไม่มีแหล่งข้อมูล · pending data source.",
  tone = "none",
}: {
  label?: string;
  tone?: "none" | "illustrative";
}) {
  return (
    <div
      className={cn(
        "mb-3 flex items-start gap-2 rounded-md border border-dashed px-3 py-2 text-[11px] leading-relaxed",
        tone === "illustrative"
          ? "border-warning/40 bg-warning/10 text-warning"
          : "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </div>
  );
}
