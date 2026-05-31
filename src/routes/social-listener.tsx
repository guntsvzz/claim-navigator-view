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
} from "lucide-react";
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

function SocialListenerPage() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<Category | "all">("all");
  const [sentiment, setSentiment] = useState<Sentiment | "all">("all");
  const [activeTarget, setActiveTarget] = useState<Target | "all">("all");

  const filtered = useMemo(
    () =>
      FEED.filter(
        (n) =>
          (activeTarget === "all" || n.target === activeTarget) &&
          (activeCat === "all" || n.category === activeCat) &&
          (sentiment === "all" || n.sentiment === sentiment) &&
          (query === "" ||
            n.title.toLowerCase().includes(query.toLowerCase()) ||
            n.entities.some((e) => e.toLowerCase().includes(query.toLowerCase()))),
      ),
    [activeCat, activeTarget, sentiment, query],
  );

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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Live · sync ทุก 5 นาที · 12 sources
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
    </div>
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
