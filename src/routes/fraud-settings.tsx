import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ClipboardList,
  Cog,
  Database,
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
  Copy,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fraud-settings")({
  head: () => ({
    meta: [
      { title: "Fraud Detection Settings · Claim Ops" },
      {
        name: "description",
        content:
          "Configure RFM segmentation, rule-based checks, anomaly & network detection, cross-insurer matching, watchlists, and alert routing that power the Fraud Analysis page.",
      },
    ],
  }),
  component: FraudSettingsPage,
});

/* ----------------------------- Types ----------------------------- */

type Segment = "Critical" | "High" | "Medium" | "Monitor" | "Low";
type Severity = "High" | "Medium" | "Low";
type Role = "Admin" | "Executive";
type LoadState = "loading" | "ready" | "error";

const SEGMENT_ORDER: Segment[] = ["Critical", "High", "Medium", "Monitor", "Low"];

const SEGMENT_STYLES: Record<Segment, string> = {
  Critical: "bg-destructive/15 text-destructive border-destructive/40",
  High: "bg-warning/15 text-warning border-warning/40",
  Medium: "bg-warning/10 text-warning border-warning/25",
  Monitor: "bg-info/15 text-info border-info/40",
  Low: "bg-muted text-muted-foreground border-border",
};

const SEVERITY_STYLES: Record<Severity, string> = {
  High: "bg-destructive/15 text-destructive border-destructive/30",
  Medium: "bg-warning/15 text-warning border-warning/30",
  Low: "bg-muted text-muted-foreground border-border",
};

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

/* ----------------------------- Constants ----------------------------- */

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

/* ----------------------------- Default settings ----------------------------- */

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

/* ----------------------------- Helpers ----------------------------- */

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

/* ----------------------------- Section nav ----------------------------- */

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

/* ----------------------------- Page ----------------------------- */

function FraudSettingsPage() {
  const [role, setRole] = useState<Role>("Admin");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [active, setActive] = useState<SectionId>("general");
  const [settings, setSettings] = useState<FraudSettings>(() => clone(DEFAULT_SETTINGS));
  const [saved, setSaved] = useState<FraudSettings>(() => clone(DEFAULT_SETTINGS));
  const [savingState, setSavingState] = useState<"idle" | "saving">("idle");

  const readOnly = role === "Executive";

  // Simulated load of persisted settings.
  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");
    const t = window.setTimeout(() => {
      if (cancelled) return;
      // Flip to "error" if a transient failure was injected (kept false in mock).
      setSettings(clone(DEFAULT_SETTINGS));
      setSaved(clone(DEFAULT_SETTINGS));
      setLoadState("ready");
    }, 750);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

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

  function handleSave() {
    if (!canSave) return;
    setSavingState("saving");
    window.setTimeout(() => {
      setSaved(clone(settings));
      setSavingState("idle");
      toast.success("Saved successfully", {
        description: "Fraud detection settings are now live on the Fraud Analysis page.",
      });
    }, 650);
  }

  function handleDiscard() {
    setSettings(clone(saved));
    toast("Changes discarded");
  }

  const activeRules = settings.rules.filter((r) => r.enabled).length;

  /* ---------------- Loading ---------------- */
  if (loadState === "loading") {
    return <SettingsSkeleton />;
  }

  /* ---------------- Error ---------------- */
  if (loadState === "error") {
    return (
      <div className="space-y-6">
        <PageHeader role={role} setRole={setRole} />
        <Panel title="Settings unavailable" subtitle="We couldn't load your configuration">
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-destructive/15 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              The fraud settings service did not respond. Your previous configuration is
              still active — retry to edit it.
            </p>
            <Button
              className="gap-2"
              onClick={() => {
                setLoadState("loading");
                window.setTimeout(() => setLoadState("ready"), 750);
              }}
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  /* ---------------- Ready ---------------- */
  return (
    <div className="space-y-6 pb-24">
      <PageHeader role={role} setRole={setRole} />

      {readOnly && (
        <div className="flex items-center gap-2 rounded-lg border border-info/40 bg-info/10 px-4 py-3 text-sm text-info">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">Read-only.</span> You are viewing as Executive.
            Switch to Admin to edit these settings.
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
        {/* Section nav */}
        <nav
          aria-label="Settings sections"
          className="min-w-0 lg:sticky lg:top-20 lg:self-start"
        >
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = active === s.id;
              return (
                <li key={s.id} className="shrink-0">
                  <button
                    onClick={() => setActive(s.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground/80 hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap lg:whitespace-normal">{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content */}
        <div className="min-w-0 space-y-4">
          {active === "general" && (
            <GeneralSection settings={settings} update={update} readOnly={readOnly} />
          )}
          {active === "rfm" && (
            <RfmSection
              settings={settings}
              update={update}
              readOnly={readOnly}
              weightSum={weightSum}
              weightsValid={weightsValid}
            />
          )}
          {active === "rules" && (
            <RulesSection settings={settings} update={update} readOnly={readOnly} />
          )}
          {active === "anomaly" && (
            <AnomalySection settings={settings} update={update} readOnly={readOnly} />
          )}
          {active === "cross" && (
            <CrossInsurerSection settings={settings} update={update} readOnly={readOnly} />
          )}
          {active === "watchlist" && (
            <WatchlistSection settings={settings} update={update} readOnly={readOnly} />
          )}
          {active === "alerts" && (
            <AlertsSection settings={settings} update={update} readOnly={readOnly} />
          )}
        </div>
      </div>

      {/* Sticky save footer */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md transition-transform md:left-[260px]",
          dirty && !readOnly ? "translate-y-0" : "translate-y-full",
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
            <Button variant="ghost" size="sm" onClick={handleDiscard} disabled={savingState === "saving"}>
              Discard
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={handleSave}
              disabled={!canSave}
            >
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

/* ----------------------------- Header ----------------------------- */

function PageHeader({
  role,
  setRole,
}: {
  role: Role;
  setRole: (r: Role) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            BVTPA · Fraud Review
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Fraud Detection Settings
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Configure the RFM model, rules, and routing that the Fraud Analysis page
            consumes.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Shared field wrappers ----------------------------- */

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

/* ----------------------------- 1) General ----------------------------- */

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

/* ----------------------------- 2) RFM Segmentation ----------------------------- */

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

/* ----------------------------- 3) Rules ----------------------------- */

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
      subtitle="Deterministic checks that generate Rule signals on the Fraud Analysis page"
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

/* ----------------------------- 4) Anomaly & Network ----------------------------- */

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

/* ----------------------------- 5) Cross-Insurer ----------------------------- */

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

/* ----------------------------- 6) Watchlist ----------------------------- */

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

/* ----------------------------- 7) Alerts & Routing ----------------------------- */

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

/* ----------------------------- Skeleton ----------------------------- */

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[232px_minmax(0,1fr)]">
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
