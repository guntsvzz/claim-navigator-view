import { useMemo, useState } from "react";
import { MapPin, TrendingUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MAP_W,
  MAP_H,
  TH_PROVINCES,
  REGION_LABELS,
  type ThRegion,
} from "@/lib/thailand-geo";
import {
  diagnosisGroups,
  fmtBaht,
  fmtNum,
  provinceData,
  providerPerf,
} from "@/lib/mock-data";

const metrics = [
  { key: "claims", label: "Claims" },
  { key: "payable", label: "Payable" },
  { key: "pending", label: "Pending" },
] as const;
type MetricKey = (typeof metrics)[number]["key"];

const regions: ("all" | ThRegion)[] = [
  "all",
  "central",
  "north",
  "northeast",
  "east",
  "west",
  "south",
];

export function ThailandMap() {
  const [metric, setMetric] = useState<MetricKey>("claims");
  const [region, setRegion] = useState<"all" | ThRegion>("all");
  const [selectedProvince, setSelectedProvince] = useState<string>(
    "Bangkok Metropolis",
  );

  const dataByName = useMemo(() => {
    const m = new Map<string, (typeof provinceData)[number]>();
    provinceData.forEach((p) => m.set(p.province, p));
    return m;
  }, []);

  const visibleProvinces = useMemo(
    () =>
      TH_PROVINCES.filter((p) => region === "all" || p.region === region),
    [region],
  );

  const maxVal = useMemo(() => {
    return Math.max(
      ...visibleProvinces.map((p) => {
        const d = dataByName.get(p.name);
        return d ? (d[metric] as number) : 0;
      }),
      1,
    );
  }, [visibleProvinces, dataByName, metric]);

  const selected = dataByName.get(selectedProvince) ?? provinceData[0];

  return (
    <section className="rounded-lg border border-border bg-card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">
            Thailand · Claim Concentration
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Choropleth by {metrics.find((m) => m.key === metric)?.label.toLowerCase()} · {visibleProvinces.length} provinces
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border border-border bg-background p-0.5 text-[11px] font-semibold">
            {metrics.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`rounded-[5px] px-2.5 py-1 transition-colors ${
                  metric === m.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <Select value={region} onValueChange={(v) => setRegion(v as "all" | ThRegion)}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r === "all" ? "All regions" : REGION_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue placeholder="Province" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {TH_PROVINCES
                .filter((p) => region === "all" || p.region === region)
                .map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="grid gap-0 lg:grid-cols-[1.5fr_1fr]">
        <div className="relative border-b border-border bg-secondary/40 p-4 lg:border-b-0 lg:border-r">
          <svg
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            className="mx-auto block h-[560px] w-full max-w-[500px]"
            role="img"
            aria-label="Thailand provinces choropleth"
          >
            {TH_PROVINCES.map((p) => {
              const d = dataByName.get(p.name);
              const dimmed = region !== "all" && p.region !== region;
              const v = d ? (d[metric] as number) : 0;
              const intensity = v / maxVal;
              const isSelected = p.name === selectedProvince;
              const fill = dimmed
                ? "color-mix(in oklab, var(--color-muted) 60%, transparent)"
                : `color-mix(in oklab, var(--color-primary) ${Math.max(8, intensity * 88)}%, white)`;
              return (
                <path
                  key={p.name}
                  d={p.d}
                  fill={fill}
                  stroke={isSelected ? "var(--color-primary)" : "var(--color-border)"}
                  strokeWidth={isSelected ? 1.6 : 0.5}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  opacity={dimmed ? 0.35 : 1}
                  onClick={() => setSelectedProvince(p.name)}
                >
                  <title>{`${p.name} · ${metrics.find((m) => m.key === metric)?.label}: ${
                    d
                      ? metric === "payable"
                        ? "฿" + fmtBaht(v)
                        : fmtNum(v)
                      : "—"
                  }`}</title>
                </path>
              );
            })}
          </svg>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Lower</span>
            <div
              className="mx-3 h-2 flex-1 rounded-full"
              style={{
                background:
                  "linear-gradient(to right, color-mix(in oklab, var(--color-primary) 8%, white), var(--color-primary))",
              }}
            />
            <span>Higher</span>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <div>
              <div className="text-base font-semibold">{selected.province}</div>
              <div className="text-xs text-muted-foreground">{selected.th} · {REGION_LABELS[selected.region]}</div>
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <Stat label="Total Claims" value={fmtNum(selected.claims)} />
            <Stat label="Total Payable" value={`฿${fmtBaht(selected.payable)}`} tone="success" />
            <Stat label="Pending" value={fmtNum(selected.pending)} tone="warning" />
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
                    <span className="mr-1.5 font-mono text-muted-foreground">{d.code}</span>
                    {d.en}
                  </span>
                  <span className="font-mono tabular-nums text-muted-foreground">{fmtNum(d.count)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
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
      <dd className={`font-mono text-base font-semibold tabular-nums ${t}`}>{value}</dd>
    </div>
  );
}
