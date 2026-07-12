import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  CheckCircle2,
  FileSignature,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Sparkles,
  Target,
  Users,
  XCircle,
} from "lucide-react";
import { useView } from "@/lib/view-store";
import { insurers, providers } from "@/lib/mock-data";
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
  { service: "Telemedicine Add-on", status: "Inactive", expiry: "—" },
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

        {/* Readiness legend */}
        <div className="mt-4 border-t border-border pt-4">
          <ReadinessLegend />
        </div>
      </section>

      {/* Executive KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="SLA Performance" value="94.2%" sub="Met / Total cases" delta={2.1} icon={CheckCircle2} tone="success" readiness="live" />
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
                  : "bg-success/15 text-success";
            return (
              <li key={m.date} className="relative">
                <span className={cn("absolute -left-[30px] top-1.5 h-3 w-3 rounded-full", dot)} />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">{m.date}</span>
                    <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", badge)}>
                      {m.status}
                    </span>
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
                <td className="py-2.5 text-right font-mono tabular-nums text-muted-foreground">{r.expiry}</td>
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


      {/* 5. Customer Behaviour */}
      <SectionHeader index="05" title="Customer Behaviour" subtitle="Loyalty, satisfaction, financial discipline" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Renewal Rate" value="96%" sub="Last 12 months" delta={2} icon={RefreshCw} tone="success" readiness="manual" />
        <KpiCard label="Upsell Potential" value="3 lines" sub="of 7 available" icon={Sparkles} tone="info" readiness="manual" />
      </div>


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


