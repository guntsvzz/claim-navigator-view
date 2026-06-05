import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
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
  Trash2,
  Globe,
  Rss,
  CheckCircle2,
  Settings2,
  X,
  ListPlus,
  Siren,
  CheckCheck,
  ChevronDown,
  Wand2,
  PenLine,
  Pin,
  Hash,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Panel } from "@/components/dashboard/panel";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { insurers as MOCK_INSURERS, providers as MOCK_PROVIDERS } from "@/lib/mock-data";
import { Upload } from "lucide-react";
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
  sourceType: "News" | "Facebook" | "X" | "Pantip" | "Gov" | "Blog" | "Manual";
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
  manual?: boolean;
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
  const [addSignalOpen, setAddSignalOpen] = useState(false);
  const [sources, setSources] = useState<ConfiguredSource[]>(SEED_SOURCES);
  const [manualSignals, setManualSignals] = useState<NewsItem[]>([]);
  const feedRef = useRef<HTMLDivElement | null>(null);

  const FEED_ALL = useMemo(() => [...manualSignals, ...FEED], [manualSignals]);
  const activeSourceCount = sources.filter((s) => s.active).length;

  const scrollToFeed = () => {
    requestAnimationFrame(() => {
      feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const onTargetClick = (t: Target | "all") => {
    setActiveTarget(t);
    scrollToFeed();
  };
  const onCategoryClick = (c: Category | "all") => {
    setActiveCat(c);
    scrollToFeed();
  };

  const activeFilterCount =
    sentiments.size + severities.size + sourceGroups.size + (dateRange !== "30d" ? 1 : 0);

  const filtered = useMemo(() => {
    const limit = DATE_LIMIT[dateRange];
    return FEED_ALL.filter((n) => {
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
  }, [FEED_ALL, activeCat, activeTarget, sentiments, severities, sourceGroups, dateRange, query]);

  const resetFilters = () => {
    setSentiments(new Set());
    setSeverities(new Set());
    setSourceGroups(new Set());
    setDateRange("30d");
  };

  const counts = useMemo(() => {
    const c = { self: 0, customer: 0, regulation: 0, fraud: 0 } as Record<Category, number>;
    FEED_ALL.forEach((n) => c[n.category]++);
    return c;
  }, [FEED_ALL]);

  const targetCounts = useMemo(() => {
    const c = { bvtpa: 0, insurer: 0, provider: 0, industry: 0 } as Record<Target, number>;
    FEED_ALL.forEach((n) => c[n.target]++);
    return c;
  }, [FEED_ALL]);

  const critical = FEED_ALL.filter((n) => n.severity === "critical");

  const handleAddSignal = (s: NewsItem) => {
    setManualSignals((prev) => [s, ...prev]);
    toast.success("Signal added to feed", {
      description: `${TARGET_META[s.target].label} · ${s.sentiment} · ${s.severity}`,
    });
  };

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
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Live · sync ทุก 5 นาที · {activeSourceCount} sources
          </div>
          <button
            onClick={() => setSourcesOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-accent"
          >
            <Settings2 className="h-3.5 w-3.5" /> Manage Sources
          </button>
          <button
            onClick={() => setAddSignalOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> Add Signal
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

      {/* Compact target summary bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Target
        </span>
        <button
          onClick={() => onTargetClick("all")}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
            activeTarget === "all"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          All · {FEED_ALL.length}
        </button>
        {(Object.keys(TARGET_META) as Target[]).map((t) => {
          const meta = TARGET_META[t];
          const Icon = meta.icon;
          const active = activeTarget === t;
          const negCount = FEED_ALL.filter((n) => n.target === t && n.sentiment === "negative").length;
          return (
            <button
              key={t}
              onClick={() => onTargetClick(active ? "all" : t)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/80 hover:bg-accent",
              )}
            >
              <Icon className={cn("h-3 w-3", !active && meta.tone)} />
              <span>{meta.label}</span>
              <span className="tabular-nums opacity-70">· {targetCounts[t]}</span>
              {negCount > 0 && (
                <span className={cn(
                  "rounded-full px-1.5 py-0 text-[10px] font-bold",
                  active ? "bg-primary-foreground/20" : "bg-destructive/15 text-destructive",
                )}>
                  {negCount}
                </span>
              )}
            </button>
          );
        })}
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
              onClick={() => onCategoryClick(active ? "all" : c)}
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
      <div ref={feedRef} className="grid grid-cols-1 gap-4 lg:grid-cols-3 scroll-mt-4">
        <div className="lg:col-span-2">
          <Panel
            title={
              activeTarget !== "all"
                ? `Showing ${filtered.length} signals for ${TARGET_META[activeTarget].label}`
                : activeCat !== "all"
                  ? `Showing ${filtered.length} signals · ${CATEGORY_META[activeCat].label}`
                  : "Signals feed"
            }
            subtitle={
              activeTarget !== "all" || activeCat !== "all" || activeFilterCount > 0 || query
                ? `${filtered.length} จาก ${FEED_ALL.length} รายการ · filters active`
                : `${filtered.length} จาก ${FEED_ALL.length} รายการ`
            }
            bodyClassName="p-0"
          >
            <FilterBar
              query={query}
              setQuery={setQuery}
              sentiments={sentiments}
              setSentiments={setSentiments}
              severities={severities}
              setSeverities={setSeverities}
              sourceGroups={sourceGroups}
              setSourceGroups={setSourceGroups}
              dateRange={dateRange}
              setDateRange={setDateRange}
              activeCount={activeFilterCount}
              onReset={resetFilters}
            />
            <ul className="divide-y divide-border">
              {filtered.map((n) => (
                <FeedItem key={n.id} item={n} />
              ))}
              {filtered.length === 0 && (
                <li className="px-6 py-16">
                  <EmptyState
                    hasFilters={activeFilterCount > 0 || activeTarget !== "all" || activeCat !== "all" || !!query}
                    onReset={() => {
                      resetFilters();
                      setActiveTarget("all");
                      setActiveCat("all");
                      setQuery("");
                    }}
                  />
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

      {/* Manage Sources — admin task (Job 1: "Watch this for me") */}
      <Sheet open={sourcesOpen} onOpenChange={setSourcesOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> Manage Sources
            </SheetTitle>
            <SheetDescription>
              URL ที่ระบบ crawl อัตโนมัติ จัดกลุ่มตามความสัมพันธ์กับ entity ในระบบ
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ManageSourcesPanel sources={sources} setSources={setSources} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Signal — in-the-moment capture (Job 2: "I found something, log it") */}
      <AddSignalDialog
        open={addSignalOpen}
        onOpenChange={setAddSignalOpen}
        onSubmit={handleAddSignal}
      />

    </div>
  );
}

function FilterBar({
  query,
  setQuery,
  sentiments,
  setSentiments,
  severities,
  setSeverities,
  sourceGroups,
  setSourceGroups,
  dateRange,
  setDateRange,
  activeCount,
  onReset,
}: {
  query: string;
  setQuery: (s: string) => void;
  sentiments: Set<Sentiment>;
  setSentiments: (s: Set<Sentiment>) => void;
  severities: Set<Severity>;
  setSeverities: (s: Set<Severity>) => void;
  sourceGroups: Set<SourceGroup>;
  setSourceGroups: (s: Set<SourceGroup>) => void;
  dateRange: DateRange;
  setDateRange: (d: DateRange) => void;
  activeCount: number;
  onReset: () => void;
}) {
  const toggle = <T,>(set: Set<T>, val: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setter(next);
  };

  const dateOpts: { v: DateRange; label: string }[] = [
    { v: "today", label: "Today" },
    { v: "7d", label: "7d" },
    { v: "30d", label: "30d" },
    { v: "all", label: "All" },
  ];

  const sentOpts: { v: Sentiment; label: string; tone: string }[] = [
    { v: "positive", label: "Positive", tone: "text-success" },
    { v: "neutral", label: "Neutral", tone: "text-muted-foreground" },
    { v: "negative", label: "Negative", tone: "text-destructive" },
  ];

  const sevOpts: { v: Severity; label: string }[] = [
    { v: "low", label: "Low" },
    { v: "med", label: "Medium" },
    { v: "high", label: "High" },
    { v: "critical", label: "Critical" },
  ];

  const srcOpts: SourceGroup[] = ["News", "Forum", "Social", "Gov & Official"];

  return (
    <div className="border-b border-border bg-muted/20 px-4 py-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาข่าว หรือ entity..."
            className="h-8 w-full pl-7 text-xs"
          />
        </div>

        <div className="inline-flex overflow-hidden rounded-md border border-border bg-card">
          {dateOpts.map((o) => (
            <button
              key={o.v}
              onClick={() => setDateRange(o.v)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-semibold transition-colors",
                dateRange === o.v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" /> Reset ({activeCount})
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <PillRow
          label="Sentiment"
          options={sentOpts.map((o) => ({
            key: o.v,
            label: o.label,
            tone: o.tone,
            active: sentiments.has(o.v),
            onToggle: () => toggle(sentiments, o.v, setSentiments),
          }))}
        />
        <PillRow
          label="Severity"
          options={sevOpts.map((o) => ({
            key: o.v,
            label: o.label,
            active: severities.has(o.v),
            onToggle: () => toggle(severities, o.v, setSeverities),
          }))}
        />
        <PillRow
          label="Source"
          options={srcOpts.map((o) => ({
            key: o,
            label: o,
            active: sourceGroups.has(o),
            onToggle: () => toggle(sourceGroups, o, setSourceGroups),
          }))}
        />
      </div>
    </div>
  );
}

function PillRow({
  label,
  options,
}: {
  label: string;
  options: { key: string; label: string; tone?: string; active: boolean; onToggle: () => void }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
        {label}
      </span>
      {options.map((o) => (
        <button
          key={o.key}
          onClick={o.onToggle}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
            o.active
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-foreground/70 hover:bg-accent",
          )}
        >
          {o.active && <CheckCircle2 className="h-2.5 w-2.5" />}
          <span className={cn(!o.active && o.tone)}>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Search className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold">ไม่มีรายการตรงกับ filter</div>
          <p className="mt-1 text-xs text-muted-foreground">
            ลองลด filter หรือขยายช่วงเวลาเพื่อดูสัญญาณเพิ่มเติม
          </p>
        </div>
        <button
          onClick={onReset}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-semibold hover:bg-accent"
        >
          <X className="h-3.5 w-3.5" /> Clear all filters
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCheck className="h-6 w-6" />
      </div>
      <div>
        <div className="text-sm font-semibold">All clear — ไม่มีสัญญาณที่ต้องดำเนินการ</div>
        <p className="mt-1 text-xs text-muted-foreground">
          ระบบยัง monitoring อยู่ตลอด · sync ครั้งถัดไปใน 5 นาที
        </p>
      </div>
    </div>
  );
}

// =====================================================================
// Manage Sources — entity-first
// =====================================================================

type EntityRow = {
  id: string;
  name: string;
  type: "Insurer" | "Provider";
  domainHint: string;
};

// Build a realistic-feeling directory of ~150 entities for the demo,
// seeded with the real mock-data records so screenshots stay consistent.
const EXTRA_INSURERS: { code: string; name: string }[] = [
  { code: "AXA", name: "AXA Insurance" }, { code: "ALZ", name: "Allianz Ayudhya" },
  { code: "CHB", name: "Chubb Life" }, { code: "GEN", name: "Generali Thailand" },
  { code: "ING", name: "Ing Life" }, { code: "PRD", name: "Prudential Thailand" },
  { code: "SCB", name: "SCB Life" }, { code: "KTL", name: "Krungthai-AXA Life" },
  { code: "TCB", name: "Tokio Marine Life" }, { code: "MSI", name: "MSIG Insurance" },
  { code: "DHP", name: "Dhipaya Insurance" }, { code: "VBG", name: "Viriyah Insurance" },
  { code: "BUI", name: "Bangkok Union Insurance" }, { code: "TUI", name: "Thai Union Insurance" },
  { code: "ETQ", name: "Etiqa Insurance" }, { code: "OCN", name: "Ocean Life" },
];
const EXTRA_PROVIDERS: { code: string; name: string }[] = [
  { code: "SRK", name: "Siriraj Hospital" }, { code: "CMU", name: "Chulalongkorn Hospital" },
  { code: "RMD", name: "Ramathibodi Hospital" }, { code: "BHQ", name: "BHQ Medical Centre" },
  { code: "MET", name: "Metro Hospital" }, { code: "PYO", name: "Phayao Hospital" },
  { code: "BNK", name: "Bangkok Nursing Home" }, { code: "PSC", name: "Police General Hospital" },
  { code: "STH", name: "Saint Louis Hospital" }, { code: "TNW", name: "Thainakarin Hospital" },
  { code: "SKM", name: "Sukumvit Hospital" }, { code: "LMC", name: "Lardprao Medical Center" },
  { code: "NPH", name: "Nopparat Hospital" }, { code: "BNP", name: "Bangpakok Hospital" },
  { code: "RBT", name: "Ratchaburi Tropical Hospital" }, { code: "HKM", name: "Hat Yai Medical" },
  { code: "PRC", name: "Praram 9 Hospital" }, { code: "MCT", name: "Mayo Clinic Thailand" },
];

function slugDomain(name: string, suffix: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 14) || "site";
  return `${slug}.${suffix}`;
}

const ENTITY_DIRECTORY: EntityRow[] = (() => {
  const ins: EntityRow[] = [
    ...MOCK_INSURERS.map((i) => ({
      id: i.id,
      name: i.name_en,
      type: "Insurer" as const,
      domainHint: `${i.code.toLowerCase()}.co.th`,
    })),
    ...EXTRA_INSURERS.map((i, idx) => ({
      id: `INSX${idx}`,
      name: i.name,
      type: "Insurer" as const,
      domainHint: slugDomain(i.name, "co.th"),
    })),
  ];
  const prv: EntityRow[] = [
    ...MOCK_PROVIDERS.map((p) => ({
      id: p.id,
      name: p.name_en,
      type: "Provider" as const,
      domainHint: `${p.code.toLowerCase()}.com`,
    })),
    ...EXTRA_PROVIDERS.map((p, idx) => ({
      id: `PRVX${idx}`,
      name: p.name,
      type: "Provider" as const,
      domainHint: slugDomain(p.name, "com"),
    })),
  ];
  // Pad with generated branch hospitals to reach a believable ~150
  const pad: EntityRow[] = [];
  const cities = ["Chiang Rai", "Khon Kaen", "Korat", "Hat Yai", "Pattaya", "Rayong", "Udon", "Surat", "Phuket", "Hua Hin"];
  for (let i = pad.length; ins.length + prv.length + pad.length < 150; i++) {
    const c = cities[i % cities.length];
    const name = `${c} Regional Hospital ${Math.floor(i / cities.length) + 1}`;
    pad.push({
      id: `PRVG${i}`,
      name,
      type: "Provider",
      domainHint: slugDomain(name, "com"),
    });
  }
  return [...ins, ...prv, ...pad];
})();

function suggestUrlsFor(e: EntityRow): { label: string; url: string }[] {
  const d = e.domainHint;
  if (e.type === "Insurer") {
    return [
      { label: "Media centre", url: `https://${d}/th/media-centre` },
      { label: "Press releases", url: `https://${d}/about/news` },
      { label: "Google News query", url: `https://news.google.com/search?q=${encodeURIComponent(e.name)}` },
    ];
  }
  return [
    { label: "Hospital news", url: `https://${d}/news` },
    { label: "Press room", url: `https://${d}/about/press` },
    { label: "Google News query", url: `https://news.google.com/search?q=${encodeURIComponent(e.name)}` },
  ];
}

type ManageTab = "entities" | "general";

function ManageSourcesPanel({
  sources,
  setSources,
}: {
  sources: ConfiguredSource[];
  setSources: React.Dispatch<React.SetStateAction<ConfiguredSource[]>>;
}) {
  const [tab, setTab] = useState<ManageTab>("entities");
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "covered" | "uncovered">("all");
  const [csvOpen, setCsvOpen] = useState(false);

  // Map entity name → sources
  const sourcesByEntity = useMemo(() => {
    const map = new Map<string, ConfiguredSource[]>();
    sources.forEach((s) => {
      if (s.entity) {
        const arr = map.get(s.entity) ?? [];
        arr.push(s);
        map.set(s.entity, arr);
      }
    });
    return map;
  }, [sources]);

  const generalSources = useMemo(
    () => sources.filter((s) => !s.entity),
    [sources],
  );

  const coveredCount = useMemo(
    () => ENTITY_DIRECTORY.filter((e) => (sourcesByEntity.get(e.name)?.length ?? 0) > 0).length,
    [sourcesByEntity],
  );
  const total = ENTITY_DIRECTORY.length;
  const pct = Math.round((coveredCount / total) * 100);

  const filteredEntities = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ENTITY_DIRECTORY.filter((e) => {
      const has = (sourcesByEntity.get(e.name)?.length ?? 0) > 0;
      if (filter === "covered" && !has) return false;
      if (filter === "uncovered" && has) return false;
      if (!needle) return true;
      return e.name.toLowerCase().includes(needle) || e.type.toLowerCase().includes(needle);
    });
  }, [q, filter, sourcesByEntity]);

  const addSourceForEntity = (e: EntityRow, url: string, label?: string) => {
    const src: ConfiguredSource = {
      id: `s${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url,
      label: label || `${e.name} — ${new URL(url).hostname.replace("www.", "")}`,
      scope: e.type === "Insurer" ? "insurer" : "provider",
      entity: e.name,
      kind: url.includes("rss") || url.endsWith(".xml") ? "rss" : "page",
      active: true,
    };
    setSources((prev) => [src, ...prev]);
    toast.success("Source added", { description: `${e.name} · will sync next cycle` });
  };

  const toggleSource = (id: string) =>
    setSources((s) =>
      s.map((x) => {
        if (x.id !== id) return x;
        const next = { ...x, active: !x.active };
        toast(next.active ? "Source resumed" : "Source paused", { description: x.label });
        return next;
      }),
    );
  const removeSource = (id: string) =>
    setSources((s) => {
      const item = s.find((x) => x.id === id);
      if (item) toast("Source removed", { description: item.label });
      return s.filter((x) => x.id !== id);
    });

  return (
    <div className="space-y-4">
      {/* Coverage indicator */}
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-sm font-semibold">
            <span className="tabular-nums">{coveredCount}</span>
            <span className="text-muted-foreground"> / {total}</span>
            <span className="ml-1.5 text-muted-foreground font-normal">entities have at least one source</span>
          </div>
          <span className="text-xs font-semibold tabular-nums text-primary">{pct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{total - coveredCount} entities ยังไม่มี source</span>
          <button
            onClick={() => setCsvOpen(true)}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 font-semibold text-foreground hover:bg-accent"
          >
            <Upload className="h-3 w-3" /> Import via CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-md border border-border bg-muted/30 p-1">
        {([
          { id: "entities", label: "Entities", count: total },
          { id: "general", label: "General / Governance", count: generalSources.length },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-sm px-2 py-1.5 text-xs font-semibold transition-colors",
              tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "entities" ? (
        <div className="space-y-2">
          {/* Search + filter row */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search insurer or provider..."
                className="h-9 pl-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
              {(["all", "covered", "uncovered"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-sm px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors",
                    filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f === "uncovered" ? "Gaps" : f}
                </button>
              ))}
            </div>
          </div>

          {/* Entity list */}
          <div className="max-h-[460px] overflow-y-auto rounded-md border border-border">
            {filteredEntities.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">ไม่พบ entity ที่ตรงกับการค้นหา</div>
            ) : (
              <ul className="divide-y divide-border">
                {filteredEntities.slice(0, 80).map((e) => {
                  const linked = sourcesByEntity.get(e.name) ?? [];
                  const isOpen = expanded === e.id;
                  const Icon = e.type === "Insurer" ? Building2 : Hospital;
                  return (
                    <li key={e.id}>
                      <button
                        onClick={() => setExpanded(isOpen ? null : e.id)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/40"
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", e.type === "Insurer" ? "text-primary" : "text-success")} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">{e.name}</span>
                            <span className="rounded-full border border-border bg-muted/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {e.type}
                            </span>
                          </div>
                        </div>
                        {linked.length > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                            <CheckCircle2 className="h-3 w-3" /> {linked.length} source{linked.length > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            No source yet
                          </span>
                        )}
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                            isOpen && "rotate-180",
                          )}
                        />
                      </button>

                      {isOpen && (
                        <div className="space-y-3 border-t border-border bg-muted/20 px-3 py-3">
                          {linked.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Linked sources
                              </div>
                              <ul className="space-y-1.5">
                                {linked.map((s) => (
                                  <li key={s.id} className="flex items-start gap-2 rounded-md border border-border bg-background px-2.5 py-2">
                                    <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-xs font-medium">{s.label}</div>
                                      <a
                                        href={s.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block truncate text-[10px] text-muted-foreground hover:text-primary"
                                      >
                                        {s.url}
                                      </a>
                                    </div>
                                    <button
                                      onClick={() => toggleSource(s.id)}
                                      className={cn(
                                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                                        s.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                                      )}
                                    >
                                      {s.active ? "Active" : "Paused"}
                                    </button>
                                    <button
                                      onClick={() => removeSource(s.id)}
                                      className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <SuggestedAndCustom entity={e} onAdd={addSourceForEntity} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {filteredEntities.length > 80 && (
              <div className="border-t border-border bg-muted/20 px-3 py-2 text-center text-[10px] text-muted-foreground">
                Showing first 80 of {filteredEntities.length}. ลด search หรือ filter ให้แคบลง
              </div>
            )}
          </div>
        </div>
      ) : (
        <GeneralSourcesBucket
          sources={generalSources}
          onAdd={(src) => {
            setSources((prev) => [src, ...prev]);
            toast.success("Source added", { description: "Will sync in next cycle." });
          }}
          onToggle={toggleSource}
          onRemove={removeSource}
        />
      )}

      {/* CSV import dialog */}
      <CsvImportDialog
        open={csvOpen}
        onOpenChange={setCsvOpen}
        onImport={(rows) => {
          let added = 0;
          const byName = new Map(ENTITY_DIRECTORY.map((e) => [e.name.toLowerCase(), e]));
          const next: ConfiguredSource[] = [];
          rows.forEach((r) => {
            const e = byName.get(r.name.toLowerCase());
            if (!e || !r.url) return;
            next.push({
              id: `csv${Date.now()}-${added}`,
              url: r.url,
              label: `${e.name} — imported`,
              scope: e.type === "Insurer" ? "insurer" : "provider",
              entity: e.name,
              kind: "page",
              active: true,
            });
            added++;
          });
          if (added > 0) {
            setSources((prev) => [...next, ...prev]);
            toast.success(`Imported ${added} sources`);
          } else {
            toast.error("No matching entities found in CSV");
          }
          setCsvOpen(false);
        }}
      />
    </div>
  );
}

function SuggestedAndCustom({
  entity,
  onAdd,
}: {
  entity: EntityRow;
  onAdd: (e: EntityRow, url: string, label?: string) => void;
}) {
  const [custom, setCustom] = useState("");
  const suggestions = suggestUrlsFor(entity);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Wand2 className="h-3 w-3" /> System-suggested URLs
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {suggestions.map((s) => (
          <div
            key={s.url}
            className="flex items-center gap-2 rounded-md border border-dashed border-border bg-background px-2.5 py-1.5"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold">{s.label}</div>
              <div className="truncate text-[10px] text-muted-foreground">{s.url}</div>
            </div>
            <button
              onClick={() => onAdd(entity, s.url, `${entity.name} — ${s.label}`)}
              className="inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2 text-[10px] font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="หรือวาง URL เอง..."
          className="h-8 text-xs"
        />
        <button
          onClick={() => {
            if (!custom.trim()) return;
            try {
              new URL(custom.trim());
            } catch {
              toast.error("URL ไม่ถูกต้อง");
              return;
            }
            onAdd(entity, custom.trim());
            setCustom("");
          }}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-[11px] font-semibold hover:bg-accent"
        >
          <Plus className="h-3 w-3" /> Add custom
        </button>
      </div>
    </div>
  );
}

function GeneralSourcesBucket({
  sources,
  onAdd,
  onToggle,
  onRemove,
}: {
  sources: ConfiguredSource[];
  onAdd: (s: ConfiguredSource) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [scope, setScope] = useState<Target>("industry");

  const submit = () => {
    if (!url.trim()) return;
    try {
      new URL(url.trim());
    } catch {
      toast.error("URL ไม่ถูกต้อง");
      return;
    }
    onAdd({
      id: `g${Date.now()}`,
      url: url.trim(),
      label: label.trim() || url.trim(),
      scope,
      kind: "page",
      active: true,
    });
    setUrl("");
    setLabel("");
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">General / Governance</span> — ลิงก์ที่ไม่ผูกกับ insurer หรือ provider เช่น คปภ., ปปง., สมาคมประกัน, กฎหมายใหม่
      </div>

      <div className="rounded-md border border-border">
        {sources.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">ยังไม่มี source ในกลุ่มนี้</div>
        ) : (
          <ul className="divide-y divide-border">
            {sources.map((s) => (
              <li key={s.id} className="flex items-start gap-3 px-3 py-2.5">
                <Hash className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.label}</div>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-[11px] text-muted-foreground hover:text-primary"
                  >
                    {s.url}
                  </a>
                </div>
                <button
                  onClick={() => onToggle(s.id)}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    s.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                  )}
                >
                  {s.active ? "Active" : "Paused"}
                </button>
                <button
                  onClick={() => onRemove(s.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2 rounded-md border border-border bg-card p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Add general source
        </div>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.oic.or.th/th/news" className="h-8 text-xs" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. คปภ. ข่าวประชาสัมพันธ์)" className="h-8 text-xs" />
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as Target)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
          >
            <option value="industry">Scope: Industry / Regulator</option>
            <option value="bvtpa">Scope: BVTPA</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button
            onClick={submit}
            className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3 w-3" /> Add source
          </button>
        </div>
      </div>
    </div>
  );
}

function CsvImportDialog({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onImport: (rows: { name: string; url: string }[]) => void;
}) {
  const [text, setText] = useState(
    "AIA Thailand, https://www.aia.co.th/th/about-aia/media-centre.html\nMuang Thai Life, https://www.muangthai.co.th/news",
  );
  const parse = () => {
    const rows = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [name, ...rest] = l.split(",");
        return { name: (name || "").trim(), url: rest.join(",").trim() };
      })
      .filter((r) => r.name && r.url);
    onImport(rows);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4" /> Import sources via CSV
          </DialogTitle>
          <DialogDescription>
            Format: <code className="rounded bg-muted px-1 py-0.5 text-[11px]">entity_name, url</code> — ระบบจะ match ชื่อกับ entity ในระบบ
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="font-mono text-xs"
        />
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-muted-foreground hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={parse}
            className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Upload className="h-3 w-3" /> Import
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function AddSignalDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onSubmit: (s: NewsItem) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [target, setTarget] = useState<Target>("bvtpa");
  const [sentiment, setSentiment] = useState<Sentiment>("neutral");
  const [severity, setSeverity] = useState<Severity>("med");
  const [aiInferred, setAiInferred] = useState(false);

  // Tiny heuristic "AI" — infers from body keywords whenever body changes.
  // User can still adjust before submit.
  const inferFromBody = () => {
    const text = (title + " " + body).toLowerCase();
    let s: Sentiment = "neutral";
    if (/(ฟ้อง|ร้องเรียน|ทุจริต|ปลอม|ถูกจับ|ล้มละลาย|ขาดทุน|fraud|lawsuit|complaint)/.test(text))
      s = "negative";
    else if (/(เปิดตัว|กำไร|รางวัล|ขยาย|partner|launch|grow)/.test(text)) s = "positive";

    let sev: Severity = "med";
    if (/(critical|วิกฤต|เร่งด่วน|ทุจริต|ฟ้อง)/.test(text)) sev = "critical";
    else if (/(เสี่ยง|กระทบ|ปรับ|warning|high)/.test(text)) sev = "high";
    else if (/(ทั่วไป|รายงาน|info)/.test(text)) sev = "low";

    let t: Target = target;
    if (/(bvtpa|เรา|บริษัทเรา)/i.test(text)) t = "bvtpa";
    else if (/(aia|fwd|muang thai|ประกัน|insurer)/.test(text)) t = "insurer";
    else if (/(รพ|hospital|clinic|bumrungrad|โรงพยาบาล|คลินิก)/.test(text)) t = "provider";
    else if (/(คปภ|ปปง|กฎหมาย|พ\.ร\.บ|oic|regulation)/.test(text)) t = "industry";

    setSentiment(s);
    setSeverity(sev);
    setTarget(t);
    setAiInferred(true);
  };

  const reset = () => {
    setTitle("");
    setBody("");
    setSourceUrl("");
    setTarget("bvtpa");
    setSentiment("neutral");
    setSeverity("med");
    setAiInferred(false);
  };

  const submit = () => {
    if (!title.trim()) return;
    const cat: Category =
      target === "bvtpa"
        ? "self"
        : target === "industry"
          ? "regulation"
          : "customer";
    onSubmit({
      id: `m${Date.now()}`,
      title: title.trim(),
      summary: body.trim() || "(Manual signal — no summary)",
      source: sourceUrl.trim() || "Manual entry",
      sourceType: "Manual",
      time: "เพิ่งเพิ่ม",
      hoursAgo: 0,
      sentiment,
      category: cat,
      severity,
      target,
      entities: [],
      reach: 0,
      mentions: 1,
      url: sourceUrl.trim() || "#",
      manual: true,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(b) => { onOpenChange(b); if (!b) reset(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-4 w-4" /> Add Signal
          </DialogTitle>
          <DialogDescription>
            เจอข่าวจาก print / PDF / screenshot? เพิ่มเข้าฟีดได้เลย AI จะช่วยเดา sentiment & severity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          <Input
            placeholder="หัวข้อ / Headline"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm"
          />
          <Textarea
            placeholder="วาง content, สรุปสั้น หรือคำอธิบายทำไมถึง flag…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[110px] text-sm"
          />
          <Input
            placeholder="URL ที่มา (optional)"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="h-9 text-xs"
          />

          <div className="flex items-center justify-between rounded-md border border-dashed border-border bg-muted/30 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">
              {aiInferred ? "AI inferred — adjust below if needed" : "Auto-detect sentiment & severity"}
            </div>
            <button
              onClick={inferFromBody}
              disabled={!title && !body}
              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-card border border-border px-2.5 text-[11px] font-semibold hover:bg-accent disabled:opacity-50"
            >
              <Wand2 className="h-3 w-3" /> Auto-detect
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <ScopePicker value={target} onChange={setTarget} compact />
            <SentimentPicker2 value={sentiment} onChange={setSentiment} />
            <SeverityPicker value={severity} onChange={setSeverity} />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => { reset(); onOpenChange(false); }}
            className="inline-flex h-9 items-center rounded-md px-3 text-xs font-medium text-muted-foreground hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!title.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add to feed
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
          {item.manual && (
            <span className="inline-flex items-center gap-1 rounded-full border border-info/40 bg-info/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-info">
              <PenLine className="h-2.5 w-2.5" /> Manual
            </span>
          )}
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

        {/* Inline CTAs — close the loop from signal to action */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(item.severity === "critical" || item.severity === "high") && (
            <button
              onClick={() =>
                toast.success("War Room opened", {
                  description: item.title,
                })
              }
              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-destructive px-2.5 text-[11px] font-semibold text-destructive-foreground hover:bg-destructive/90"
            >
              <Siren className="h-3 w-3" /> Open War Room
            </button>
          )}
          <button
            onClick={() =>
              toast.success("Task created", {
                description: `Assigned: review “${item.title.slice(0, 48)}…”`,
              })
            }
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[11px] font-semibold hover:bg-accent"
          >
            <ListPlus className="h-3 w-3" /> Create Task
          </button>
          <button
            onClick={() => toast("Saved to watchlist", { description: item.title })}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Bookmark className="h-3 w-3" /> Watch
          </button>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" /> Open source
          </a>
        </div>
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
