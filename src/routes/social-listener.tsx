import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Newspaper,
  TrendingUp,
  TrendingDown,
  Building2,
  Hospital,
  Gavel,
  Search,
  Filter,
  ExternalLink,
  Flame,
  Sparkles,
  Eye,
  MessageSquare,
  Share2,
  Bookmark,
  Clock,
  ArrowUpRight,
  Link2,
  Plus,
  Upload,
  Trash2,
  Globe,
  FileText,
  Rss,
  CheckCircle2,
  Settings2,
  X,
  ChevronDown,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Panel } from "@/components/dashboard/panel";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/social-listener")({
  component: SocialListenerPage,
  head: () => ({
    meta: [
      { title: "Social Listener — BVTPA" },
      {
        name: "description",
        content:
          "Monitor news, social signals, and risk events about BVTPA, insurer & provider customers, regulations, and fraud.",
      },
    ],
  }),
});

type Sentiment = "positive" | "neutral" | "negative";
type Category = "self" | "customer" | "regulation" | "fraud";
type Severity = "low" | "med" | "high" | "critical";
type Target = "bvtpa" | "insurer" | "provider" | "industry";

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceType: "News" | "Facebook" | "X" | "Pantip" | "Gov" | "Blog";
  time: string;
  hoursAgo?: number;
  sentiment: Sentiment;
  category: Category;
  severity: Severity;
  target: Target;
  entities: string[];
  reach: number;
  mentions: number;
  url: string;
  hot?: boolean;
};

const FEED: NewsItem[] = [
  {
    id: "n1",
    target: "bvtpa",
    title: "ผู้เอาประกันโพสต์ร้องเรียน BVTPA อนุมัติเคลมล่าช้า กระทบโซเชียลกระแสลบ",
    summary:
      "โพสต์บน Pantip ยอด engagement สูงขึ้น 320% ใน 6 ชม. ระบุปัญหาการอนุมัติเคลม IPD กับ รพ.เอกชนใหญ่ มีคอมเมนต์ลบกว่า 180 ราย",
    source: "Pantip / Sinsae",
    sourceType: "Pantip",
    time: "32 นาทีที่แล้ว",
    hoursAgo: 0.5,
    sentiment: "negative",
    category: "self",
    severity: "critical",
    entities: ["BVTPA"],
    reach: 48200,
    mentions: 214,
    url: "#",
    hot: true,
  },
  {
    id: "n2",
    target: "industry",
    title: "คปภ. เตรียมประกาศหลักเกณฑ์ใหม่ ค่ารักษาเหมาจ่าย IPD มีผล Q3/2026",
    summary:
      "ร่างกฎหมายปรับเพดานเหมาจ่าย IPD ใหม่ คาดกระทบเงื่อนไขกรมธรรม์ของบริษัทประกัน 12 ราย และผู้ให้บริการ TPA โดยตรง",
    source: "ฐานเศรษฐกิจ",
    sourceType: "News",
    time: "1 ชม.ที่แล้ว",
    sentiment: "neutral",
    category: "regulation",
    severity: "high",
    entities: ["OIC", "Industry"],
    reach: 12400,
    mentions: 38,
    url: "#",
  },
  {
    id: "n3",
    target: "insurer",
    title: "AIA Thailand ประกาศกำไรไตรมาส Q1 โตกว่าคาด เพิ่มงบประกันสุขภาพกลุ่ม",
    summary:
      "ผลประกอบการดี ส่งสัญญาณเพิ่ม volume เคลมสุขภาพกลุ่ม opportunity สำหรับขยายสัญญาบริการ TPA",
    source: "Bangkok Post",
    sourceType: "News",
    time: "2 ชม.ที่แล้ว",
    sentiment: "positive",
    category: "customer",
    severity: "low",
    entities: ["AIA Thailand"],
    reach: 9800,
    mentions: 24,
    url: "#",
  },
  {
    id: "n4",
    target: "provider",
    title: "คลินิกในเครือ XYZ ถูกตรวจสอบ เบิกค่ารักษาเกินจริง — สตช.ขยายผล",
    summary:
      "พบเครือข่ายคลินิก 8 สาขาในกรุงเทพและปริมณฑล มีรายการเคลมผิดปกติ ระบบ fraud detection ของ TPA หลายรายจับสัญญาณก่อนหน้านี้",
    source: "ไทยรัฐออนไลน์",
    sourceType: "News",
    time: "3 ชม.ที่แล้ว",
    sentiment: "negative",
    category: "fraud",
    severity: "critical",
    entities: ["Clinic Network XYZ"],
    reach: 22300,
    mentions: 96,
    url: "#",
    hot: true,
  },
  {
    id: "n5",
    target: "provider",
    title: "Bumrungrad Hospital เปิดศูนย์การแพทย์ใหม่ ขยายบริการ IPD เพิ่ม 120 เตียง",
    summary:
      "อาจกระทบ volume เคลมและต้นทุนเฉลี่ยต่อเคส ควรอัปเดต fee schedule และเงื่อนไข pre-authorization",
    source: "Hfocus",
    sourceType: "News",
    time: "5 ชม.ที่แล้ว",
    sentiment: "neutral",
    category: "customer",
    severity: "med",
    entities: ["Bumrungrad"],
    reach: 7200,
    mentions: 18,
    url: "#",
  },
  {
    id: "n6",
    target: "bvtpa",
    title: "ผู้บริโภครีวิวบริการ BVTPA เชิงบวก ขั้นตอนเคลม OPD เร็วขึ้นมาก",
    summary:
      "Facebook กลุ่มประกันสุขภาพ มีผู้แชร์ประสบการณ์เชิงบวก 42 ราย ภายใน 24 ชม. — โอกาส amplify สำหรับฝ่าย Marketing",
    source: "Facebook Groups",
    sourceType: "Facebook",
    time: "6 ชม.ที่แล้ว",
    sentiment: "positive",
    category: "self",
    severity: "low",
    entities: ["BVTPA"],
    reach: 18900,
    mentions: 64,
    url: "#",
  },
  {
    id: "n7",
    target: "insurer",
    title: "FWD Insurance ถูกฟ้องคดีปฏิเสธเคลมโรคร้ายแรง — เริ่มสืบพยานสัปดาห์หน้า",
    summary:
      "อาจกระทบนโยบายอนุมัติเคลมประเภท CI ของลูกค้ารายนี้ ทีม Account ควรเตรียม briefing",
    source: "ประชาชาติธุรกิจ",
    sourceType: "News",
    time: "8 ชม.ที่แล้ว",
    sentiment: "negative",
    category: "customer",
    severity: "high",
    entities: ["FWD Insurance"],
    reach: 14500,
    mentions: 52,
    url: "#",
  },
  {
    id: "n8",
    target: "industry",
    title: "พ.ร.บ. คุ้มครองข้อมูลสุขภาพ ฉบับใหม่ ผ่านวาระ 2 — TPA ต้องปรับ data flow",
    summary:
      "เพิ่มข้อกำหนด consent และ data retention ของข้อมูลเคลมสุขภาพ บังคับใช้ภายใน 180 วัน",
    source: "ราชกิจจานุเบกษา",
    sourceType: "Gov",
    time: "12 ชม.ที่แล้ว",
    sentiment: "neutral",
    category: "regulation",
    severity: "high",
    entities: ["PDPA-Health"],
    reach: 4200,
    mentions: 12,
    url: "#",
  },
  {
    id: "n9",
    target: "industry",
    title: "ตำรวจจับเครือข่ายปลอมเอกสารเบิกประกัน มูลค่ากว่า 80 ล้านบาท",
    summary:
      "ใช้ใบเสร็จและใบรับรองแพทย์ปลอม ยื่นเคลมกับบริษัทประกันชีวิต 4 แห่ง — เป็นสัญญาณให้ทบทวน document verification flow",
    source: "ข่าวสด",
    sourceType: "News",
    time: "1 วันที่แล้ว",
    sentiment: "negative",
    category: "fraud",
    severity: "high",
    entities: ["Fraud Ring"],
    reach: 31200,
    mentions: 124,
    url: "#",
  },
  {
    id: "n10",
    target: "insurer",
    title: "Muang Thai Life ประกาศ partner กับ Health-tech รายใหญ่ — ขยาย telemedicine",
    summary:
      "บริการ telemedicine จะเพิ่ม volume การเคลม OPD รูปแบบใหม่ ควรเตรียม workflow รองรับ",
    source: "The Standard Wealth",
    sourceType: "News",
    time: "1 วันที่แล้ว",
    sentiment: "positive",
    category: "customer",
    severity: "med",
    entities: ["Muang Thai Life"],
    reach: 8800,
    mentions: 28,
    url: "#",
  },
];

const mentionTrend = Array.from({ length: 14 }).map((_, i) => ({
  d: `D${i + 1}`,
  pos: 18 + ((i * 7) % 14),
  neg: 12 + ((i * 11) % 22) + (i > 9 ? 18 : 0),
  neu: 30 + ((i * 5) % 18),
}));

const topEntities = [
  { name: "BVTPA", mentions: 278, delta: 38, neg: 42 },
  { name: "AIA Thailand", mentions: 184, delta: 12, neg: 8 },
  { name: "Bumrungrad", mentions: 142, delta: -4, neg: 6 },
  { name: "FWD Insurance", mentions: 128, delta: 22, neg: 28 },
  { name: "Bangkok Hospital", mentions: 96, delta: 5, neg: 4 },
  { name: "Muang Thai Life", mentions: 84, delta: -2, neg: 3 },
];

const CATEGORY_META: Record<
  Category,
  { label: string; icon: typeof Building2; tone: string }
> = {
  self: { label: "About BVTPA", icon: Sparkles, tone: "text-info" },
  customer: { label: "Customer (Insurer/Provider)", icon: Building2, tone: "text-primary" },
  regulation: { label: "Regulation & Policy", icon: Gavel, tone: "text-warning" },
  fraud: { label: "Fraud Signals", icon: ShieldAlert, tone: "text-destructive" },
};

const TARGET_META: Record<
  Target,
  { label: string; sub: string; icon: typeof Building2; tone: string }
> = {
  bvtpa: { label: "BVTPA", sub: "Talk เกี่ยวกับเรา", icon: Sparkles, tone: "text-info" },
  insurer: { label: "Insurers", sub: "บริษัทประกันลูกค้า", icon: Building2, tone: "text-primary" },
  provider: { label: "Providers", sub: "โรงพยาบาล / คลินิก", icon: Hospital, tone: "text-success" },
  industry: { label: "Industry / Regulator", sub: "คปภ. ปปง. กฎหมาย", icon: Gavel, tone: "text-warning" },
};

type ConfiguredSource = {
  id: string;
  url: string;
  label: string;
  scope: Target;
  entity?: string;
  kind: "rss" | "page" | "social";
  active: boolean;
};

const SEED_SOURCES: ConfiguredSource[] = [
  { id: "s1", url: "https://www.oic.or.th/th/news", label: "คปภ. — ข่าวประชาสัมพันธ์", scope: "industry", kind: "page", active: true },
  { id: "s2", url: "https://www.amlo.go.th/index.php/th/news", label: "ปปง. — ข่าวสาร", scope: "industry", kind: "page", active: true },
  { id: "s3", url: "https://www.aia.co.th/th/about-aia/media-centre.html", label: "AIA Media Centre", scope: "insurer", entity: "AIA Thailand", kind: "page", active: true },
  { id: "s4", url: "https://www.bangkokhospital.com/news", label: "Bangkok Hospital — News", scope: "provider", entity: "Bangkok Hospital", kind: "rss", active: true },
  { id: "s5", url: "https://pantip.com/tag/ประกันสุขภาพ", label: "Pantip — ประกันสุขภาพ", scope: "bvtpa", kind: "social", active: true },
  { id: "s6", url: "https://www.bvtpa.co.th/press", label: "BVTPA Press Room", scope: "bvtpa", kind: "page", active: false },
];

type DateRange = "today" | "7d" | "30d" | "all";

const SOURCE_TYPE_GROUPS: Record<string, NewsItem["sourceType"][]> = {
  News: ["News"],
  Forum: ["Pantip", "Blog"],
  Social: ["Facebook", "X"],
  "Gov & Official": ["Gov"],
};
type SourceGroup = keyof typeof SOURCE_TYPE_GROUPS;

const DATE_LIMIT: Record<DateRange, number> = {
  today: 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
  all: Infinity,
};

function SocialListenerPage() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<Category | "all">("all");
  const [activeTarget, setActiveTarget] = useState<Target | "all">("all");
  const [sentiments, setSentiments] = useState<Set<Sentiment>>(new Set());
  const [severities, setSeverities] = useState<Set<Severity>>(new Set());
  const [sourceGroups, setSourceGroups] = useState<Set<SourceGroup>>(new Set());
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const activeFilterCount =
    sentiments.size + severities.size + sourceGroups.size + (dateRange !== "30d" ? 1 : 0);

  const filtered = useMemo(() => {
    const limit = DATE_LIMIT[dateRange];
    return FEED.filter((n) => {
      if (activeTarget !== "all" && n.target !== activeTarget) return false;
      if (activeCat !== "all" && n.category !== activeCat) return false;
      if (sentiments.size > 0 && !sentiments.has(n.sentiment)) return false;
      if (severities.size > 0 && !severities.has(n.severity)) return false;
      if (sourceGroups.size > 0) {
        const inGroup = Array.from(sourceGroups).some((g) =>
          SOURCE_TYPE_GROUPS[g].includes(n.sourceType),
        );
        if (!inGroup) return false;
      }
      if (typeof n.hoursAgo === "number" && n.hoursAgo > limit) return false;
      if (
        query !== "" &&
        !n.title.toLowerCase().includes(query.toLowerCase()) &&
        !n.entities.some((e) => e.toLowerCase().includes(query.toLowerCase()))
      )
        return false;
      return true;
    });
  }, [activeCat, activeTarget, sentiments, severities, sourceGroups, dateRange, query]);

  const resetFilters = () => {
    setSentiments(new Set());
    setSeverities(new Set());
    setSourceGroups(new Set());
    setDateRange("30d");
  };

  const counts = useMemo(() => {
    const c = { self: 0, customer: 0, regulation: 0, fraud: 0 } as Record<Category, number>;
    FEED.forEach((n) => c[n.category]++);
    return c;
  }, []);

  const targetCounts = useMemo(() => {
    const c = { bvtpa: 0, insurer: 0, provider: 0, industry: 0 } as Record<Target, number>;
    FEED.forEach((n) => c[n.target]++);
    return c;
  }, []);


  const critical = FEED.filter((n) => n.severity === "critical");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Intelligence
          </div>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight">Social Listener</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time monitoring ของข่าวสาร, social signal และความเสี่ยงที่กระทบ BVTPA, ลูกค้า, และอุตสาหกรรม
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Live · sync ทุก 5 นาที · 12 sources
          </div>
          <button
            onClick={() => setSourcesOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-accent"
          >
            <Settings2 className="h-3.5 w-3.5" /> Manage Sources
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Mentions Today"
          value="486"
          delta={28}
          sub="vs 7-day avg"
          icon={MessageSquare}
          tone="info"
        />
        <KpiCard
          label="Negative Signals"
          value="84"
          delta={42}
          sub="ต้องตอบสนองภายใน 24 ชม."
          icon={TrendingDown}
          tone="destructive"
        />
        <KpiCard
          label="Critical Alerts"
          value={String(critical.length)}
          sub="ที่ต้องเสนอผู้บริหาร"
          icon={AlertTriangle}
          tone="warning"
        />
        <KpiCard
          label="Share of Voice"
          value="32%"
          delta={6}
          sub="ในกลุ่ม TPA Thailand"
          icon={TrendingUp}
          tone="success"
        />
      </div>

      {/* Critical alerts banner */}
      {critical.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-destructive/15 text-destructive">
              <Flame className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Critical signals — ต้องการการตัดสินใจทันที
                </h3>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-destructive">
                  {critical.length} events
                </span>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {critical.map((n) => (
                  <button
                    key={n.id}
                    className="group flex items-start gap-3 rounded-md border border-destructive/30 bg-card p-3 text-left transition-colors hover:border-destructive"
                  >
                    <Hotness />
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-medium">{n.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{n.source}</span>
                        <span>·</span>
                        <span>{n.time}</span>
                        <span>·</span>
                        <span>reach {(n.reach / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Target tabs — Part 1: who is being talked about */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Conversation target
          </div>
          <button
            onClick={() => setActiveTarget("all")}
            className={cn(
              "text-[11px] font-medium",
              activeTarget === "all" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            ดูทั้งหมด
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {(Object.keys(TARGET_META) as Target[]).map((t) => {
            const meta = TARGET_META[t];
            const Icon = meta.icon;
            const active = activeTarget === t;
            const negCount = FEED.filter((n) => n.target === t && n.sentiment === "negative").length;
            return (
              <button
                key={t}
                onClick={() => setActiveTarget(active ? "all" : t)}
                className={cn(
                  "rounded-lg border bg-card p-4 text-left transition-all",
                  active
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-md bg-muted", meta.tone)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-bold tabular-nums">{targetCounts[t]}</span>
                </div>
                <div className="mt-2 text-sm font-semibold">{meta.label}</div>
                <div className="mt-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{meta.sub}</span>
                  {negCount > 0 && (
                    <span className="font-semibold text-destructive">{negCount} neg</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">

        {(Object.keys(CATEGORY_META) as Category[]).map((c) => {
          const meta = CATEGORY_META[c];
          const Icon = meta.icon;
          const active = activeCat === c;
          return (
            <button
              key={c}
              onClick={() => setActiveCat(active ? "all" : c)}
              className={cn(
                "rounded-lg border bg-card p-4 text-left transition-all",
                active
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40",
              )}
            >
              <div className="flex items-center justify-between">
                <Icon className={cn("h-5 w-5", meta.tone)} />
                <span className="text-2xl font-bold tabular-nums">{counts[c]}</span>
              </div>
              <div className="mt-2 text-sm font-semibold">{meta.label}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {c === "self" && "ข่าวเกี่ยวกับเรา · ชื่อเสียง"}
                {c === "customer" && "Insurer & Provider events"}
                {c === "regulation" && "นโยบาย · กฎหมายใหม่"}
                {c === "fraud" && "สัญญาณทุจริตภายนอก"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          title="Mention trend (14 days)"
          subtitle="แยกตาม sentiment"
          className="lg:col-span-2"
        >
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mentionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="pos" stroke="var(--color-success)" strokeWidth={2} dot={false} name="Positive" />
                <Line type="monotone" dataKey="neu" stroke="var(--color-muted-foreground)" strokeWidth={2} dot={false} name="Neutral" />
                <Line type="monotone" dataKey="neg" stroke="var(--color-destructive)" strokeWidth={2} dot={false} name="Negative" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Top entities" subtitle="ถูกพูดถึงมากสุดวันนี้">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topEntities} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="mentions" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Feed + sidebar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Signals feed"
            subtitle={`${filtered.length} จาก ${FEED.length} รายการ`}
            actions={
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ค้นหา..."
                    className="h-8 w-44 pl-7 text-xs"
                  />
                </div>
                <SentimentPicker value={sentiment} onChange={setSentiment} />
              </div>
            }
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-border">
              {filtered.map((n) => (
                <FeedItem key={n.id} item={n} />
              ))}
              {filtered.length === 0 && (
                <li className="px-4 py-12 text-center text-sm text-muted-foreground">
                  ไม่มีรายการตรงกับ filter ปัจจุบัน
                </li>
              )}
            </ul>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Recommended actions" subtitle="แนะนำโดยระบบ">
            <ul className="space-y-3">
              <ActionRow
                tone="destructive"
                icon={ShieldAlert}
                title="เปิด War Room"
                desc="กระแสร้องเรียน Pantip ใน 6 ชม. — เตรียม official statement"
              />
              <ActionRow
                tone="warning"
                icon={Gavel}
                title="Brief Compliance Team"
                desc="ร่าง คปภ. ใหม่ ต้องประเมิน impact ต่อสัญญาบริการ"
              />
              <ActionRow
                tone="info"
                icon={Sparkles}
                title="Amplify positive review"
                desc="42 รีวิวเชิงบวก OPD — ส่งต่อให้ทีม Marketing"
              />
              <ActionRow
                tone="destructive"
                icon={AlertTriangle}
                title="Audit Provider XYZ"
                desc="ตรวจสอบเคลมย้อนหลัง 90 วัน ก่อนข่าวขยายผล"
              />
            </ul>
          </Panel>

          <Panel title="Sources" subtitle="กระจายของ signal วันนี้">
            <div className="space-y-2.5">
              {[
                { name: "News (online)", pct: 42, color: "var(--color-primary)" },
                { name: "Pantip / Forum", pct: 18, color: "var(--color-warning)" },
                { name: "Facebook", pct: 16, color: "var(--color-info)" },
                { name: "X (Twitter)", pct: 12, color: "var(--color-success)" },
                { name: "Gov / Official", pct: 8, color: "var(--color-destructive)" },
                { name: "Blogs", pct: 4, color: "var(--color-muted-foreground)" },
              ].map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="font-semibold tabular-nums">{s.pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.pct}%`, background: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Part 2: Data source configuration */}
      <DataSourcesSection />
    </div>
  );
}

function DataSourcesSection() {
  const [sources, setSources] = useState<ConfiguredSource[]>(SEED_SOURCES);
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newScope, setNewScope] = useState<Target>("industry");
  const [newEntity, setNewEntity] = useState("");
  const [newKind, setNewKind] = useState<"rss" | "page" | "social">("page");

  // Manual news upload state
  const [mTitle, setMTitle] = useState("");
  const [mUrl, setMUrl] = useState("");
  const [mSummary, setMSummary] = useState("");
  const [mScope, setMScope] = useState<Target>("industry");
  const [mSentiment, setMSentiment] = useState<Sentiment>("negative");
  const [mSeverity, setMSeverity] = useState<Severity>("med");
  const [uploaded, setUploaded] = useState<
    { id: string; title: string; scope: Target; sentiment: Sentiment; severity: Severity; time: string }[]
  >([]);

  const addSource = () => {
    if (!newUrl.trim()) return;
    setSources((s) => [
      {
        id: `s${Date.now()}`,
        url: newUrl.trim(),
        label: newLabel.trim() || newUrl.trim(),
        scope: newScope,
        entity: newEntity.trim() || undefined,
        kind: newKind,
        active: true,
      },
      ...s,
    ]);
    setNewUrl("");
    setNewLabel("");
    setNewEntity("");
  };

  const toggleSource = (id: string) =>
    setSources((s) => s.map((x) => (x.id === id ? { ...x, active: !x.active } : x)));
  const removeSource = (id: string) => setSources((s) => s.filter((x) => x.id !== id));

  const submitManual = () => {
    if (!mTitle.trim()) return;
    setUploaded((u) => [
      {
        id: `m${Date.now()}`,
        title: mTitle.trim(),
        scope: mScope,
        sentiment: mSentiment,
        severity: mSeverity,
        time: "เพิ่งอัปโหลด",
      },
      ...u,
    ]);
    setMTitle("");
    setMUrl("");
    setMSummary("");
  };

  return (
    <div>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Configuration
          </div>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight">Online & Offline data sources</h2>
          <p className="text-xs text-muted-foreground">
            กำหนดเอง URL ที่อยากให้ระบบติดตาม หรืออัปโหลดข่าวที่เจอเองพร้อมระบุ sentiment / severity
          </p>
        </div>
        <div className="text-[11px] text-muted-foreground">
          {sources.filter((s) => s.active).length} active · {sources.length} total
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Online sources */}
        <Panel
          title={
            <span className="inline-flex items-center gap-2">
              <Globe className="h-4 w-4" /> Online sources (URL)
            </span>
          }
          subtitle="RSS / หน้าข่าว / โซเชียลที่อยากให้ระบบ crawl"
        >
          <div className="space-y-3">
            <div className="rounded-md border border-dashed border-border bg-muted/30 p-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Input
                  placeholder="https://example.com/news หรือ RSS feed"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="h-8 text-xs md:col-span-2"
                />
                <Input
                  placeholder="Label (เช่น คปภ. — ข่าวประชาสัมพันธ์)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  placeholder="Entity (optional) เช่น AIA Thailand"
                  value={newEntity}
                  onChange={(e) => setNewEntity(e.target.value)}
                  className="h-8 text-xs"
                />
                <ScopePicker value={newScope} onChange={setNewScope} />
                <div className="flex items-center justify-between gap-2">
                  <KindPicker value={newKind} onChange={setNewKind} />
                  <button
                    onClick={addSource}
                    className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-3.5 w-3.5" /> เพิ่ม source
                  </button>
                </div>
              </div>
            </div>

            <ul className="divide-y divide-border rounded-md border border-border">
              {sources.map((s) => {
                const meta = TARGET_META[s.scope];
                const KindIcon = s.kind === "rss" ? Rss : s.kind === "social" ? MessageSquare : Globe;
                return (
                  <li key={s.id} className="flex items-start gap-3 px-3 py-2.5">
                    <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted", meta.tone)}>
                      <KindIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-medium">{s.label}</span>
                        <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-foreground/70">
                          {meta.label}
                        </span>
                        {s.entity && (
                          <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-1.5 py-0.5 text-[9px] font-medium text-foreground/70">
                            {s.entity}
                          </span>
                        )}
                      </div>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-muted-foreground hover:text-primary"
                      >
                        <Link2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{s.url}</span>
                      </a>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleSource(s.id)}
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                          s.active
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {s.active ? "Active" : "Paused"}
                      </button>
                      <button
                        onClick={() => removeSource(s.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Panel>

        {/* Manual news upload */}
        <Panel
          title={
            <span className="inline-flex items-center gap-2">
              <Upload className="h-4 w-4" /> Manual news upload
            </span>
          }
          subtitle="เจอข่าวเอง? เพิ่มเข้าฟีดและกำหนดความเสี่ยงได้เลย"
        >
          <div className="space-y-2.5">
            <Input
              placeholder="หัวข้อข่าว"
              value={mTitle}
              onChange={(e) => setMTitle(e.target.value)}
              className="h-8 text-xs"
            />
            <Input
              placeholder="URL ที่มา (optional)"
              value={mUrl}
              onChange={(e) => setMUrl(e.target.value)}
              className="h-8 text-xs"
            />
            <Textarea
              placeholder="สรุปสั้น ๆ / ทำไมถึง flag"
              value={mSummary}
              onChange={(e) => setMSummary(e.target.value)}
              className="min-h-[70px] text-xs"
            />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <ScopePicker value={mScope} onChange={setMScope} compact />
              <SentimentPicker2 value={mSentiment} onChange={setMSentiment} />
              <SeverityPicker value={mSeverity} onChange={setMSeverity} />
            </div>
            <button
              onClick={submitManual}
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <FileText className="h-3.5 w-3.5" /> เพิ่มเข้าฟีด
            </button>

            {uploaded.length > 0 && (
              <ul className="mt-3 space-y-2 border-t border-border pt-3">
                {uploaded.map((u) => (
                  <li key={u.id} className="flex items-start gap-2 rounded-md bg-muted/40 p-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{u.title}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="rounded-full bg-card px-1.5 py-0.5 font-semibold uppercase tracking-wider">
                          {TARGET_META[u.scope].label}
                        </span>
                        <span className={cn("rounded-full px-1.5 py-0.5 font-semibold uppercase tracking-wider", SENT_STYLE[u.sentiment])}>
                          {u.sentiment}
                        </span>
                        <span className={cn("rounded-full px-1.5 py-0.5 font-semibold uppercase tracking-wider", SEV_STYLE[u.severity])}>
                          {u.severity}
                        </span>
                        <span>· {u.time}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ScopePicker({
  value,
  onChange,
  compact,
}: {
  value: Target;
  onChange: (t: Target) => void;
  compact?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Target)}
      className={cn(
        "h-8 rounded-md border border-input bg-transparent px-2 text-xs",
        compact ? "" : "md:col-span-1",
      )}
    >
      {(Object.keys(TARGET_META) as Target[]).map((t) => (
        <option key={t} value={t}>
          Scope: {TARGET_META[t].label}
        </option>
      ))}
    </select>
  );
}

function KindPicker({
  value,
  onChange,
}: {
  value: "rss" | "page" | "social";
  onChange: (k: "rss" | "page" | "social") => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as "rss" | "page" | "social")}
      className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
    >
      <option value="page">Type: Web page</option>
      <option value="rss">Type: RSS feed</option>
      <option value="social">Type: Social</option>
    </select>
  );
}

function SentimentPicker2({
  value,
  onChange,
}: {
  value: Sentiment;
  onChange: (s: Sentiment) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Sentiment)}
      className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
    >
      <option value="positive">Sentiment: Positive</option>
      <option value="neutral">Sentiment: Neutral</option>
      <option value="negative">Sentiment: Negative</option>
    </select>
  );
}

function SeverityPicker({
  value,
  onChange,
}: {
  value: Severity;
  onChange: (s: Severity) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Severity)}
      className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
    >
      <option value="low">Severity: Low</option>
      <option value="med">Severity: Medium</option>
      <option value="high">Severity: High</option>
      <option value="critical">Severity: Critical</option>
    </select>
  );
}


function Hotness() {
  return (
    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
      <Flame className="h-3.5 w-3.5" />
    </div>
  );
}

function SentimentPicker({
  value,
  onChange,
}: {
  value: Sentiment | "all";
  onChange: (s: Sentiment | "all") => void;
}) {
  const opts: { v: Sentiment | "all"; label: string }[] = [
    { v: "all", label: "All" },
    { v: "positive", label: "Pos" },
    { v: "neutral", label: "Neu" },
    { v: "negative", label: "Neg" },
  ];
  return (
    <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "rounded-[5px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors",
            value === o.v
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const SENT_STYLE: Record<Sentiment, string> = {
  positive: "bg-success/15 text-success border-success/30",
  neutral: "bg-muted text-muted-foreground border-border",
  negative: "bg-destructive/15 text-destructive border-destructive/30",
};

const SEV_STYLE: Record<Severity, string> = {
  low: "bg-muted text-muted-foreground",
  med: "bg-info/15 text-info",
  high: "bg-warning/15 text-warning",
  critical: "bg-destructive/15 text-destructive",
};

function FeedItem({ item }: { item: NewsItem }) {
  const Cat = CATEGORY_META[item.category].icon;
  return (
    <li className="group flex gap-4 px-4 py-4 transition-colors hover:bg-accent/40">
      <div className="flex flex-col items-center gap-2">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-md",
            CATEGORY_META[item.category].tone,
            "bg-muted",
          )}
        >
          <Cat className="h-5 w-5" />
        </div>
        {item.hot && (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-destructive">
            <Flame className="h-2.5 w-2.5" /> Hot
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              SENT_STYLE[item.sentiment],
            )}
          >
            {item.sentiment}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              SEV_STYLE[item.severity],
            )}
          >
            {item.severity}
          </span>
          {item.entities.map((e) => (
            <span
              key={e}
              className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-foreground/80"
            >
              {e}
            </span>
          ))}
        </div>
        <h4 className="mt-1.5 text-sm font-semibold leading-snug">{item.title}</h4>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.summary}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Newspaper className="h-3 w-3" />
            {item.source}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {item.time}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" />
            reach {item.reach.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1">
            <Share2 className="h-3 w-3" />
            {item.mentions} mentions
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground">
          <Bookmark className="h-3.5 w-3.5" />
        </button>
        <button className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground">
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

function ActionRow({
  tone,
  icon: Icon,
  title,
  desc,
}: {
  tone: "destructive" | "warning" | "info";
  icon: typeof Filter;
  title: string;
  desc: string;
}) {
  const toneMap = {
    destructive: "bg-destructive/15 text-destructive",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/15 text-info",
  };
  return (
    <li className="flex gap-3">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", toneMap[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
      </div>
    </li>
  );
}
