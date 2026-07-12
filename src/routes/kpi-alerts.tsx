import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  History,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sliders,
  TrendingDown,
} from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/kpi-alerts")({
  head: () => ({
    meta: [
      { title: "KPI Configuration & Alerts · Claim Ops" },
      {
        name: "description",
        content:
          "Track KPI targets, thresholds, and predictive risk per client. Configure alert conditions and review alert history.",
      },
    ],
  }),
  component: KpiAlertsPage,
});

/* ----------------------------- Types & mock data ----------------------------- */

type KpiStatus = "normal" | "below";
type Risk = "Low" | "Medium" | "High";
type Role = "Team Lead" | "Executive";
type LoadState = "ready" | "loading" | "empty" | "error";

interface Kpi {
  id: string;
  name: string;
  target: number;
  actual: number;
  unit: string; // "%", "hrs", "days"
  threshold: number;
  status: KpiStatus;
  risk: Risk;
  alertEnabled: boolean;
  /** true when lower values are better (e.g. processing time) */
  lowerIsBetter: boolean;
}

interface AlertEvent {
  id: string;
  text: string;
  time: string;
  severity: "warning" | "critical";
  type: string;
  recipient: string;
}

interface HistoryEntry {
  date: string;
  from: number;
  to: number;
  changedBy: string;
}

interface TrendPoint {
  label: string;
  actual: number | null;
  target: number;
  forecast: number | null;
  band?: [number, number];
}

const clients = ["ABC Insurance", "Siam Health", "Bangkok Provident", "Thai Re Group"];

const initialKpis: Kpi[] = [
  {
    id: "k1",
    name: "Claim processing time",
    target: 3,
    actual: 4.2,
    unit: "days",
    threshold: 4,
    status: "below",
    risk: "High",
    alertEnabled: true,
    lowerIsBetter: true,
  },
  {
    id: "k2",
    name: "SLA completion rate",
    target: 98,
    actual: 94.3,
    unit: "%",
    threshold: 95,
    status: "below",
    risk: "High",
    alertEnabled: true,
    lowerIsBetter: false,
  },
  {
    id: "k3",
    name: "First-response time",
    target: 2,
    actual: 2.1,
    unit: "hrs",
    threshold: 3,
    status: "normal",
    risk: "Medium",
    alertEnabled: true,
    lowerIsBetter: true,
  },
  {
    id: "k4",
    name: "CSAT",
    target: 90,
    actual: 88,
    unit: "%",
    threshold: 85,
    status: "normal",
    risk: "Medium",
    alertEnabled: false,
    lowerIsBetter: false,
  },
];

const initialAlerts: AlertEvent[] = [
  {
    id: "a1",
    text: "SLA completion rate dropped below 95%",
    time: "12 min ago",
    severity: "critical",
    type: "Below threshold",
    recipient: "Team Lead",
  },
  {
    id: "a2",
    text: "Claim processing time exceeded 4 days threshold",
    time: "48 min ago",
    severity: "critical",
    type: "Below threshold",
    recipient: "Ops Manager",
  },
  {
    id: "a3",
    text: "CSAT predicted to miss target by end of period",
    time: "2 hrs ago",
    severity: "warning",
    type: "Predicted to fall below",
    recipient: "Team Lead",
  },
  {
    id: "a4",
    text: "First-response time trending upward (+18%)",
    time: "5 hrs ago",
    severity: "warning",
    type: "Trend change",
    recipient: "Account Manager",
  },
];

const historyByKpi: Record<string, HistoryEntry[]> = {
  k1: [
    { date: "2026-06-28", from: 5, to: 4, changedBy: "K. Wattana" },
    { date: "2026-05-14", from: 6, to: 5, changedBy: "P. Chai" },
  ],
  k2: [
    { date: "2026-07-01", from: 93, to: 95, changedBy: "K. Wattana" },
    { date: "2026-04-22", from: 90, to: 93, changedBy: "A. Srisai" },
  ],
  k3: [{ date: "2026-06-10", from: 4, to: 3, changedBy: "P. Chai" }],
  k4: [{ date: "2026-05-30", from: 80, to: 85, changedBy: "A. Srisai" }],
};

/** Trend + forecast data per KPI. Forecast overlaps the last actual point for a continuous line. */
const trendByKpi: Record<string, TrendPoint[]> = {
  k1: [
    { label: "W1", actual: 3.1, target: 3, forecast: null },
    { label: "W2", actual: 3.4, target: 3, forecast: null },
    { label: "W3", actual: 3.8, target: 3, forecast: null },
    { label: "W4", actual: 4.2, target: 3, forecast: 4.2, band: [4.0, 4.4] },
    { label: "W5", actual: null, target: 3, forecast: 4.5, band: [4.1, 4.9] },
    { label: "W6", actual: null, target: 3, forecast: 4.8, band: [4.2, 5.4] },
  ],
  k2: [
    { label: "W1", actual: 97.5, target: 98, forecast: null },
    { label: "W2", actual: 96.8, target: 98, forecast: null },
    { label: "W3", actual: 95.4, target: 98, forecast: null },
    { label: "W4", actual: 94.3, target: 98, forecast: 94.3, band: [93.8, 94.8] },
    { label: "W5", actual: null, target: 98, forecast: 93.6, band: [92.8, 94.4] },
    { label: "W6", actual: null, target: 98, forecast: 92.9, band: [91.6, 94.2] },
  ],
  k3: [
    { label: "W1", actual: 1.8, target: 2, forecast: null },
    { label: "W2", actual: 1.9, target: 2, forecast: null },
    { label: "W3", actual: 2.0, target: 2, forecast: null },
    { label: "W4", actual: 2.1, target: 2, forecast: 2.1, band: [2.0, 2.2] },
    { label: "W5", actual: null, target: 2, forecast: 2.2, band: [2.0, 2.4] },
    { label: "W6", actual: null, target: 2, forecast: 2.3, band: [2.0, 2.6] },
  ],
  k4: [
    { label: "W1", actual: 89, target: 90, forecast: null },
    { label: "W2", actual: 88.5, target: 90, forecast: null },
    { label: "W3", actual: 88.2, target: 90, forecast: null },
    { label: "W4", actual: 88, target: 90, forecast: 88, band: [87, 89] },
    { label: "W5", actual: null, target: 90, forecast: 87.4, band: [86, 88.8] },
    { label: "W6", actual: null, target: 90, forecast: 86.8, band: [85, 88.6] },
  ],
};

const dateRanges = {
  thisMonth: { label: "This month" },
  thisQuarter: { label: "This quarter" },
  last30: { label: "Last 30 days" },
} as const;

/* ----------------------------- Helpers ----------------------------- */

function riskClasses(risk: Risk) {
  switch (risk) {
    case "High":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "Medium":
      return "bg-warning/15 text-warning border-warning/30";
    default:
      return "bg-success/15 text-success border-success/30";
  }
}

/** Progress fraction of actual vs target, clamped 0..1. */
function progressFraction(kpi: Kpi) {
  if (kpi.lowerIsBetter) {
    // lower is better: full bar when actual <= target
    return Math.max(0, Math.min(1, kpi.target / Math.max(kpi.actual, 0.0001)));
  }
  return Math.max(0, Math.min(1, kpi.actual / Math.max(kpi.target, 0.0001)));
}

function computeStatus(kpi: Pick<Kpi, "actual" | "threshold" | "lowerIsBetter">): KpiStatus {
  if (kpi.lowerIsBetter) return kpi.actual > kpi.threshold ? "below" : "normal";
  return kpi.actual < kpi.threshold ? "below" : "normal";
}

/* ----------------------------- Page ----------------------------- */

function KpiAlertsPage() {
  const [client, setClient] = useState(clients[0]);
  const [rangeKey, setRangeKey] = useState<keyof typeof dateRanges>("thisMonth");
  const [role, setRole] = useState<Role>("Team Lead");
  const [loadState, setLoadState] = useState<LoadState>("ready");
  const [kpis, setKpis] = useState<Kpi[]>(initialKpis);
  const [alerts, setAlerts] = useState<AlertEvent[]>(initialAlerts);
  const [selectedKpiId, setSelectedKpiId] = useState<string>(initialKpis[1].id);
  const [addOpen, setAddOpen] = useState(false);
  const [thresholdFor, setThresholdFor] = useState<Kpi | null>(null);

  // Alert condition settings
  const [triggerType, setTriggerType] = useState("Below threshold");
  const [margin, setMargin] = useState("5");
  const [savedCondition, setSavedCondition] = useState(false);

  const readOnly = role === "Executive";

  const summary = useMemo(() => {
    let onTrack = 0;
    let atRisk = 0;
    let below = 0;
    kpis.forEach((k) => {
      if (k.status === "below") below += 1;
      else if (k.risk === "High" || k.risk === "Medium") atRisk += 1;
      else onTrack += 1;
    });
    return { onTrack, atRisk, below };
  }, [kpis]);

  const selectedKpi = kpis.find((k) => k.id === selectedKpiId) ?? kpis[0];
  const trend = selectedKpi ? trendByKpi[selectedKpi.id] ?? [] : [];

  function handleRefresh() {
    setLoadState("loading");
    window.setTimeout(() => setLoadState("ready"), 900);
  }

  function toggleAlert(id: string) {
    if (readOnly) return;
    setKpis((prev) =>
      prev.map((k) => (k.id === id ? { ...k, alertEnabled: !k.alertEnabled } : k)),
    );
  }

  function saveThreshold(id: string, next: number) {
    setKpis((prev) =>
      prev.map((k) =>
        k.id === id
          ? { ...k, threshold: next, status: computeStatus({ ...k, threshold: next }) }
          : k,
      ),
    );
    setThresholdFor(null);
  }

  function addKpi(input: {
    name: string;
    target: number;
    threshold: number;
    unit: string;
    lowerIsBetter: boolean;
  }) {
    const id = `k${Date.now()}`;
    const actual = input.target; // new KPI starts at target
    const newKpi: Kpi = {
      id,
      name: input.name,
      target: input.target,
      actual,
      unit: input.unit,
      threshold: input.threshold,
      status: "normal",
      risk: "Low",
      alertEnabled: true,
      lowerIsBetter: input.lowerIsBetter,
    };
    setKpis((prev) => [...prev, newKpi]);
    trendByKpi[id] = [
      { label: "W1", actual: input.target, target: input.target, forecast: null },
      { label: "W2", actual: input.target, target: input.target, forecast: null },
      { label: "W3", actual: input.target, target: input.target, forecast: input.target, band: [input.target, input.target] },
      { label: "W4", actual: null, target: input.target, forecast: input.target, band: [input.target, input.target] },
    ];
    historyByKpi[id] = [];
    setAddOpen(false);
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
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              KPI Configuration &amp; Alerts
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Track targets, thresholds &amp; predictive risk per client
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={client} onValueChange={setClient}>
              <SelectTrigger className="h-9 w-[184px]" aria-label="Select client">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Select
                value={rangeKey}
                onValueChange={(v) => setRangeKey(v as keyof typeof dateRanges)}
              >
                <SelectTrigger className="h-9 w-[150px]" aria-label="Select date range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dateRanges).map(([key, r]) => (
                    <SelectItem key={key} value={key}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="h-9 w-[150px]" aria-label="Select role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Team Lead">Team Lead</SelectItem>
                <SelectItem value="Executive">Executive (read-only)</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={handleRefresh}
              disabled={loadState === "loading"}
            >
              <RefreshCw
                className={cn("h-4 w-4", loadState === "loading" && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary chips */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryChip
            tone="success"
            icon={CheckCircle2}
            label="KPIs on track"
            count={summary.onTrack}
          />
          <SummaryChip
            tone="warning"
            icon={AlertTriangle}
            label="At risk (predicted)"
            count={summary.atRisk}
          />
          <SummaryChip
            tone="destructive"
            icon={ShieldAlert}
            label="Below threshold"
            count={summary.below}
          />
        </div>
      </section>

      {/* ---------------- Body ---------------- */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <div className="space-y-4">
          <Panel
            title="KPIs"
            subtitle={`${client} · ${dateRanges[rangeKey].label}`}
            actions={
              <Button
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setAddOpen(true)}
                disabled={readOnly}
                title={readOnly ? "Executive role is read-only" : "Add a KPI"}
              >
                <Plus className="h-4 w-4" />
                Add KPI
              </Button>
            }
            bodyClassName="p-0"
          >
            {loadState === "loading" ? (
              <KpiListSkeleton />
            ) : loadState === "error" ? (
              <ErrorState onRetry={handleRefresh} />
            ) : kpis.length === 0 ? (
              <EmptyState onAdd={() => setAddOpen(true)} readOnly={readOnly} />
            ) : (
              <ul className="divide-y divide-border">
                {kpis.map((kpi) => (
                  <KpiRow
                    key={kpi.id}
                    kpi={kpi}
                    selected={kpi.id === selectedKpiId}
                    readOnly={readOnly}
                    onSelect={() => setSelectedKpiId(kpi.id)}
                    onToggleAlert={() => toggleAlert(kpi.id)}
                    onSetThreshold={() => setThresholdFor(kpi)}
                  />
                ))}
              </ul>
            )}
          </Panel>

          {/* Trend & Prediction */}
          <Panel
            title="Trend & Prediction"
            subtitle={
              selectedKpi
                ? `${selectedKpi.name} · actual vs target with forecast band`
                : "Select a KPI"
            }
            actions={
              <Select value={selectedKpiId} onValueChange={setSelectedKpiId}>
                <SelectTrigger className="h-8 w-[190px]" aria-label="Select KPI for chart">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kpis.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          >
            {loadState === "loading" ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={trend} margin={{ left: -8, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="var(--color-muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--color-muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {/* Forecast risk band */}
                    <Area
                      type="monotone"
                      dataKey="band"
                      name="Forecast band"
                      stroke="none"
                      fill="var(--color-warning)"
                      fillOpacity={0.15}
                      connectNulls
                    />
                    {selectedKpi && (
                      <ReferenceLine
                        y={selectedKpi.threshold}
                        stroke="var(--color-destructive)"
                        strokeDasharray="4 4"
                        label={{
                          value: `Threshold ${selectedKpi.threshold}${selectedKpi.unit}`,
                          fill: "var(--color-destructive)",
                          fontSize: 10,
                          position: "insideTopRight",
                        }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="target"
                      name="Target"
                      stroke="var(--color-muted-foreground)"
                      strokeWidth={1.5}
                      strokeDasharray="5 4"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="Actual"
                      stroke="var(--color-primary)"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      name="Forecast"
                      stroke="var(--color-warning)"
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                {selectedKpi && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TrendingDown className="h-3.5 w-3.5 text-warning" />
                    Forecast projects{" "}
                    <span className="font-semibold text-foreground">{selectedKpi.name}</span>{" "}
                    at{" "}
                    <span className={cn("font-semibold", riskTextTone(selectedKpi.risk))}>
                      {selectedKpi.risk} risk
                    </span>{" "}
                    of missing target by end of period.
                  </p>
                )}
              </>
            )}
          </Panel>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          {/* Recent alerts */}
          <Panel
            title="Recent alerts"
            subtitle={`${alerts.length} events`}
            bodyClassName="p-0"
          >
            {loadState === "loading" ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="mt-1 h-2.5 w-2.5 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No alerts fired yet.</p>
            ) : (
              <ul className="max-h-[280px] divide-y divide-border overflow-y-auto">
                {alerts.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                    <span
                      className={cn(
                        "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                        a.severity === "critical" ? "bg-destructive" : "bg-warning",
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-sm leading-snug">{a.text}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {a.type} · {a.recipient} · {a.time}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Alert condition settings */}
          <Panel
            title="Alert condition"
            subtitle="When should alerts fire?"
            actions={<Sliders className="h-4 w-4 text-muted-foreground" />}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="trigger">Trigger type</Label>
                <Select
                  value={triggerType}
                  onValueChange={(v) => {
                    setTriggerType(v);
                    setSavedCondition(false);
                  }}
                >
                  <SelectTrigger id="trigger" className="h-9" disabled={readOnly}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Below threshold">Below threshold</SelectItem>
                    <SelectItem value="Predicted to fall below">
                      Predicted to fall below
                    </SelectItem>
                    <SelectItem value="Trend change">Trend change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="margin">Margin (%)</Label>
                <Input
                  id="margin"
                  type="number"
                  min={0}
                  max={100}
                  value={margin}
                  disabled={readOnly}
                  onChange={(e) => {
                    setMargin(e.target.value);
                    setSavedCondition(false);
                  }}
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground">
                  Fire when actual is within this margin of the threshold.
                </p>
              </div>
              <Button
                className="w-full"
                disabled={readOnly || savedCondition}
                onClick={() => setSavedCondition(true)}
              >
                {savedCondition ? "Saved" : "Save condition"}
              </Button>
              {readOnly && (
                <p className="text-center text-xs text-muted-foreground">
                  Executive role is read-only.
                </p>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* ---------------- Add KPI dialog ---------------- */}
      <AddKpiDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        client={client}
        onAdd={addKpi}
      />

      {/* ---------------- Set threshold dialog ---------------- */}
      <ThresholdDialog
        kpi={thresholdFor}
        onOpenChange={(o) => !o && setThresholdFor(null)}
        onSave={saveThreshold}
      />
    </div>
  );
}

/* ----------------------------- Sub-components ----------------------------- */

function riskTextTone(risk: Risk) {
  if (risk === "High") return "text-destructive";
  if (risk === "Medium") return "text-warning";
  return "text-success";
}

function SummaryChip({
  tone,
  icon: Icon,
  label,
  count,
}: {
  tone: "success" | "warning" | "destructive";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
}) {
  const toneMap = {
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    destructive: "border-destructive/30 bg-destructive/10 text-destructive",
  } as const;
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border p-3", toneMap[tone])}>
      <span className="grid h-10 w-10 place-items-center rounded-md bg-background/60">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-2xl font-bold leading-none tabular-nums text-foreground">
          {count}
        </div>
        <div className="mt-1 text-xs font-medium">{label}</div>
      </div>
    </div>
  );
}

function KpiRow({
  kpi,
  selected,
  readOnly,
  onSelect,
  onToggleAlert,
  onSetThreshold,
}: {
  kpi: Kpi;
  selected: boolean;
  readOnly: boolean;
  onSelect: () => void;
  onToggleAlert: () => void;
  onSetThreshold: () => void;
}) {
  const frac = progressFraction(kpi);
  const below = kpi.status === "below";
  const history = historyByKpi[kpi.id] ?? [];

  return (
    <li
      className={cn(
        "px-4 py-3.5 transition-colors",
        selected ? "bg-accent/60" : "hover:bg-accent/30",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          onClick={onSelect}
          className="group flex min-w-0 items-center gap-2 text-left"
          aria-pressed={selected}
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              selected && "rotate-90 text-primary",
            )}
          />
          <span className="truncate text-sm font-semibold">{kpi.name}</span>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              riskClasses(kpi.risk),
            )}
          >
            {kpi.risk} risk
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              below
                ? "bg-destructive/15 text-destructive border-destructive/30"
                : "bg-success/15 text-success border-success/30",
            )}
          >
            {below ? "Below threshold" : "Normal"}
          </span>

          {/* History popover (KP-4) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Threshold history">
                <History className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <div className="text-sm font-semibold">Threshold history</div>
              {history.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">No changes recorded.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {history.map((h, i) => (
                    <li key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{h.date}</span>
                      <span className="font-mono tabular-nums">
                        {h.from}
                        {kpi.unit} → {h.to}
                        {kpi.unit}
                      </span>
                      <span className="text-muted-foreground">{h.changedBy}</span>
                    </li>
                  ))}
                </ul>
              )}
            </PopoverContent>
          </Popover>

          {/* Alert toggle (KP-7) */}
          <button
            onClick={onToggleAlert}
            disabled={readOnly}
            aria-label={kpi.alertEnabled ? "Disable alert" : "Enable alert"}
            aria-pressed={kpi.alertEnabled}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-md transition-colors",
              kpi.alertEnabled
                ? "text-primary hover:bg-primary/10"
                : "text-muted-foreground hover:bg-accent",
              readOnly && "cursor-not-allowed opacity-50",
            )}
          >
            {kpi.alertEnabled ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Values */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-6 gap-y-1 pl-6 text-xs text-muted-foreground">
        <span>
          Target:{" "}
          <span className="font-mono tabular-nums text-foreground">
            {kpi.target}
            {kpi.unit}
          </span>
        </span>
        <span>
          Actual:{" "}
          <span
            className={cn(
              "font-mono tabular-nums",
              below ? "text-destructive" : "text-foreground",
            )}
          >
            {kpi.actual}
            {kpi.unit}
          </span>
        </span>
        <span>
          Threshold:{" "}
          <span className="font-mono tabular-nums text-foreground">
            {kpi.threshold}
            {kpi.unit}
          </span>
        </span>
        <button
          onClick={onSetThreshold}
          disabled={readOnly}
          className={cn(
            "font-medium text-primary hover:underline",
            readOnly && "cursor-not-allowed opacity-50 no-underline",
          )}
        >
          Set threshold
        </button>
      </div>

      {/* Progress bar (KP-3) */}
      <div className="mt-2 pl-6">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(frac * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${kpi.name} progress`}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all",
              below ? "bg-destructive" : "bg-success",
            )}
            style={{ width: `${Math.max(4, frac * 100)}%` }}
          />
        </div>
      </div>
    </li>
  );
}

function AddKpiDialog({
  open,
  onOpenChange,
  client,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  client: string;
  onAdd: (input: {
    name: string;
    target: number;
    threshold: number;
    unit: string;
    lowerIsBetter: boolean;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [threshold, setThreshold] = useState("");
  const [unit, setUnit] = useState("%");
  const [lowerIsBetter, setLowerIsBetter] = useState(false);

  const valid = name.trim() && target !== "" && threshold !== "";

  function submit() {
    if (!valid) return;
    onAdd({
      name: name.trim(),
      target: Number(target),
      threshold: Number(threshold),
      unit,
      lowerIsBetter,
    });
    setName("");
    setTarget("");
    setThreshold("");
    setUnit("%");
    setLowerIsBetter(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add KPI</DialogTitle>
          <DialogDescription>Create a new KPI target for {client}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="kpi-name">KPI name</Label>
            <Input
              id="kpi-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Renewal rate"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="kpi-target">Target</Label>
              <Input
                id="kpi-target"
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="98"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kpi-threshold">Threshold</Label>
              <Input
                id="kpi-threshold"
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="95"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="kpi-unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="kpi-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="%">Percent (%)</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="hrs">Hours</SelectItem>
                  <SelectItem value="pts">Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end justify-between rounded-md border border-border px-3 py-2">
              <div>
                <Label htmlFor="kpi-lower" className="cursor-pointer">
                  Lower is better
                </Label>
                <p className="text-[11px] text-muted-foreground">e.g. time metrics</p>
              </div>
              <Switch id="kpi-lower" checked={lowerIsBetter} onCheckedChange={setLowerIsBetter} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid}>
            Add KPI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ThresholdDialog({
  kpi,
  onOpenChange,
  onSave,
}: {
  kpi: Kpi | null;
  onOpenChange: (o: boolean) => void;
  onSave: (id: string, next: number) => void;
}) {
  const [value, setValue] = useState("");

  // Sync when a KPI is selected
  const open = kpi !== null;
  const currentId = kpi?.id;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o && kpi) setValue(String(kpi.threshold));
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Set threshold</DialogTitle>
          <DialogDescription>
            {kpi ? `Adjust the alert threshold for ${kpi.name}.` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="threshold-value">
            Threshold {kpi ? `(${kpi.unit})` : ""}
          </Label>
          <Input
            id="threshold-value"
            type="number"
            value={value === "" && kpi ? String(kpi.threshold) : value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (currentId) onSave(currentId, Number(value === "" && kpi ? kpi.threshold : value));
            }}
          >
            Save threshold
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KpiListSkeleton() {
  return (
    <ul className="divide-y divide-border">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="space-y-2.5 px-4 py-3.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-2 w-full rounded-full" />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ onAdd, readOnly }: { onAdd: () => void; readOnly: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
        <ShieldAlert className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold">No KPIs configured</p>
        <p className="mt-1 text-sm text-muted-foreground">Add one to start tracking targets.</p>
      </div>
      <Button size="sm" className="gap-1.5" onClick={onAdd} disabled={readOnly}>
        <Plus className="h-4 w-4" />
        Add KPI
      </Button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <div>
        <p className="text-sm font-semibold">Couldn&apos;t load KPIs</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Something went wrong while fetching data.
        </p>
      </div>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}
