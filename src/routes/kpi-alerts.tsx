import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw } from "lucide-react";
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
  INITIAL_CLIENTS,
  type Client,
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
    <div className="space-y-3">
      {/* ---------------- Header ---------------- */}
      <section className="rounded-lg border border-border bg-card px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: title block OR breadcrumb when inside a client */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              Key Account Management
            </div>
            <h1 className="text-lg font-bold tracking-tight leading-tight">KPI &amp; SLA Alerts</h1>
            {!selectedClient && (
              <p className="text-xs text-muted-foreground">
                SLA performance, thresholds &amp; predictive risk per client
              </p>
            )}
          </div>

          {/* Right: breadcrumb + switch (client view) OR updated + refresh (overview) */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedClient ? (
              <>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setSelectedId(null)}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </Button>
                <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs">
                  <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground hover:underline">
                    All clients
                  </button>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-semibold">{selectedClient.name}</span>
                </nav>
                <span className="text-xs text-muted-foreground hidden sm:inline">Switch:</span>
                <Select value={selectedClient.id} onValueChange={(id) => setSelectedId(id)}>
                  <SelectTrigger className="h-7 w-[160px] text-xs" aria-label="Switch client">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scopedClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="h-4 w-px bg-border" />
              </>
            ) : null}
            <div className="hidden items-center text-xs text-muted-foreground sm:flex">
              Updated {updatedAt}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleRefresh}
              disabled={loadState === "loading"}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loadState === "loading" && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      {/* ---------------- Body: Level 1 overview ↔ Level 2 detail ---------------- */}
      {selectedClient ? (
        <ClientDetail
          key={selectedClient.id}
          client={selectedClient}
          clients={scopedClients}
          readOnly={readOnly}
          onBack={() => setSelectedId(null)}
          onSelectClient={(id) => setSelectedId(id)}
          onSetThreshold={handleSetThreshold}
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
