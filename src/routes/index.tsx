import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
  Clock,
  FileText,
  Hourglass,
  ShieldX,
  TrendingUp,
  Wallet,
  Layers,
} from "lucide-react";
import { useView } from "@/lib/view-store";
import {
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
} from "@/lib/mock-data";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Panel } from "@/components/dashboard/panel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daily Operation Overview · Claim Ops" },
      { name: "description", content: "Real-time operational health, KPIs, trends and rankings." },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const { view, entityId } = useView();
  const k = view === "insurer" ? kpiInsurer : kpiProvider;
  const entity =
    view === "insurer"
      ? insurers.find((i) => i.id === entityId)
      : providers.find((p) => p.id === entityId);
  const entityLabel = entity?.name_en ?? "All";

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {view} View · Daily Operation
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {entityLabel}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {view === "insurer"
              ? "Monitoring all claims under the selected insurer portfolio."
              : "Monitoring claims submitted by the selected provider."}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> Updated{" "}
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

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
          label="Avg SLA"
          value={`${k.avgSlaMins}m`}
          sub={`${k.aging} aging > 7d`}
          delta={-4.6}
          icon={AlertTriangle}
          tone="info"
        />
      </div>

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
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData} margin={{ left: -10, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} fill="url(#g1)" name="Claims" />
              <Area type="monotone" dataKey="incurred" stroke="var(--color-success)" strokeWidth={0} fill="url(#g2)" name="Incurred" hide />
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
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-2 space-y-1.5 text-xs">
            {statusBreakdown.map((s) => (
              <li key={s.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
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

      {/* SLA + Ranking */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="SLA Aging Buckets" subtitle="Open claims by working days">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[
                { bucket: "0–1d", count: 9820, fill: "var(--color-success)" },
                { bucket: "2–3d", count: 4120, fill: "var(--color-primary)" },
                { bucket: "4–7d", count: 2390, fill: "var(--color-warning)" },
                { bucket: ">7d", count: 1099, fill: "var(--color-destructive)" },
              ]}
              margin={{ left: -16, right: 8, top: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="bucket" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
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
                  <th className="pb-2 text-right">Avg SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(view === "insurer" ? providerPerf : insurerPerf).slice(0, 6).map((r, i) => (
                  <tr key={r.id} className="text-sm hover:bg-accent/30">
                    <td className="py-2.5 text-muted-foreground font-mono">{i + 1}</td>
                    <td className="py-2.5">
                      <div className="font-medium">{r.name_en}</div>
                      <div className="text-[11px] text-muted-foreground">{r.code}</div>
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums">{fmtNum(r.claims)}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-success">
                      ฿{fmtBaht(r.payable)}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums">
                      {"pending" in r ? fmtNum(r.pending) : fmtNum(Math.round((r.pendingRate / 100) * r.claims))}
                    </td>
                    <td className="py-2.5 text-right">
                      <SlaBadge mins={r.avgSla} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Financial mini */}
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

function SlaBadge({ mins }: { mins: number }) {
  const tone =
    mins < 120 ? "text-success" : mins < 180 ? "text-warning" : "text-destructive";
  return <span className={`font-mono tabular-nums ${tone}`}>{mins}m</span>;
}
