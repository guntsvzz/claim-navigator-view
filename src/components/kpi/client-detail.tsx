import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  Bell,
  BellOff,
  ChevronRight,
  Download,
  History,
  Info,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  computeSla,
  fmt,
  healthFromPct,
  healthLabel,
  healthPillClasses,
  riskFromHealth,
  round1,
  summarizeClient,
  type Client,
  type Risk,
  type SlaComputed,
  type SlaId,
} from "@/lib/sla-data";
// import { getSlaView } from "@/lib/sla-claims";

/* ============================================================================
 * ClientDetail — BVTPA "Claim Analysis Performance" report layout
 * ========================================================================== */

export function ClientDetail({
  client,
  clients,
  readOnly,
  onBack,
  onSelectClient,
  onSetThreshold,
  onToggleAllAlerts,
}: {
  client: Client;
  clients: Client[];
  readOnly: boolean;
  onBack: () => void;
  onSelectClient: (id: string) => void;
  onSetThreshold: (clientId: string, slaId: SlaId, next: number) => void;
  onToggleAllAlerts: (clientId: string, enable: boolean) => void;
}) {
  const summary = useMemo(() => summarizeClient(client), [client]);
  const contracted = summary.contracted;

  // Master alert state: how many SLAs have alerts enabled
  const enabledCount = contracted.filter((c) => client.data[c.slaId]?.alertEnabled).length;
  const allEnabled = enabledCount === contracted.length;
  const noneEnabled = enabledCount === 0;

  const [selectedSla, setSelectedSla] = useState<SlaId>(
    () => (contracted[0]?.slaId ?? "faxClaim") as SlaId,
  );
  const sla = contracted.find((c) => c.slaId === selectedSla) ?? contracted[0];

  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [monthMode, setMonthMode] = useState<"byMonth" | "byCaseType">("byMonth");
  // For "by Case Type" mode — which month to show (default = latest month with data)
  const [caseTypeMonth, setCaseTypeMonth] = useState<string>("Dec");

  if (!sla) return <EmptyDetail clientName={client.name} onBack={onBack} />;

  const data = client.data[sla.slaId]!;
  const unit = sla.target.unit;
  const targetPct = sla.target.passTargetPct;

  // Forecast
  const futures = data.forecast.filter((f) => f.month.startsWith("+"));
  const forecastEnd = futures.length ? futures[futures.length - 1].forecast ?? sla.passPct : sla.passPct;
  const forecastHealth = healthFromPct(forecastEnd, targetPct);
  const forecastRisk = riskFromHealth(forecastHealth);

  // Monthly chart — "by Month" mode: all 12 months stacked
  const byMonthData = useMemo(() => {
    const rows = data.monthly.map((m) => ({
      month: m.month,
      pass: m.pass,
      notPass: m.notPass,
      passPct: m.passPct,
      total: m.pass + m.notPass,
      target: targetPct,
      forecast: null as number | null,
      band: undefined as [number, number] | undefined,
    }));
    if (rows.length) {
      const last = rows[rows.length - 1];
      last.forecast = last.passPct;
      last.band = [last.passPct, last.passPct];
    }
    futures.forEach((f) => {
      rows.push({
        month: f.month,
        pass: 0,
        notPass: 0,
        passPct: null as unknown as number,
        total: 0,
        target: targetPct,
        forecast: f.forecast,
        band: f.band,
      });
    });
    return rows;
  }, [data.monthly, futures, targetPct]);

  // Monthly chart — "by Case Type" mode: 2 bars for the selected month
  const byCaseTypeData = useMemo(() => {
    const m = data.monthly.find((x) => x.month === caseTypeMonth) ?? data.monthly[0];
    if (!m) return [];
    const cTotal = m.complicate;
    const ncTotal = m.nonComplicate;
    const cPass = Math.round(m.pass * (cTotal / (cTotal + ncTotal || 1)));
    const ncPass = m.pass - cPass;
    return [
      {
        name: "Complicate",
        pass: cPass,
        notPass: cTotal - cPass,
        passPct: cTotal ? round1((cPass / cTotal) * 100) : 0,
        total: cTotal,
      },
      {
        name: "Non-Complicate",
        pass: ncPass,
        notPass: ncTotal - ncPass,
        passPct: ncTotal ? round1((ncPass / ncTotal) * 100) : 0,
        total: ncTotal,
      },
    ];
  }, [data.monthly, caseTypeMonth]);

  // Donut data — uses donutTotal (= total − backlog), not total
  const donutData = [
    { name: "Complicate",     value: sla.complicate    },
    { name: "Non-Complicate", value: sla.nonComplicate },
  ];

  return (
    <div className="space-y-2">
      {/* Breadcrumb + back + client switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={onBack}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground hover:underline">
              All clients
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold">{client.name}</span>
          </nav>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Switch client</span>
          <Select value={client.id} onValueChange={onSelectClient}>
            <SelectTrigger className="h-7 w-[180px] text-xs" aria-label="Switch client">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Master alert toggle */}
      <div className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors",
        allEnabled ? "border-primary/40 bg-primary/5" : "border-border bg-card",
      )}>
        <div className="flex items-center gap-2.5">
          <span className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-md",
            allEnabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}>
            {allEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </span>
          <div>
            <div className="text-sm font-semibold leading-tight">
              Alerts for {client.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {noneEnabled
                ? "All alerts disabled — no notifications will fire"
                : allEnabled
                  ? `All ${contracted.length} SLA alerts enabled`
                  : `${enabledCount} of ${contracted.length} SLA alerts enabled`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!noneEnabled && !allEnabled && (
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
              Partial
            </span>
          )}
          <Button
            variant={allEnabled ? "default" : "outline"}
            size="sm"
            className="h-7 gap-1.5 text-xs"
            disabled={readOnly}
            onClick={() => onToggleAllAlerts(client.id, !allEnabled)}
            aria-pressed={allEnabled}
          >
            {allEnabled ? (
              <><BellOff className="h-3.5 w-3.5" /> Disable all</>
            ) : (
              <><Bell className="h-3.5 w-3.5" /> Enable all</>
            )}
          </Button>
        </div>
      </div>

      {/* SLA selector tabs */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Select SLA">
        {contracted.map((c) => {
          const active = c.slaId === sla.slaId;
          return (
            <button
              key={c.slaId}
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedSla(c.slaId)}
              className={cn(
                "flex flex-col items-start rounded-md border px-3 py-1.5 text-left transition-colors",
                active
                  ? "border-[#1a3a6b] bg-[#1a3a6b] text-white shadow-sm"
                  : "border-border bg-card hover:bg-accent/50",
              )}
            >
              <span className="text-xs font-semibold">{c.def.name}</span>
              <span className={cn("text-[10px]", active ? "text-white/75" : "text-muted-foreground")}>
                Target &lt; {c.target.target} {c.target.unit}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---- Report body ---- */}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">

          {/* A) FOUR SOLID SUMMARY TILES */}
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <SolidTile
              color="#2563EB"
              label="No. of Claim"
              value={fmt(sla.total)}
              sub="total in range"
            />
            <SolidTile
              color="#16a34a"
              label="Pass"
              value={fmt(sla.pass)}
              sub={`${sla.passPct}% of claims`}
            />
            <SolidTile
              color="#dc2626"
              label="Not Pass"
              value={fmt(sla.notPass)}
              sub={`${round1(100 - sla.passPct)}% of claims`}
            />
            <SolidTile
              color="#92400e"
              label="Backlog · ย้อนหลัง"
              value={fmt(sla.backlog)}
              sub="awaiting closure"
            />
          </div>

          {/* B) Portion of Case donut + C) Period SLA table */}
          <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">

            {/* B) Portion of Case */}
            <div className="overflow-hidden rounded-lg border border-border">
              <SectionBar title="Portion of Case" />
              <div className="p-4">
                <div className="relative">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={2}
                        strokeWidth={0}
                        label={({ cx, cy, midAngle, outerRadius: or, name, value }) => {
                          const RADIAN = Math.PI / 180;
                          const rx = cx + (or + 18) * Math.cos(-midAngle * RADIAN);
                          const ry = cy + (or + 18) * Math.sin(-midAngle * RADIAN);
                          const pct = sla.donutTotal > 0 ? round1((value / sla.donutTotal) * 100) : 0;
                          return (
                            <text x={rx} y={ry} textAnchor={rx > cx ? "start" : "end"} dominantBaseline="central" fontSize={10} fill="currentColor">
                              {`${fmt(value)} (${pct}%)`}
                            </text>
                          );
                        }}
                        labelLine
                      >
                        <Cell fill="#f97316" />
                        <Cell fill="#3b82f6" />
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v: number, n: string) => [
                          `${fmt(v)} (${sla.donutTotal > 0 ? round1((v / sla.donutTotal) * 100) : 0}%)`,
                          n,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold tabular-nums">{fmt(sla.donutTotal)}</div>
                    <div className="text-[10px] text-muted-foreground">total cases</div>
                  </div>
                </div>
                <div className="mt-2 space-y-1.5">
                <LegendRow color="#f97316" label="Complicate"     value={sla.complicate}    total={sla.donutTotal} />
                <LegendRow color="#3b82f6" label="Non-Complicate" value={sla.nonComplicate} total={sla.donutTotal} />
                </div>
                <p className="mt-3 text-[10px] text-muted-foreground">
                  Total = No. of Claim ({fmt(sla.total)}) − Backlog ({fmt(sla.backlog)}) = {fmt(sla.donutTotal)}
                </p>
              </div>
            </div>

            {/* C) Period SLA table */}
            <div className="overflow-hidden rounded-lg border border-border">
              <SectionBar title={`Period SLA  ·  Target < ${sla.target.target} ${unit}`} />
              <PeriodTable sla={sla} />
            </div>
          </div>

          {/* D) No. of Claim by Month */}
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-center justify-between bg-[#374151] px-4 py-2.5">
              <span className="text-sm font-semibold text-white">No. of Claim by Month</span>
              <div className="inline-flex rounded-md bg-white/10 p-0.5 text-xs">
                {(["byMonth", "byCaseType"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setMonthMode(k)}
                    className={cn(
                      "rounded-[4px] px-2.5 py-1 font-medium transition-colors",
                      monthMode === k
                        ? "bg-white text-[#374151] shadow-sm"
                        : "text-white/80 hover:text-white",
                    )}
                  >
                    {k === "byMonth" ? "by Month" : "by Case Type"}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              {monthMode === "byMonth" ? (
                <ByMonthChart data={byMonthData} targetPct={targetPct} />
              ) : (
                <ByCaseTypeChart
                  data={byCaseTypeData}
                  months={data.monthly.map((m) => m.month)}
                  selectedMonth={caseTypeMonth}
                  onMonthChange={setCaseTypeMonth}
                  targetPct={targetPct}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <Panel title={sla.def.name} subtitle="Status vs this client's target">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold tabular-nums">{sla.passPct}%</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Pass% · target {targetPct}%
                </div>
              </div>
              <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", healthPillClasses(sla.health))}>
                {healthLabel(sla.health)}
              </span>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  {forecastEnd >= sla.passPct ? (
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-warning" />
                  )}
                  Forecast to period end
                </span>
                <RiskBadge risk={forecastRisk} />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums">{round1(forecastEnd)}%</span>
                <span className="text-xs text-muted-foreground">projected Pass%</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {forecastHealth === "belowTarget"
                  ? `Predicted to finish below the ${targetPct}% target.`
                  : forecastHealth === "atRisk"
                    ? `Projected to land within a thin margin of target.`
                    : `On track to stay above the ${targetPct}% target.`}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div>
                  <div className="text-xs text-muted-foreground">SLA threshold</div>
                  <div className="font-mono text-sm font-semibold tabular-nums">
                    &lt; {sla.target.target} {unit}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Threshold change history">
                        <History className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72">
                      <div className="text-sm font-semibold">Threshold change history</div>
                      {data.history.length === 0 ? (
                        <p className="mt-2 text-xs text-muted-foreground">No changes recorded.</p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {data.history.map((h, i) => (
                            <li key={i} className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-muted-foreground">{h.date}</span>
                              <span className="font-mono tabular-nums">{h.from}{unit} → {h.to}{unit}</span>
                              <span className="text-muted-foreground">{h.changedBy}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={readOnly}
                    onClick={() => setThresholdOpen(true)}
                  >
                    Set threshold
                  </Button>
                </div>
              </div>


            </div>


          </Panel>

          <Panel
            title="Recent alerts"
            subtitle={`${data.alerts.length} event${data.alerts.length === 1 ? "" : "s"}`}
            bodyClassName="p-0"
            actions={
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAlertsOpen(true)}>
                View all
              </Button>
            }
          >
            {data.alerts.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No alerts fired.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.alerts.slice(0, 4).map((a) => (
                  <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", a.severity === "critical" ? "bg-destructive" : "bg-warning")} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm leading-snug">{a.text}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{a.recipient} · {a.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Button variant="outline" className="w-full gap-2" onClick={() => exportCsv(client, sla)}>
            <Download className="h-4 w-4" />
            Export report (CSV)
          </Button>
        </div>
      </div>

      <ThresholdDialog
        open={thresholdOpen}
        onOpenChange={setThresholdOpen}
        sla={sla}
        onSave={(next) => { onSetThreshold(client.id, sla.slaId, next); setThresholdOpen(false); }}
      />
      <AlertsDialog open={alertsOpen} onOpenChange={setAlertsOpen} client={client} sla={sla} />
    </div>
  );
}

/* ============================================================================
 * A) Solid-color summary tile
 * ========================================================================== */

function SolidTile({ color, label, value, sub }: { color: string; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg p-4 text-white" style={{ backgroundColor: color }}>
      <div className="text-xs font-semibold uppercase tracking-wider opacity-85">{label}</div>
      <div className="mt-1.5 text-3xl font-bold tabular-nums leading-none">{value}</div>
      <div className="mt-1.5 text-[11px] opacity-80">{sub}</div>
    </div>
  );
}

/* ============================================================================
 * Section bar (navy)
 * ========================================================================== */

function SectionBar({ title }: { title: string }) {
  return (
    <div className="bg-[#1e3a5f] px-4 py-2.5">
      <span className="text-sm font-semibold text-white">{title}</span>
    </div>
  );
}

/* ============================================================================
 * C) Period SLA table
 * ========================================================================== */

function PeriodTable({ sla }: { sla: SlaComputed }) {
  // Derive totals from claims
  const totalComp = sla.complicate;
  const totalNon  = sla.nonComplicate;
  const grand     = sla.donutTotal;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-xs">
        <thead>
          <tr className="bg-[#1e3a5f] text-white">
            <th rowSpan={2} className="px-3 py-2 text-left font-semibold">
              Period ({sla.target.unit})
            </th>
            <th colSpan={2} className="border-l border-white/20 px-3 py-1.5 text-center font-semibold">Complicate</th>
            <th colSpan={2} className="border-l border-white/20 px-3 py-1.5 text-center font-semibold">Non-Complicate</th>
            <th colSpan={2} className="border-l border-white/20 px-3 py-1.5 text-center font-semibold">Grand Total</th>
          </tr>
          <tr className="bg-[#1e3a5f]/85 text-white text-[10px]">
            <SubTh>No. of Claim</SubTh>
            <SubTh>Portion %</SubTh>
            <SubTh border>No. of Claim</SubTh>
            <SubTh>Portion %</SubTh>
            <SubTh border>No. of Claim</SubTh>
            <SubTh>Portion %</SubTh>
          </tr>
        </thead>
        <tbody>
          {sla.bucketsRef.map((b) => {
            const isPass = b.upper <= sla.target.target;
            const rowTotal = b.complicate + b.nonComplicate;
            const complicatePct  = totalComp > 0 ? round1((b.complicate    / totalComp) * 100) : 0;
            const nonComplicatePct = totalNon > 0 ? round1((b.nonComplicate / totalNon)  * 100) : 0;
            const totalPct       = grand     > 0 ? round1((rowTotal        / grand)     * 100) : 0;
            return (
              <tr key={b.label} className={cn("border-b border-border", isPass ? "bg-green-50/60 dark:bg-green-950/20" : "bg-red-50/40 dark:bg-red-950/10")}>
                <td className="px-3 py-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", isPass ? "bg-green-600" : "bg-red-500")} />
                    {b.label}
                  </span>
                </td>
                <Td>{fmt(b.complicate)}</Td>
                <Td muted>{complicatePct}%</Td>
                <Td border>{fmt(b.nonComplicate)}</Td>
                <Td muted>{nonComplicatePct}%</Td>
                <Td border>{fmt(rowTotal)}</Td>
                <Td muted>{totalPct}%</Td>
              </tr>
            );
          })}
          <tr className="border-t-2 border-[#1e3a5f]/40 bg-muted/50 font-semibold">
            <td className="px-3 py-2 text-xs font-bold">Grand Total</td>
            <Td>{fmt(totalComp)}</Td>
            <Td>100%</Td>
            <Td border>{fmt(totalNon)}</Td>
            <Td>100%</Td>
            <Td border>{fmt(grand)}</Td>
            <Td>100%</Td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================================
 * D-1) "by Month" chart — 12 stacked bars with data labels + Pass% line
 * ========================================================================== */

type ByMonthRow = {
  month: string;
  pass: number;
  notPass: number;
  passPct: number | null;
  total: number;
  target: number;
  forecast: number | null;
  band?: [number, number];
};

function ByMonthChart({ data, targetPct }: { data: ByMonthRow[]; targetPct: number }) {
  const realMonths = data.filter((d) => !d.month.startsWith("+"));

  return (
    <>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ left: -8, right: 8, top: 24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis
            yAxisId="left"
            stroke="var(--color-muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            stroke="var(--color-muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <ReferenceLine
            yAxisId="right"
            y={targetPct}
            stroke="#3b82f6"
            strokeDasharray="6 4"
            label={{ value: `Target ${targetPct}%`, fill: "#3b82f6", fontSize: 10, position: "insideTopRight" }}
          />
          <Bar yAxisId="left" dataKey="pass" name="Pass" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]}>
            <LabelList dataKey="pass" position="inside" style={{ fill: "#fff", fontSize: 9, fontWeight: 600 }} formatter={(v: number) => (v > 0 ? fmt(v) : "")} />
          </Bar>
          <Bar yAxisId="left" dataKey="notPass" name="Not Pass" stackId="a" fill="#dc2626" radius={[3, 3, 0, 0]}>
            <LabelList dataKey="notPass" position="inside" style={{ fill: "#fff", fontSize: 9, fontWeight: 600 }} formatter={(v: number) => (v > 0 ? fmt(v) : "")} />
          </Bar>
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="band"
            name="Forecast band"
            stroke="none"
            fill="#f59e0b"
            fillOpacity={0.15}
            connectNulls
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="passPct"
            name="Pass%"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ r: 2.5 }}
            connectNulls
          >
            <LabelList dataKey="passPct" position="top" style={{ fill: "#3b82f6", fontSize: 9, fontWeight: 600 }} formatter={(v: number | null) => (v != null ? `${v}%` : "")} />
          </Line>
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="forecast"
            name="Forecast"
            stroke="#f59e0b"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            dot={{ r: 2.5 }}
            connectNulls
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Total row — monthly totals */}
      <div className="mt-3 overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[700px] text-xs">
          <tbody>
            <tr className="bg-muted/50">
              <td className="px-3 py-1.5 font-semibold text-muted-foreground">Total</td>
              {realMonths.map((d) => (
                <td key={d.month} className="px-2 py-1.5 text-center font-mono tabular-nums font-semibold">
                  {fmt(d.total)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ============================================================================
 * D-2) "by Case Type" chart — 2 stacked bars (Complicate, Non-Complicate) 
 *      for a single selected month, with Pass% line (no target/forecast lines)
 * ========================================================================== */

type CaseTypeRow = { name: string; pass: number; notPass: number; passPct: number; total: number };

function ByCaseTypeChart({
  data,
  months,
  selectedMonth,
  onMonthChange,
  targetPct,
}: {
  data: CaseTypeRow[];
  months: string[];
  selectedMonth: string;
  onMonthChange: (m: string) => void;
  targetPct: number;
}) {
  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Month:</span>
        <Select value={selectedMonth} onValueChange={onMonthChange}>
          <SelectTrigger className="h-7 w-[110px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ left: -8, right: 8, top: 24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            yAxisId="left"
            stroke="var(--color-muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            label={{ value: "No. of Claim", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fontSize: 10, fill: "var(--color-muted-foreground)" } }}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            stroke="var(--color-muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            label={{ value: "% Pass", angle: 90, position: "insideRight", style: { textAnchor: "middle", fontSize: 10, fill: "var(--color-muted-foreground)" } }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip contentStyle={tooltipStyle} />
          {/* Stacked Pass (green, bottom) + Not Pass (red, top) */}
          <Bar yAxisId="left" dataKey="pass" name="Pass" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]}>
            <LabelList dataKey="pass" position="inside" style={{ fill: "#fff", fontSize: 11, fontWeight: 600 }} formatter={(v: number) => (v > 0 ? fmt(v) : "")} />
          </Bar>
          <Bar yAxisId="left" dataKey="notPass" name="Not Pass" stackId="a" fill="#dc2626" radius={[3, 3, 0, 0]}>
            <LabelList dataKey="notPass" position="inside" style={{ fill: "#fff", fontSize: 11, fontWeight: 600 }} formatter={(v: number) => (v > 0 ? fmt(v) : "")} />
          </Bar>
          {/* Pass% line with markers and labels */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="passPct"
            name="Pass%"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#3b82f6" }}
            connectNulls
          >
            <LabelList dataKey="passPct" position="top" style={{ fill: "#3b82f6", fontSize: 11, fontWeight: 700 }} formatter={(v: number) => `${v}%`} />
          </Line>
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Total row — by case type totals for selected month */}
      <div className="mt-3 rounded-md border border-border overflow-x-auto">
        <table className="w-full text-xs">
          <tbody>
            <tr className="bg-muted/50">
              <td className="px-3 py-1.5 font-semibold text-muted-foreground">Total</td>
              {data.map((d) => (
                <td key={d.name} className="px-4 py-1.5 text-center font-mono tabular-nums font-semibold">
                  {fmt(d.total)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ============================================================================
 * Dialogs
 * ========================================================================== */

function ThresholdDialog({ open, onOpenChange, sla, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void; sla: SlaComputed; onSave: (next: number) => void;
}) {
  const [value, setValue] = useState(String(sla.target.target));
  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) setValue(String(sla.target.target)); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Set threshold · {sla.def.name}</DialogTitle>
          <DialogDescription>Adjust the target boundary. Pass / Not Pass and status recompute against this value.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="th-value">Target ({sla.target.unit})</Label>
          <Input id="th-value" type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Info className="h-3 w-3" />
            Default from contract: &lt; {sla.target.target} {sla.target.unit}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(Number(value) || sla.target.target)}>Save threshold</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AlertsDialog({ open, onOpenChange, client, sla }: {
  open: boolean; onOpenChange: (o: boolean) => void; client: Client; sla: SlaComputed;
}) {
  const data = client.data[sla.slaId]!;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Alert history · {sla.def.name}</DialogTitle>
          <DialogDescription>{client.name} — all alert events for this SLA in the selected range.</DialogDescription>
        </DialogHeader>
        <ul className="max-h-[360px] divide-y divide-border overflow-y-auto">
          {data.alerts.map((a) => (
            <li key={a.id} className="flex items-start gap-3 py-3">
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", a.severity === "critical" ? "bg-destructive" : "bg-warning")} aria-hidden />
              <div className="min-w-0">
                <p className="text-sm leading-snug">{a.text}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.severity === "critical" ? "Critical" : "Warning"} · {a.recipient} · {a.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================================
 * Small reusable pieces
 * ========================================================================== */

function RiskBadge({ risk }: { risk: Risk }) {
  const map: Record<Risk, string> = {
    High:   "bg-destructive/15 text-destructive border-destructive/30",
    Medium: "bg-warning/15 text-warning border-warning/30",
    Low:    "bg-success/15 text-success border-success/30",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", map[risk])}>
      {risk} risk
    </span>
  );
}

function StripCount({ tone, label, count }: { tone: "success" | "warning" | "destructive"; label: string; count: number }) {
  const toneMap = {
    success:     "border-success/30 bg-success/10 text-success",
    warning:     "border-warning/30 bg-warning/10 text-warning",
    destructive: "border-destructive/30 bg-destructive/10 text-destructive",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium", toneMap[tone])}>
      <span className="text-sm font-bold tabular-nums">{count}</span>
      {label}
    </span>
  );
}

function LegendRow({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-mono tabular-nums text-muted-foreground">
        {fmt(value)} · {total > 0 ? round1((value / total) * 100) : 0}%
      </span>
    </div>
  );
}

function SubTh({ children, border }: { children: React.ReactNode; border?: boolean }) {
  return (
    <th className={cn("px-3 py-1 text-right font-medium", border && "border-l border-white/20")}>
      {children}
    </th>
  );
}

function Td({ children, muted, border }: { children: React.ReactNode; muted?: boolean; border?: boolean }) {
  return (
    <td className={cn("px-3 py-1.5 text-right font-mono tabular-nums", muted && "text-muted-foreground", border && "border-l border-border")}>
      {children}
    </td>
  );
}

function EmptyDetail({ clientName, onBack }: { clientName: string; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to all clients
      </Button>
      <Panel title={clientName} subtitle="SLA report">
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Info className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-semibold">No SLA data for this client / range</p>
          <p className="text-sm text-muted-foreground">This client has no contracted SLAs with data in the selected range.</p>
        </div>
      </Panel>
    </div>
  );
}

/* ============================================================================
 * Utils
 * ========================================================================== */

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
} as const;

function pct(n: number, total: number) {
  if (!total) return "0%";
  return `${round1((n / total) * 100)}%`;
}

function exportCsv(client: Client, sla: SlaComputed) {
  const rows: string[] = [];
  rows.push(`Client,${client.name}`);
  rows.push(`SLA,${sla.def.name}`);
  rows.push(`Target,< ${sla.target.target} ${sla.target.unit}`);
  rows.push(`Pass Target %,${sla.target.passTargetPct}`);
  rows.push("");
  rows.push("Metric,Value");
  rows.push(`No. of Claim,${sla.total}`);
  rows.push(`Pass,${sla.pass}`);
  rows.push(`Not Pass,${sla.notPass}`);
  rows.push(`Pass %,${sla.passPct}`);
  rows.push(`Backlog,${sla.backlog}`);
  rows.push(`Donut Total,${sla.donutTotal}`);
  rows.push(`Complicate,${sla.complicate}`);
  rows.push(`Non-Complicate,${sla.nonComplicate}`);
  rows.push("");
  rows.push("Period,Complicate,Non-Complicate,Grand Total");
  sla.bucketsRef.forEach((b) => {
    rows.push(`${b.label},${b.complicate},${b.nonComplicate},${b.complicate + b.nonComplicate}`);
  });
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${client.id}-${sla.slaId}-sla-report.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
