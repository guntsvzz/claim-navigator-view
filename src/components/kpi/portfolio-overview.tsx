import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Building2,
  ChevronRight,
  Hospital,
  Minus,
  Search,
} from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  clientHealth,
  fmt,
  healthLabel,
  healthPillClasses,
  summarizeClient,
  type Client,
  type ClientSummary,
  type SlaHealth,
} from "@/lib/sla-data";

type SortKey = "risk" | "passPct" | "alerts" | "name";

const HEALTH_RANK: Record<SlaHealth, number> = { belowTarget: 0, atRisk: 1, onTarget: 2 };

export function PortfolioOverview({
  clients,
  loading,
  onSelect,
}: {
  clients: Client[];
  loading: boolean;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("risk");

  const rows = useMemo(() => {
    return clients.map((c) => ({ client: c, summary: summarizeClient(c) }));
  }, [clients]);

  const portfolio = useMemo(() => {
    let clientsAtRisk = 0;
    let slasBelow = 0;
    let alertsToday = 0;
    let passSum = 0;
    rows.forEach(({ summary }) => {
      const h = clientHealth(summary);
      if (h !== "onTarget") clientsAtRisk += 1;
      slasBelow += summary.belowTarget;
      alertsToday += summary.openAlerts;
      passSum += summary.overallPassPct;
    });
    return {
      clientsAtRisk,
      slasBelow,
      alertsToday,
      avgPass: rows.length ? Math.round((passSum / rows.length) * 10) / 10 : 0,
    };
  }, [rows]);

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter(({ client }) => client.name.toLowerCase().includes(q));
    const sorted = [...list].sort((a, b) => {
      switch (sortKey) {
        case "passPct":
          return a.summary.overallPassPct - b.summary.overallPassPct;
        case "alerts":
          return b.summary.openAlerts - a.summary.openAlerts;
        case "name":
          return a.client.name.localeCompare(b.client.name);
        case "risk":
        default: {
          const ra = HEALTH_RANK[clientHealth(a.summary)];
          const rb = HEALTH_RANK[clientHealth(b.summary)];
          if (ra !== rb) return ra - rb;
          return a.summary.overallPassPct - b.summary.overallPassPct;
        }
      }
    });
    return sorted;
  }, [rows, query, sortKey]);

  return (
    <div className="space-y-4">
      {/* Portfolio summary chips */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <PortfolioChip
          tone="destructive"
          label="Clients at risk"
          value={loading ? null : portfolio.clientsAtRisk}
          sub={`of ${rows.length} clients`}
        />
        <PortfolioChip
          tone="warning"
          label="SLAs below target"
          value={loading ? null : portfolio.slasBelow}
          sub="across portfolio"
        />
        <PortfolioChip
          tone="info"
          label="Alerts today"
          value={loading ? null : portfolio.alertsToday}
          sub="open events"
        />
        <PortfolioChip
          tone="success"
          label="Avg Pass%"
          value={loading ? null : portfolio.avgPass}
          suffix="%"
          sub="all clients"
        />
      </div>

      <Panel
        title="Clients"
        subtitle="Pick a company to view its SLA performance report"
        bodyClassName="p-0"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clients"
                className="h-8 w-[180px] pl-8 text-sm"
                aria-label="Search clients"
              />
            </div>
          </div>
        }
      >
        {loading ? (
          <TableSkeleton />
        ) : filteredSorted.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            No clients match &quot;{query}&quot;.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                  <SortableTh label="Client" active={sortKey === "name"} onClick={() => setSortKey("name")} />
                  <th className="px-4 py-2.5 font-medium">SLA health</th>
                  <th className="px-4 py-2.5 font-medium">Worst SLA now</th>
                  <SortableTh
                    label="Overall Pass%"
                    active={sortKey === "passPct"}
                    onClick={() => setSortKey("passPct")}
                    align="right"
                  />
                  <SortableTh
                    label="Alerts"
                    active={sortKey === "alerts"}
                    onClick={() => setSortKey("alerts")}
                    align="right"
                  />
                  <th className="px-4 py-2.5 font-medium">
                    <button
                      type="button"
                      onClick={() => setSortKey("risk")}
                      className={cn(
                        "font-medium hover:text-foreground",
                        sortKey === "risk" && "text-foreground underline underline-offset-4",
                      )}
                    >
                      Risk
                    </button>
                  </th>
                  <th className="px-4 py-2.5" aria-label="View" />
                </tr>
              </thead>
              <tbody>
                {filteredSorted.map(({ client, summary }) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    summary={summary}
                    onSelect={() => onSelect(client.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function ClientRow({
  client,
  summary,
  onSelect,
}: {
  client: Client;
  summary: ClientSummary;
  onSelect: () => void;
}) {
  const health = clientHealth(summary);
  const rowTone =
    health === "belowTarget"
      ? "bg-destructive/[0.05] hover:bg-destructive/10"
      : health === "atRisk"
        ? "bg-warning/[0.05] hover:bg-warning/10"
        : "hover:bg-accent/40";
  const Tag = client.tag === "insurer" ? Building2 : Hospital;
  const delta = client.trendDelta;

  return (
    <tr
      className={cn("cursor-pointer border-b border-border transition-colors", rowTone)}
      onClick={onSelect}
      tabIndex={0}
      role="button"
      aria-label={`View SLA report for ${client.name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            <Tag className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold">{client.name}</div>
            <div className="text-xs capitalize text-muted-foreground">{client.tag}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <HealthCount tone="success" label="On target" count={summary.onTarget} />
          <HealthCount tone="warning" label="At risk" count={summary.atRisk} />
          <HealthCount tone="destructive" label="Below" count={summary.belowTarget} />
        </div>
      </td>
      <td className="px-4 py-3">
        {summary.worst ? (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                healthPillClasses(summary.worst.health),
              )}
            >
              {summary.worst.passPct}%
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {summary.worst.def.name} · {healthLabel(summary.worst.health).toLowerCase()}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No SLA data</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1.5 font-mono tabular-nums font-semibold">
          {summary.overallPassPct}%
          <TrendArrow delta={delta} />
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className={cn(
            "inline-flex items-center gap-1 font-mono tabular-nums",
            summary.openAlerts > 0 ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <Bell className="h-3.5 w-3.5" />
          {summary.openAlerts}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            healthPillClasses(health),
          )}
        >
          {healthLabel(health)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
      </td>
    </tr>
  );
}

function TrendArrow({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.1) {
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" aria-label="No change" />;
  }
  const up = delta > 0;
  return (
    <span
      className={cn("inline-flex items-center text-[11px]", up ? "text-success" : "text-destructive")}
      aria-label={`${up ? "Up" : "Down"} ${Math.abs(delta)} points vs last period`}
    >
      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {Math.abs(delta)}
    </span>
  );
}

function HealthCount({
  tone,
  label,
  count,
}: {
  tone: "success" | "warning" | "destructive";
  label: string;
  count: number;
}) {
  const toneMap = {
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    destructive: "border-destructive/30 bg-destructive/10 text-destructive",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
        count === 0 ? "border-border bg-muted/40 text-muted-foreground" : toneMap[tone],
      )}
      title={`${count} ${label}`}
    >
      <span className="font-semibold">{count}</span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

function PortfolioChip({
  tone,
  label,
  value,
  sub,
  suffix,
}: {
  tone: "success" | "warning" | "destructive" | "info";
  label: string;
  value: number | null;
  sub: string;
  suffix?: string;
}) {
  const toneMap = {
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    info: "text-info",
  } as const;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {value === null ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <div className={cn("mt-1 text-3xl font-bold leading-none tabular-nums", toneMap[tone])}>
          {value}
          {suffix}
        </div>
      )}
      <div className="mt-1.5 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function SortableTh({
  label,
  active,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <th className={cn("px-4 py-2.5 font-medium", align === "right" && "text-right")}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "font-medium hover:text-foreground",
          active && "text-foreground underline underline-offset-4",
        )}
      >
        {label}
      </button>
    </th>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-border">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="ml-auto h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
