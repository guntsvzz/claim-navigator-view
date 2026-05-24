import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, ExternalLink, Search } from "lucide-react";
import { Panel, StatusBadge } from "@/components/dashboard/panel";
import { fmtBaht, fmtNum, pendingReasons, rejectReasons, workQueue } from "@/lib/mock-data";

export const Route = createFileRoute("/work-queue")({
  head: () => ({
    meta: [
      { title: "Claim Work Queue · Claim Ops" },
      { name: "description", content: "Operational task list with SLA risk, pending reasons, and drilldown." },
    ],
  }),
  component: WorkQueuePage,
});

const tabs = ["All", "Pending", "Need Doc", "Rejected", "SLA Risk"] as const;

function WorkQueuePage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const filtered = workQueue.filter((c) => {
    if (tab === "All") return true;
    if (tab === "SLA Risk") return c.workingDays > 4;
    return c.status === tab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Work Queue
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Claims requiring action</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Investigate, follow up, or escalate operational claim items.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Top Pending Reasons" subtitle="Why claims are stuck">
          <ReasonBars data={pendingReasons} color="var(--color-warning)" />
        </Panel>
        <Panel title="Top Reject Reasons" subtitle="Decline & rejection drivers">
          <ReasonBars data={rejectReasons} color="var(--color-destructive)" />
        </Panel>
      </div>

      <Panel
        title="Work Queue"
        subtitle={`${filtered.length} claims · ${tab}`}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search claim no."
                className="h-8 w-56 rounded-md border border-border bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
            <button className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs hover:bg-accent">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        }
        bodyClassName="p-0"
      >
        <div className="flex gap-1 border-b border-border px-4 py-2">
          {tabs.map((t) => {
            const active = tab === t;
            const count = workQueue.filter((c) => {
              if (t === "All") return true;
              if (t === "SLA Risk") return c.workingDays > 4;
              return c.status === t;
            }).length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {t}
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                    active ? "bg-primary-foreground/15" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">Claim No.</th>
                <th className="px-3 py-2.5 text-left">Type</th>
                <th className="px-3 py-2.5 text-left">Status</th>
                <th className="px-3 py-2.5 text-left">Insurer</th>
                <th className="px-3 py-2.5 text-left">Provider</th>
                <th className="px-3 py-2.5 text-right">Working Days</th>
                <th className="px-3 py-2.5 text-right">SLA</th>
                <th className="px-3 py-2.5 text-right">Payable</th>
                <th className="px-3 py-2.5 text-left">Reason</th>
                <th className="px-2 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-accent/30">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs font-semibold">{c.id}</div>
                    <div className="text-[10px] text-muted-foreground">{c.tpa} · {c.source}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs">{c.type}</div>
                    <div className="text-[10px] text-muted-foreground">{c.event}</div>
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-3 text-xs">{c.insurer}</td>
                  <td className="px-3 py-3 text-xs">{c.provider}</td>
                  <td className={`px-3 py-3 text-right font-mono tabular-nums text-xs ${c.workingDays > 7 ? "text-destructive font-bold" : c.workingDays > 4 ? "text-warning" : ""}`}>
                    {c.workingDays}d
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-xs">{c.slaMins}m</td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-xs">
                    ฿{fmtNum(c.payable)}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{c.reason}</td>
                  <td className="px-2 py-3">
                    <button className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span>Showing {filtered.length} of {workQueue.length}</span>
          <span>Total payable: ฿{fmtBaht(filtered.reduce((a, b) => a + b.payable, 0))}</span>
        </div>
      </Panel>
    </div>
  );
}

function ReasonBars({ data, color }: { data: { reason: string; count: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="reason"
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={170}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
        />
        <Bar dataKey="count" fill={color} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
