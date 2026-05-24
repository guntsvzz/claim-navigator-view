import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

type Tone = "default" | "success" | "warning" | "destructive" | "info";

const toneStyles: Record<Tone, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  info: "text-info",
};

const accentBar: Record<Tone, string> = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
};

export function KpiCard({
  label,
  value,
  sub,
  delta,
  icon: Icon,
  tone = "default",
  children,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  delta?: number;
  icon?: LucideIcon;
  tone?: Tone;
  children?: ReactNode;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <div className={cn("absolute inset-y-0 left-0 w-0.5", accentBar[tone])} />
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        {Icon && <Icon className={cn("h-4 w-4", toneStyles[tone])} />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-2xl font-bold tabular-nums tracking-tight">{value}</div>
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11px] font-semibold",
              up ? "text-success" : "text-destructive",
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
      {children}
    </div>
  );
}
