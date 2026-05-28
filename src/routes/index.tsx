import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Banknote,
  Building2,
  Clock,
  FileText,
  Hospital,
  Hourglass,
  Layers,
  ListChecks,
  ShieldX,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useView } from "@/lib/view-store";
import {
  attentionSignals,
  fmtBaht,
  fmtNum,
  insurerPerf,
  insurers,
  kpiInsurer,
  kpiProvider,
  providerPerf,
  providers,
  statusBreakdown,
  trendData,
  icd10Top10,
  icd9Top10,
} from "@/lib/mock-data";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Panel } from "@/components/dashboard/panel";
import { ThailandMap } from "@/components/dashboard/thailand-map";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Claim Operation Command Center" },
      {
        name: "description",
        content:
          "Single-page daily operation dashboard for claim monitoring across insurer and provider views.",
      },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const { view, entityId, setEntityId } = useView();
  const k = view === "insurer" ? kpiInsurer : kpiProvider;
  const list = view === "insurer" ? insurers : providers;
  const isOverview = entityId === "ALL";
  const entity = list.find((e) => e.id === entityId);
  const Icon = view === "insurer" ? Building2 : Hospital;
  const overviewLabel = view === "insurer" ? "All Insurers" : "All Providers";

  const [updatedAt, setUpdatedAt] = useState<string>("");
  useEffect(() => {
    setUpdatedAt(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    );
  }, []);

  const workQueueCount = k.pending + Math.round(k.aging * 1.4);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {view} View · {isOverview ? "Portfolio Overview" : "Daily Operation"}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {isOverview ? overviewLabel : entity?.name_en ?? overviewLabel}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isOverview
                ? view === "insurer"
                  ? `Aggregated view across all ${list.length} insurer portfolios. Drill down by selecting a company.`
                  : `Aggregated view across all ${list.length} providers. Drill down by selecting a hospital.`
                : view === "insurer"
                  ? "Monitoring all claims under the selected insurer portfolio."
                  : "Monitoring claims submitted by the selected provider."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <Select value={entityId} onValueChange={setEntityId}>
                <SelectTrigger className="h-9 w-[280px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    <span className="mr-2 font-mono text-xs text-muted-foreground">
                      ALL
                    </span>
                    {overviewLabel} (Overview)
                  </SelectItem>
                  {list.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <span className="mr-2 font-mono text-xs text-muted-foreground">
                        {e.code}
                      </span>
                      {e.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Updated {updatedAt || "--:--"}
            </div>
          </div>
        </div>
      </section>



      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Total Claims"
          value={fmtNum(k.totalClaims)}
          sub={`${k.claimsToday} today`}
          delta={3.2}
          icon={FileText}
        />
        <KpiCard
          label="Total Payable"
          value={`฿${fmtBaht(k.totalPayable)}`}
          sub={`Incurred ฿${fmtBaht(k.totalIncurred)}`}
          delta={5.4}
          icon={Wallet}
          tone="success"
        />
        <KpiCard
          label="Pending"
          value={fmtNum(k.pending)}
          sub="Awaiting action"
          delta={-2.1}
          icon={Hourglass}
          tone="warning"
        />
        <KpiCard
          label="Rejected / Declined"
          value={fmtNum(k.rejected)}
          sub="Last 30 days"
          delta={1.3}
          icon={ShieldX}
          tone="destructive"
        />
        <KpiCard
          label="Work Queue Monitor"
          value={fmtNum(workQueueCount)}
          sub={`${k.aging} aging · ${k.pending} pending`}
          delta={-4.6}
          icon={ListChecks}
          tone="info"
        />
      </div>

      {/* Needs Attention */}
      <Panel
        title="Needs Attention"
        subtitle="Operational signals that require follow-up today"
        actions={
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive">
            <AlertTriangle className="h-3 w-3" /> {attentionSignals.length} active alerts
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {attentionSignals.map((s) => (
            <AttentionTile key={s.key} label={s.label} detail={s.detail} count={s.count} tone={s.tone} />
          ))}
        </div>
      </Panel>

      {/* Trend + Status */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Claim Trend"
          subtitle="Volume vs payable amount · last 30 days"
          actions={
            <div className="inline-flex rounded-md border border-border bg-background p-0.5 text-[11px] font-semibold">
              <button className="rounded-[5px] bg-primary px-2 py-1 text-primary-foreground">
                Count
              </button>
              <button className="px-2 py-1 text-muted-foreground hover:text-foreground">
                Payable
              </button>
              <button className="px-2 py-1 text-muted-foreground hover:text-foreground">
                Incurred
              </button>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ left: -10, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="date"
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
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--color-foreground)",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#g1)"
                name="Claims"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Status Breakdown" subtitle="Current claim distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusBreakdown}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                stroke="var(--color-card)"
                strokeWidth={2}
              >
                {statusBreakdown.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--color-foreground)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-2 space-y-1.5 text-xs">
            {statusBreakdown.map((s) => (
              <li key={s.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ background: s.color }}
                  />
                  {s.name}
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {fmtNum(s.value)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* SLA aging + ranking */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="SLA Aging Buckets" subtitle="Open claims by working days">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[
                { bucket: "0–1d", count: 9820 },
                { bucket: "2–3d", count: 4120 },
                { bucket: "4–7d", count: 2390 },
                { bucket: ">7d", count: 1099 },
              ]}
              margin={{ left: -16, right: 8, top: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="bucket"
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
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--color-foreground)",
                }}
                cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {[0, 1, 2, 3].map((i) => {
                  const colors = [
                    "var(--color-success)",
                    "var(--color-primary)",
                    "var(--color-warning)",
                    "var(--color-destructive)",
                  ];
                  return <Cell key={i} fill={colors[i]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel
          className="xl:col-span-2"
          title={view === "insurer" ? "Top Providers" : "Top Insurers"}
          subtitle={`Ranked by payable amount · ${view} portfolio view`}
          actions={
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Layers className="h-3 w-3" /> 10 entities
            </span>
          }
        >
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 text-left">#</th>
                  <th className="pb-2 text-left">Name</th>
                  <th className="pb-2 text-right">Claims</th>
                  <th className="pb-2 text-right">Payable</th>
                  <th className="pb-2 text-right">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(view === "insurer" ? providerPerf : insurerPerf)
                  .slice(0, 6)
                  .map((r, i) => (
                    <tr key={r.id} className="text-sm hover:bg-accent/30">
                      <td className="py-2.5 font-mono text-muted-foreground">{i + 1}</td>
                      <td className="py-2.5">
                        <div className="font-medium">{r.name_en}</div>
                        <div className="text-[11px] text-muted-foreground">{r.code}</div>
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums">{fmtNum(r.claims)}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-success">
                        ฿{fmtBaht(r.payable)}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums">
                        {"pending" in r
                          ? fmtNum(r.pending)
                          : fmtNum(Math.round((r.pendingRate / 100) * r.claims))}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* ICD Top 10 */}
      <div className="grid gap-4 xl:grid-cols-2">
        <IcdPanel
          title="Top 10 ICD-10 Diagnoses"
          subtitle="Most frequent diagnosis claim transactions"
          rows={icd10Top10}
        />
        <IcdPanel
          title="Top 10 ICD-9 Procedures"
          subtitle="Most frequent procedure claim transactions"
          rows={icd9Top10}
        />
      </div>

      {/* Thailand Map */}
      <ThailandMap />

      {/* Financial snapshot */}
      <Panel
        title="Financial Health Snapshot"
        subtitle="From incurred to payable · current period"
        actions={
          <span className="inline-flex items-center gap-1 text-[11px] text-success">
            <TrendingUp className="h-3 w-3" /> 77% conversion
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Total Incurred", value: 284_500_000, icon: Banknote, tone: "default" as const },
            { label: "Total Payable", value: 219_300_000, icon: Wallet, tone: "success" as const },
            { label: "Deductible", value: 14_600_000, icon: ShieldX, tone: "warning" as const },
            { label: "Decline Amount", value: 12_800_000, icon: AlertTriangle, tone: "destructive" as const },
          ].map((f) => (
            <KpiCard
              key={f.label}
              label={f.label}
              value={`฿${fmtBaht(f.value)}`}
              icon={f.icon}
              tone={f.tone}
            />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function IcdPanel({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: { code: string; th: string; en: string; count: number; payable: number }[];
}) {
  const max = Math.max(...rows.map((r) => r.count));
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <Panel
      title={title}
      subtitle={subtitle}
      actions={
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Layers className="h-3 w-3" /> {fmtNum(total)} txns
        </span>
      }
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="pb-2 text-left">#</th>
            <th className="pb-2 text-left">Code</th>
            <th className="pb-2 text-left">Description</th>
            <th className="pb-2 text-right">Claims</th>
            <th className="pb-2 text-right">Payable</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={r.code} className="hover:bg-accent/30">
              <td className="py-2 font-mono text-xs text-muted-foreground">{i + 1}</td>
              <td className="py-2 font-mono text-xs font-semibold">{r.code}</td>
              <td className="py-2">
                <div className="font-medium leading-tight">{r.en}</div>
                <div className="text-[11px] text-muted-foreground">{r.th}</div>
              </td>
              <td className="py-2 text-right">
                <div className="font-mono tabular-nums">{fmtNum(r.count)}</div>
                <div className="mt-1 h-1 w-20 ml-auto overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(r.count / max) * 100}%` }}
                  />
                </div>
              </td>
              <td className="py-2 text-right font-mono tabular-nums text-success">
                ฿{fmtBaht(r.payable)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function AttentionTile({
  label,
  detail,
  count,
  tone,
}: {
  label: string;
  detail: string;
  count: number;
  tone: "warning" | "destructive";
}) {
  const styles =
    tone === "destructive"
      ? "border-destructive/30 bg-destructive/5"
      : "border-warning/40 bg-warning/5";
  const toneText =
    tone === "destructive" ? "text-destructive" : "text-warning";
  return (
    <div className={cn("rounded-md border p-4", styles)}>
      <div className="flex items-start justify-between">
        <div className={cn("text-[11px] font-semibold uppercase tracking-wider", toneText)}>
          {label}
        </div>
        <AlertTriangle className={cn("h-4 w-4", toneText)} />
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{fmtNum(count)}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}
