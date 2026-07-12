import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ShieldAlert,
  Users,
  Activity,
  ClipboardList,
  Copy,
  CalendarDays,
  Filter,
  X,
  ChevronRight,
  Clock,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmtNum } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fraud-analysis")({
  head: () => ({
    meta: [
      { title: "Fraud Analysis · Claim Ops" },
      {
        name: "description",
        content:
          "RFM-based review prioritization and rule-based claim checks for the BVTPA fraud review team.",
      },
    ],
  }),
  component: FraudAnalysisPage,
});

// ---------- Types & constants ----------

type Segment = "Critical" | "High" | "Medium" | "Monitor" | "Low";
type SignalKind = "Rule" | "Anomaly" | "Network" | "Cross-Insurer";

const SEGMENT_STYLES: Record<Segment, string> = {
  Critical: "bg-destructive/15 text-destructive border-destructive/40",
  High: "bg-warning/15 text-warning border-warning/40",
  Medium: "bg-warning/10 text-warning border-warning/25",
  Monitor: "bg-info/15 text-info border-info/40",
  Low: "bg-muted text-muted-foreground border-border",
};

const SEGMENT_BAR: Record<Segment, string> = {
  Critical: "var(--color-destructive)",
  High: "oklch(0.72 0.16 55)",
  Medium: "var(--color-warning)",
  Monitor: "var(--color-info)",
  Low: "oklch(0.65 0.02 260)",
};

const SIGNAL_STYLES: Record<SignalKind, string> = {
  Rule: "bg-muted text-foreground border-border",
  Anomaly: "bg-info/10 text-info border-info/30",
  Network: "bg-primary/10 text-primary border-primary/30",
  "Cross-Insurer": "bg-destructive/15 text-destructive border-destructive/40",
};

type CrossInsurerCase = {
  insurers: [string, string];
  provider: string;
  treatmentDate: string;
  diagnosis: string;
  amounts: [number, number];
};

type QueueRow = {
  id: string;
  memberTh: string;
  memberId: string;
  r: number;
  f: number;
  m: number;
  segment: Segment;
  signals: SignalKind[];
  topReason: string;
  amount: number;
  lastClaim: string;
  rfmDetail: { r: string; f: string; m: string };
  reasonCodes: string[];
  crossInsurer?: CrossInsurerCase;
};

// ---------- Mock data ----------

const QUEUE: QueueRow[] = [
  {
    id: "FA-0001",
    memberTh: "คุณสมชาย วัฒนกุล",
    memberId: "MBR-0038291",
    r: 5,
    f: 5,
    m: 4,
    segment: "Critical",
    signals: ["Cross-Insurer", "Rule", "Anomaly"],
    topReason:
      "Same treatment submitted to วิริยะประกันสุขภาพ + ทิพยประกันชีวิต this week",
    amount: 184_500,
    lastClaim: "yesterday",
    rfmDetail: {
      r: "Last claim yesterday — highest recency band",
      f: "14 claims in the last 30 days",
      m: "Cumulative ฿420,000 in 90d — top 8% of members",
    },
    reasonCodes: [
      "Cross-insurer duplicate: identical procedure code + date",
      "Same provider used 6× in 21 days",
      "Amount matches benefit ceiling within 2%",
    ],
    crossInsurer: {
      insurers: ["วิริยะประกันสุขภาพ", "ทิพยประกันชีวิต"],
      provider: "Bangkok Hospital",
      treatmentDate: "2026-07-08",
      diagnosis: "I25 · Chronic ischemic heart disease",
      amounts: [184_500, 182_900],
    },
  },
  {
    id: "FA-0002",
    memberTh: "คุณปิยะดา ศรีสุวรรณ",
    memberId: "MBR-0041027",
    r: 5,
    f: 4,
    m: 5,
    segment: "Critical",
    signals: ["Cross-Insurer", "Rule"],
    topReason:
      "Identical MRI claim filed at Samitivej to วิริยะ + ทิพย 3 days apart",
    amount: 96_800,
    lastClaim: "2 days ago",
    rfmDetail: {
      r: "Last claim 2 days ago",
      f: "9 claims in 30 days — 3.2× peer group",
      m: "฿612,000 in 90d — top 4%",
    },
    reasonCodes: [
      "Cross-insurer duplicate: MRI lumbar spine, same date",
      "Repeated near-ceiling claims (3× in 45d)",
    ],
    crossInsurer: {
      insurers: ["วิริยะประกันสุขภาพ", "ทิพยประกันชีวิต"],
      provider: "Samitivej Hospital",
      treatmentDate: "2026-07-05",
      diagnosis: "M54 · Dorsalgia (MRI lumbar)",
      amounts: [96_800, 94_200],
    },
  },
  {
    id: "FA-0003",
    memberTh: "คุณอนันต์ ตั้งเจริญ",
    memberId: "MBR-0027845",
    r: 4,
    f: 5,
    m: 4,
    segment: "High",
    signals: ["Rule", "Anomaly"],
    topReason: "12 claims in 30 days near benefit ceiling",
    amount: 78_200,
    lastClaim: "3 days ago",
    rfmDetail: {
      r: "Last claim 3 days ago",
      f: "12 claims in 30 days — anomaly z=3.1",
      m: "฿348,000 in 90d",
    },
    reasonCodes: [
      "Repeated claims within short time window",
      "Claim amount near benefit ceiling (repeated)",
    ],
  },
  {
    id: "FA-0004",
    memberTh: "คุณกนกวรรณ อภิชาติ",
    memberId: "MBR-0039102",
    r: 4,
    f: 4,
    m: 5,
    segment: "High",
    signals: ["Rule", "Network"],
    topReason:
      "Same provider + treatment date + amount as 2 other members (Bumrungrad)",
    amount: 142_300,
    lastClaim: "4 days ago",
    rfmDetail: {
      r: "Last claim 4 days ago",
      f: "8 claims in 30 days",
      m: "฿521,000 in 90d",
    },
    reasonCodes: [
      "Provider-network cluster: 3 members, identical amount",
      "Same diagnosis code (K80) across cluster",
    ],
  },
  {
    id: "FA-0005",
    memberTh: "คุณธีรวัฒน์ ชูเกียรติ",
    memberId: "MBR-0044891",
    r: 5,
    f: 3,
    m: 5,
    segment: "High",
    signals: ["Rule"],
    topReason: "First claim filed 6 days after policy activation — ฿210,000",
    amount: 210_400,
    lastClaim: "today",
    rfmDetail: {
      r: "Filed today",
      f: "5 claims since activation (28d)",
      m: "฿410,000 lifetime",
    },
    reasonCodes: [
      "Claim filed immediately after policy activation",
      "High-value first claim (>฿200k)",
    ],
  },
  {
    id: "FA-0006",
    memberTh: "คุณวรรณา พงษ์ไพศาล",
    memberId: "MBR-0031204",
    r: 3,
    f: 4,
    m: 3,
    segment: "Medium",
    signals: ["Anomaly"],
    topReason: "OPD visit frequency 2.4× peer group (same age band)",
    amount: 24_600,
    lastClaim: "8 days ago",
    rfmDetail: {
      r: "Last claim 8 days ago",
      f: "11 OPD visits in 60d",
      m: "฿148,000 in 90d",
    },
    reasonCodes: ["Frequency anomaly vs peer group"],
  },
  {
    id: "FA-0007",
    memberTh: "คุณเจษฎา รุ่งเรือง",
    memberId: "MBR-0042553",
    r: 3,
    f: 3,
    m: 4,
    segment: "Medium",
    signals: ["Rule"],
    topReason: "Duplicate submission — same date + amount (BNH)",
    amount: 38_900,
    lastClaim: "9 days ago",
    rfmDetail: {
      r: "Last claim 9 days ago",
      f: "6 claims in 60d",
      m: "฿219,000 in 90d",
    },
    reasonCodes: ["Same member+provider+date+amount duplicate"],
  },
  {
    id: "FA-0008",
    memberTh: "คุณศิริพร มณีวงษ์",
    memberId: "MBR-0028117",
    r: 2,
    f: 3,
    m: 3,
    segment: "Monitor",
    signals: ["Anomaly"],
    topReason: "Diagnosis mix shift — chronic codes rising 40% QoQ",
    amount: 18_400,
    lastClaim: "14 days ago",
    rfmDetail: {
      r: "Last claim 14 days ago",
      f: "7 claims in 90d",
      m: "฿96,000 in 90d",
    },
    reasonCodes: ["Diagnosis code drift"],
  },
  {
    id: "FA-0009",
    memberTh: "คุณพัชรินทร์ ทองแท้",
    memberId: "MBR-0035628",
    r: 2,
    f: 2,
    m: 4,
    segment: "Monitor",
    signals: ["Network"],
    topReason: "Uses provider on internal watchlist (Ramkhamhaeng cluster)",
    amount: 52_100,
    lastClaim: "17 days ago",
    rfmDetail: {
      r: "Last claim 17 days ago",
      f: "4 claims in 90d",
      m: "฿186,000 in 90d",
    },
    reasonCodes: ["Provider on watchlist"],
  },
  {
    id: "FA-0010",
    memberTh: "คุณนพดล จิตรานนท์",
    memberId: "MBR-0040992",
    r: 1,
    f: 2,
    m: 2,
    segment: "Low",
    signals: ["Rule"],
    topReason: "Old document date flagged — likely benign",
    amount: 9_200,
    lastClaim: "28 days ago",
    rfmDetail: {
      r: "Last claim 28 days ago",
      f: "3 claims in 90d",
      m: "฿42,000 in 90d",
    },
    reasonCodes: ["Document date >21 days from submission"],
  },
];

const SEGMENT_DIST: { name: Segment; value: number }[] = [
  { name: "Critical", value: 18 },
  { name: "High", value: 42 },
  { name: "Medium", value: 138 },
  { name: "Monitor", value: 264 },
  { name: "Low", value: 812 },
];

type Rule = {
  id: string;
  name: string;
  severity: "High" | "Medium" | "Low";
  hits: number;
  enabled: boolean;
};

const INITIAL_RULES: Rule[] = [
  {
    id: "r1",
    name: "Cross-insurer duplicate claim (same treatment to 2 insurers)",
    severity: "High",
    hits: 7,
    enabled: true,
  },
  {
    id: "r2",
    name: "Same member + provider + treatment date + amount",
    severity: "High",
    hits: 24,
    enabled: true,
  },
  {
    id: "r3",
    name: "Claim amount near benefit ceiling (repeated)",
    severity: "Medium",
    hits: 61,
    enabled: true,
  },
  {
    id: "r4",
    name: "Claim filed immediately after policy activation",
    severity: "Medium",
    hits: 33,
    enabled: true,
  },
  {
    id: "r5",
    name: "Repeated claims within a short time window",
    severity: "Medium",
    hits: 74,
    enabled: true,
  },
  {
    id: "r6",
    name: "Member/provider on blacklist/watchlist",
    severity: "High",
    hits: 14,
    enabled: false,
  },
];

// ---------- Helpers ----------

const fmtBahtFull = (n: number) =>
  "฿" + new Intl.NumberFormat("en-US").format(n);

function RfmBadge({ label, value }: { label: "R" | "F" | "M"; value: number }) {
  const tone =
    value >= 5
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : value >= 4
        ? "bg-warning/15 text-warning border-warning/30"
        : value >= 3
          ? "bg-info/15 text-info border-info/30"
          : "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-[34px] items-center justify-center gap-0.5 rounded border px-1.5 text-[11px] font-semibold tabular-nums",
        tone,
      )}
    >
      <span className="opacity-60">{label}</span>
      {value}
    </span>
  );
}

function SegmentPill({ segment }: { segment: Segment }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        SEGMENT_STYLES[segment],
      )}
    >
      {segment}
    </span>
  );
}

function SignalChip({ kind }: { kind: SignalKind }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium",
        SIGNAL_STYLES[kind],
      )}
    >
      {kind}
    </span>
  );
}

// ---------- Page ----------

function FraudAnalysisPage() {
  const [range, setRange] = useState("30d");
  const [segmentFilter, setSegmentFilter] = useState<Segment | "ALL">("ALL");
  const [rules, setRules] = useState(INITIAL_RULES);
  const [activeRow, setActiveRow] = useState<QueueRow | null>(null);

  const rows = useMemo(
    () =>
      QUEUE.filter((r) => segmentFilter === "ALL" || r.segment === segmentFilter),
    [segmentFilter],
  );

  const rules30d = rules.filter((r) => r.enabled).reduce((s, r) => s + r.hits, 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              BVTPA · Fraud Review
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Fraud Analysis
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              RFM-based review prioritization + rule-based claim checks.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="h-9 w-[160px]">
                <CalendarDays className="mr-1 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="ytd">Year to date</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Filter className="h-3.5 w-3.5" /> Filters
              <span className="ml-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                2
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Critical Queue"
          value="18"
          sub="Highest-priority cases"
          tone="destructive"
          icon={AlertTriangle}
        />
        <KpiCard
          label="Cross-Insurer Duplicates"
          value="7"
          sub="Same treatment → 2+ insurers"
          tone="destructive"
          icon={Copy}
          delta={40}
        />
        <KpiCard
          label="High RFM Risk"
          value="42"
          sub="Recent · frequent · high value"
          tone="warning"
          icon={ShieldAlert}
        />
        <KpiCard
          label="Rules Triggered (30d)"
          value={fmtNum(rules30d)}
          sub={`${rules.filter((r) => r.enabled).length} active rules`}
          tone="info"
          icon={ClipboardList}
        />
        <KpiCard
          label="Under Review"
          value="56"
          sub="Assigned to reviewers"
          tone="default"
          icon={Users}
        />
      </div>

      {/* Review Priority Queue */}
      <Panel
        title="Review Priority Queue"
        subtitle="Ranked by RFM score + rule severity. Critical first."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Segment</span>
            <Select
              value={segmentFilter}
              onValueChange={(v) => setSegmentFilter(v as Segment | "ALL")}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All segments</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Monitor">Monitor</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Member</th>
                <th className="px-4 py-2 text-left font-medium">RFM</th>
                <th className="px-4 py-2 text-left font-medium">Segment</th>
                <th className="px-4 py-2 text-left font-medium">Signals</th>
                <th className="px-4 py-2 text-left font-medium">Top reason</th>
                <th className="px-4 py-2 text-right font-medium">Reimbursed</th>
                <th className="px-4 py-2 text-left font-medium">Last claim</th>
                <th className="px-4 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:bg-accent/40"
                >
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium">{row.memberTh}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {row.memberId}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex gap-1">
                      <RfmBadge label="R" value={row.r} />
                      <RfmBadge label="F" value={row.f} />
                      <RfmBadge label="M" value={row.m} />
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <SegmentPill segment={row.segment} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-1">
                      {row.signals.map((s) => (
                        <SignalChip key={s} kind={s} />
                      ))}
                    </div>
                  </td>
                  <td className="max-w-[320px] px-4 py-3 align-top text-xs text-muted-foreground">
                    {row.topReason}
                  </td>
                  <td className="px-4 py-3 text-right align-top font-semibold tabular-nums">
                    {fmtBahtFull(row.amount)}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {row.lastClaim}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={() => setActiveRow(row)}
                    >
                      Review
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Two panels: segment distribution + rules */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="RFM Segment Distribution"
          subtitle="Members grouped by review priority"
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={SEGMENT_DIST}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  stroke="var(--color-border)"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  stroke="var(--color-border)"
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {SEGMENT_DIST.map((s) => (
                    <Cell key={s.name} fill={SEGMENT_BAR[s.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-md border border-info/30 bg-info/5 p-3 text-xs text-info">
            <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              RFM ranks review priority — it is not a fraud decision. Cases
              require reviewer confirmation before any action.
            </span>
          </div>
        </Panel>

        <Panel
          title="Rule-Based Checks"
          subtitle="Classic detectors — hit counts in the last 30 days"
        >
          <ul className="divide-y divide-border">
            {rules.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {r.name}
                    </span>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                        r.severity === "High"
                          ? "border-destructive/40 bg-destructive/10 text-destructive"
                          : r.severity === "Medium"
                            ? "border-warning/40 bg-warning/10 text-warning"
                            : "border-border bg-muted text-muted-foreground",
                      )}
                    >
                      {r.severity}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {r.enabled
                      ? `${fmtNum(r.hits)} claims flagged (30d)`
                      : "Disabled"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-14 text-right text-sm font-semibold tabular-nums">
                    {r.enabled ? fmtNum(r.hits) : "—"}
                  </span>
                  <Switch
                    checked={r.enabled}
                    onCheckedChange={(v) =>
                      setRules((prev) =>
                        prev.map((x) =>
                          x.id === r.id ? { ...x, enabled: v } : x,
                        ),
                      )
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Review drawer */}
      <ReviewDrawer row={activeRow} onClose={() => setActiveRow(null)} />
    </div>
  );
}

// ---------- Drawer ----------

function ReviewDrawer({
  row,
  onClose,
}: {
  row: QueueRow | null;
  onClose: () => void;
}) {
  const open = row !== null;
  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col border-l border-border bg-card shadow-2xl transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {row && (
          <>
            <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  Case {row.id}
                </div>
                <h2 className="mt-0.5 text-lg font-bold tracking-tight">
                  {row.memberTh}
                </h2>
                <div className="font-mono text-xs text-muted-foreground">
                  {row.memberId}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SegmentPill segment={row.segment} />
                <button
                  onClick={onClose}
                  className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {/* RFM breakdown */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  RFM Breakdown
                </h3>
                <div className="mt-2 space-y-2">
                  {(
                    [
                      { k: "R", label: "Recency", v: row.r, note: row.rfmDetail.r },
                      { k: "F", label: "Frequency", v: row.f, note: row.rfmDetail.f },
                      { k: "M", label: "Monetary", v: row.m, note: row.rfmDetail.m },
                    ] as const
                  ).map((x) => (
                    <div
                      key={x.k}
                      className="flex items-start gap-3 rounded-md border border-border bg-background p-3"
                    >
                      <RfmBadge label={x.k as "R" | "F" | "M"} value={x.v} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{x.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {x.note}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Reason codes */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Signals & Reason Codes
                </h3>
                <div className="mt-2 flex flex-wrap gap-1">
                  {row.signals.map((s) => (
                    <SignalChip key={s} kind={s} />
                  ))}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {row.reasonCodes.map((rc, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs"
                    >
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                      <span>{rc}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Cross-insurer comparison */}
              {row.crossInsurer && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-destructive">
                    Cross-Insurer Duplicate
                  </h3>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {row.crossInsurer.insurers.map((ins, i) => (
                      <div
                        key={ins}
                        className="rounded-md border border-destructive/30 bg-destructive/5 p-3"
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
                          Insurer {i + 1}
                        </div>
                        <div className="mt-0.5 text-sm font-semibold">
                          {ins}
                        </div>
                        <dl className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">Date</dt>
                            <dd className="font-mono">
                              {row.crossInsurer!.treatmentDate}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">Provider</dt>
                            <dd className="text-right">
                              {row.crossInsurer!.provider}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">Diagnosis</dt>
                            <dd className="text-right">
                              {row.crossInsurer!.diagnosis}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">Amount</dt>
                            <dd className="font-semibold tabular-nums">
                              {fmtBahtFull(row.crossInsurer!.amounts[i])}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button size="sm" className="gap-1">
                Assign to reviewer
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
