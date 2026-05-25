export type ViewMode = "insurer" | "provider";

export const insurers = [
  { id: "INS001", code: "AIA", name_th: "เอไอเอ ประเทศไทย", name_en: "AIA Thailand" },
  { id: "INS002", code: "MTL", name_th: "เมืองไทยประกันชีวิต", name_en: "Muang Thai Life" },
  { id: "INS003", code: "BLA", name_th: "กรุงเทพประกันชีวิต", name_en: "Bangkok Life" },
  { id: "INS004", code: "TLI", name_th: "ไทยประกันชีวิต", name_en: "Thai Life Insurance" },
  { id: "INS005", code: "FWD", name_th: "เอฟดับบลิวดี", name_en: "FWD Insurance" },
];

export const providers = [
  { id: "PRV001", code: "BDMS", name_th: "โรงพยาบาลกรุงเทพ", name_en: "Bangkok Hospital", province: "Bangkok" },
  { id: "PRV002", code: "BNH", name_th: "โรงพยาบาลบีเอ็นเอช", name_en: "BNH Hospital", province: "Bangkok" },
  { id: "PRV003", code: "SMT", name_th: "โรงพยาบาลสมิติเวช", name_en: "Samitivej Hospital", province: "Bangkok" },
  { id: "PRV004", code: "BUM", name_th: "โรงพยาบาลบำรุงราษฎร์", name_en: "Bumrungrad Hospital", province: "Bangkok" },
  { id: "PRV005", code: "RAM", name_th: "โรงพยาบาลรามคำแหง", name_en: "Ramkhamhaeng Hospital", province: "Bangkok" },
  { id: "PRV006", code: "CMH", name_th: "โรงพยาบาลเชียงใหม่ราม", name_en: "Chiangmai Ram", province: "Chiang Mai" },
  { id: "PRV007", code: "PYT", name_th: "โรงพยาบาลพญาไท", name_en: "Phyathai Hospital", province: "Bangkok" },
  { id: "PRV008", code: "VBK", name_th: "โรงพยาบาลวิภาวดี", name_en: "Vibhavadi Hospital", province: "Bangkok" },
];

export const kpiInsurer = {
  totalClaims: 18429,
  claimsToday: 312,
  totalIncurred: 284_500_000,
  totalPayable: 219_300_000,
  pending: 1247,
  rejected: 384,
  avgSlaMins: 142,
  aging: 96,
  avgClaimAmt: 11_900,
};

export const kpiProvider = {
  totalClaims: 4280,
  claimsToday: 87,
  totalIncurred: 62_300_000,
  totalPayable: 48_100_000,
  pending: 312,
  rejected: 78,
  avgSlaMins: 168,
  aging: 41,
  avgClaimAmt: 11_240,
};

export const trendData = Array.from({ length: 30 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  const base = 280 + Math.sin(i / 3) * 60 + Math.random() * 80;
  return {
    date: d.toISOString().slice(5, 10),
    count: Math.round(base),
    payable: Math.round(base * 11000 + Math.random() * 200000),
    incurred: Math.round(base * 14500 + Math.random() * 220000),
  };
});

export const statusBreakdown = [
  { name: "Approved", value: 11420, color: "var(--color-success)" },
  { name: "Pending", value: 1247, color: "var(--color-warning)" },
  { name: "Rejected", value: 384, color: "var(--color-destructive)" },
  { name: "Declined", value: 218, color: "oklch(0.5 0.15 25)" },
  { name: "In Review", value: 5160, color: "var(--color-info)" },
];

export const agingBuckets = [
  { bucket: "0–1 day", count: 9820, risk: "low" },
  { bucket: "2–3 days", count: 4120, risk: "low" },
  { bucket: "4–7 days", count: 2390, risk: "med" },
  { bucket: "> 7 days", count: 1099, risk: "high" },
];

export const pendingReasons = [
  { reason: "Missing medical report", count: 312 },
  { reason: "Awaiting itemized bill", count: 248 },
  { reason: "Pre-authorization required", count: 196 },
  { reason: "Diagnosis clarification", count: 154 },
  { reason: "Member eligibility check", count: 128 },
  { reason: "Concurrent review pending", count: 98 },
];

export const rejectReasons = [
  { reason: "Policy exclusion", count: 142 },
  { reason: "Non-covered benefit", count: 98 },
  { reason: "Duplicate claim", count: 64 },
  { reason: "Pre-existing condition", count: 48 },
  { reason: "Document expired", count: 32 },
];

export const workQueue = Array.from({ length: 24 }).map((_, i) => {
  const statuses = ["Pending", "In Review", "Rejected", "Approved", "Need Doc"];
  const types = ["IPD", "OPD", "Dental", "Maternity"];
  const events = ["Illness", "Accident", "Surgery"];
  const provider = providers[i % providers.length];
  const insurer = insurers[i % insurers.length];
  const status = statuses[i % statuses.length];
  return {
    id: `CLM-2026-${String(50320 + i).padStart(6, "0")}`,
    tpa: `TPA${String(98000 + i)}`,
    source: i % 2 ? "WEB" : "API",
    type: types[i % types.length],
    event: events[i % events.length],
    status,
    insurer: insurer.name_en,
    provider: provider.name_en,
    province: provider.province,
    created: new Date(Date.now() - i * 8 * 3600 * 1000).toISOString().slice(0, 10),
    docDate: new Date(Date.now() - i * 6 * 3600 * 1000).toISOString().slice(0, 10),
    slaMins: 60 + ((i * 47) % 480),
    workingDays: (i * 3) % 12,
    incurred: 8000 + ((i * 7321) % 240000),
    payable: 6000 + ((i * 5891) % 180000),
    reason:
      status === "Pending"
        ? "Missing medical report"
        : status === "Rejected"
          ? "Policy exclusion"
          : status === "Need Doc"
            ? "Itemized bill required"
            : "—",
  };
});

export const providerPerf = providers.map((p, i) => ({
  ...p,
  claims: 1820 - i * 180 + Math.round(Math.random() * 100),
  payable: (32 - i * 3) * 1_000_000 + Math.random() * 1_000_000,
  pendingRate: 4 + i * 0.8,
  rejectRate: 1.2 + i * 0.4,
  avgSla: 90 + i * 18,
  avgLos: 2.4 + i * 0.3,
}));

export const insurerPerf = insurers.map((p, i) => ({
  ...p,
  claims: 5800 - i * 620 + Math.round(Math.random() * 200),
  payable: (62 - i * 7) * 1_000_000 + Math.random() * 2_000_000,
  pending: 320 - i * 38,
  rejected: 96 - i * 12,
  avgSla: 110 + i * 22,
}));

import { TH_PROVINCES, type ThRegion } from "./thailand-geo";

const PROVINCE_TH: Record<string, string> = {
  "Bangkok Metropolis": "กรุงเทพมหานคร",
  "Chiang Mai": "เชียงใหม่",
  "Phuket": "ภูเก็ต",
  "Chon Buri": "ชลบุรี",
  "Khon Kaen": "ขอนแก่น",
  "Songkhla": "สงขลา",
  "Nakhon Ratchasima": "นครราชสีมา",
  "Surat Thani": "สุราษฎร์ธานี",
  "Udon Thani": "อุดรธานี",
  "Rayong": "ระยอง",
};

// Seed deterministic mock metrics per province so the map is reproducible.
function seedRand(seed: number) {
  let s = seed % 2147483647;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

export type ProvinceRow = {
  province: string;
  th: string;
  region: ThRegion;
  claims: number;
  payable: number;
  pending: number;
  sla: number;
};

export const provinceData: ProvinceRow[] = TH_PROVINCES.map((p, i) => {
  const rand = seedRand(i * 131 + 7);
  // Bangkok scaled up
  const base = p.name === "Bangkok Metropolis" ? 8000 : 200 + Math.floor(rand() * 1800);
  const claims = base + Math.floor(rand() * 200);
  const avgClaim = 11_000 + Math.floor(rand() * 4000);
  return {
    province: p.name,
    th: PROVINCE_TH[p.name] ?? p.name,
    region: p.region,
    claims,
    payable: claims * avgClaim,
    pending: Math.floor(claims * (0.05 + rand() * 0.06)),
    sla: 110 + Math.floor(rand() * 90),
  };
});

export const attentionSignals = [
  {
    key: "spike",
    label: "Claim Spike",
    detail: "Today +38% vs 7-day avg",
    count: 312,
    tone: "warning" as const,
  },
  {
    key: "sla",
    label: "SLA Exceeded",
    detail: "Claims past target turnaround",
    count: 96,
    tone: "destructive" as const,
  },
  {
    key: "reject",
    label: "Rejection Rate Up",
    detail: "Policy exclusions trending",
    count: 48,
    tone: "destructive" as const,
  },
  {
    key: "aging",
    label: "Aging > 7 days",
    detail: "Need immediate follow-up",
    count: 1099,
    tone: "warning" as const,
  },
];

export const diagnosisGroups = [
  { code: "I10", th: "ความดันโลหิตสูง", en: "Hypertension", count: 1820, cost: 18_400_000, chronic: true },
  { code: "E11", th: "เบาหวานชนิดที่ 2", en: "Type 2 Diabetes", count: 1640, cost: 22_100_000, chronic: true },
  { code: "J18", th: "ปอดอักเสบ", en: "Pneumonia", count: 1240, cost: 28_900_000, chronic: false },
  { code: "K29", th: "กระเพาะอักเสบ", en: "Gastritis", count: 1180, cost: 9_800_000, chronic: false },
  { code: "M54", th: "ปวดหลัง", en: "Back pain", count: 980, cost: 7_400_000, chronic: false },
  { code: "N39", th: "ติดเชื้อทางเดินปัสสาวะ", en: "UTI", count: 820, cost: 6_900_000, chronic: false },
  { code: "I25", th: "โรคหัวใจขาดเลือด", en: "Ischemic Heart Disease", count: 640, cost: 32_400_000, chronic: true },
  { code: "C50", th: "มะเร็งเต้านม", en: "Breast Cancer", count: 320, cost: 28_100_000, chronic: true },
];

export const financialBreakdown = [
  { label: "Total Incurred", value: 284_500_000 },
  { label: "Provider Discount", value: -18_200_000 },
  { label: "Insurer Discount", value: -6_400_000 },
  { label: "Decline Amount", value: -12_800_000 },
  { label: "Deductible", value: -14_600_000 },
  { label: "Exceed Limit", value: -8_900_000 },
  { label: "Co-insurance", value: -4_300_000 },
  { label: "Total Payable", value: 219_300_000 },
];

export const fmtBaht = (n: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
export const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(n);
