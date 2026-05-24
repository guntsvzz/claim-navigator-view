import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Panel } from "@/components/dashboard/panel";
import { useView } from "@/lib/view-store";
import { diagnosisGroups, financialBreakdown, fmtBaht, fmtNum, insurerPerf, providerPerf } from "@/lib/mock-data";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Performance Analysis · Claim Ops" },
      { name: "description", content: "Provider/Insurer ranking, diagnosis groups and financial breakdown." },
    ],
  }),
  component: PerformancePage,
});

function PerformancePage() {
  const { view } = useView();
  const ranking = view === "insurer" ? providerPerf : insurerPerf;
  const rankingLabel = view === "insurer" ? "Providers" : "Insurers";

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Performance Analysis · {view} View
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {rankingLabel} performance & cost drivers
        </h1>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title={`Top ${rankingLabel} by Payable`} subtitle="Bar = payable amount · sorted desc">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ranking} margin={{ left: -8, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="code" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmtBaht(v as number)} />
              <Tooltip
                contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => `฿${fmtBaht(v as number)}`}
              />
              <Bar dataKey="payable" radius={[6, 6, 0, 0]} fill="var(--color-primary)">
                {ranking.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "var(--color-primary)" : `oklch(0.72 ${0.16 - i * 0.012} 215)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Volume vs Payable" subtitle="Bubble = avg SLA mins">
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ left: -8, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                type="number"
                dataKey="claims"
                name="Claims"
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="number"
                dataKey="payable"
                name="Payable"
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => fmtBaht(v as number)}
              />
              <ZAxis type="number" dataKey="avgSla" range={[60, 360]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
              />
              <Scatter data={ranking} fill="var(--color-info)" />
            </ScatterChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel
        title={`${rankingLabel} Ranking Table`}
        subtitle="Complete leaderboard with key operational metrics"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">Rank</th>
                <th className="px-3 py-2.5 text-left">Name</th>
                <th className="px-3 py-2.5 text-right">Claims</th>
                <th className="px-3 py-2.5 text-right">Payable</th>
                <th className="px-3 py-2.5 text-right">Avg Claim</th>
                <th className="px-3 py-2.5 text-right">Avg SLA</th>
                <th className="px-3 py-2.5 text-right">{view === "insurer" ? "Reject Rate" : "Pending"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ranking.map((r, i) => (
                <tr key={r.id} className="hover:bg-accent/30">
                  <td className="px-4 py-3 font-mono text-muted-foreground">#{i + 1}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{r.name_en}</div>
                    <div className="text-[11px] text-muted-foreground">{r.name_th}</div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">{fmtNum(r.claims)}</td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-success">฿{fmtBaht(r.payable)}</td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">฿{fmtNum(Math.round(r.payable / r.claims))}</td>
                  <td className={`px-3 py-3 text-right font-mono tabular-nums ${r.avgSla > 180 ? "text-destructive" : r.avgSla > 140 ? "text-warning" : "text-success"}`}>
                    {r.avgSla}m
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">
                    {"rejectRate" in r ? `${r.rejectRate.toFixed(1)}%` : fmtNum(r.pending)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Top Diagnosis Groups by Cost" subtitle="ICD-10 grouped · payable amount">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={diagnosisGroups} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmtBaht(v as number)} />
              <YAxis type="category" dataKey="en" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={140} />
              <Tooltip
                contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => `฿${fmtBaht(v as number)}`}
              />
              <Bar dataKey="cost" radius={[0, 6, 6, 0]}>
                {diagnosisGroups.map((d, i) => (
                  <Cell key={i} fill={d.chronic ? "var(--color-destructive)" : "var(--color-primary)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-destructive" />Chronic</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary" />Acute / Simple</span>
          </div>
        </Panel>

        <Panel title="Financial Waterfall" subtitle="From Incurred → Payable">
          <ul className="space-y-2">
            {financialBreakdown.map((f, i) => {
              const isFinal = i === 0 || i === financialBreakdown.length - 1;
              const isNeg = f.value < 0;
              const max = 284_500_000;
              const w = (Math.abs(f.value) / max) * 100;
              return (
                <li key={f.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={isFinal ? "font-semibold" : "text-muted-foreground"}>
                      {f.label}
                    </span>
                    <span className={`font-mono tabular-nums ${isNeg ? "text-destructive" : isFinal ? "text-success font-semibold" : ""}`}>
                      {isNeg ? "−" : ""}฿{fmtBaht(Math.abs(f.value))}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${isFinal ? "bg-success" : isNeg ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${w}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
