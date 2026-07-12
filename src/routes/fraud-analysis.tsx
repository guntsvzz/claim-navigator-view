import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
  Activity,
  AlertTriangle,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Cog,
  Copy,
  Database,
  Filter,
  Layers,
  Lock,
  Network,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { fmtNum } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fraud-analysis")({
  head: () => ({
    meta: [
      { title: "Fraud Analysis · Claim Ops" },
      {
        name: "description",
        content:
          "RFM-based review prioritization, rule-based claim checks, and fraud detection settings for the BVTPA fraud review team.",
      },
    ],
  }),
  component: FraudAnalysisPage,
});

// ---------- Types & constants ----------

type Segment = "Critical" | "High" | "Medium" | "Monitor" | "Low";
type SignalKind = "Rule" | "Anomaly" | "Network" | "Cross-Insurer";
type Severity = "High" | "Medium" | "Low";
type Role = "Admin" | "Executive";

const SEGMENT_ORDER: Segment[] = ["Critical", "High", "Medium", "Monitor", "Low"];

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

const SEVERITY_STYLES: Record<Severity, string> = {
  High: "bg-destructive/15 text-destructive border-destructive/30",
  Medium: "bg-warning/15 text-warning border-warning/30",
  Low: "bg-muted text-muted-foreground border-border",
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

// Hit counts (last 30 days) per shared rule id, surfaced on the Review Queue tab.
const RULE_HITS: Record<string, number> = {
  r1: 7,
  r2: 24,
  r3: 61,
  r4: 33,
  r5: 74,
  r6: 14,
};

// ---------- Settings types ----------

type ParamType = "percent" | "count" | "days" | "amount";

interface RuleParam {
  key: string;
  label: string;
  type: ParamType;
  value: number;
}

interface RuleConfig {
  id: string;
  name: string;
  severity: Severity;
  enabled: boolean;
  params: RuleParam[];
  watchlistToggle?: boolean;
}

interface WatchlistEntry {
  id: string;
  name: string;
  reason: string;
  addedBy: string;
}

interface FraudSettings {
  general: {
    enabled: boolean;
    schedule: "realtime" | "hourly" | "daily";
    dailyTime: string;
  };
  rfm: {
    weights: { recency: number; frequency: number; monetary: number };
    cutoffs: { critical: number; high: number; medium: number; monitor: number };
  };
  rules: RuleConfig[];
  anomaly: {
    zScore: number;
    minPeerGroup: number;
    networkMinMembers: number;
    matchFields: string[];
  };
  crossInsurer: {
    procedureCode: boolean;
    treatmentDate: boolean;
    dateWindowDays: number;
    amountTolerance: boolean;
    amountTolerancePct: number;
    provider: boolean;
    insurers: string[];
  };
  watchlist: {
    providers: WatchlistEntry[];
    members: WatchlistEntry[];
  };
  alerts: {
    minSegment: Segment;
    inApp: boolean;
    email: boolean;
    recipients: string[];
    autoAssign: boolean;
    slaHours: number;
  };
}

const ALL_INSURERS = [
  "วิริยะประกันสุขภาพ",
  "ทิพยประกันชีวิต",
  "กรุงเทพประกันภัย",
  "เมืองไทยประกันชีวิต",
  "อลิอันซ์ อยุธยา",
  "เอไอเอ ประเทศไทย",
];

const NETWORK_FIELDS = ["Provider", "Treatment date", "Amount", "Diagnosis"];

const RECIPIENT_OPTIONS = [
  "Admin",
  "Team Lead",
  "Fraud Reviewer — K. Wattana",
  "Fraud Reviewer — P. Chai",
  "Fraud Reviewer — A. Srisai",
];

const DEFAULT_SETTINGS: FraudSettings = {
  general: {
    enabled: true,
    schedule: "hourly",
    dailyTime: "02:00",
  },
  rfm: {
    weights: { recency: 30, frequency: 30, monetary: 40 },
    cutoffs: { critical: 85, high: 70, medium: 50, monitor: 30 },
  },
  rules: [
    {
      id: "r1",
      name: "Cross-insurer duplicate claim (same treatment to 2 insurers)",
      severity: "High",
      enabled: true,
      params: [{ key: "tolerance", label: "Amount tolerance", type: "percent", value: 2 }],
    },
    {
      id: "r2",
      name: "Same member + provider + treatment date + amount",
      severity: "High",
      enabled: true,
      params: [{ key: "tolerance", label: "Amount tolerance", type: "percent", value: 1 }],
    },
    {
      id: "r3",
      name: "Claim amount near benefit ceiling (repeated)",
      severity: "Medium",
      enabled: true,
      params: [
        { key: "ceilingPct", label: "% of ceiling", type: "percent", value: 95 },
        { key: "minRepeats", label: "Min repeats", type: "count", value: 3 },
      ],
    },
    {
      id: "r4",
      name: "Claim filed immediately after policy activation",
      severity: "Medium",
      enabled: true,
      params: [
        { key: "daysAfter", label: "Days after activation", type: "days", value: 7 },
        { key: "minAmount", label: "Min amount", type: "amount", value: 200000 },
      ],
    },
    {
      id: "r5",
      name: "Repeated claims within a short time window",
      severity: "Medium",
      enabled: true,
      params: [
        { key: "count", label: "Claim count", type: "count", value: 5 },
        { key: "windowDays", label: "Window", type: "days", value: 14 },
      ],
    },
    {
      id: "r6",
      name: "Member/provider on blacklist/watchlist",
      severity: "High",
      enabled: false,
      params: [],
      watchlistToggle: true,
    },
  ],
  anomaly: {
    zScore: 3,
    minPeerGroup: 30,
    networkMinMembers: 3,
    matchFields: ["Provider", "Treatment date", "Amount"],
  },
  crossInsurer: {
    procedureCode: true,
    treatmentDate: true,
    dateWindowDays: 1,
    amountTolerance: true,
    amountTolerancePct: 2,
    provider: true,
    insurers: ["วิริยะประกันสุขภาพ", "ทิพยประกันชีวิต"],
  },
  watchlist: {
    providers: [
      {
        id: "wp1",
        name: "Ramkhamhaeng Cluster Clinic",
        reason: "Repeated network-cluster duplicates",
        addedBy: "K. Wattana",
      },
    ],
    members: [
      {
        id: "wm1",
        name: "MBR-0040992 · คุณนพดล จิตรานนท์",
        reason: "Confirmed prior fraudulent submission",
        addedBy: "A. Srisai",
      },
    ],
  },
  alerts: {
    minSegment: "High",
    inApp: true,
    email: true,
    recipients: ["Admin", "Team Lead"],
    autoAssign: true,
    slaHours: 24,
  },
};

const SECTIONS = [
  { id: "general", label: "General", icon: Cog },
  { id: "rfm", label: "RFM Segmentation", icon: SlidersHorizontal },
  { id: "rules", label: "Rule-Based Checks", icon: ClipboardList },
  { id: "anomaly", label: "Anomaly & Network", icon: Network },
  { id: "cross", label: "Cross-Insurer Duplicate", icon: Copy },
  { id: "watchlist", label: "Watchlist / Blacklist", icon: ShieldAlert },
  { id: "alerts", label: "Alerts & Routing", icon: BellRing },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

// ---------- Helpers ----------

const fmtBahtFull = (n: number) =>
  "฿" + new Intl.NumberFormat("en-US").format(n);

const clone = (s: FraudSettings): FraudSettings =>
  JSON.parse(JSON.stringify(s)) as FraudSettings;

function scoreToSegment(score: number, c: FraudSettings["rfm"]["cutoffs"]): Segment {
  if (score >= c.critical) return "Critical";
  if (score >= c.high) return "High";
  if (score >= c.medium) return "Medium";
  if (score >= c.monitor) return "Monitor";
  return "Low";
}

const paramSuffix: Record<ParamType, string> = {
  percent: "%",
  count: "×",
  days: "days",
  amount: "฿",
};

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

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        SEVERITY_STYLES[severity],
      )}
    >
      {severity}
    </span>
  );
}

// ---------- Page ----------

function FraudAnalysisPage() {
  // Shared header controls (persist across tabs).
  const [role, setRole] = useState<Role>("Admin");
  const readOnly = role === "Executive";
  const [range, setRange] = useState("30d");
  const [tab, setTab] = useState<"queue" | "settings">("queue");

  // Shared configuration state (rules power both tabs).
  const [settings, setSettings] = useState<FraudSettings>(() => clone(DEFAULT_SETTINGS));
  const [saved, setSaved] = useState<FraudSettings>(() => clone(DEFAULT_SETTINGS));
  const [savingState, setSavingState] = useState<"idle" | "saving">("idle");
  const [activeSection, setActiveSection] = useState<SectionId>("general");

  // Review Queue state.
  const [segmentFilter, setSegmentFilter] = useState<Segment | "ALL">("ALL");
  const [activeRow, setActiveRow] = useState<QueueRow | null>(null);

  const rows = useMemo(
    () =>
      QUEUE.filter((r) => segmentFilter === "ALL" || r.segment === segmentFilter),
    [segmentFilter],
  );

  const dirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(saved),
    [settings, saved],
  );

  const weightSum =
    settings.rfm.weights.recency +
    settings.rfm.weights.frequency +
    settings.rfm.weights.monetary;
  const weightsValid = weightSum === 100;
  const canSave = dirty && weightsValid && !readOnly && savingState === "idle";

  const activeRules = settings.rules.filter((r) => r.enabled).length;
  const rules30d = settings.rules
    .filter((r) => r.enabled)
    .reduce((s, r) => s + (RULE_HITS[r.id] ?? 0), 0);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function update(mutator: (draft: FraudSettings) => void) {
    if (readOnly) return;
    setSettings((prev) => {
      const next = clone(prev);
      mutator(next);
      return next;
    });
  }

  function toggleRule(id: string, value: boolean) {
    update((d) => {
      const rule = d.rules.find((r) => r.id === id);
      if (rule) rule.enabled = value;
    });
  }

  function handleSave() {
    if (!canSave) return;
    setSavingState("saving");
    window.setTimeout(() => {
      setSaved(clone(settings));
      setSavingState("idle");
      toast.success("Saved successfully", {
        description: "Fraud detection settings are now live on the Review Queue.",
      });
    }, 650);
  }

  function handleDiscard() {
    setSettings(clone(saved));
    toast("Changes discarded");
  }

  const settingsActive = tab === "settings";

  return (
    <div className={cn("space-y-6", settingsActive && "pb-24")}>
      {/* Page header — shared across tabs */}
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
              RFM-based review prioritization, rule-based checks, and detection settings.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Viewing as
            </span>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="h-9 w-[184px]" aria-label="Select role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin (full edit)</SelectItem>
                <SelectItem value="Executive">Executive (read-only)</SelectItem>
              </SelectContent>
            </Select>
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
          </div>
        </div>

        {/* Segmented tab control */}
        <div className="mt-4 inline-flex rounded-lg border border-border bg-muted p-1">
          {(
            [
              { id: "queue" as const, label: "Review Queue" },
              { id: "settings" as const, label: "Settings" },
            ]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-semibold transition-colors",
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* -------------------- Review Queue tab -------------------- */}
      {tab === "queue" && (
        <>
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
              sub={`${activeRules} active rules`}
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
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <Filter className="h-3.5 w-3.5" /> Filters
                  <span className="ml-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    2
                  </span>
                </Button>
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
                {settings.rules.map((r) => {
                  const hits = RULE_HITS[r.id] ?? 0;
                  return (
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
                            ? `${fmtNum(hits)} claims flagged (30d)`
                            : "Disabled"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-14 text-right text-sm font-semibold tabular-nums">
                          {r.enabled ? fmtNum(hits) : "—"}
                        </span>
                        <Switch
                          checked={r.enabled}
                          disabled={readOnly}
                          onCheckedChange={(v) => toggleRule(r.id, v)}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {/* -------------------- Settings tab -------------------- */}
      {tab === "settings" && (
        <>
          {readOnly && (
            <div className="flex items-center gap-2 rounded-lg border border-info/40 bg-info/10 px-4 py-3 text-sm text-info">
              <Lock className="h-4 w-4 shrink-0" />
              <span>
                <span className="font-semibold">Read-only.</span> You are viewing as
                Executive. Switch to Admin to edit these settings.
              </span>
            </div>
          )}

          {/* Config summary */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard
              label="Detection"
              value={settings.general.enabled ? "Enabled" : "Disabled"}
              sub={
                settings.general.schedule === "daily"
                  ? `Daily · ${settings.general.dailyTime}`
                  : settings.general.schedule === "hourly"
                    ? "Runs hourly"
                    : "Real-time"
              }
              tone={settings.general.enabled ? "success" : "destructive"}
              icon={ShieldCheck}
            />
            <KpiCard
              label="Active Rules"
              value={`${activeRules}/${settings.rules.length}`}
              sub="Rule-based checks on"
              tone="info"
              icon={ClipboardList}
            />
            <KpiCard
              label="Alert Trigger"
              value={settings.alerts.minSegment}
              sub={`SLA ${settings.alerts.slaHours}h`}
              tone="warning"
              icon={BellRing}
            />
            <KpiCard
              label="Watchlisted"
              value={settings.watchlist.providers.length + settings.watchlist.members.length}
              sub={`${settings.watchlist.providers.length} providers · ${settings.watchlist.members.length} members`}
              tone="destructive"
              icon={ShieldAlert}
            />
          </div>

          {/* Nav + content */}
          <div className="grid gap-6 lg:grid-cols-[232px_minmax(0,1fr)]">
            <nav
              aria-label="Settings sections"
              className="min-w-0 lg:sticky lg:top-20 lg:self-start"
            >
              <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
                {SECTIONS.map((s) => {
                  const Icon = s.icon;
                  const isActive = activeSection === s.id;
                  return (
                    <li key={s.id} className="shrink-0">
                      <button
                        onClick={() => setActiveSection(s.id)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground/80 hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="whitespace-nowrap lg:whitespace-normal">
                          {s.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="min-w-0 space-y-4">
              {activeSection === "general" && (
                <GeneralSection settings={settings} update={update} readOnly={readOnly} />
              )}
              {activeSection === "rfm" && (
                <RfmSection
                  settings={settings}
                  update={update}
                  readOnly={readOnly}
                  weightSum={weightSum}
                  weightsValid={weightsValid}
                />
              )}
              {activeSection === "rules" && (
                <RulesSection settings={settings} update={update} readOnly={readOnly} />
              )}
              {activeSection === "anomaly" && (
                <AnomalySection settings={settings} update={update} readOnly={readOnly} />
              )}
              {activeSection === "cross" && (
                <CrossInsurerSection settings={settings} update={update} readOnly={readOnly} />
              )}
              {activeSection === "watchlist" && (
                <WatchlistSection settings={settings} update={update} readOnly={readOnly} />
              )}
              {activeSection === "alerts" && (
                <AlertsSection settings={settings} update={update} readOnly={readOnly} />
              )}
            </div>
          </div>
        </>
      )}

      {/* Review drawer (Review Queue) */}
      <ReviewDrawer row={activeRow} onClose={() => setActiveRow(null)} />

      {/* Sticky save footer — only while Settings tab is active */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md transition-transform md:left-[260px]",
          settingsActive && dirty && !readOnly ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 text-sm">
            {weightsValid ? (
              <span className="flex items-center gap-1.5 text-warning">
                <AlertTriangle className="h-4 w-4" />
                You have unsaved changes
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                RFM weights must total 100% before saving (currently {weightSum}%)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              disabled={savingState === "saving"}
            >
              Discard
            </Button>
            <Button size="sm" className="gap-2" onClick={handleSave} disabled={!canSave}>
              {savingState === "saving" ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Save changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
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

// ---------- Settings shared field wrappers ----------

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-background px-4 py-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

type SectionProps = {
  settings: FraudSettings;
  update: (m: (draft: FraudSettings) => void) => void;
  readOnly: boolean;
};

// ---------- 1) General ----------

function GeneralSection({ settings, update, readOnly }: SectionProps) {
  const g = settings.general;
  const [testing, setTesting] = useState(false);
  const [lastSync, setLastSync] = useState("Today, 08:42");

  return (
    <>
      <Panel title="General" subtitle="Master switch and detection schedule">
        <div className="space-y-4">
          <ToggleRow
            label="Enable fraud detection"
            hint="Master switch for all rules, RFM scoring, and alerts."
            checked={g.enabled}
            onCheckedChange={(v) => update((d) => (d.general.enabled = v))}
            disabled={readOnly}
          />

          <Field
            label="Detection run schedule"
            hint="How often claims are re-scored and re-evaluated against rules."
          >
            <RadioGroup
              value={g.schedule}
              onValueChange={(v) =>
                update((d) => (d.general.schedule = v as typeof g.schedule))
              }
              disabled={readOnly || !g.enabled}
              className="grid gap-2 sm:grid-cols-3"
            >
              {[
                { v: "realtime", label: "Real-time", hint: "On each claim submission" },
                { v: "hourly", label: "Hourly", hint: "Batch every hour" },
                { v: "daily", label: "Daily", hint: "Once per day" },
              ].map((opt) => (
                <label
                  key={opt.v}
                  htmlFor={`sched-${opt.v}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm transition-colors",
                    g.schedule === opt.v
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent/40",
                    (readOnly || !g.enabled) && "cursor-not-allowed opacity-60",
                  )}
                >
                  <RadioGroupItem id={`sched-${opt.v}`} value={opt.v} className="mt-0.5" />
                  <span>
                    <span className="block font-medium">{opt.label}</span>
                    <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </Field>

          {g.schedule === "daily" && (
            <Field label="Daily run time" hint="Local time (Asia/Bangkok).">
              <Input
                type="time"
                value={g.dailyTime}
                onChange={(e) => update((d) => (d.general.dailyTime = e.target.value))}
                disabled={readOnly || !g.enabled}
                className="w-40"
              />
            </Field>
          )}
        </div>
      </Panel>

      <Panel title="Data source" subtitle="Internal claim data-warehouse connection">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-background p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-muted text-foreground">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Claim Data Warehouse</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> Connected
                </span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Internal warehouse · last sync {lastSync}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={readOnly || testing}
            onClick={() => {
              setTesting(true);
              window.setTimeout(() => {
                setTesting(false);
                setLastSync("Today, just now");
                toast.success("Connection healthy", {
                  description: "Data warehouse responded in 240ms.",
                });
              }, 900);
            }}
          >
            {testing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Testing…
              </>
            ) : (
              <>
                <Activity className="h-4 w-4" /> Test connection
              </>
            )}
          </Button>
        </div>
      </Panel>
    </>
  );
}

// ---------- 2) RFM Segmentation ----------

function RfmSection({
  settings,
  update,
  readOnly,
  weightSum,
  weightsValid,
}: SectionProps & { weightSum: number; weightsValid: boolean }) {
  const { weights, cutoffs } = settings.rfm;
  const [sample, setSample] = useState(78);
  const sampleSegment = scoreToSegment(sample, cutoffs);

  const weightItems: { key: keyof typeof weights; label: string }[] = [
    { key: "recency", label: "Recency" },
    { key: "frequency", label: "Frequency" },
    { key: "monetary", label: "Monetary" },
  ];

  const cutoffItems: { key: keyof typeof cutoffs; segment: Segment }[] = [
    { key: "critical", segment: "Critical" },
    { key: "high", segment: "High" },
    { key: "medium", segment: "Medium" },
    { key: "monitor", segment: "Monitor" },
  ];

  return (
    <>
      <Panel
        title="RFM weights"
        subtitle="Contribution of each dimension to the composite score (must total 100%)"
        actions={
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums",
              weightsValid
                ? "border-success/30 bg-success/15 text-success"
                : "border-destructive/30 bg-destructive/15 text-destructive",
            )}
          >
            {weightsValid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            Total {weightSum}%
          </span>
        }
      >
        <div className="space-y-5">
          {weightItems.map((w) => (
            <div key={w.key}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <Label className="font-medium">{w.label}</Label>
                <span className="font-semibold tabular-nums">{weights[w.key]}%</span>
              </div>
              <Slider
                value={[weights[w.key]]}
                min={0}
                max={100}
                step={5}
                disabled={readOnly}
                onValueChange={([v]) => update((d) => (d.rfm.weights[w.key] = v))}
              />
            </div>
          ))}
          {!weightsValid && (
            <p className="text-xs text-destructive">
              Weights currently total {weightSum}%. Adjust so Recency + Frequency + Monetary = 100%.
            </p>
          )}
        </div>
      </Panel>

      <Panel
        title="Segment cut-offs"
        subtitle="Minimum composite score (0–100) that maps a member to each segment"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {cutoffItems.map((c) => (
            <div
              key={c.key}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md border p-3",
                SEGMENT_STYLES[c.segment],
              )}
            >
              <SegmentPill segment={c.segment} />
              <div className="flex items-center gap-1.5">
                <span className="text-xs opacity-80">score ≥</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={cutoffs[c.key]}
                  disabled={readOnly}
                  onChange={(e) =>
                    update((d) => (d.rfm.cutoffs[c.key] = Number(e.target.value)))
                  }
                  className="h-8 w-20 bg-background tabular-nums"
                />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 p-3">
            <SegmentPill segment="Low" />
            <span className="text-xs text-muted-foreground">
              anything below {cutoffs.monitor}
            </span>
          </div>
        </div>
      </Panel>

      <Panel title="Live preview" subtitle="See which segment a sample score maps to">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <Label className="font-medium">Sample composite score</Label>
            <span className="text-2xl font-bold tabular-nums">{sample}</span>
          </div>
          <Slider
            value={[sample]}
            min={0}
            max={100}
            step={1}
            onValueChange={([v]) => setSample(v)}
          />
          <div className="flex items-center gap-3 rounded-md border border-border bg-background p-4">
            <span className="text-sm text-muted-foreground">Resulting segment</span>
            <span className="text-lg">→</span>
            <SegmentPill segment={sampleSegment} />
          </div>
        </div>
      </Panel>
    </>
  );
}

// ---------- 3) Rules ----------

function RulesSection({ settings, update, readOnly }: SectionProps) {
  function addRule() {
    update((d) => {
      d.rules.push({
        id: `r${Date.now()}`,
        name: "Custom rule",
        severity: "Medium",
        enabled: true,
        params: [{ key: "threshold", label: "Threshold", type: "count", value: 1 }],
      });
    });
  }

  return (
    <Panel
      title="Rule-based checks"
      subtitle="Deterministic checks that generate Rule signals on the Review Queue"
      actions={
        <Button size="sm" className="h-8 gap-1.5" onClick={addRule} disabled={readOnly}>
          <Plus className="h-4 w-4" /> Add custom rule
        </Button>
      }
      bodyClassName="p-0"
    >
      <div className="divide-y divide-border">
        {settings.rules.map((rule, idx) => (
          <div key={rule.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Switch
                  checked={rule.enabled}
                  disabled={readOnly}
                  onCheckedChange={(v) => update((d) => (d.rules[idx].enabled = v))}
                  aria-label={`Enable ${rule.name}`}
                />
                <div>
                  <div className="text-sm font-medium leading-snug">{rule.name}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <SeverityBadge severity={rule.severity} />
                    <Select
                      value={rule.severity}
                      onValueChange={(v) =>
                        update((d) => (d.rules[idx].severity = v as Severity))
                      }
                      disabled={readOnly}
                    >
                      <SelectTrigger className="h-7 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              {rule.id.startsWith("r") && Number(rule.id.slice(1)) > 1000000000 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  disabled={readOnly}
                  onClick={() => update((d) => d.rules.splice(idx, 1))}
                  aria-label="Remove rule"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {(rule.params.length > 0 || rule.watchlistToggle) && (
              <div
                className={cn(
                  "mt-3 grid gap-3 pl-11 sm:grid-cols-2 lg:grid-cols-3",
                  !rule.enabled && "opacity-50",
                )}
              >
                {rule.params.map((p, pIdx) => (
                  <div key={p.key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{p.label}</Label>
                    <div className="flex items-center gap-1.5">
                      {p.type === "amount" && (
                        <span className="text-sm text-muted-foreground">฿</span>
                      )}
                      <Input
                        type="number"
                        value={p.value}
                        disabled={readOnly || !rule.enabled}
                        onChange={(e) =>
                          update(
                            (d) =>
                              (d.rules[idx].params[pIdx].value = Number(e.target.value)),
                          )
                        }
                        className="h-8 tabular-nums"
                      />
                      {p.type !== "amount" && (
                        <span className="text-xs text-muted-foreground">
                          {paramSuffix[p.type]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {rule.watchlistToggle && (
                  <div className="flex items-center gap-2 self-end pb-1 text-xs text-muted-foreground">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Uses the Watchlist / Blacklist entries
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ---------- 4) Anomaly & Network ----------

function AnomalySection({ settings, update, readOnly }: SectionProps) {
  const a = settings.anomaly;
  return (
    <>
      <Panel
        title="Anomaly detection"
        subtitle="Statistical outliers vs. peer group generate Anomaly signals"
      >
        <div className="space-y-5">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <Label className="font-medium">Z-score threshold</Label>
              <span className="font-semibold tabular-nums">{a.zScore.toFixed(1)}σ</span>
            </div>
            <Slider
              value={[a.zScore]}
              min={1}
              max={5}
              step={0.1}
              disabled={readOnly}
              onValueChange={([v]) =>
                update((d) => (d.anomaly.zScore = Math.round(v * 10) / 10))
              }
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Flag members whose behavior exceeds this many standard deviations from their peer group.
            </p>
          </div>
          <Field
            label="Minimum peer-group size"
            hint="Skip anomaly scoring when the comparison group is smaller than this."
          >
            <Input
              type="number"
              min={2}
              value={a.minPeerGroup}
              disabled={readOnly}
              onChange={(e) => update((d) => (d.anomaly.minPeerGroup = Number(e.target.value)))}
              className="w-40 tabular-nums"
            />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Network cluster detection"
        subtitle="Groups of members sharing suspicious attributes generate Network signals"
      >
        <div className="space-y-5">
          <Field
            label="Minimum members in a cluster"
            hint="A cluster is flagged only when at least this many members match."
          >
            <Input
              type="number"
              min={2}
              value={a.networkMinMembers}
              disabled={readOnly}
              onChange={(e) =>
                update((d) => (d.anomaly.networkMinMembers = Number(e.target.value)))
              }
              className="w-40 tabular-nums"
            />
          </Field>
          <Field label="Match fields" hint="Attributes that must match to form a cluster.">
            <div className="grid gap-2 sm:grid-cols-2">
              {NETWORK_FIELDS.map((f) => {
                const checked = a.matchFields.includes(f);
                return (
                  <label
                    key={f}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm transition-colors",
                      checked ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40",
                      readOnly && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={readOnly}
                      onCheckedChange={(v) =>
                        update((d) => {
                          if (v) d.anomaly.matchFields.push(f);
                          else
                            d.anomaly.matchFields = d.anomaly.matchFields.filter(
                              (x) => x !== f,
                            );
                        })
                      }
                    />
                    {f}
                  </label>
                );
              })}
            </div>
          </Field>
        </div>
      </Panel>
    </>
  );
}

// ---------- 5) Cross-Insurer ----------

function CrossInsurerSection({ settings, update, readOnly }: SectionProps) {
  const c = settings.crossInsurer;
  return (
    <>
      <Panel
        title="Match criteria"
        subtitle="How a claim is matched across insurers to detect duplicate submissions"
      >
        <div className="space-y-3">
          <label
            className={cn(
              "flex items-center gap-2 rounded-md border border-border p-3 text-sm",
              readOnly && "opacity-60",
            )}
          >
            <Checkbox
              checked={c.procedureCode}
              disabled={readOnly}
              onCheckedChange={(v) => update((d) => (d.crossInsurer.procedureCode = !!v))}
            />
            Procedure code
          </label>

          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 text-sm",
              readOnly && "opacity-60",
            )}
          >
            <label className="flex items-center gap-2">
              <Checkbox
                checked={c.treatmentDate}
                disabled={readOnly}
                onCheckedChange={(v) => update((d) => (d.crossInsurer.treatmentDate = !!v))}
              />
              Treatment date
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">± window</span>
              <Input
                type="number"
                min={0}
                value={c.dateWindowDays}
                disabled={readOnly || !c.treatmentDate}
                onChange={(e) =>
                  update((d) => (d.crossInsurer.dateWindowDays = Number(e.target.value)))
                }
                className="h-8 w-16 tabular-nums"
              />
              <span className="text-xs text-muted-foreground">days</span>
            </div>
          </div>

          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 text-sm",
              readOnly && "opacity-60",
            )}
          >
            <label className="flex items-center gap-2">
              <Checkbox
                checked={c.amountTolerance}
                disabled={readOnly}
                onCheckedChange={(v) => update((d) => (d.crossInsurer.amountTolerance = !!v))}
              />
              Amount tolerance
            </label>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                value={c.amountTolerancePct}
                disabled={readOnly || !c.amountTolerance}
                onChange={(e) =>
                  update((d) => (d.crossInsurer.amountTolerancePct = Number(e.target.value)))
                }
                className="h-8 w-16 tabular-nums"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>

          <label
            className={cn(
              "flex items-center gap-2 rounded-md border border-border p-3 text-sm",
              readOnly && "opacity-60",
            )}
          >
            <Checkbox
              checked={c.provider}
              disabled={readOnly}
              onCheckedChange={(v) => update((d) => (d.crossInsurer.provider = !!v))}
            />
            Provider
          </label>
        </div>
      </Panel>

      <Panel
        title="Participating insurers"
        subtitle="Cross-insurer duplicates are only checked against selected insurers"
        actions={
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Layers className="h-3 w-3" /> {c.insurers.length} selected
          </span>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {ALL_INSURERS.map((ins) => {
            const checked = c.insurers.includes(ins);
            return (
              <label
                key={ins}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm transition-colors",
                  checked ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40",
                  readOnly && "cursor-not-allowed opacity-60",
                )}
              >
                <Checkbox
                  checked={checked}
                  disabled={readOnly}
                  onCheckedChange={(v) =>
                    update((d) => {
                      if (v) d.crossInsurer.insurers.push(ins);
                      else
                        d.crossInsurer.insurers = d.crossInsurer.insurers.filter(
                          (x) => x !== ins,
                        );
                    })
                  }
                />
                {ins}
              </label>
            );
          })}
        </div>
      </Panel>
    </>
  );
}

// ---------- 6) Watchlist ----------

function WatchlistTable({
  kind,
  entries,
  update,
  readOnly,
}: {
  kind: "providers" | "members";
  entries: WatchlistEntry[];
  update: SectionProps["update"];
  readOnly: boolean;
}) {
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");

  function add() {
    if (!name.trim() || !reason.trim()) return;
    update((d) => {
      d.watchlist[kind].push({
        id: `${kind}-${Date.now()}`,
        name: name.trim(),
        reason: reason.trim(),
        addedBy: "Admin",
      });
    });
    setName("");
    setReason("");
  }

  return (
    <Panel
      title={kind === "providers" ? "Providers" : "Members"}
      subtitle={`${entries.length} on watchlist`}
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-medium">
                {kind === "providers" ? "Provider" : "Member"}
              </th>
              <th className="px-4 py-2 text-left font-medium">Reason</th>
              <th className="px-4 py-2 text-left font-medium">Added by</th>
              <th className="px-4 py-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">
                  No entries yet.
                </td>
              </tr>
            ) : (
              entries.map((e) => {
                const globalIdx = entries.indexOf(e);
                return (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{e.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{e.reason}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{e.addedBy}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={readOnly}
                        aria-label="Remove entry"
                        onClick={() => update((d) => d.watchlist[kind].splice(globalIdx, 1))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <div className="flex flex-wrap items-end gap-2 border-t border-border p-4">
          <div className="min-w-[160px] flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">
              {kind === "providers" ? "Provider name / ID" : "Member ID / name"}
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={kind === "providers" ? "e.g. Bangkok Hospital" : "e.g. MBR-0012345"}
              className="h-9"
            />
          </div>
          <div className="min-w-[160px] flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Reason</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this being flagged?"
              className="h-9"
            />
          </div>
          <Button size="sm" className="h-9 gap-1.5" onClick={add} disabled={!name.trim() || !reason.trim()}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      )}
    </Panel>
  );
}

function WatchlistSection({ settings, update, readOnly }: SectionProps) {
  return (
    <>
      <WatchlistTable
        kind="providers"
        entries={settings.watchlist.providers}
        update={update}
        readOnly={readOnly}
      />
      <WatchlistTable
        kind="members"
        entries={settings.watchlist.members}
        update={update}
        readOnly={readOnly}
      />
    </>
  );
}

// ---------- 7) Alerts & Routing ----------

function AlertsSection({ settings, update, readOnly }: SectionProps) {
  const a = settings.alerts;
  return (
    <>
      <Panel title="Alert trigger" subtitle="When flagged cases should raise an alert">
        <Field
          label="Minimum segment that triggers an alert"
          hint="Cases in this segment or more severe will generate an alert."
        >
          <Select
            value={a.minSegment}
            onValueChange={(v) => update((d) => (d.alerts.minSegment = v as Segment))}
            disabled={readOnly}
          >
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEGMENT_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Panel>

      <Panel title="Channels" subtitle="Where alerts are delivered">
        <div className="space-y-3">
          <ToggleRow
            label="In-app notifications"
            hint="Show alerts in the notification bell."
            checked={a.inApp}
            onCheckedChange={(v) => update((d) => (d.alerts.inApp = v))}
            disabled={readOnly}
          />
          <ToggleRow
            label="Email notifications"
            hint="Send an email to selected recipients."
            checked={a.email}
            onCheckedChange={(v) => update((d) => (d.alerts.email = v))}
            disabled={readOnly}
          />
        </div>
      </Panel>

      <Panel
        title="Recipients"
        subtitle="Who receives fraud alerts"
        actions={
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users className="h-3 w-3" /> {a.recipients.length} selected
          </span>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {RECIPIENT_OPTIONS.map((r) => {
            const checked = a.recipients.includes(r);
            return (
              <label
                key={r}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm transition-colors",
                  checked ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40",
                  readOnly && "cursor-not-allowed opacity-60",
                )}
              >
                <Checkbox
                  checked={checked}
                  disabled={readOnly}
                  onCheckedChange={(v) =>
                    update((d) => {
                      if (v) d.alerts.recipients.push(r);
                      else d.alerts.recipients = d.alerts.recipients.filter((x) => x !== r);
                    })
                  }
                />
                {r}
              </label>
            );
          })}
        </div>
      </Panel>

      <Panel title="Auto-assignment" subtitle="Route flagged cases to reviewers automatically">
        <div className="space-y-4">
          <ToggleRow
            label="Auto-assign flagged cases to reviewers"
            hint="Distribute new flagged cases across the reviewer pool."
            checked={a.autoAssign}
            onCheckedChange={(v) => update((d) => (d.alerts.autoAssign = v))}
            disabled={readOnly}
          />
          <Field label="Review SLA" hint="Target time to first review after assignment.">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={a.slaHours}
                disabled={readOnly || !a.autoAssign}
                onChange={(e) => update((d) => (d.alerts.slaHours = Number(e.target.value)))}
                className="h-9 w-24 tabular-nums"
              />
              <span className="text-sm text-muted-foreground">hours</span>
            </div>
          </Field>
        </div>
      </Panel>
    </>
  );
}
