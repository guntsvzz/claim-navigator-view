import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
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
  Sliders,
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

export function ClientDetail({
  client,
  clients,
  readOnly,
  onBack,
  onSelectClient,
  onSetThreshold,
  onToggleAlert,
}: {
  client: Client;
  clients: Client[];
  readOnly: boolean;
  onBack: () => void;
  onSelectClient: (id: string) => void;
  onSetThreshold: (clientId: string, slaId: SlaId, next: number) => void;
  onToggleAlert: (clientId: string, slaId: SlaId) => void;
}) {
  const summary = useMemo(() => summarizeClient(client), [client]);
  const contracted = summary.contracted;

  const [selectedSla, setSelectedSla] = useState<SlaId>(
    () => (contracted[0]?.slaId ?? "faxClaim") as SlaId,
  );
  // ensure selection is valid for this client
  const sla = contracted.find((c) => c.slaId === selectedSla) ?? contracted[0];

  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [monthMode, setMonthMode] = useState<"passfail" | "casetype">("passfail");

  if (!sla) {
    return (
      <EmptyDetail clientName={client.name} onBack={onBack} />
    );
  }

  const data = client.data[sla.slaId]!;
  const unit = sla.target.unit;
  const targetPct = sla.target.passTargetPct;

  // Forecast + risk
  const futures = data.forecast.filter((f) => f.month.startsWith("+"));
  const forecastEnd = futures.length ? futures[futures.length - 1].forecast ?? sla.passPct : sla.passPct;
  const forecastHealth = healthFromPct(forecastEnd, targetPct);
  const forecastRisk = riskFromHealth(forecastHealth);

  // Monthly chart data (bars + pass% line + forecast band)
  const chartData = useMemo(() => {
    const rows = data.monthly.map((m) => ({
      month: m.month,
      pass: m.pass,
      notPass: m.notPass,
      complicate: m.complicate,
      nonComplicate: m.nonComplicate,
      passPct: m.passPct,
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
        complicate: 0,
        nonComplicate: 0,
        passPct: null as unknown as number,
        target: targetPct,
        forecast: f.forecast,
        band: f.band,
      });
    });
    return rows;
  }, [data.monthly, futures, targetPct]);

  const donutData = [
    { name: "Complicate", value: sla.complicate, key: "complicate" },
    { name: "Non-Complicate", value: sla.nonComplicate, key: "noncomplicate" },
  ];

  return (
    <div className="space-y-4">
      {/* Breadcrumb + back + client switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground hover:underline">
              All clients
            </button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{client.name}</span>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Switch client</span>
          <Select value={client.id} onValueChange={onSelectClient}>
            <SelectTrigger className="h-8 w-[200px]" aria-label="Switch client">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SLA health strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <span className="mr-1 text-xs font-medium text-muted-foreground">This client&apos;s SLAs:</span>
        <StripCount tone="success" label="On target" count={summary.onTarget} />
        <StripCount tone="warning" label="At risk" count={summary.atRisk} />
        <StripCount tone="destructive" label="Below target" count={summary.belowTarget} />
        <span className="ml-auto text-xs text-muted-foreground">
          {contracted.length} contracted SLA{contracted.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* SLA selector tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Select SLA">
        {contracted.map((c) => {
          const active = c.slaId === sla.slaId;
          return (
            <button
              key={c.slaId}
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedSla(c.slaId)}
              className={cn(
                "flex flex-col items-start rounded-lg border px-3.5 py-2 text-left transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card hover:bg-accent/50",
              )}
            >
              <span className="text-sm font-semibold">{c.def.name}</span>
              <span className={cn("text-[11px]", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                Target &lt; {c.target.target} {c.target.unit}
              </span>
            </button>
          );
        })}
      </div>

      {/* Body: report (left) + config/alert rail (right) */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {/* 1) Summary tiles */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile tone="info" label="No. of Claim" value={fmt(sla.total)} sub="total in range" />
            <Tile
              tone="success"
              label="Pass"
              value={fmt(sla.pass)}
              sub={`${sla.passPct}% of claims`}
            />
            <Tile
              tone="destructive"
              label="Not Pass"
              value={fmt(sla.notPass)}
              sub={`${round1(100 - sla.passPct)}% of claims`}
            />
            <Tile tone="warning" label="Backlog · ย้อนหลัง" value={fmt(sla.backlog)} sub="awaiting closure" />
          </div>

          {/* 2 + 3) Donut + Period table */}
          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <Panel title="Portion of Case" subtitle="Complicate vs Non-Complicate">
              <div className="relative">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={82}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      <Cell fill="var(--color-warning)" />
                      <Cell fill="var(--color-info)" />
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number, n: string) => [`${fmt(v)} (${round1((v / sla.total) * 100)}%)`, n]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold tabular-nums">{fmt(sla.total)}</div>
                  <div className="text-[11px] text-muted-foreground">total cases</div>
                </div>
              </div>
              <div className="mt-2 space-y-1.5">
                <LegendRow color="var(--color-warning)" label="Complicate" value={sla.complicate} total={sla.total} />
                <LegendRow color="var(--color-info)" label="Non-Complicate" value={sla.nonComplicate} total={sla.total} />
              </div>
            </Panel>

            <Panel title="Period SLA" subtitle={`Time buckets vs target < ${sla.target.target} ${unit}`} bodyClassName="p-0">
              <PeriodTable sla={sla} />
            </Panel>
          </div>

          {/* 4) Monthly chart */}
          <Panel
            title="No. of Claim by Month"
            subtitle={
              monthMode === "passfail"
                ? "Pass / Not Pass with Pass% and forecast"
                : "Complicate / Non-Complicate by month"
            }
            actions={
              <div className="inline-flex rounded-md bg-muted p-0.5 text-xs">
                {([
                  { k: "passfail", label: "Pass / Not Pass" },
                  { k: "casetype", label: "By Case Type" },
                ] as const).map(({ k, label }) => (
                  <button
                    key={k}
                    onClick={() => setMonthMode(k)}
                    className={cn(
                      "rounded-[5px] px-2.5 py-1 font-medium transition-colors",
                      monthMode === k
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ left: -12, right: 4, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine
                  yAxisId="right"
                  y={targetPct}
                  stroke="var(--color-primary)"
                  strokeDasharray="5 4"
                  label={{
                    value: `Target ${targetPct}%`,
                    fill: "var(--color-primary)",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
                {monthMode === "passfail" ? (
                  <>
                    <Bar yAxisId="left" dataKey="pass" name="Pass" stackId="a" fill="var(--color-success)" radius={[0, 0, 0, 0]} />
                    <Bar yAxisId="left" dataKey="notPass" name="Not Pass" stackId="a" fill="var(--color-destructive)" radius={[3, 3, 0, 0]} />
                  </>
                ) : (
                  <>
                    <Bar yAxisId="left" dataKey="complicate" name="Complicate" stackId="a" fill="var(--color-warning)" />
                    <Bar yAxisId="left" dataKey="nonComplicate" name="Non-Complicate" stackId="a" fill="var(--color-info)" radius={[3, 3, 0, 0]} />
                  </>
                )}
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="band"
                  name="Forecast band"
                  stroke="none"
                  fill="var(--color-warning)"
                  fillOpacity={0.16}
                  connectNulls
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="passPct"
                  name="Pass%"
                  stroke="var(--color-info)"
                  strokeWidth={2.5}
                  dot={{ r: 2.5 }}
                  connectNulls
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast"
                  stroke="var(--color-warning)"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={{ r: 2.5 }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* Right rail: config + alerting + prediction */}
        <div className="space-y-4">
          <Panel title={sla.def.name} subtitle="Status vs this client's target">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold tabular-nums">{sla.passPct}%</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Pass% · target {targetPct}%
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                  healthPillClasses(sla.health),
                )}
              >
                {healthLabel(sla.health)}
              </span>
            </div>

            {/* Predictive forecast */}
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
                <span className="text-xs text-muted-foreground">
                  projected Pass%
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {forecastHealth === "belowTarget"
                  ? `Predicted to finish below the ${targetPct}% target.`
                  : forecastHealth === "atRisk"
                    ? `Projected to land within a thin margin of target.`
                    : `On track to stay above the ${targetPct}% target.`}
              </p>
            </div>

            {/* Threshold + alert toggle */}
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
                              <span className="font-mono tabular-nums">
                                {h.from}
                                {unit} → {h.to}
                                {unit}
                              </span>
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
                    title={readOnly ? "Executive role is read-only" : "Set threshold"}
                  >
                    Set threshold
                  </Button>
                </div>
              </div>

              <button
                onClick={() => !readOnly && onToggleAlert(client.id, sla.slaId)}
                disabled={readOnly}
                aria-pressed={data.alertEnabled}
                className={cn(
                  "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors",
                  data.alertEnabled ? "border-primary/40 bg-primary/5" : "border-border",
                  readOnly && "cursor-not-allowed opacity-60",
                )}
              >
                <div>
                  <div className="text-xs text-muted-foreground">Alerts for this SLA</div>
                  <div className="text-sm font-semibold">{data.alertEnabled ? "Enabled" : "Disabled"}</div>
                </div>
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-md",
                    data.alertEnabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {data.alertEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </span>
              </button>
            </div>

            {readOnly && (
              <p className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-center text-[11px] text-muted-foreground">
                Executive role — read-only. Edit controls are disabled.
              </p>
            )}
          </Panel>

          {/* Alert condition */}
          <AlertConditionPanel readOnly={readOnly} targetPct={targetPct} />

          {/* Recent alerts */}
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
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        a.severity === "critical" ? "bg-destructive" : "bg-warning",
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-sm leading-snug">{a.text}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {a.recipient} · {a.time}
                      </p>
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

      {/* Threshold dialog */}
      <ThresholdDialog
        open={thresholdOpen}
        onOpenChange={setThresholdOpen}
        sla={sla}
        onSave={(next) => {
          onSetThreshold(client.id, sla.slaId, next);
          setThresholdOpen(false);
        }}
      />

      {/* All alerts dialog */}
      <AlertsDialog open={alertsOpen} onOpenChange={setAlertsOpen} client={client} sla={sla} />
    </div>
  );
}

/* ----------------------------- Period table ----------------------------- */

function PeriodTable({ sla }: { sla: SlaComputed }) {
  const data = sla; // computed already has buckets via client; recompute portions here
  const buckets = useBuckets(sla);
  const totalComp = buckets.reduce((a, b) => a + b.complicate, 0);
  const totalNon = buckets.reduce((a, b) => a + b.nonComplicate, 0);
  const grand = totalComp + totalNon;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-xs">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th rowSpan={2} className="px-3 py-2 text-left font-semibold">
              Period ({sla.target.unit})
            </th>
            <th colSpan={2} className="border-l border-primary-foreground/20 px-3 py-1.5 text-center font-semibold">
              Complicate
            </th>
            <th colSpan={2} className="border-l border-primary-foreground/20 px-3 py-1.5 text-center font-semibold">
              Non-Complicate
            </th>
            <th colSpan={2} className="border-l border-primary-foreground/20 px-3 py-1.5 text-center font-semibold">
              Grand Total
            </th>
          </tr>
          <tr className="bg-primary/90 text-primary-foreground text-[10px]">
            <SubTh>No. of Claim</SubTh>
            <SubTh>Portion %</SubTh>
            <SubTh border>No. of Claim</SubTh>
            <SubTh>Portion %</SubTh>
            <SubTh border>No. of Claim</SubTh>
            <SubTh>Portion %</SubTh>
          </tr>
        </thead>
        <tbody>
          {buckets.map((b) => {
            const rowTotal = b.complicate + b.nonComplicate;
            const isPass = b.upper <= sla.target.target;
            return (
              <tr
                key={b.label}
                className={cn(
                  "border-b border-border",
                  isPass ? "bg-success/[0.06]" : "bg-destructive/[0.04]",
                )}
              >
                <td className="px-3 py-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isPass ? "bg-success" : "bg-destructive",
                      )}
                    />
                    {b.label}
                  </span>
                </td>
                <Td>{fmt(b.complicate)}</Td>
                <Td muted>{pct(b.complicate, totalComp)}</Td>
                <Td border>{fmt(b.nonComplicate)}</Td>
                <Td muted>{pct(b.nonComplicate, totalNon)}</Td>
                <Td border>{fmt(rowTotal)}</Td>
                <Td muted>{pct(rowTotal, grand)}</Td>
              </tr>
            );
          })}
          <tr className="border-t-2 border-primary/40 bg-muted/50 font-semibold">
            <td className="px-3 py-2">Grand Total</td>
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

/** buckets live on the raw client data — pull them via the computed sla's id through a hook-free lookup. */
function useBuckets(sla: SlaComputed) {
  return sla.bucketsRef;
}

/* ----------------------------- Alert condition ----------------------------- */

function AlertConditionPanel({ readOnly, targetPct }: { readOnly: boolean; targetPct: number }) {
  const [trigger, setTrigger] = useState("below");
  const [margin, setMargin] = useState("3");
  const [saved, setSaved] = useState(true);

  return (
    <Panel title="Alert condition" subtitle="When should this SLA alert?" actions={<Sliders className="h-4 w-4 text-muted-foreground" />}>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="ac-trigger">Fire when Pass%</Label>
          <Select
            value={trigger}
            onValueChange={(v) => {
              setTrigger(v);
              setSaved(false);
            }}
          >
            <SelectTrigger id="ac-trigger" className="h-9" disabled={readOnly}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="below">Is below target</SelectItem>
              <SelectItem value="margin">Within margin of target</SelectItem>
              <SelectItem value="trend">Is trending down</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {trigger === "margin" && (
          <div className="space-y-1.5">
            <Label htmlFor="ac-margin">Margin (%)</Label>
            <Input
              id="ac-margin"
              type="number"
              min={0}
              max={20}
              value={margin}
              disabled={readOnly}
              onChange={(e) => {
                setMargin(e.target.value);
                setSaved(false);
              }}
              className="h-9"
            />
            <p className="text-[11px] text-muted-foreground">
              Alert when Pass% is within {margin || 0}% above the {targetPct}% target.
            </p>
          </div>
        )}
        <Button className="w-full" disabled={readOnly || saved} onClick={() => setSaved(true)}>
          {saved ? "Saved" : "Save condition"}
        </Button>
      </div>
    </Panel>
  );
}

/* ----------------------------- Dialogs ----------------------------- */

function ThresholdDialog({
  open,
  onOpenChange,
  sla,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sla: SlaComputed;
  onSave: (next: number) => void;
}) {
  const [value, setValue] = useState(String(sla.target.target));

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setValue(String(sla.target.target));
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Set threshold · {sla.def.name}</DialogTitle>
          <DialogDescription>
            Adjust the target boundary. Pass / Not Pass and status recompute against this value.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="th-value">Target ({sla.target.unit})</Label>
          <Input
            id="th-value"
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Info className="h-3 w-3" />
            Default from contract: &lt; {sla.target.target} {sla.target.unit}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(Number(value) || sla.target.target)}>Save threshold</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AlertsDialog({
  open,
  onOpenChange,
  client,
  sla,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  client: Client;
  sla: SlaComputed;
}) {
  const data = client.data[sla.slaId]!;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Alert history · {sla.def.name}</DialogTitle>
          <DialogDescription>
            {client.name} — all alert events for this SLA in the selected range.
          </DialogDescription>
        </DialogHeader>
        <ul className="max-h-[360px] divide-y divide-border overflow-y-auto">
          {data.alerts.map((a) => (
            <li key={a.id} className="flex items-start gap-3 py-3">
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  a.severity === "critical" ? "bg-destructive" : "bg-warning",
                )}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-sm leading-snug">{a.text}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {a.severity === "critical" ? "Critical" : "Warning"} · {a.recipient} · {a.time}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- Small pieces ----------------------------- */

function RiskBadge({ risk }: { risk: Risk }) {
  const map: Record<Risk, string> = {
    High: "bg-destructive/15 text-destructive border-destructive/30",
    Medium: "bg-warning/15 text-warning border-warning/30",
    Low: "bg-success/15 text-success border-success/30",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", map[risk])}>
      {risk} risk
    </span>
  );
}

function Tile({
  tone,
  label,
  value,
  sub,
}: {
  tone: "info" | "success" | "destructive" | "warning";
  label: string;
  value: string;
  sub: string;
}) {
  const toneMap = {
    info: "border-info/30 bg-info/5 text-info",
    success: "border-success/30 bg-success/5 text-success",
    destructive: "border-destructive/30 bg-destructive/5 text-destructive",
    warning: "border-warning/30 bg-warning/5 text-warning",
  } as const;
  return (
    <div className={cn("rounded-lg border p-3.5", toneMap[tone])}>
      <div className="text-xs font-medium text-foreground/70">{label}</div>
      <div className="mt-1 text-2xl font-bold leading-none tabular-nums text-foreground">{value}</div>
      <div className="mt-1.5 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function StripCount({
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
        {fmt(value)} · {round1((value / total) * 100)}%
      </span>
    </div>
  );
}

function SubTh({ children, border }: { children: React.ReactNode; border?: boolean }) {
  return (
    <th className={cn("px-3 py-1 text-right font-medium", border && "border-l border-primary-foreground/20")}>
      {children}
    </th>
  );
}

function Td({ children, muted, border }: { children: React.ReactNode; muted?: boolean; border?: boolean }) {
  return (
    <td
      className={cn(
        "px-3 py-1.5 text-right font-mono tabular-nums",
        muted && "text-muted-foreground",
        border && "border-l border-border",
      )}
    >
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

/* ----------------------------- Utils ----------------------------- */

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
