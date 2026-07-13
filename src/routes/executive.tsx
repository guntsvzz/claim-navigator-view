import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle,
  Banknote,
  Briefcase,
  Calendar,
  CheckCircle2,
  CreditCard,
  FileSignature,
  HandCoins,
  Heart,
  Lock,
  Mail,
  MessageSquare,
  Percent,
  Phone,
  Receipt,
  RefreshCw,
  Smartphone,
  Sparkles,
  Star,
  Swords,
  Target,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useView } from "@/lib/view-store";
import { insurers, providers, fmtBaht, fmtNum } from "@/lib/mock-data";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Panel } from "@/components/dashboard/panel";
import {
  ReadinessBadge,
  ReadinessLegend,
} from "@/components/dashboard/readiness";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/executive")({
  head: () => ({
    meta: [
      { title: "Executive Dashboard · KAM Meeting" },
      {
        name: "description",
        content:
          "Executive-level account view for KAM meetings: profile, engagement, revenue, profitability, behaviour, and growth strategy.",
      },
    ],
  }),
  component: ExecutivePage,
});

// ----- Mock account profile data -----
const accountProfiles: Record<
  string,
  {
    productLines: string[];
    distribution: string[];
    contacts: { name: string; role: string; email: string; phone: string }[];
    services: string[];
    serviceYears: number;
    contractStatus: "Active" | "Renewing" | "Expiring";
    renewalDate: string;
  }
> = {
  default: {
    productLines: ["PA", "Health", "Life", "Group Health"],
    distribution: ["Agent", "Broker", "Bancassurance", "Digital"],
    contacts: [
      { name: "คุณ สมชาย เจริญสุข", role: "CEO", email: "somchai@insurer.co.th", phone: "+66 2 123 4567" },
      { name: "คุณ มาลี วงศ์ดี", role: "Head of Claims", email: "malee@insurer.co.th", phone: "+66 2 123 4568" },
      { name: "คุณ ธนพล แก้วใส", role: "IT Director", email: "thanapol@insurer.co.th", phone: "+66 2 123 4569" },
    ],
    services: ["Claim Management", "Mobile App", "Pre-Authorization", "Provider Network"],
    serviceYears: 5.5,
    contractStatus: "Active",
    renewalDate: "2026-12-31",
  },
};

// Per-service / per-product contract renewal (LIVE — from contract records)
const serviceRenewals: {
  service: string;
  status: "Active" | "Inactive";
  expiry: string;
}[] = [
  { service: "Claim Management", status: "Active", expiry: "31 Dec 2026" },
  { service: "Mobile App", status: "Active", expiry: "31 Dec 2026" },
  { service: "Pre-Authorization", status: "Active", expiry: "30 Jun 2026" },
  { service: "Provider Network", status: "Active", expiry: "31 Dec 2026" },
  { service: "Telemedicine Add-on", status: "Inactive", expiry: "31 Dec 2024" },
];

// LIVE — from complaints/ticketing system
const complaints = [
  { type: "Service Delay", count: 14, trend: "up" as const },
  { type: "Claim Dispute", count: 9, trend: "down" as const },
  { type: "Document Loss", count: 4, trend: "flat" as const },
  { type: "System Issue", count: 3, trend: "down" as const },
];

// Contract milestones (Section 02) — LIVE, from contract records
const contractMilestones = [
  { date: "01 Sep 2020", label: "Initial Contract Signed", detail: "3-year master service agreement", status: "done" as const },
  { date: "01 Sep 2023", label: "Renewal · Term 2", detail: "Expanded to Group Health + Digital claim portal", status: "done" as const },
  { date: "01 Jan 2026", label: "Current Term", detail: "Active — SLA 95%, 4 product lines", status: "current" as const },
  { date: "31 Dec 2026", label: "Upcoming Renewal", detail: "Proposal due 30 Sep · target uplift +8%", status: "upcoming" as const },
];

// Section 03 — Revenue & volume (SAMPLE — no confirmed source)
const revenueByYear = [
  { year: "2021", revenue: 38_200_000 },
  { year: "2022", revenue: 44_500_000 },
  { year: "2023", revenue: 52_100_000 },
  { year: "2024", revenue: 61_800_000 },
  { year: "2025", revenue: 72_900_000 },
  { year: "2026", revenue: 84_300_000 },
];

const volumeByYear = [
  { year: "2021", policies: 12_400, members: 48_600 },
  { year: "2022", policies: 14_100, members: 55_800 },
  { year: "2023", policies: 16_300, members: 63_200 },
  { year: "2024", policies: 18_900, members: 71_400 },
  { year: "2025", policies: 21_800, members: 80_900 },
  { year: "2026", policies: 24_600, members: 91_200 },
];

const actualVsYtd = [
  { period: "2023", premium: 52.1, ytd: 0 },
  { period: "2024", premium: 61.8, ytd: 0 },
  { period: "2025", premium: 72.9, ytd: 0 },
  { period: "2026 YTD", premium: 0, ytd: 58.4 },
];

const seasonality = [
  { m: "Jan", v: 6.1 }, { m: "Feb", v: 5.8 }, { m: "Mar", v: 7.4 },
  { m: "Apr", v: 6.9 }, { m: "May", v: 7.8 }, { m: "Jun", v: 8.6 },
  { m: "Jul", v: 9.4 }, { m: "Aug", v: 10.2 }, { m: "Sep", v: 9.1 },
  { m: "Oct", v: 8.4 }, { m: "Nov", v: 7.9 }, { m: "Dec", v: 6.7 },
];

// Section 05 — Financial discipline (SAMPLE — pending Finance/survey data)
const competitors = [
  { name: "This Account", price: "Baseline", service: 94, nps: 48, network: 320, us: true },
  { name: "Competitor A (AXA-like)", price: "−4%", service: 91, nps: 42, network: 280, us: false },
  { name: "Competitor B (Allianz-like)", price: "+2%", service: 89, nps: 39, network: 340, us: false },
  { name: "Competitor C (Local)", price: "−7%", service: 86, nps: 31, network: 240, us: false },
];

// Section 05 — Renewal histogram (MANUAL · BD+KAM)
const renewalHistory = [
  { year: "2020", rate: 91 },
  { year: "2021", rate: 93 },
  { year: "2022", rate: 94 },
  { year: "2023", rate: 95 },
  { year: "2024", rate: 95 },
  { year: "2025", rate: 96 },
];

// Section 05 — AI upsell suggestions (AI · review)
const upsellSuggestions = [
  {
    product: "Chronic Care Rider",
    rationale: "Diabetes claims up 22% YoY — high-risk members likely to benefit from managed-care coverage.",
    source: "Claim trend",
  },
  {
    product: "Telemedicine Add-on",
    rationale: "OPD utilisation 68%; digital pre-auth already in use — low-friction upsell with no network dependency.",
    source: "Claim trend · KAM",
  },
  {
    product: "Group Health SME Extension",
    rationale: "Client expanding workforce by ~15% (BD note); current group plan cap may be reached by Q3 2026.",
    source: "BD note",
  },
];

// Section 05 — Churn risk drivers (AI/KAM estimate — not a measured score)
const churnDrivers = [
  { driver: "Premium increase > 8% at renewal", tone: "destructive" as const },
  { driver: "SLA breach on high-cost claims", tone: "destructive" as const },
  { driver: "Slow pre-authorisation turnaround", tone: "warning" as const },
  { driver: "Provider network gaps (upcountry)", tone: "warning" as const },
  { driver: "Limited digital self-service", tone: "info" as const },
];

// Section 06 — Growth direction narrative (AI · review)
const growthNarrative = {
  sentences: [
    "Client is actively moving toward digital self-service — their IT Director confirmed a portal RFP planned for Q3 2026.",
    "Workforce expansion of ~15% expected before year-end, which is likely to trigger a new group-health plan or rider.",
    "Chronic-disease prevalence in the covered population (hypertension, diabetes) is rising, signalling growing demand for managed-care and wellness bundles.",
    "Public social-listening signals show increased awareness of telemedicine benefits among their industry peers.",
  ],
  sources: ["BD note", "IT Director (KAM)", "Claim trend", "Social listening"],
};

// Section 06 — Opportunities to prepare (AI-suggested · reviewable)
const growthOpportunities = [
  {
    title: "Digital Self-Service Portal",
    lens: "Digital Integration",
    rationale: "Client IT Director confirmed portal RFP for Q3 2026 — we should pre-brief on our API capability.",
    sources: ["BD note", "IT Director (KAM)"],
    impact: "High",
    effort: "Medium",
  },
  {
    title: "Telemedicine Claim Auto-Approval",
    lens: "Automation",
    rationale: "OPD volume and telemedicine add-on usage create a clear workflow for pre-auth automation.",
    sources: ["Claim trend"],
    impact: "High",
    effort: "High",
  },
  {
    title: "Group Health SME Extension",
    lens: "New Product",
    rationale: "Workforce growth projection will exceed current plan cap — propose expanded group scheme early.",
    sources: ["BD note"],
    impact: "Medium",
    effort: "Low",
  },
  {
    title: "Wellness Program Bundle",
    lens: "New Product",
    rationale: "Rising chronic-disease claims make a preventive-wellness rider commercially viable and differentiating.",
    sources: ["Claim trend", "KAM"],
    impact: "Medium",
    effort: "Medium",
  },
  {
    title: "ESG-aligned Green Hospital Network",
    lens: "ESG / Compliance",
    rationale: "Client's new ESG policy (FY2026 report) mentions green procurement — positions us ahead of RFP criteria.",
    sources: ["Social listening", "BD note"],
    impact: "Low",
    effort: "Medium",
  },
];

function ExecutivePage() {
  const { view, entityId, setEntityId } = useView();
  const list = view === "insurer" ? insurers : providers;
  const profile = accountProfiles.default;
  const isOverview = entityId === "ALL";
  const entity = list.find((e) => e.id === entityId);
  const accountLabel = isOverview
    ? view === "insurer"
      ? "All Insurers"
      : "All Providers"
    : entity?.name_en ?? "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Executive Dashboard · KAM Meeting
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{accountLabel}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Strategic account view for relationship managers — profile, engagement, revenue, profitability, behaviour, and growth.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Read-only
            </span>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <Select value={entityId} onValueChange={setEntityId}>
                <SelectTrigger className="h-9 w-[280px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    <span className="mr-2 font-mono text-xs text-muted-foreground">ALL</span>
                    {view === "insurer" ? "All Insurers" : "All Providers"} (Overview)
                  </SelectItem>
                  {list.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <span className="mr-2 font-mono text-xs text-muted-foreground">{e.code}</span>
                      {e.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold">Next KAM Meeting:</span>
              <span className="text-muted-foreground">16 Mar 2026</span>
            </div>
          </div>
        </div>

        {/* Page-level note + readiness legend */}
        <div className="mt-4 border-t border-border pt-4 space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Some figures are sample data for demonstration — look for the{" "}
            <span className="inline-flex items-center gap-0.5 font-semibold">Sample</span>{" "}
            badge.
          </p>
          <ReadinessLegend />
        </div>
      </section>

      {/* Executive KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Annual Revenue" value="฿84.3M" sub="FY 2026 estimate" delta={15.6} icon={Banknote} tone="success" readiness="sample" />
        <KpiCard label="Gross Margin" value="41%" sub="Revenue – claims cost" delta={1.2} icon={Percent} tone="success" readiness="sample" />
        <KpiCard label="Loss Ratio" value="59%" sub="Claims / Premium" delta={-0.8} icon={Receipt} readiness="sample" />
        <KpiCard label="SLA Performance" value="94.2%" sub="Met / Total cases" delta={2.1} icon={CheckCircle2} tone="success" readiness="live" />
        <KpiCard label="NPS Score" value="+48" sub="Last survey · Q4 2025" delta={3} icon={Heart} tone="success" readiness="sample" />
        <KpiCard label="Renewal Probability" value="92%" sub="Model estimate" delta={1} icon={RefreshCw} tone="success" readiness="sample" />
      </div>

      {/* 1. Account Profile */}
      <SectionHeader index="01" title="Account Profile" subtitle="Who they are, what they buy from us" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Product / Business Lines"
          subtitle="Lines of business active with this account"
          actions={<ReadinessBadge state="manual" />}
        >
          <div className="flex flex-wrap gap-2">
            {profile.productLines.map((p) => (
              <span key={p} className="rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                {p}
              </span>
            ))}
          </div>
          <div className="mt-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Distribution Model
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.distribution.map((d) => (
                <span key={d} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm">
                  {d}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subscribed Services
            </div>
            <ul className="space-y-1.5 text-sm">
              {profile.services.map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel
          className="xl:col-span-2"
          title="Key Contacts"
          subtitle="Primary stakeholders for engagement"
          actions={
            <>
              <ReadinessBadge state="manual" />
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Users className="h-3 w-3" /> {profile.contacts.length} contacts
              </span>
            </>
          }
        >
          <div className="grid gap-3 md:grid-cols-3">
            {profile.contacts.map((c) => (
              <div key={c.email} className="rounded-md border border-border bg-background p-3">
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="text-xs text-primary">{c.role}</div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> {c.email}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> {c.phone}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* 2. Relationship / Engagement */}
      <SectionHeader index="02" title="Relationship & Engagement" subtitle="Service quality and account health" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Service Years" value={`${profile.serviceYears} yrs`} sub="Since Sep 2020" icon={Calendar} readiness="live" />
        <KpiCard label="Contract Status" value={profile.contractStatus} sub={`Renews ${profile.renewalDate}`} icon={RefreshCw} tone="success" readiness="live" />
        <KpiCard label="SLA Met Rate" value="94.2%" sub="1,842 of 1,956 cases" icon={Target} tone="success" readiness="live" />
        <KpiCard label="Open Complaints" value="30" sub="MoM +3 cases" icon={AlertTriangle} tone="warning" readiness="live" />
        <KpiCard label="Digital Adoption" value="74%" sub="Mobile app active users" delta={6} icon={Smartphone} tone="info" readiness="sample" />
      </div>
      <Panel
        title="Contract History"
        subtitle="Start → current term → upcoming renewal"
        actions={
          <>
            <ReadinessBadge state="live" />
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <FileSignature className="h-3 w-3" /> {contractMilestones.length} milestones
            </span>
          </>
        }
      >
        <ol className="relative ml-2 space-y-4 border-l border-border pl-6">
          {contractMilestones.map((m) => {
            const dot =
              m.status === "current"
                ? "bg-primary ring-4 ring-primary/20"
                : m.status === "upcoming"
                  ? "bg-background border-2 border-warning"
                  : "bg-success";
            const badge =
              m.status === "current"
                ? "bg-primary/15 text-primary"
                : m.status === "upcoming"
                  ? "bg-warning/15 text-warning"
                  : null;
            return (
              <li key={m.date} className="relative">
                <span className={cn("absolute -left-[30px] top-1.5 h-3 w-3 rounded-full", dot)} />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">{m.date}</span>
                    {badge && (
                      <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", badge)}>
                        {m.status}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold">{m.label}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{m.detail}</p>
              </li>
            );
          })}
        </ol>
      </Panel>

      {/* Per-service contract renewal */}
      <Panel
        title="Contract Renewal by Service"
        subtitle="Each product / service with its own status and expiry"
        actions={<ReadinessBadge state="live" />}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="pb-2 text-left">Service / Product</th>
              <th className="pb-2 text-right">Status</th>
              <th className="pb-2 text-right">Expiry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {serviceRenewals.map((r) => (
              <tr key={r.service}>
                <td className="py-2.5 font-medium">{r.service}</td>
                <td className="py-2.5 text-right">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      r.status === "Active"
                        ? "border-success/30 bg-success/15 text-success"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {r.status === "Active" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {r.status}
                  </span>
                </td>
                <td className={cn("py-2.5 text-right font-mono tabular-nums", r.status === "Inactive" ? "text-destructive" : "text-muted-foreground")}>
                  {r.expiry}
                  {r.status === "Inactive" && r.expiry !== "—" && (
                    <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider">(expired)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Issues & Complaints"
          subtitle="Trend MoM by category"
          actions={<ReadinessBadge state="live" />}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 text-left">Type</th>
                <th className="pb-2 text-right">Count</th>
                <th className="pb-2 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {complaints.map((c) => (
                <tr key={c.type}>
                  <td className="py-2.5">{c.type}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{c.count}</td>
                  <td className="py-2.5 text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-semibold",
                        c.trend === "up" && "text-destructive",
                        c.trend === "down" && "text-success",
                        c.trend === "flat" && "text-muted-foreground",
                      )}
                    >
                      {c.trend === "up" ? "▲" : c.trend === "down" ? "▼" : "■"} {c.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel
          title="Claim Analysis Highlights"
          subtitle="Population utilization & top conditions"
          actions={<ReadinessBadge state="live" />}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-[11px] uppercase text-muted-foreground">OPD / IPD Split</div>
              <div className="mt-1 text-lg font-semibold">68% / 32%</div>
              <div className="text-xs text-muted-foreground">12,420 vs 5,840 claims</div>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-[11px] uppercase text-muted-foreground">Utilization Rate</div>
              <div className="mt-1 text-lg font-semibold">42.6%</div>
              <div className="text-xs text-muted-foreground">Active members / Total</div>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-[11px] uppercase text-muted-foreground">Avg Claim Amount</div>
              <div className="mt-1 text-lg font-semibold">฿11,900</div>
              <div className="text-xs text-muted-foreground">Across all events</div>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-[11px] uppercase text-muted-foreground">Top Diagnosis</div>
              <div className="mt-1 text-lg font-semibold">I10</div>
              <div className="text-xs text-muted-foreground">Hypertension · 1,820 cases</div>
            </div>
          </div>
        </Panel>
      </div>


      {/* 3. Business Volume / Revenue */}
      <SectionHeader index="03" title="Business Volume & Revenue" subtitle="Growth trajectory and product mix" />
      <Panel
        title="Revenue YoY"
        subtitle="Annual revenue trend — CAGR / YoY growth"
        actions={<ReadinessBadge state="sample" />}
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={revenueByYear} margin={{ left: -10, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="year" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `฿${fmtBaht(v)}`}
            />
            <Tooltip
              contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [`฿${fmtBaht(v)}`, "Revenue"]}
            />
            <Bar dataKey="revenue" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Policy & Member Growth"
          subtitle="Volume trend · last 6 years"
          actions={<ReadinessBadge state="sample" />}
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={volumeByYear} margin={{ left: -10, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="year" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${fmtBaht(v)}`} />
              <Tooltip
                contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => fmtNum(v)}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="policies" name="Policies" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="members" name="Members" stroke="var(--color-info)" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel
          title="3-yr Actual vs 2026 YTD"
          subtitle="Premium / Revenue (฿M)"
          actions={<ReadinessBadge state="sample" />}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={actualVsYtd} margin={{ left: -10, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="period" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}M`} />
              <Tooltip
                contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => `฿${v}M`}
              />
              <Bar dataKey="premium" name="Full-year Actual" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ytd" name="2026 YTD" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <Panel
        title="Seasonality Trend"
          subtitle="Monthly revenue of annual"
        actions={<ReadinessBadge state="sample" />}
      >
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={seasonality} margin={{ left: -10, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => `${v}%`}
            />
            <Line type="monotone" dataKey="v" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      {/* 4. Profitability */}
      <SectionHeader index="04" title="Profitability Analysis" subtitle="Margins, cost-to-serve and loss" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Gross Margin" value="41%" sub="Revenue – claims cost" delta={1.2} icon={TrendingUp} tone="success" readiness="sample" />
        <KpiCard label="Net Margin" value="18%" sub="After all expenses" delta={0.4} icon={Percent} readiness="sample" />
        <KpiCard label="Cost to Serve" value="฿2,840" sub="Per policy / year" delta={-1.1} icon={HandCoins} tone="success" readiness="sample" />
        <KpiCard label="Loss Ratio" value="59%" sub="Claims / Premium" delta={-0.8} icon={Receipt} readiness="sample" />
      </div>
      <Panel
        title="Contribution by Product Line"
        subtitle="Revenue + margin per line"
        actions={<ReadinessBadge state="sample" />}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="pb-2 text-left">Product Line</th>
              <th className="pb-2 text-right">Revenue</th>
              <th className="pb-2 text-right">Share</th>
              <th className="pb-2 text-right">Gross Margin</th>
              <th className="pb-2 text-right">Loss Ratio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[
              { name: "Health", rev: 32_000_000, share: 38, gm: 41, lr: 60 },
              { name: "PA", rev: 20_200_000, share: 24, gm: 44, lr: 55 },
              { name: "Group Health", rev: 18_500_000, share: 22, gm: 33, lr: 68 },
              { name: "Life", rev: 13_600_000, share: 16, gm: 36, lr: 64 },
            ].map((r) => (
              <tr key={r.name}>
                <td className="py-2.5 font-medium">{r.name}</td>
                <td className="py-2.5 text-right font-mono tabular-nums">฿{fmtBaht(r.rev)}</td>
                <td className="py-2.5 text-right font-mono tabular-nums">{r.share}%</td>
                <td className="py-2.5 text-right font-mono tabular-nums">{r.gm}%</td>
                <td className="py-2.5 text-right font-mono tabular-nums">{r.lr}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {/* 5. Customer Behaviour */}
      <SectionHeader index="05" title="Customer Behaviour" subtitle="Loyalty, satisfaction, financial discipline" />

      {/* Renewal Rate — histogram */}
      <Panel
        title="Renewal Rate · Historical"
        subtitle="Annual renewal consistency — BD + KAM maintained"
        actions={
          <>
            <ReadinessBadge state="manual" />
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <RefreshCw className="h-3 w-3" /> Overall 96%
            </span>
          </>
        }
      >
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={renewalHistory} margin={{ left: -16, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="year" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[85, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => [`${v}%`, "Renewal Rate"]}
            />
            <Bar dataKey="rate" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      {/* Upsell / Cross-sell — AI suggestion */}
      <Panel
        title="Upsell & Cross-sell Opportunities"
        subtitle="AI analysis of claim trends and BD notes — review before presenting"
        actions={
          <>
            <ReadinessBadge state="ai" />
            <span className="inline-flex items-center gap-1 text-[11px] text-primary">
              <Sparkles className="h-3 w-3" /> AI suggestion · review
            </span>
          </>
        }
      >
        <ul className="space-y-3">
          {upsellSuggestions.map((s) => (
            <li
              key={s.product}
              className="flex items-start justify-between gap-4 rounded-md border border-primary/20 bg-primary/5 p-3"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm">{s.product}</span>
                  <SourceChip label={s.source} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.rationale}</p>
              </div>
              {/* Confirm/dismiss hidden on read-only executive view */}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-muted-foreground italic">
          AI-generated from claim trends and BD notes — confirm with KAM before presenting to client.
        </p>
      </Panel>

      {/* Churn Risk & Drivers */}
      <Panel
        title="Churn Risk & Drivers"
        subtitle="KAM/AI judgement estimate — not a measured score"
        actions={<ReadinessBadge state="ai" />}
      >
        <ul className="space-y-2.5">
          {churnDrivers.map((d) => {
            const dotColor =
              d.tone === "destructive"
                ? "bg-destructive"
                : d.tone === "warning"
                  ? "bg-warning"
                  : "bg-info";
            const label =
              d.tone === "destructive" ? "High" : d.tone === "warning" ? "Medium" : "Low";
            const labelColor =
              d.tone === "destructive"
                ? "text-destructive"
                : d.tone === "warning"
                  ? "text-warning"
                  : "text-info";
            return (
              <li key={d.driver} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", dotColor)} />
                  {d.driver}
                </span>
                <span className={cn("shrink-0 text-xs font-semibold", labelColor)}>{label} risk</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[11px] text-muted-foreground italic">
          Drivers reflect KAM judgement — not a statistically measured churn index.
        </p>
      </Panel>

      {/* Financial discipline & satisfaction — sample KPI cards */}
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Price Sensitivity" value="Low" sub="Estimated elasticity" icon={Target} readiness="sample" />
        <KpiCard label="CSAT / NPS" value="+48" sub="Q4 2025 survey" delta={3} icon={Heart} tone="success" readiness="sample" />
        <KpiCard label="DSO" value="22 days" sub="Days sales outstanding" delta={-2} icon={Calendar} tone="success" readiness="sample" />
        <KpiCard label="Overdue Rate" value="3.2%" sub="Invoices past 30 days" icon={CreditCard} readiness="sample" />
        <KpiCard label="Credit Risk" value="Low" sub="AA internal rating" icon={CheckCircle2} tone="success" readiness="sample" />
      </div>

      {/* Competitor Comparison — sample */}
      <Panel
        title="Competitor Comparison"
        subtitle="Price & service positioning snapshot"
        actions={
          <>
            <ReadinessBadge state="sample" />
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Swords className="h-3 w-3" /> vs 3 competitors
            </span>
          </>
        }
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="pb-2 text-left">Player</th>
              <th className="pb-2 text-right">Price</th>
              <th className="pb-2 text-right">SLA %</th>
              <th className="pb-2 text-right">NPS</th>
              <th className="pb-2 text-right">Network</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {competitors.map((c) => (
              <tr key={c.name} className={cn(c.us && "bg-muted/40")}>
                <td className="py-2.5 font-medium">
                  {c.us ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {c.name}
                    </span>
                  ) : (
                    c.name
                  )}
                </td>
                <td className="py-2.5 text-right font-mono tabular-nums">{c.price}</td>
                <td className="py-2.5 text-right font-mono tabular-nums">{c.service}%</td>
                <td className="py-2.5 text-right font-mono tabular-nums">+{c.nps}</td>
                <td className="py-2.5 text-right font-mono tabular-nums">{c.network}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {/* 6. Customer Growth Direction & Strategy */}
      <SectionHeader index="06" title="Customer Growth Direction &amp; Strategy" subtitle="Where is this client heading — so we can prepare" />

      {/* AI narrative card */}
      <Panel
        title="Client Growth Direction"
        subtitle="AI synthesis of public signals, claim trends, and team notes"
        actions={
          <>
            <ReadinessBadge state="ai" />
            <span className="inline-flex items-center gap-1 text-[11px] text-primary">
              <Sparkles className="h-3 w-3" /> AI-generated · review
            </span>
          </>
        }
      >
        <ul className="space-y-2.5">
          {growthNarrative.sentences.map((sentence, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
              <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              {sentence}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground font-semibold">Sources:</span>
          {growthNarrative.sources.map((s) => (
            <SourceChip key={s} label={s} />
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground italic">
          AI-generated from BD notes, claim trends, and public signals — review before presenting to client.
        </p>
      </Panel>

      {/* Opportunities to prepare */}
      <Panel
        title="Opportunities to Prepare"
        subtitle="AI-suggested initiatives based on client growth signals — confirm before acting"
        actions={
          <>
            <ReadinessBadge state="ai" />
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="h-3 w-3" /> {growthOpportunities.length} initiatives
            </span>
          </>
        }
      >
        <ul className="space-y-3">
          {growthOpportunities.map((o) => (
            <li key={o.title} className="rounded-md border border-border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm">{o.title}</span>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {o.lens}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{o.rationale}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {o.sources.map((s) => (
                      <SourceChip key={s} label={s} />
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <ImpactBadge value={o.impact} />
                  <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {o.effort} effort
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      {/* Opportunity Backlog — full table */}
      <Panel
        title="Opportunity Backlog"
        subtitle="All growth initiatives with scoring"
        actions={
          <>
            <ReadinessBadge state="sample" />
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="h-3 w-3" /> {growthOpportunities.length} initiatives
            </span>
          </>
        }
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="pb-2 text-left">Initiative</th>
              <th className="pb-2 text-left">Category</th>
              <th className="pb-2 text-right">Impact</th>
              <th className="pb-2 text-right">Effort</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {growthOpportunities.map((o) => (
              <tr key={o.title} className="hover:bg-accent/30">
                <td className="py-2.5 font-medium">{o.title}</td>
                <td className="py-2.5">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {o.lens}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <ImpactBadge value={o.impact} />
                </td>
                <td className="py-2.5 text-right">
                  <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {o.effort}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

    </div>
  );
}

function SectionHeader({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-end gap-3 border-b border-border pb-2 pt-2">
      <span className="text-2xl font-bold text-primary/30 tabular-nums">{index}</span>
      <div>
        <h2 className="text-base font-bold tracking-tight">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function SourceChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
      <MessageSquare className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

function ImpactBadge({ value }: { value: string }) {
  const cls =
    value === "High"
      ? "bg-success/15 text-success border-success/30"
      : value === "Medium"
        ? "bg-warning/15 text-warning border-warning/30"
        : "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-semibold", cls)}>
      {value} impact
    </span>
  );
}


