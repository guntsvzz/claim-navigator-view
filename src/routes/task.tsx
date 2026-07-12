import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Hourglass,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/task")({
  head: () => ({
    meta: [
      { title: "Team Task Monitoring · Claim Ops" },
      {
        name: "description",
        content:
          "Per-person workload, progress, blockers, and AI-generated summaries for Key Account Management teams.",
      },
    ],
  }),
  component: TaskPage,
});

/* ----------------------------- Types & mock data ----------------------------- */

type TaskStatus = "completed" | "in-progress" | "overdue" | "upcoming";
type Role = "Team Lead" | "Executive";

interface Member {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  openCount: number;
}

interface Task {
  id: string;
  name: string;
  client: string;
  status: TaskStatus;
  dueDate: string; // ISO yyyy-mm-dd
  startDate: string;
  assigneeId: string;
  description: string;
  activity: { at: string; text: string }[];
}

const members: Member[] = [
  {
    id: "m1",
    name: "Anong Srisai",
    role: "Senior Account Manager",
    avatarUrl: "/avatars/anong.png",
    openCount: 4,
  },
  {
    id: "m2",
    name: "Krit Wattana",
    role: "Claims Analyst",
    avatarUrl: "/avatars/krit.png",
    openCount: 5,
  },
  {
    id: "m3",
    name: "Ploy Chaiyo",
    role: "Account Manager",
    avatarUrl: "/avatars/ploy.png",
    openCount: 3,
  },
  {
    id: "m4",
    name: "Somsak Meng",
    role: "Onboarding Specialist",
    avatarUrl: "/avatars/somsak.png",
    openCount: 6,
  },
];

const tasks: Task[] = [
  // Anong (m1)
  {
    id: "t1",
    name: "Q3 renewal proposal for Bangkok Life",
    client: "Bangkok Life",
    status: "in-progress",
    startDate: "2026-07-13",
    dueDate: "2026-07-15",
    assigneeId: "m1",
    description:
      "Prepare and circulate the Q3 renewal proposal including revised premium tiers and SLA commitments.",
    activity: [
      { at: "14 Jul, 09:12", text: "Drafted premium tier comparison." },
      { at: "13 Jul, 16:40", text: "Kickoff call with underwriting." },
    ],
  },
  {
    id: "t2",
    name: "Reconcile disputed claims batch #4821",
    client: "Muang Thai",
    status: "overdue",
    startDate: "2026-07-08",
    dueDate: "2026-07-12",
    assigneeId: "m1",
    description:
      "Reconcile 38 disputed claims flagged during the monthly audit and coordinate resolution with the provider.",
    activity: [
      { at: "12 Jul, 18:05", text: "Escalated 6 items to provider network." },
      { at: "10 Jul, 11:20", text: "Categorized disputes by root cause." },
    ],
  },
  {
    id: "t3",
    name: "Send weekly KAM scorecard",
    client: "Bangkok Life",
    status: "completed",
    startDate: "2026-07-13",
    dueDate: "2026-07-14",
    assigneeId: "m1",
    description: "Compile and email the weekly account scorecard to stakeholders.",
    activity: [{ at: "14 Jul, 08:30", text: "Scorecard delivered to 4 contacts." }],
  },
  {
    id: "t4",
    name: "Prep QBR deck for executive review",
    client: "Thai Health",
    status: "upcoming",
    startDate: "2026-07-16",
    dueDate: "2026-07-17",
    assigneeId: "m1",
    description: "Build the quarterly business review deck ahead of the executive meeting.",
    activity: [{ at: "13 Jul, 10:00", text: "Outline template created." }],
  },
  // Krit (m2)
  {
    id: "t5",
    name: "Fraud pattern review on high-cost claims",
    client: "Allianz Ayudhya",
    status: "in-progress",
    startDate: "2026-07-13",
    dueDate: "2026-07-16",
    assigneeId: "m2",
    description: "Investigate anomalous high-cost IPD claims flagged by the fraud model.",
    activity: [{ at: "14 Jul, 13:15", text: "Reviewed 12 of 20 flagged cases." }],
  },
  {
    id: "t6",
    name: "Update ICD mapping table",
    client: "Muang Thai",
    status: "completed",
    startDate: "2026-07-13",
    dueDate: "2026-07-14",
    assigneeId: "m2",
    description: "Refresh ICD-10 to internal category mapping for the new fiscal year.",
    activity: [{ at: "14 Jul, 15:00", text: "Table published to shared drive." }],
  },
  {
    id: "t7",
    name: "SLA breach report for June",
    client: "Thai Health",
    status: "overdue",
    startDate: "2026-07-07",
    dueDate: "2026-07-11",
    assigneeId: "m2",
    description: "Summarize June SLA breaches with root-cause breakdown.",
    activity: [{ at: "11 Jul, 17:45", text: "Waiting on provider response times data." }],
  },
  {
    id: "t8",
    name: "Validate auto-adjudication rules",
    client: "Allianz Ayudhya",
    status: "in-progress",
    startDate: "2026-07-14",
    dueDate: "2026-07-16",
    assigneeId: "m2",
    description: "Test new auto-adjudication rules against last month's claim sample.",
    activity: [{ at: "14 Jul, 11:00", text: "Configured test harness." }],
  },
  {
    id: "t9",
    name: "Monthly fraud KPI refresh",
    client: "Muang Thai",
    status: "upcoming",
    startDate: "2026-07-17",
    dueDate: "2026-07-17",
    assigneeId: "m2",
    description: "Refresh fraud detection KPIs for the monthly leadership review.",
    activity: [],
  },
  // Ploy (m3)
  {
    id: "t10",
    name: "Onboard new SME group policy",
    client: "SCB Protect",
    status: "in-progress",
    startDate: "2026-07-13",
    dueDate: "2026-07-16",
    assigneeId: "m3",
    description: "Guide SCB Protect through onboarding for their new SME group health policy.",
    activity: [{ at: "14 Jul, 10:20", text: "Collected member census file." }],
  },
  {
    id: "t11",
    name: "Resolve portal access tickets",
    client: "SCB Protect",
    status: "completed",
    startDate: "2026-07-13",
    dueDate: "2026-07-14",
    assigneeId: "m3",
    description: "Clear the backlog of provider portal access requests.",
    activity: [{ at: "14 Jul, 14:10", text: "All 9 tickets resolved." }],
  },
  {
    id: "t12",
    name: "Client satisfaction follow-up calls",
    client: "Thai Health",
    status: "upcoming",
    startDate: "2026-07-16",
    dueDate: "2026-07-17",
    assigneeId: "m3",
    description: "Conduct post-claim satisfaction calls with 8 key members.",
    activity: [],
  },
  // Somsak (m4)
  {
    id: "t13",
    name: "Configure claim intake integration",
    client: "Bangkok Life",
    status: "overdue",
    startDate: "2026-07-06",
    dueDate: "2026-07-10",
    assigneeId: "m4",
    description: "Set up the API integration for automated claim intake from the client system.",
    activity: [{ at: "10 Jul, 16:00", text: "Blocked on client sandbox credentials." }],
  },
  {
    id: "t14",
    name: "Train client team on new portal",
    client: "SCB Protect",
    status: "in-progress",
    startDate: "2026-07-14",
    dueDate: "2026-07-15",
    assigneeId: "m4",
    description: "Run the onboarding training session for the client operations team.",
    activity: [{ at: "14 Jul, 09:45", text: "Scheduled session for 15 Jul." }],
  },
  {
    id: "t15",
    name: "Migrate legacy policy records",
    client: "Muang Thai",
    status: "in-progress",
    startDate: "2026-07-13",
    dueDate: "2026-07-16",
    assigneeId: "m4",
    description: "Migrate 2,400 legacy policy records into the new platform.",
    activity: [{ at: "14 Jul, 12:30", text: "1,100 records migrated and validated." }],
  },
  {
    id: "t16",
    name: "Verify data mapping sign-off",
    client: "Bangkok Life",
    status: "completed",
    startDate: "2026-07-13",
    dueDate: "2026-07-14",
    assigneeId: "m4",
    description: "Obtain client sign-off on the field mapping specification.",
    activity: [{ at: "14 Jul, 15:40", text: "Sign-off received from IT Director." }],
  },
  {
    id: "t17",
    name: "Set up monitoring alerts",
    client: "SCB Protect",
    status: "upcoming",
    startDate: "2026-07-17",
    dueDate: "2026-07-17",
    assigneeId: "m4",
    description: "Configure integration health alerts for the go-live window.",
    activity: [],
  },
  {
    id: "t18",
    name: "Draft go-live runbook",
    client: "Bangkok Life",
    status: "upcoming",
    startDate: "2026-07-16",
    dueDate: "2026-07-17",
    assigneeId: "m4",
    description: "Prepare the go-live runbook and rollback plan.",
    activity: [],
  },
];

/* ----------------------------- Config maps ----------------------------- */

const dateRanges: Record<string, { label: string; start: string; end: string }> = {
  thisWeek: { label: "13–17 Jul 2026", start: "2026-07-13", end: "2026-07-17" },
  lastWeek: { label: "6–12 Jul 2026", start: "2026-07-06", end: "2026-07-12" },
  thisMonth: { label: "1–31 Jul 2026", start: "2026-07-01", end: "2026-07-31" },
};

const statusMeta: Record<
  TaskStatus,
  { label: string; icon: typeof CheckCircle2; text: string; bg: string; border: string; dot: string }
> = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    text: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    dot: "bg-success",
  },
  "in-progress": {
    label: "In Progress",
    icon: Clock,
    text: "text-info",
    bg: "bg-info/10",
    border: "border-info/30",
    dot: "bg-info",
  },
  overdue: {
    label: "Overdue",
    icon: AlertCircle,
    text: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    dot: "bg-destructive",
  },
  upcoming: {
    label: "Upcoming",
    icon: Hourglass,
    text: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    dot: "bg-warning",
  },
};

const statusOrder: TaskStatus[] = ["overdue", "in-progress", "upcoming", "completed"];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/* ----------------------------- Page ----------------------------- */

type LoadState = "ready" | "loading" | "error";

function TaskPage() {
  const [rangeKey, setRangeKey] = useState<keyof typeof dateRanges>("thisWeek");
  const [role, setRole] = useState<Role>("Team Lead");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(members[0].id);
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("ready");
  const [updatedAt, setUpdatedAt] = useState(() => new Date());

  const readOnly = role === "Executive";
  const range = dateRanges[rangeKey];

  const filteredMembers = useMemo(
    () =>
      members.filter((m) =>
        (m.name + " " + m.role).toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query],
  );

  const selectedMember = members.find((m) => m.id === selectedId) ?? members[0];

  const memberTasks = useMemo(() => {
    return tasks
      .filter((t) => t.assigneeId === selectedMember.id)
      .filter((t) => t.dueDate >= range.start && t.dueDate <= range.end)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [selectedMember.id, range.start, range.end]);

  const counts = useMemo(() => {
    const c: Record<TaskStatus, number> = {
      completed: 0,
      "in-progress": 0,
      overdue: 0,
      upcoming: 0,
    };
    memberTasks.forEach((t) => (c[t.status] += 1));
    return c;
  }, [memberTasks]);

  const minutesAgo = Math.max(1, Math.round((Date.now() - updatedAt.getTime()) / 60000));

  function handleRefresh() {
    setLoadState("loading");
    setOpenTask(null);
    window.setTimeout(() => {
      setUpdatedAt(new Date());
      setLoadState("ready");
    }, 900);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Team Monitoring
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Team Task Monitoring</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Per-person workload &amp; AI summary
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Select
                value={rangeKey}
                onValueChange={(v) => setRangeKey(v as keyof typeof dateRanges)}
              >
                <SelectTrigger className="h-9 w-[168px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dateRanges).map(([key, r]) => (
                    <SelectItem key={key} value={key}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Team Lead">Team Lead</SelectItem>
                <SelectItem value="Executive">Executive (read-only)</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={handleRefresh}
              disabled={loadState === "loading"}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", loadState === "loading" && "animate-spin")}
              />
              <span className="hidden sm:inline">
                Updated {minutesAgo} min ago
              </span>
              <span className="sm:hidden">Refresh</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Body: sidebar + main */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Member list */}
        <aside className="w-full shrink-0 lg:w-[280px]">
          <Panel
            title="Team Members"
            subtitle={`${members.length} people`}
            bodyClassName="p-2"
            actions={
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Users className="h-3 w-3" /> {range.label}
              </span>
            }
          >
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search members..."
                  className="h-9 pl-8"
                  aria-label="Search team members"
                />
              </div>
            </div>
            <ul className="space-y-1" role="listbox" aria-label="Team members">
              {filteredMembers.length === 0 && (
                <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No members found
                </li>
              )}
              {filteredMembers.map((m) => {
                const active = m.id === selectedMember.id;
                return (
                  <li key={m.id}>
                    <button
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setSelectedId(m.id);
                        setOpenTask(null);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-accent",
                      )}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={m.avatarUrl || "/placeholder.svg"} alt="" />
                        <AvatarFallback className="text-xs">{initials(m.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "truncate text-sm font-semibold",
                            active && "text-primary",
                          )}
                        >
                          {m.name}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{m.role}</div>
                      </div>
                      <span className="grid h-6 min-w-6 place-items-center rounded-full bg-muted px-1.5 text-xs font-semibold tabular-nums text-muted-foreground">
                        {m.openCount}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </aside>

        {/* Main panel */}
        <div className="min-w-0 flex-1">
          {loadState === "loading" ? (
            <MainSkeleton />
          ) : loadState === "error" ? (
            <ErrorState onRetry={handleRefresh} />
          ) : (
            <div className="space-y-4">
              {/* Status summary cards */}
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {(["completed", "in-progress", "overdue", "upcoming"] as TaskStatus[]).map(
                  (s) => {
                    const meta = statusMeta[s];
                    const Icon = meta.icon;
                    return (
                      <div
                        key={s}
                        className={cn(
                          "rounded-lg border bg-card p-4",
                          meta.border,
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "text-[11px] font-semibold uppercase tracking-wider",
                              meta.text,
                            )}
                          >
                            {meta.label}
                          </span>
                          <span
                            className={cn(
                              "grid h-7 w-7 place-items-center rounded-md",
                              meta.bg,
                            )}
                          >
                            <Icon className={cn("h-4 w-4", meta.text)} />
                          </span>
                        </div>
                        <div className="mt-2 text-3xl font-bold tabular-nums">{counts[s]}</div>
                      </div>
                    );
                  },
                )}
              </div>

              {/* AI Summary */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-violet-500/10">
                      <Sparkles className="h-4 w-4 text-violet-500" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight">
                        AI Summary · {selectedMember.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">Updated {minutesAgo} min ago</p>
                    </div>
                  </div>
                  <span className="hidden rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-500 sm:inline">
                    AI
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                  {buildSummary(selectedMember, counts, memberTasks, range.label)}
                </p>
              </div>

              {/* Tasks table */}
              <Panel
                title="Tasks"
                subtitle={`Sorted by due date · ${range.label}`}
                bodyClassName="p-0"
                actions={
                  <span className="text-[11px] text-muted-foreground">
                    {memberTasks.length} task{memberTasks.length === 1 ? "" : "s"}
                  </span>
                }
              >
                {memberTasks.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <th className="px-4 py-2.5 text-left">Status</th>
                          <th className="px-4 py-2.5 text-left">Task</th>
                          <th className="px-4 py-2.5 text-left">Client</th>
                          <th className="px-4 py-2.5 text-left">Due</th>
                          <th className="px-4 py-2.5" aria-label="Open detail" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {[...memberTasks]
                          .sort(
                            (a, b) =>
                              statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status) ||
                              a.dueDate.localeCompare(b.dueDate),
                          )
                          .map((t) => {
                            const meta = statusMeta[t.status];
                            return (
                              <tr
                                key={t.id}
                                tabIndex={0}
                                role="button"
                                aria-label={`Open detail for ${t.name}`}
                                onClick={() => setOpenTask(t)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setOpenTask(t);
                                  }
                                }}
                                className="cursor-pointer transition-colors hover:bg-accent/40 focus:outline-none focus-visible:bg-accent/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                              >
                                <td className="px-4 py-3">
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                                      meta.bg,
                                      meta.border,
                                      meta.text,
                                    )}
                                  >
                                    <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                                    {meta.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-medium">{t.name}</td>
                                <td className="px-4 py-3 text-muted-foreground">{t.client}</td>
                                <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                                  {fmtDate(t.dueDate)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </div>
          )}
        </div>
      </div>

      {/* Task detail drawer */}
      <Sheet open={!!openTask} onOpenChange={(o) => !o && setOpenTask(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {openTask && (
            <TaskDetail task={openTask} member={selectedMember} readOnly={readOnly} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ----------------------------- Sub-components ----------------------------- */

function TaskDetail({
  task,
  member,
  readOnly,
}: {
  task: Task;
  member: Member;
  readOnly: boolean;
}) {
  const meta = statusMeta[task.status];
  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              meta.bg,
              meta.border,
              meta.text,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {meta.label}
          </span>
        </div>
        <SheetTitle className="text-left text-lg leading-snug">{task.name}</SheetTitle>
        <SheetDescription className="text-left">{task.client}</SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-5">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Assignee</dt>
            <dd className="mt-0.5 font-medium">{member.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Client</dt>
            <dd className="mt-0.5 font-medium">{task.client}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Start date</dt>
            <dd className="mt-0.5 font-mono text-xs tabular-nums">{fmtDate(task.startDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Due date</dt>
            <dd className="mt-0.5 font-mono text-xs tabular-nums">{fmtDate(task.dueDate)}</dd>
          </div>
        </dl>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{task.description}</p>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Activity
          </div>
          {task.activity.length === 0 ? (
            <p className="mt-1.5 text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ol className="mt-2 space-y-3 border-l border-border pl-4">
              {task.activity.map((a, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                  <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {a.at}
                  </div>
                  <div className="text-sm">{a.text}</div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {!readOnly && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1">
              Update status
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              Reassign
            </Button>
          </div>
        )}
        {readOnly && (
          <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Executive view is read-only. Editing actions are hidden.
          </p>
        )}
      </div>
    </>
  );
}

function MainSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-8 w-10" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-11/12" />
        <Skeleton className="mt-2 h-3 w-9/12" />
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-muted">
        <CalendarDays className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No tasks in this range</p>
      <p className="text-xs text-muted-foreground">
        Try selecting a different date range for this member.
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-16 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-destructive/10">
        <AlertCircle className="h-5 w-5 text-destructive" />
      </div>
      <div>
        <p className="text-sm font-medium">Couldn&apos;t load tasks</p>
        <p className="text-xs text-muted-foreground">
          There was a problem fetching this member&apos;s workload.
        </p>
      </div>
      <Button size="sm" variant="outline" className="gap-2" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </Button>
    </div>
  );
}

/* ----------------------------- Helpers ----------------------------- */

function buildSummary(
  member: Member,
  counts: Record<TaskStatus, number>,
  memberTasks: Task[],
  rangeLabel: string,
): string {
  if (memberTasks.length === 0) {
    return `${member.name} has no tasks scheduled for ${rangeLabel}. Consider assigning upcoming work or reviewing a wider date range.`;
  }
  const overdue = memberTasks.filter((t) => t.status === "overdue");
  const inProgress = memberTasks.filter((t) => t.status === "in-progress");
  const parts: string[] = [];

  parts.push(
    `During ${rangeLabel}, ${member.name} has ${memberTasks.length} tracked task${
      memberTasks.length === 1 ? "" : "s"
    }: ${counts.completed} completed, ${counts["in-progress"]} in progress, ${counts.overdue} overdue, and ${counts.upcoming} upcoming.`,
  );

  if (inProgress.length > 0) {
    parts.push(
      `Active work centers on "${inProgress[0].name}" for ${inProgress[0].client}${
        inProgress.length > 1 ? ` and ${inProgress.length - 1} other item${inProgress.length - 1 === 1 ? "" : "s"}` : ""
      }.`,
    );
  }

  if (overdue.length > 0) {
    parts.push(
      `Needs attention: ${overdue.length} overdue item${overdue.length === 1 ? "" : "s"}, most critically "${overdue[0].name}" (${overdue[0].client}), due ${fmtDate(overdue[0].dueDate)}.`,
    );
  } else {
    parts.push("No overdue items — workload is on track.");
  }

  if (counts.upcoming > 0) {
    parts.push(`${counts.upcoming} upcoming task${counts.upcoming === 1 ? "" : "s"} should be prioritized next.`);
  }

  return parts.join(" ");
}
