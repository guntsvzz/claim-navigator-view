import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, RefreshCw } from "lucide-react";
import { useView } from "@/lib/view-store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DATE_RANGES,
  INITIAL_CLIENTS,
  type Client,
  type RangeKey,
  type SlaId,
} from "@/lib/sla-data";
import { PortfolioOverview } from "@/components/kpi/portfolio-overview";
import { ClientDetail } from "@/components/kpi/client-detail";

export const Route = createFileRoute("/kpi-alerts")({
  head: () => ({
    meta: [
      { title: "KPI & SLA Alerts · Claim Ops" },
      {
        name: "description",
        content:
          "SLA performance, thresholds and predictive risk per client. Portfolio overview plus per-client SLA report with configuration and alerting.",
      },
    ],
  }),
  component: KpiAlertsPage,
});

type LoadState = "ready" | "loading";

/** Human-readable "last updated" timestamp. */
function nowLabel() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function KpiAlertsPage() {
  const { view } = useView();

  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rangeKey, setRangeKey] = useState<RangeKey>("thisMonth");
  const [loadState, setLoadState] = useState<LoadState>("ready");
  const [updatedAt, setUpdatedAt] = useState<string>(nowLabel);

  const readOnly = false;

  // Clients scoped to the active Insurer/Provider mode from the sidebar.
  const scopedClients = useMemo(
    () => clients.filter((c) => c.tag === view),
    [clients, view],
  );

  // Keep the selection valid when the mode toggle changes the visible list.
  const selectedClient =
    selectedId != null ? scopedClients.find((c) => c.id === selectedId) ?? null : null;

  function handleRefresh() {
    setLoadState("loading");
    window.setTimeout(() => {
      setLoadState("ready");
      setUpdatedAt(nowLabel());
    }, 800);
  }

  function handleSetThreshold(clientId: string, slaId: SlaId, next: number) {
    if (readOnly) return;
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        const prevTarget = c.targets[slaId];
        if (!prevTarget || prevTarget.target === next) return c;
        const data = c.data[slaId];
        const nextData = data
          ? {
              ...data,
              history: [
                {
                  date: new Date().toISOString().slice(0, 10),
                  from: prevTarget.target,
                  to: next,
                  changedBy: "You",
                },
                ...data.history,
              ],
            }
          : data;
        return {
          ...c,
          targets: { ...c.targets, [slaId]: { ...prevTarget, target: next } },
          data: nextData ? { ...c.data, [slaId]: nextData } : c.data,
        };
      }),
    );
  }

  function handleToggleAlert(clientId: string, slaId: SlaId) {
    if (readOnly) return;
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        const data = c.data[slaId];
        if (!data) return c;
        return {
          ...c,
          data: { ...c.data, [slaId]: { ...data, alertEnabled: !data.alertEnabled } },
        };
      }),
    );
  }

  function handleToggleAllAlerts(clientId: string, enable: boolean) {
    if (readOnly) return;
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        const nextData = { ...c.data };
        (Object.keys(nextData) as SlaId[]).forEach((slaId) => {
          const d = nextData[slaId];
          if (d) nextData[slaId] = { ...d, alertEnabled: enable };
        });
        return { ...c, data: nextData };
      }),
    );
  }

  return (
    <div className="space-y-6">
      {/* ---------------- Header ---------------- */}
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Key Account Management
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">KPI &amp; SLA Alerts</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              SLA performance, thresholds &amp; predictive risk per client
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Select value={rangeKey} onValueChange={(v) => setRangeKey(v as RangeKey)}>
                <SelectTrigger className="h-9 w-[160px]" aria-label="Select date range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DATE_RANGES).map(([key, r]) => (
                    <SelectItem key={key} value={key}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden items-center text-xs text-muted-foreground sm:flex">
              Updated {updatedAt}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={handleRefresh}
              disabled={loadState === "loading"}
            >
              <RefreshCw className={cn("h-4 w-4", loadState === "loading" && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      {/* ---------------- Body: Level 1 overview ↔ Level 2 detail ---------------- */}
      {selectedClient ? (
        <ClientDetail
          key={`${selectedClient.id}-${rangeKey}`}
          client={selectedClient}
          clients={scopedClients}
          readOnly={readOnly}
          onBack={() => setSelectedId(null)}
          onSelectClient={(id) => setSelectedId(id)}
          onSetThreshold={handleSetThreshold}
          onToggleAlert={handleToggleAlert}
          onToggleAllAlerts={handleToggleAllAlerts}
        />
      ) : (
        <PortfolioOverview
          clients={scopedClients}
          loading={loadState === "loading"}
          onSelect={(id) => setSelectedId(id)}
        />
      )}
    </div>
  );
}
