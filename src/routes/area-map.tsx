import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, TrendingUp } from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { fmtBaht, fmtNum, provinceData, diagnosisGroups, providerPerf } from "@/lib/mock-data";

export const Route = createFileRoute("/area-map")({
  head: () => ({
    meta: [
      { title: "Claim Area Map · Claim Ops" },
      { name: "description", content: "Geographic concentration of claims by province with drilldown." },
    ],
  }),
  component: AreaMapPage,
});

const metrics = [
  { key: "claims", label: "Claim Count" },
  { key: "payable", label: "Payable Amount" },
  { key: "pending", label: "Pending" },
  { key: "sla", label: "SLA Risk" },
] as const;

function AreaMapPage() {
  const [selected, setSelected] = useState(provinceData[0]);
  const [metric, setMetric] = useState<(typeof metrics)[number]["key"]>("claims");

  const maxVal = Math.max(...provinceData.map((p) => p[metric] as number));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Claim Area Map
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Geographic concentration</h1>
        </div>
        <div className="inline-flex rounded-md border border-border bg-card p-0.5 text-[11px] font-semibold">
          {metrics.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`rounded-[5px] px-3 py-1.5 transition-colors ${
                metric === m.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Thailand · Province Heat"
          subtitle={`Shaded by ${metrics.find((m) => m.key === metric)?.label.toLowerCase()}`}
        >
          {/* Stylized province "map" — abstract grid since real map needs lib */}
          <div className="relative rounded-lg border border-border bg-gradient-to-br from-background to-card p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {provinceData.map((p) => {
                const intensity = (p[metric] as number) / maxVal;
                const isActive = selected.province === p.province;
                return (
                  <button
                    key={p.province}
                    onClick={() => setSelected(p)}
                    className={`group relative overflow-hidden rounded-md border p-3 text-left transition-all ${
                      isActive
                        ? "border-primary ring-2 ring-primary/40"
                        : "border-border hover:border-primary/60"
                    }`}
                    style={{
                      background: `linear-gradient(135deg, color-mix(in oklab, var(--color-primary) ${
                        intensity * 70
                      }%, transparent), color-mix(in oklab, var(--color-primary) ${
                        intensity * 30
                      }%, var(--color-card)))`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-foreground/70">
                          {p.province}
                        </div>
                        <div className="mt-1 text-lg font-bold tabular-nums">
                          {metric === "payable" ? `฿${fmtBaht(p.payable)}` : fmtNum(p[metric] as number)}
                          {metric === "sla" && "m"}
                        </div>
                      </div>
                      <MapPin className="h-4 w-4 opacity-50" />
                    </div>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-background/40">
                      <div className="h-full bg-foreground/70" style={{ width: `${intensity * 100}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Lower</span>
              <div className="h-2 flex-1 mx-3 rounded-full bg-gradient-to-r from-card to-primary" />
              <span>Higher</span>
            </div>
          </div>
        </Panel>

        <Panel title={selected.province} subtitle={selected.th}>
          <dl className="space-y-3 text-sm">
            <Stat label="Total Claims" value={fmtNum(selected.claims)} />
            <Stat label="Total Payable" value={`฿${fmtBaht(selected.payable)}`} tone="success" />
            <Stat label="Pending" value={fmtNum(selected.pending)} tone="warning" />
            <Stat label="Avg SLA" value={`${selected.sla}m`} tone={selected.sla > 160 ? "destructive" : "default"} />
          </dl>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Top Providers</span>
              <TrendingUp className="h-3 w-3" />
            </div>
            <ul className="space-y-1.5">
              {providerPerf.slice(0, 4).map((p) => (
                <li key={p.id} className="flex items-center justify-between text-xs">
                  <span className="truncate">{p.name_en}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">{fmtNum(p.claims)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Top Diagnosis Groups
            </div>
            <ul className="space-y-1.5">
              {diagnosisGroups.slice(0, 4).map((d) => (
                <li key={d.code} className="flex items-center justify-between text-xs">
                  <span className="truncate">
                    <span className="font-mono text-muted-foreground mr-1.5">{d.code}</span>
                    {d.en}
                  </span>
                  <span className="font-mono tabular-nums text-muted-foreground">{fmtNum(d.count)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const t = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  }[tone];
  return (
    <div className="flex items-center justify-between border-b border-border pb-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`font-mono tabular-nums text-base font-semibold ${t}`}>{value}</dd>
    </div>
  );
}
