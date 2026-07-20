import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Flag,
  Hourglass,
  LayoutGrid,
  ListChecks,
  ListTodo,
  Plus,
  RefreshCw,
  Repeat,
  Sparkles,
} from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

export const Route = createFileRoute("/task")({
  head: () => ({
    meta: [
      { title: "แดชบอร์ดงาน · Claim Ops" },
      {
        name: "description",
        content:
          "ติดตามและจัดการงานของทีม พร้อมสรุปภาระงานรายบุคคลด้วย AI สำหรับทีม Key Account Management",
      },
    ],
  }),
  component: TaskPage,
});

/* ----------------------------- Types & mock data ----------------------------- */

type TaskStatus = "completed" | "in-progress" | "overdue" | "upcoming";
type Priority = "high" | "medium" | "low";
type Role = "Team Member";

interface Member {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
}

interface Task {
  id: string;
  name: string;
  client: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string; // ISO yyyy-mm-dd
  startDate: string;
  assigneeId: string;
  description: string;
  subDone: number;
  subTotal: number;
  activity: { at: string; text: string }[];
}

interface RecurringTask {
  id: string;
  name: string;
  client: string;
  cadence: "daily" | "weekly" | "monthly";
  nextRun: string;
  assigneeId: string;
  priority: Priority;
}

interface Suggestion {
  id: string;
  title: string;
  detail: string;
  eta: string;
  priority: Priority;
}

const CURRENT_USER_ID = "m1";

const members: Member[] = [
  { id: "m1", name: "Anong Srisai", role: "Senior Account Manager", avatarUrl: "/avatars/anong.png" },
  { id: "m2", name: "Krit Wattana", role: "Claims Analyst", avatarUrl: "/avatars/krit.png" },
  { id: "m3", name: "Ploy Chaiyo", role: "Account Manager", avatarUrl: "/avatars/ploy.png" },
  { id: "m4", name: "Somsak Meng", role: "Onboarding Specialist", avatarUrl: "/avatars/somsak.png" },
];

const tasks: Task[] = [
  // Anong (m1)
  {
    id: "t1",
    name: "ข้อเสนอต่ออายุกรมธรรม์ Q3 — Bangkok Life",
    client: "Bangkok Life",
    status: "in-progress",
    priority: "high",
    startDate: "2026-07-13",
    dueDate: "2026-07-15",
    assigneeId: "m1",
    subDone: 1,
    subTotal: 3,
    description:
      "จัดทำและส่งข้อเสนอต่ออายุ Q3 รวมถึงเบี้ยประกันแบบใหม่และข้อผูกพัน SLA",
    activity: [
      { at: "14 ก.ค. 09:12", text: "ร่างตารางเปรียบเทียบเบี้ยประกันเสร็จ" },
      { at: "13 ก.ค. 16:40", text: "ประชุมเริ่มงานกับทีมพิจารณารับประกัน" },
    ],
  },
  {
    id: "t2",
    name: "กระทบยอดเคลมพิพาท batch #4821",
    client: "Muang Thai",
    status: "overdue",
    priority: "high",
    startDate: "2026-07-08",
    dueDate: "2026-07-12",
    assigneeId: "m1",
    subDone: 2,
    subTotal: 5,
    description:
      "กระทบยอดเคลมพิพาท 38 รายการที่พบระหว่างการตรวจสอบรายเดือน และประสานการแก้ไขกับผู้ให้บริการ",
    activity: [
      { at: "12 ก.ค. 18:05", text: "ยกระดับ 6 รายการไปยังเครือข่ายผู้ให้บริการ" },
      { at: "10 ก.ค. 11:20", text: "จัดหมวดหมู่ข้อพิพาทตามสาเหตุหลัก" },
    ],
  },
  {
    id: "t3",
    name: "ส่งสกอร์การ์ด KAM รายสัปดาห์",
    client: "Bangkok Life",
    status: "completed",
    priority: "medium",
    startDate: "2026-07-13",
    dueDate: "2026-07-14",
    assigneeId: "m1",
    subDone: 2,
    subTotal: 2,
    description: "รวบรวมและส่งอีเมลสกอร์การ์ดบัญชีรายสัปดาห์ให้ผู้เกี่ยวข้อง",
    activity: [{ at: "14 ก.ค. 08:30", text: "ส่งสกอร์การ์ดให้ผู้ติดต่อ 4 ราย" }],
  },
  {
    id: "t4",
    name: "เตรียมสไลด์ QBR สำหรับผู้บริหาร",
    client: "Thai Health",
    status: "upcoming",
    priority: "medium",
    startDate: "2026-07-16",
    dueDate: "2026-07-17",
    assigneeId: "m1",
    subDone: 0,
    subTotal: 4,
    description: "จัดทำสไลด์ทบทวนผลประกอบการรายไตรมาสก่อนการประชุมผู้บริหาร",
    activity: [{ at: "13 ก.ค. 10:00", text: "สร้างเทมเพลตโครงร่างแล้ว" }],
  },
  // Krit (m2)
  {
    id: "t5",
    name: "ตรวจรูปแบบทุจริตในเคลมค่ารักษาสูง",
    client: "Allianz Ayudhya",
    status: "in-progress",
    priority: "high",
    startDate: "2026-07-13",
    dueDate: "2026-07-16",
    assigneeId: "m2",
    subDone: 3,
    subTotal: 5,
    description: "ตรวจสอบเคลม IPD ค่ารักษาสูงที่ผิดปกติซึ่งถูกโมเดลตรวจจับทุจริตทำเครื่องหมายไว้",
    activity: [{ at: "14 ก.ค. 13:15", text: "ตรวจสอบแล้ว 12 จาก 20 เคส" }],
  },
  {
    id: "t6",
    name: "อัปเดตตารางแมป ICD",
    client: "Muang Thai",
    status: "completed",
    priority: "low",
    startDate: "2026-07-13",
    dueDate: "2026-07-14",
    assigneeId: "m2",
    subDone: 2,
    subTotal: 2,
    description: "รีเฟรชการแมป ICD-10 ไปยังหมวดหมู่ภายในสำหรับปีงบประมาณใหม่",
    activity: [{ at: "14 ก.ค. 15:00", text: "เผยแพร่ตารางขึ้นไดรฟ์ที่ใช้ร่วมกัน" }],
  },
  {
    id: "t7",
    name: "รายงานการละเมิด SLA เดือนมิถุนายน",
    client: "Thai Health",
    status: "overdue",
    priority: "medium",
    startDate: "2026-07-07",
    dueDate: "2026-07-11",
    assigneeId: "m2",
    subDone: 1,
    subTotal: 3,
    description: "สรุปการละเมิด SLA เดือนมิถุนายนพร้อมการวิเคราะห์สาเหตุ",
    activity: [{ at: "11 ก.ค. 17:45", text: "รอข้อมูลเวลาตอบสนองจากผู้ให้บริการ" }],
  },
  {
    id: "t8",
    name: "ตรวจสอบกฎ Auto-Adjudication",
    client: "Allianz Ayudhya",
    status: "in-progress",
    priority: "medium",
    startDate: "2026-07-14",
    dueDate: "2026-07-16",
    assigneeId: "m2",
    subDone: 1,
    subTotal: 4,
    description: "ทดสอบกฎ auto-adjudication ใหม่กับตัวอย่างเคลมของเดือนที่แล้ว",
    activity: [{ at: "14 ก.ค. 11:00", text: "ตั้งค่าชุดทดสอบเรียบร้อย" }],
  },
  {
    id: "t9",
    name: "รีเฟรช KPI ทุจริตรายเดือน",
    client: "Muang Thai",
    status: "upcoming",
    priority: "low",
    startDate: "2026-07-17",
    dueDate: "2026-07-17",
    assigneeId: "m2",
    subDone: 0,
    subTotal: 2,
    description: "รีเฟรช KPI การตรวจจับทุจริตสำหรับการทบทวนของผู้บริหารรายเดือน",
    activity: [],
  },
  // Ploy (m3)
  {
    id: "t10",
    name: "ออนบอร์ดกรมธรรม์กลุ่ม SME ใหม่",
    client: "SCB Protect",
    status: "in-progress",
    priority: "high",
    startDate: "2026-07-13",
    dueDate: "2026-07-16",
    assigneeId: "m3",
    subDone: 2,
    subTotal: 6,
    description: "นำ SCB Protect ผ่านกระบวนการออนบอร์ดกรมธรรม์สุขภาพกลุ่ม SME ใหม่",
    activity: [{ at: "14 ก.ค. 10:20", text: "รวบรวมไฟล์ทะเบียนสมาชิกแล้ว" }],
  },
  {
    id: "t11",
    name: "แก้ไขทิกเก็ตการเข้าถึงพอร์ทัล",
    client: "SCB Protect",
    status: "completed",
    priority: "medium",
    startDate: "2026-07-13",
    dueDate: "2026-07-14",
    assigneeId: "m3",
    subDone: 3,
    subTotal: 3,
    description: "เคลียร์งานค้างของคำขอเข้าถึงพอร์ทัลผู้ให้บริการ",
    activity: [{ at: "14 ก.ค. 14:10", text: "แก้ไขครบทั้ง 9 ทิกเก็ต" }],
  },
  {
    id: "t12",
    name: "โทรติดตามความพึงพอใจลูกค้า",
    client: "Thai Health",
    status: "upcoming",
    priority: "low",
    startDate: "2026-07-16",
    dueDate: "2026-07-17",
    assigneeId: "m3",
    subDone: 0,
    subTotal: 8,
    description: "โทรสำรวจความพึงพอใจหลังการเคลมกับสมาชิกคนสำคัญ 8 ราย",
    activity: [],
  },
  // Somsak (m4)
  {
    id: "t13",
    name: "ตั้งค่าการเชื่อมต่อรับเคลม",
    client: "Bangkok Life",
    status: "overdue",
    priority: "high",
    startDate: "2026-07-06",
    dueDate: "2026-07-10",
    assigneeId: "m4",
    subDone: 1,
    subTotal: 4,
    description: "ตั้งค่าการเชื่อมต่อ API สำหรับรับเคลมอัตโนมัติจากระบบของลูกค้า",
    activity: [{ at: "10 ก.ค. 16:00", text: "ติดขัดเรื่องข้อมูลรับรอง sandbox ของลูกค้า" }],
  },
  {
    id: "t14",
    name: "อบรมทีมลูกค้าเรื่องพอร์ทัลใหม่",
    client: "SCB Protect",
    status: "in-progress",
    priority: "medium",
    startDate: "2026-07-14",
    dueDate: "2026-07-15",
    assigneeId: "m4",
    subDone: 1,
    subTotal: 2,
    description: "จัดเซสชันอบรมออนบอร์ดให้ทีมปฏิบัติการของลูกค้า",
    activity: [{ at: "14 ก.ค. 09:45", text: "นัดเซสชันวันที่ 15 ก.ค." }],
  },
  {
    id: "t15",
    name: "ย้ายข้อมูลกรมธรรม์เดิม",
    client: "Muang Thai",
    status: "in-progress",
    priority: "medium",
    startDate: "2026-07-13",
    dueDate: "2026-07-16",
    assigneeId: "m4",
    subDone: 2,
    subTotal: 4,
    description: "ย้ายข้อมูลกรมธรรม์เดิม 2,400 รายการเข้าสู่แพลตฟอร์มใหม่",
    activity: [{ at: "14 ก.ค. 12:30", text: "ย้ายและตรวจสอบแล้ว 1,100 รายการ" }],
  },
  {
    id: "t16",
    name: "ยืนยันการเซ็นรับรองการแมปข้อมูล",
    client: "Bangkok Life",
    status: "completed",
    priority: "low",
    startDate: "2026-07-13",
    dueDate: "2026-07-14",
    assigneeId: "m4",
    subDone: 1,
    subTotal: 1,
    description: "ขอการเซ็นรับรองข้อกำหนดการแมปฟิลด์จากลูกค้า",
    activity: [{ at: "14 ก.ค. 15:40", text: "ได้รับการเซ็นรับรองจากผู้อำนวยการ IT" }],
  },
  {
    id: "t17",
    name: "ตั้งค่าการแจ้งเตือนการมอนิเตอร์",
    client: "SCB Protect",
    status: "upcoming",
    priority: "medium",
    startDate: "2026-07-17",
    dueDate: "2026-07-17",
    assigneeId: "m4",
    subDone: 0,
    subTotal: 3,
    description: "ตั้งค่าการแจ้งเตือนสุขภาพการเชื่อมต่อสำหรับช่วง go-live",
    activity: [],
  },
];

const recurringTasks: RecurringTask[] = [
  { id: "r1", name: "ส่งสรุปแนวโน้มเคลมรายเดือน", client: "Bangkok Life", cadence: "monthly", nextRun: "2026-08-01", assigneeId: "m1", priority: "medium" },
  { id: "r2", name: "สกอร์การ์ด KAM รายสัปดาห์", client: "Bangkok Life", cadence: "weekly", nextRun: "2026-07-21", assigneeId: "m1", priority: "medium" },
  { id: "r3", name: "ตรวจสอบคิวทุจริตประจำวัน", client: "Allianz Ayudhya", cadence: "daily", nextRun: "2026-07-15", assigneeId: "m2", priority: "high" },
  { id: "r4", name: "รายงานสถานะออนบอร์ดรายสัปดาห์", client: "SCB Protect", cadence: "weekly", nextRun: "2026-07-21", assigneeId: "m3", priority: "low" },
  { id: "r5", name: "ตรวจสุขภาพการเชื่อมต่อรายวัน", client: "SCB Protect", cadence: "daily", nextRun: "2026-07-15", assigneeId: "m4", priority: "high" },
];

const suggestions: Suggestion[] = [
  { id: "s1", title: "ส่งสรุปแนวโน้มเคลมรายเดือน", detail: "BVTPA ส่งสรุปแนวโน้มเคลมประจำเดือนให้ลูกค้า", eta: "~5 วัน", priority: "medium" },
  { id: "s2", title: "UAT สำหรับ Auto-Adjudication", detail: "ส่งผลการทดสอบให้ทีมลูกค้าเพื่อตรวจสอบและอนุมัติ", eta: "~5 วัน", priority: "medium" },
  { id: "s3", title: "จัดทำเอกส���รเคลมผ่านแฟกซ์", detail: "พัฒนาเช็กลิสต์สำหรับกระบวนการเคลมผ่านแฟกซ์", eta: "~5 วัน", priority: "high" },
  { id: "s4", title: "ศึกษาความเป็นไปได้ Digital Claim", detail: "ศึกษาความเป็นไปได้ในการขยายบริการ Digital Claim", eta: "~7 วัน", priority: "low" },
];

/* ----------------------------- Config maps ----------------------------- */

const dateRanges: Record<string, { label: string; start: string; end: string }> = {
  thisWeek: { label: "13–17 ก.ค. 2026", start: "2026-07-13", end: "2026-07-17" },
  lastWeek: { label: "6–12 ก.ค. 2026", start: "2026-07-06", end: "2026-07-12" },
  thisMonth: { label: "1–31 ก.ค. 2026", start: "2026-07-01", end: "2026-07-31" },
};

const statusMeta: Record<
  TaskStatus,
  { label: string; icon: typeof CheckCircle2; text: string; bg: string; border: string; dot: string }
> = {
  completed: {
    label: "เสร็จสิ้น",
    icon: CheckCircle2,
    text: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    dot: "bg-success",
  },
  "in-progress": {
    label: "กำลังดำเนินการ",
    icon: Clock,
    text: "text-info",
    bg: "bg-info/10",
    border: "border-info/30",
    dot: "bg-info",
  },
  overdue: {
    label: "เกินกำหนด",
    icon: AlertCircle,
    text: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    dot: "bg-destructive",
  },
  upcoming: {
    label: "กำลังจะถึง",
    icon: Hourglass,
    text: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    dot: "bg-warning",
  },
};

const priorityMeta: Record<Priority, { label: string; text: string; bg: string; border: string }> = {
  high: { label: "สูง", text: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
  medium: { label: "กลาง", text: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  low: { label: "ต่ำ", text: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
};

const cadenceLabel: Record<RecurringTask["cadence"], string> = {
  daily: "รายวัน",
  weekly: "รายสัปดาห์",
  monthly: "รายเดือน",
};

const statusOrder: TaskStatus[] = ["overdue", "in-progress", "upcoming", "completed"];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

function emptyCounts(): Record<TaskStatus, number> {
  return { completed: 0, "in-progress": 0, overdue: 0, upcoming: 0 };
}

/* ----------------------------- Page ----------------------------- */

type LoadState = "ready" | "loading" | "error";

function TaskPage() {
  const [tab, setTab] = useState<"tasks" | "recurring">("tasks");
  const [viewMode, setViewMode] = useState<"team" | "timeline">("team");
  const [rangeKey, setRangeKey] = useState<keyof typeof dateRanges>("thisWeek");
  const [role] = useState<Role>("Team Member");
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("ready");
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const readOnly = false;
  const range = dateRanges[rangeKey];

  // Role-scoped members
  const scopedMembers = useMemo(
    () => members.filter((m) => m.id === CURRENT_USER_ID),
    [],
  );
  const scopedMemberIds = useMemo(() => new Set(scopedMembers.map((m) => m.id)), [scopedMembers]);

  // Tasks within range + scope
  const scopedTasks = useMemo(
    () =>
      tasks
        .filter((t) => scopedMemberIds.has(t.assigneeId))
        .filter((t) => t.dueDate >= range.start && t.dueDate <= range.end),
    [scopedMemberIds, range.start, range.end],
  );

  const totalCounts = useMemo(() => {
    const c = emptyCounts();
    scopedTasks.forEach((t) => (c[t.status] += 1));
    return c;
  }, [scopedTasks]);

  const tasksByMember = useMemo(() => {
    const map = new Map<string, Task[]>();
    scopedMembers.forEach((m) => map.set(m.id, []));
    scopedTasks.forEach((t) => map.get(t.assigneeId)?.push(t));
    map.forEach((list) =>
      list.sort(
        (a, b) =>
          statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status) ||
          a.dueDate.localeCompare(b.dueDate),
      ),
    );
    return map;
  }, [scopedMembers, scopedTasks]);

  const minutesAgo = Math.max(1, Math.round((Date.now() - updatedAt.getTime()) / 60000));
  const hasTasks = scopedTasks.length > 0;

  function handleRefresh() {
    setLoadState("loading");
    setOpenTask(null);
    window.setTimeout(() => {
      setUpdatedAt(new Date());
      setLoadState("ready");
    }, 900);
  }

  function toggleSummary(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        <TabButton active={tab === "tasks"} onClick={() => setTab("tasks")} icon={ListTodo}>
          งาน
        </TabButton>
        <TabButton active={tab === "recurring"} onClick={() => setTab("recurring")} icon={Repeat}>
          งานที่เกิดซ้ำ
        </TabButton>
      </div>

      {/* Header */}
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">แดชบอร์ดงาน</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">ติดตามและจัดการงานของทีม</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date range */}
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
            <Select value={rangeKey} onValueChange={(v) => setRangeKey(v as keyof typeof dateRanges)}>
              <SelectTrigger className="h-9 w-[150px]" aria-label="เลือกช่วงเวลา">
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

          {/* View switch */}
          <div className="flex items-center rounded-md border border-border bg-card p-0.5">
            <ViewToggle active={viewMode === "team"} onClick={() => setViewMode("team")} icon={LayoutGrid}>
              มุมมองทีม
            </ViewToggle>
            <ViewToggle active={viewMode === "timeline"} onClick={() => setViewMode("timeline")} icon={CalendarClock}>
              ไทม์ไลน์
            </ViewToggle>
          </div>

          {!readOnly && (
            <Button size="sm" className="h-9 gap-1.5" onClick={() => toast.success("เปิดฟอร์มสร้างงานใหม่")}>
              <Plus className="h-4 w-4" /> สร้างงาน
            </Button>
          )}
        </div>
      </section>

      {/* Last updated + read-only note */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          onClick={handleRefresh}
          disabled={loadState === "loading"}
          className="inline-flex items-center gap-1.5 rounded-md text-xs text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loadState === "loading" && "animate-spin")} />
          อัปเดตล่าสุด {fmtTime(updatedAt)} น.
        </button>
        <span className="text-[11px] text-muted-foreground">แสดงเฉพาะงานของคุณ</span>
      </div>

      {loadState === "loading" ? (
        <BoardSkeleton />
      ) : loadState === "error" ? (
        <ErrorState onRetry={handleRefresh} />
      ) : (
        <>
          {/* Five status cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <SummaryCard label="งานทั้งหมด" value={scopedTasks.length} icon={ListTodo} tone="neutral" />
            <SummaryCard label="กำลังดำเนินการ" value={totalCounts["in-progress"]} icon={Clock} tone="info" />
            <SummaryCard label="เสร็จสิ้น" value={totalCounts.completed} icon={CheckCircle2} tone="success" />
            <SummaryCard label="เกินกำหนด" value={totalCounts.overdue} icon={AlertCircle} tone="destructive" />
            <SummaryCard label="กำลังจะถึง" value={totalCounts.upcoming} icon={Hourglass} tone="warning" />
          </div>

          {tab === "recurring" ? (
            <RecurringView readOnly={readOnly} scopedMemberIds={scopedMemberIds} />
          ) : viewMode === "timeline" ? (
            <TimelineView
              range={range}
              tasks={scopedTasks}
              onOpen={setOpenTask}
              empty={!hasTasks}
            />
          ) : (
            <div className="flex flex-col gap-4 xl:flex-row">
              {/* Main board */}
              <div className="min-w-0 flex-1 space-y-4">
                {!hasTasks && <EmptyState />}
                {scopedMembers.map((m) => {
                  const list = tasksByMember.get(m.id) ?? [];
                  if (list.length === 0) return null;
                  return (
                    <MemberSection
                      key={m.id}
                      member={m}
                      tasks={list}
                      collapsed={collapsed.has(m.id)}
                      onToggle={() => toggleSummary(m.id)}
                      onOpen={setOpenTask}
                      rangeLabel={range.label}
                      minutesAgo={minutesAgo}
                    />
                  );
                })}
              </div>

              {/* AI Suggestions rail */}
              <aside className="w-full shrink-0 xl:w-[320px]">
                <SuggestionsRail readOnly={readOnly} onRefresh={handleRefresh} />
              </aside>
            </div>
          )}
        </>
      )}

      {/* Task detail drawer */}
      <Sheet open={!!openTask} onOpenChange={(o) => !o && setOpenTask(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {openTask && (
            <TaskDetail
              task={openTask}
              member={members.find((m) => m.id === openTask.assigneeId) ?? members[0]}
              readOnly={readOnly}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ----------------------------- Sub-components ----------------------------- */

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof ListTodo;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active}
      className={cn(
        "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof LayoutGrid;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

const summaryTone: Record<
  "neutral" | "info" | "success" | "destructive" | "warning",
  { text: string; bg: string; border: string }
> = {
  neutral: { text: "text-primary", bg: "bg-primary/10", border: "border-border" },
  info: { text: "text-info", bg: "bg-info/10", border: "border-info/30" },
  success: { text: "text-success", bg: "bg-success/10", border: "border-success/30" },
  destructive: { text: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
  warning: { text: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
};

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof ListTodo;
  tone: keyof typeof summaryTone;
}) {
  const t = summaryTone[tone];
  return (
    <div className={cn("rounded-lg border bg-card p-4", t.border)}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-[11px] font-semibold uppercase tracking-wider", t.text)}>{label}</span>
        <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md", t.bg)}>
          <Icon className={cn("h-4 w-4", t.text)} />
        </span>
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function StatusChip({ status, count }: { status: TaskStatus; count: number }) {
  const meta = statusMeta[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        meta.bg,
        meta.border,
        meta.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {count} {meta.label}
    </span>
  );
}

function MemberSection({
  member,
  tasks: list,
  collapsed,
  onToggle,
  onOpen,
  rangeLabel,
  minutesAgo,
}: {
  member: Member;
  tasks: Task[];
  collapsed: boolean;
  onToggle: () => void;
  onOpen: (t: Task) => void;
  rangeLabel: string;
  minutesAgo: number;
}) {
  const counts = useMemo(() => {
    const c = emptyCounts();
    list.forEach((t) => (c[t.status] += 1));
    return c;
  }, [list]);

  return (
    <Panel
      title={
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={member.avatarUrl || "/placeholder.svg"} alt="" />
            <AvatarFallback className="text-xs">{initials(member.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-semibold">{member.name}</div>
            <div className="text-xs font-normal text-muted-foreground">{member.role}</div>
          </div>
        </div>
      }
      bodyClassName="space-y-4"
      actions={
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {statusOrder.map((s) => counts[s] > 0 && <StatusChip key={s} status={s} count={counts[s]} />)}
        </div>
      }
    >
      {/* AI Summary (collapsible) */}
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/5">
        <button
          onClick={onToggle}
          aria-expanded={!collapsed}
          className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-violet-500/10">
              <Sparkles className="h-4 w-4 text-violet-500" />
            </span>
            <span>
              <span className="block text-sm font-semibold">สรุปโดย AI</span>
              <span className="block text-[11px] text-muted-foreground">
                อัปเดตเมื่อ {minutesAgo} นาทีที่แล้ว
              </span>
            </span>
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", !collapsed && "rotate-180")}
          />
        </button>
        {!collapsed && (
          <p className="border-t border-violet-500/20 px-3 py-2.5 text-sm leading-relaxed text-foreground/90">
            {buildSummary(member, counts, list, rangeLabel)}
          </p>
        )}
      </div>

      {/* Task cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((t) => (
          <TaskCard key={t.id} task={t} onOpen={() => onOpen(t)} />
        ))}
      </div>
    </Panel>
  );
}

function TaskCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const meta = statusMeta[task.status];
  const prio = priorityMeta[task.priority];
  return (
    <button
      onClick={onOpen}
      className="flex flex-col rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-pretty">{task.name}</h4>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            meta.bg,
            meta.border,
            meta.text,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
          {meta.label}
        </span>
      </div>

      <span className="mt-2 inline-flex w-fit items-center rounded border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
        {task.client}
      </span>

      <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{task.description}</p>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" />
          {fmtDate(task.dueDate)}
        </span>
        <span className="inline-flex items-center gap-1">
          <ListChecks className="h-3.5 w-3.5" />
          {task.subDone}/{task.subTotal}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-semibold",
            prio.bg,
            prio.border,
            prio.text,
          )}
        >
          <Flag className="h-3 w-3" />
          {prio.label}
        </span>
      </div>
    </button>
  );
}

function SuggestionsRail({ readOnly, onRefresh }: { readOnly: boolean; onRefresh: () => void }) {
  return (
    <Panel
      className="xl:sticky xl:top-20"
      title={
        <span className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-violet-500/10">
            <Sparkles className="h-4 w-4 text-violet-500" />
          </span>
          ข้อเสนอแนะจาก AI
        </span>
      }
      subtitle="อิงตามเป้าหมายของคุณ"
      bodyClassName="space-y-3"
      actions={
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onRefresh}
          aria-label="รีเฟรชข้อเสนอแนะ"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      }
    >
      {suggestions.map((s) => {
        const prio = priorityMeta[s.priority];
        return (
          <div key={s.id} className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
              <div className="min-w-0">
                <h4 className="truncate text-sm font-semibold">{s.title}</h4>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{s.detail}</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">{s.eta}</span>
                <span
                  className={cn(
                    "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold",
                    prio.bg,
                    prio.border,
                    prio.text,
                  )}
                >
                  {prio.label}
                </span>
              </span>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-primary hover:text-primary"
                  onClick={() => toast.success("สร้างงานจากข้อเสนอแนะแล้ว")}
                >
                  <Plus className="h-3.5 w-3.5" /> สร้าง
                </Button>
              )}
            </div>
          </div>
        );
      })}
      {readOnly && (
        <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
          มุมมองผู้บริหารเป็นแบบอ่านอย่างเดียว — ซ่อนปุ่มสร้างงาน
        </p>
      )}
    </Panel>
  );
}

function TimelineView({
  range,
  tasks: list,
  onOpen,
  empty,
}: {
  range: { label: string; start: string; end: string };
  tasks: Task[];
  onOpen: (t: Task) => void;
  empty: boolean;
}) {
  const days = useMemo(() => {
    const out: { iso: string; tasks: Task[] }[] = [];
    const start = new Date(range.start + "T00:00:00");
    const end = new Date(range.end + "T00:00:00");
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      out.push({ iso, tasks: list.filter((t) => t.dueDate === iso) });
    }
    return out;
  }, [range.start, range.end, list]);

  return (
    <Panel title="ไทม์ไลน์" subtitle={`เรียงตามวันครบกำหนด · ${range.label}`} bodyClassName="p-0">
      {empty ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-3 p-4">
            {days.map((day) => {
              const d = new Date(day.iso + "T00:00:00");
              return (
                <div key={day.iso} className="flex w-[180px] shrink-0 flex-col">
                  <div className="mb-2 border-b border-border pb-1.5 text-center">
                    <div className="text-xs font-semibold">
                      {d.toLocaleDateString("th-TH", { weekday: "short" })}
                    </div>
                    <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {fmtDate(day.iso)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {day.tasks.length === 0 ? (
                      <div className="rounded-md border border-dashed border-border/70 py-3 text-center text-[11px] text-muted-foreground">
                        —
                      </div>
                    ) : (
                      day.tasks.map((t) => {
                        const meta = statusMeta[t.status];
                        return (
                          <button
                            key={t.id}
                            onClick={() => onOpen(t)}
                            className={cn(
                              "rounded-md border-l-2 bg-card p-2 text-left text-xs transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              meta.border,
                              meta.bg,
                            )}
                            style={{ borderLeftColor: "currentColor" }}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} />
                              <span className={cn("truncate text-[10px] font-semibold uppercase", meta.text)}>
                                {meta.label}
                              </span>
                            </div>
                            <div className="mt-1 line-clamp-2 font-medium text-foreground">{t.name}</div>
                            <div className="mt-0.5 text-[10px] text-muted-foreground">{t.client}</div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Panel>
  );
}

function RecurringView({
  readOnly,
  scopedMemberIds,
}: {
  readOnly: boolean;
  scopedMemberIds: Set<string>;
}) {
  const list = recurringTasks.filter((r) => scopedMemberIds.has(r.assigneeId));
  return (
    <Panel
      title="งานที่เกิดซ้ำ"
      subtitle={`${list.length} เทมเพลตที่ตั้งเวลาไว้`}
      bodyClassName="p-0"
      actions={
        !readOnly ? (
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => toast.success("เพิ่มงานที่เกิดซ้ำ")}>
            <Plus className="h-3.5 w-3.5" /> เพิ่ม
          </Button>
        ) : undefined
      }
    >
      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((r) => {
            const member = members.find((m) => m.id === r.assigneeId);
            const prio = priorityMeta[r.priority];
            return (
              <div key={r.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold leading-snug text-pretty">{r.name}</h4>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-info/30 bg-info/10 px-2 py-0.5 text-[10px] font-semibold text-info">
                    <Repeat className="h-3 w-3" />
                    {cadenceLabel[r.cadence]}
                  </span>
                </div>
                <span className="mt-2 inline-flex w-fit items-center rounded border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                  {r.client}
                </span>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" />
                    ครั้งถัดไป {fmtDate(r.nextRun)}
                  </span>
                  <span className="truncate">{member?.name}</span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded border px-1.5 py-0.5 font-semibold",
                      prio.bg,
                      prio.border,
                      prio.text,
                    )}
                  >
                    {prio.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function TaskDetail({ task, member, readOnly }: { task: Task; member: Member; readOnly: boolean }) {
  const meta = statusMeta[task.status];
  const prio = priorityMeta[task.priority];
  return (
    <>
      <SheetHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              meta.bg,
              meta.border,
              meta.text,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {meta.label}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              prio.bg,
              prio.border,
              prio.text,
            )}
          >
            <Flag className="h-3 w-3" />
            ความสำคัญ{prio.label}
          </span>
        </div>
        <SheetTitle className="text-left text-lg leading-snug">{task.name}</SheetTitle>
        <SheetDescription className="text-left">{task.client}</SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-5">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">ผู้รับผิดชอบ</dt>
            <dd className="mt-0.5 font-medium">{member.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">ลูกค้า</dt>
            <dd className="mt-0.5 font-medium">{task.client}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">วันเริ่ม</dt>
            <dd className="mt-0.5 font-mono text-xs tabular-nums">{fmtDate(task.startDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">วันครบกำหนด</dt>
            <dd className="mt-0.5 font-mono text-xs tabular-nums">{fmtDate(task.dueDate)}</dd>
          </div>
        </dl>

        <div>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>งานย่อย</span>
            <span className="tabular-nums">
              {task.subDone}/{task.subTotal}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${task.subTotal ? (task.subDone / task.subTotal) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">รายละเอียด</div>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{task.description}</p>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">กิจกรรม</div>
          {task.activity.length === 0 ? (
            <p className="mt-1.5 text-sm text-muted-foreground">ยังไม่มีกิจกรรม</p>
          ) : (
            <ol className="mt-2 space-y-3 border-l border-border pl-4">
              {task.activity.map((a, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                  <div className="font-mono text-[11px] tabular-nums text-muted-foreground">{a.at}</div>
                  <div className="text-sm">{a.text}</div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {readOnly ? (
          <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            มุมมองผู้บริหารเป็นแบบอ่านอย่างเดียว ซ่อนการแก้ไข
          </p>
        ) : (
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1" onClick={() => toast.success("อัปเดตสถานะแล้ว")}>
              อัปเดตสถานะ
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.success("มอบหมายใหม่แล้ว")}>
              มอบหมายใหม่
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function BoardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-8 w-10" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="mt-4 h-14 w-full" />
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-32 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="w-full shrink-0 xl:w-[320px]">
          <Skeleton className="h-80 w-full" />
        </div>
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
      <p className="text-sm font-medium">ไม่มีงานในช่วงนี้</p>
      <p className="text-xs text-muted-foreground">ลองเลือกช่วงเวลาอื่นหรือปรับบทบาทการดู</p>
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
        <p className="text-sm font-medium">โหลดงานไม่สำเร็จ</p>
        <p className="text-xs text-muted-foreground">เกิดปัญหาในการดึงข้อมูลภาระงานของทีม</p>
      </div>
      <Button size="sm" variant="outline" className="gap-2" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5" /> ลองใหม่
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
    return `${member.name} ยังไม่มีงานในช่วง ${rangeLabel} — พิจารณามอบหมายงานหรือดูช่วงเวลาที่กว้างขึ้น`;
  }
  const overdue = memberTasks.filter((t) => t.status === "overdue");
  const inProgress = memberTasks.filter((t) => t.status === "in-progress");
  const parts: string[] = [];

  parts.push(
    `ในช่วง ${rangeLabel} ${member.name} มีงานที่ติดตาม ${memberTasks.length} รายการ: เสร็จ ${counts.completed} · กำลังดำเนินการ ${counts["in-progress"]} · เกินกำหนด ${counts.overdue} · กำลังจะถึง ${counts.upcoming}`,
  );

  if (inProgress.length > 0) {
    parts.push(
      `งานที่กำลังทำอยู่หลักคือ “${inProgress[0].name}” ของ ${inProgress[0].client}${
        inProgress.length > 1 ? ` และอีก ${inProgress.length - 1} รายการ` : ""
      }`,
    );
  }

  if (overdue.length > 0) {
    parts.push(
      `ต้องให้ความสำคัญ: มีงานเกินกำหนด ${overdue.length} รายการ โดยเฉพาะ “${overdue[0].name}” (${overdue[0].client}) ครบกำหนด ${fmtDate(overdue[0].dueDate)}`,
    );
  } else {
    parts.push("ไม่มีงานเกินกำหนด — ภาระงานอยู่ในเกณฑ์ปกติ");
  }

  if (counts.upcoming > 0) {
    parts.push(`มีงานกำลังจะถึง ${counts.upcoming} รายการที่ควรจัดลำดับความสำคัญต่อไป`);
  }

  return parts.join(" ");
}
