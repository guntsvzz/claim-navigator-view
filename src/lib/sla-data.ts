import type { ViewMode } from "./mock-data";

/* ============================================================================
 * KPI & SLA Alerts — typed mock data + per-client SLA computation
 *
 * CORE RULES:
 *  - SLA targets are PER-CLIENT (from each client's contract).
 *  - Pass + NotPass = No. of Claim (always).
 *  - donutTotal = No. of Claim − Backlog.
 *  - Complicate + NonComplicate = donutTotal.
 *  - sum(Period Grand Total) = donutTotal.
 *  - Within-target buckets' combined portion% = Pass%.
 *  - Monthly totals sum to annual totals.
 * ==========================================================================*/

export type Role = "Team Lead" | "Executive";
export type LoadState = "ready" | "loading" | "empty" | "error";
export type SlaHealth = "onTarget" | "atRisk" | "belowTarget";
export type Risk = "Low" | "Medium" | "High";
export type Unit = "mins" | "days";

export type SlaId = "faxClaim" | "preArrangement" | "creditClaim" | "reimbursement";

export interface SlaDef {
  id: SlaId;
  name: string;
  short: string;
  unit: Unit;
  /** Numeric target boundary for BVTPA's Claim Analysis Performance report */
  bvtpaTarget: number;
}

export const SLA_DEFS: SlaDef[] = [
  { id: "faxClaim",       name: "SLA Fax Claim",        short: "Fax Claim",       unit: "mins", bvtpaTarget: 25 },
  { id: "preArrangement", name: "SLA Pre-Arrangement",   short: "Pre-Arrangement", unit: "days", bvtpaTarget: 2  },
  { id: "creditClaim",    name: "SLA Credit Claim",      short: "Credit Claim",    unit: "days", bvtpaTarget: 14 },
  { id: "reimbursement",  name: "SLA Reimbursement",     short: "Reimbursement",   unit: "days", bvtpaTarget: 7  },
];

export const SLA_BY_ID: Record<SlaId, SlaDef> = SLA_DEFS.reduce(
  (acc, d) => ({ ...acc, [d.id]: d }),
  {} as Record<SlaId, SlaDef>,
);

/* ----------------------------- Exact per-SLA bucket definitions ----------------------------- */

/** Upper bound for each bucket (Infinity = last catch-all).
 *  These are used to determine Pass (upper <= target) vs Not-Pass. */
export const SLA_BUCKETS: Record<SlaId, { label: string; upper: number }[]> = {
  faxClaim: [
    { label: "0–25",   upper: 25  },
    { label: "26–30",  upper: 30  },
    { label: "31–60",  upper: 60  },
    { label: "61–90",  upper: 90  },
    { label: "91–120", upper: 120 },
    { label: "121–240",upper: 240 },
    { label: "241–480",upper: 480 },
    { label: "480+",   upper: Infinity },
  ],
  preArrangement: [
    { label: "0",   upper: 0  },
    { label: "1",   upper: 1  },
    { label: "2",   upper: 2  },
    { label: "3",   upper: 3  },
    { label: "4–7", upper: 7  },
    { label: "8–14",upper: 14 },
  ],
  creditClaim: [
    { label: "0–5",  upper: 5  },
    { label: "6–10", upper: 10 },
    { label: "11–14",upper: 14 },
    { label: "15–30",upper: 30 },
    { label: "30+",  upper: Infinity },
  ],
  reimbursement: [
    { label: "0–4",  upper: 4  },
    { label: "5–7",  upper: 7  },
    { label: "8–15", upper: 15 },
  ],
};

/** Per-client contracted target for one SLA. */
export interface SlaTarget {
  /** Numeric target boundary (e.g. 25 for "< 25 mins"). */
  target: number;
  unit: Unit;
  /** Required Pass% per the contract (status is computed vs this). */
  passTargetPct: number;
  /** false → the SLA is not part of this client's contract. */
  inContract: boolean;
}

export interface PeriodBucket {
  label: string;
  /** upper bound (minutes or days). Infinity for the last "+" bucket. */
  upper: number;
  complicate: number;
  nonComplicate: number;
}

export interface MonthPoint {
  month: string;
  pass: number;
  notPass: number;
  passPct: number;
  complicate: number;
  nonComplicate: number;
}

export interface ForecastPoint {
  month: string;
  passPct: number | null;
  forecast: number | null;
  band?: [number, number];
}

export interface ThresholdChange {
  date: string;
  from: number;
  to: number;
  changedBy: string;
}

export interface AlertEvent {
  id: string;
  text: string;
  time: string;
  recipient: string;
  severity: "warning" | "critical";
}

/** Raw per-SLA data for a client (target-independent). */
export interface SlaData {
  totalClaims: number;
  backlog: number;
  /** donutTotal = totalClaims − backlog */
  donutTotal: number;
  /** complicate share of donutTotal */
  complicateCount: number;
  /** nonComplicate share of donutTotal */
  nonComplicateCount: number;
  buckets: PeriodBucket[];
  monthly: MonthPoint[];
  forecast: ForecastPoint[];
  alerts: AlertEvent[];
  history: ThresholdChange[];
  alertEnabled: boolean;
}

export interface Client {
  id: string;
  name: string;
  tag: ViewMode;
  trendDelta: number;
  targets: Record<SlaId, SlaTarget>;
  data: Partial<Record<SlaId, SlaData>>;
}

/* ----------------------------- PRNG + distribution helpers ----------------------------- */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function distribute(total: number, weights: number[], rand: () => number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (w / sum) * total);
  const floored = raw.map((v) => Math.floor(v));
  let remainder = total - floored.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) + rand() * 0.01 }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < order.length && remainder > 0; k++) {
    floored[order[k].i] += 1;
    remainder -= 1;
  }
  return floored;
}

/* ----------------------------- Factory ----------------------------- */

interface FactoryInput {
  seed: number;
  slaId: SlaId;
  /** Exact annual totals from the BVTPA report */
  total: number;
  pass: number;
  notPass: number;
  backlog: number;
  complicateCount: number;
  nonComplicateCount: number;
  target: number;
  unit: Unit;
  passTargetPct: number;
}

const MONTHS = ["Jan-25", "Feb-25", "Mar-25", "Apr-25", "May-25", "Jun-25", "Jul-25", "Aug-25", "Sep-25", "Oct-25", "Nov-25", "Dec-25"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function makeSlaData(input: FactoryInput): SlaData {
  const { seed, slaId, total, pass, notPass, backlog, complicateCount, nonComplicateCount, target, unit, passTargetPct } = input;
  const rand = mulberry32(seed);
  const donutTotal = total - backlog;
  const template = SLA_BUCKETS[slaId];

  // --- Buckets: distribute pass count across pass-buckets, notPass across fail-buckets ---
  // pass buckets = those whose upper <= target
  const passIdx = template.reduce<number[]>((a, b, i) => (b.upper <= target ? [...a, i] : a), []);
  const failIdx = template.reduce<number[]>((a, b, i) => (b.upper > target ? [...a, i] : a), []);

  const passWeights = passIdx.map((_, k) => Math.max(1, passIdx.length - k) ** 2 + rand() * 2);
  const failWeights = failIdx.map((_, k) => Math.max(1, failIdx.length - k) + rand() * 1.5);
  const passAlloc = passIdx.length ? distribute(pass, passWeights, rand) : [];
  const failAlloc = failIdx.length ? distribute(notPass, failWeights, rand) : [];

  // Complicate share for each bucket (proportional to complicateCount / donutTotal with jitter)
  const complicateFrac = donutTotal > 0 ? complicateCount / donutTotal : 0;

  const buckets: PeriodBucket[] = template.map((b, i) => {
    let count = 0;
    const pAt = passIdx.indexOf(i);
    if (pAt >= 0) count = passAlloc[pAt];
    const fAt = failIdx.indexOf(i);
    if (fAt >= 0) count = failAlloc[fAt];
    const complicate = Math.round(count * clamp(complicateFrac + (rand() - 0.5) * 0.04, 0, 1));
    return { label: b.label, upper: b.upper, complicate, nonComplicate: count - complicate };
  });

  // --- Monthly: distribute annual pass/notPass across 12 months with realistic variance ---
  // Keep monthly complicate proportional to complicateCount / donutTotal
  const monthlyTotalsRaw = MONTHS.map(() => 0.75 + rand() * 0.5);
  const monthlyTotalsNorm = monthlyTotalsRaw.map(
    (v) => (v / monthlyTotalsRaw.reduce((a, b) => a + b, 0)) * total,
  );
  const monthlyTotals = distribute(total, monthlyTotalsRaw, rand);

  // Annual pass% to use as mean; allow ±4% swing
  const annualPassPct = pass / total;
  const monthly: MonthPoint[] = MONTHS.map((m, i) => {
    const swing = (rand() - 0.5) * 0.08;
    const monthPassPct = clamp(annualPassPct + swing, 0.3, 0.999);
    const mt = monthlyTotals[i];
    const mp = Math.round(mt * monthPassPct);
    const mnp = mt - mp;
    const mc = Math.round(mt * complicateFrac * (0.9 + rand() * 0.2));
    return {
      month: MONTHS_SHORT[i],
      pass: mp,
      notPass: mnp,
      passPct: round1(monthPassPct * 100),
      complicate: mc,
      nonComplicate: mt - mc,
    };
  });

  // Reconcile monthly sums to exact annual totals
  const monthlyPassSum = monthly.reduce((a, b) => a + b.pass, 0);
  const passDiff = pass - monthlyPassSum;
  if (passDiff !== 0) {
    // Add/subtract from largest month to keep it realistic
    const idx = monthly.reduce((best, m, i) => (m.pass > monthly[best].pass ? i : best), 0);
    monthly[idx].pass = Math.max(0, monthly[idx].pass + passDiff);
    monthly[idx].notPass = monthly[idx].pass + monthly[idx].notPass - monthly[idx].pass - passDiff > 0
      ? monthly[idx].notPass
      : monthly[idx].notPass;
    // recalc passPct
    const mt = monthly[idx].pass + monthly[idx].notPass;
    monthly[idx].passPct = mt ? round1((monthly[idx].pass / mt) * 100) : 0;
  }

  // --- Forecast ---
  const tail = monthly.slice(-4);
  const slope = (tail[3].passPct - tail[0].passPct) / 3;
  const forecast: ForecastPoint[] = [];
  tail.forEach((pt, idx) => {
    forecast.push({
      month: pt.month,
      passPct: pt.passPct,
      forecast: idx === 3 ? pt.passPct : null,
      band: idx === 3 ? [round1(pt.passPct - 0.6), round1(pt.passPct + 0.6)] : undefined,
    });
  });
  let running = tail[3].passPct;
  for (let f = 1; f <= 3; f++) {
    running = clamp(running + slope, 35, 99);
    const spread = 0.8 + f * 0.9;
    forecast.push({
      month: `+${f}`,
      passPct: null,
      forecast: round1(running),
      band: [round1(running - spread), round1(running + spread)],
    });
  }

  const actualPassPct = round1((pass / total) * 100);
  const status = healthFromPct(actualPassPct, passTargetPct);
  const alerts = makeAlerts(seed, status, actualPassPct, passTargetPct, slope);
  const history = makeHistory(seed, target, unit);

  return {
    totalClaims: total,
    backlog,
    donutTotal,
    complicateCount,
    nonComplicateCount,
    buckets,
    monthly,
    forecast,
    alerts,
    history,
    alertEnabled: status !== "onTarget",
  };
}

function makeAlerts(seed: number, status: SlaHealth, passPct: number, passTargetPct: number, slope: number): AlertEvent[] {
  const rand = mulberry32(seed * 7 + 3);
  const recipients = ["Team Lead", "Ops Manager", "Account Manager", "K. Wattana"];
  const pick = () => recipients[Math.floor(rand() * recipients.length)];
  const times = ["8 min ago", "42 min ago", "1 hr ago", "2 hrs ago", "5 hrs ago", "yesterday"];
  const out: AlertEvent[] = [];
  if (status === "belowTarget") {
    out.push({ id: `al-${seed}-1`, text: `Pass% at ${round1(passPct)}% — below contract target of ${passTargetPct}%`, time: times[0], recipient: pick(), severity: "critical" });
  }
  if (status !== "onTarget") {
    out.push({ id: `al-${seed}-2`, text: `Pass% within ${round1(Math.abs(passTargetPct - passPct))}% of target`, time: times[2], recipient: pick(), severity: "warning" });
  }
  if (slope < -0.4) {
    out.push({ id: `al-${seed}-3`, text: `Pass% trending down (${round1(slope * 3)} pts over last quarter)`, time: times[3], recipient: pick(), severity: "warning" });
  }
  if (out.length === 0) {
    out.push({ id: `al-${seed}-0`, text: `Pass% holding above target — no action required`, time: times[4], recipient: pick(), severity: "warning" });
  }
  return out;
}

function makeHistory(seed: number, target: number, unit: Unit): ThresholdChange[] {
  const rand = mulberry32(seed * 13 + 5);
  const people = ["K. Wattana", "P. Chai", "A. Srisai", "N. Boon"];
  const n = 1 + Math.floor(rand() * 2);
  const out: ThresholdChange[] = [];
  let cur = target;
  const dates = ["2026-06-18", "2026-04-05", "2026-01-22"];
  for (let i = 0; i < n; i++) {
    const step = unit === "mins" ? 5 : target > 20 ? 5 : 1;
    const prev = cur + step;
    out.push({ date: dates[i], from: prev, to: cur, changedBy: people[Math.floor(rand() * people.length)] });
    cur = prev;
  }
  return out;
}

/* ----------------------------- Helpers ----------------------------- */

export function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
export function round1(v: number) { return Math.round(v * 10) / 10; }

export function healthFromPct(passPct: number, passTargetPct: number): SlaHealth {
  if (passPct < passTargetPct) return "belowTarget";
  if (passPct < passTargetPct + 3) return "atRisk";
  return "onTarget";
}

export function riskFromHealth(h: SlaHealth): Risk {
  if (h === "belowTarget") return "High";
  if (h === "atRisk") return "Medium";
  return "Low";
}

export function computePass(data: SlaData, target: number) {
  let pass = 0;
  data.buckets.forEach((b) => { if (b.upper <= target) pass += b.complicate + b.nonComplicate; });
  return pass;
}

export interface SlaComputed {
  slaId: SlaId;
  def: SlaDef;
  target: SlaTarget;
  total: number;
  pass: number;
  notPass: number;
  passPct: number;
  backlog: number;
  donutTotal: number;
  complicate: number;
  nonComplicate: number;
  health: SlaHealth;
  bucketsRef: PeriodBucket[];
}

export function computeSla(client: Client, slaId: SlaId): SlaComputed | null {
  const target = client.targets[slaId];
  const data = client.data[slaId];
  if (!target || !target.inContract || !data) return null;
  const pass = computePass(data, target.target);
  const total = data.totalClaims;
  const notPass = total - pass;
  const passPct = total ? round1((pass / total) * 100) : 0;
  return {
    slaId,
    def: SLA_BY_ID[slaId],
    target,
    total,
    pass,
    notPass,
    passPct,
    backlog: data.backlog,
    donutTotal: data.donutTotal,
    complicate: data.complicateCount,
    nonComplicate: data.nonComplicateCount,
    health: healthFromPct(passPct, target.passTargetPct),
    bucketsRef: data.buckets,
  };
}

export interface ClientSummary {
  onTarget: number;
  atRisk: number;
  belowTarget: number;
  overallPassPct: number;
  worst: SlaComputed | null;
  openAlerts: number;
  contracted: SlaComputed[];
}

export function summarizeClient(client: Client): ClientSummary {
  const contracted: SlaComputed[] = [];
  SLA_DEFS.forEach((d) => {
    const c = computeSla(client, d.id);
    if (c) contracted.push(c);
  });
  let onTarget = 0, atRisk = 0, belowTarget = 0, weightedPass = 0, totalClaims = 0, openAlerts = 0;
  let worst: SlaComputed | null = null;
  contracted.forEach((c) => {
    if (c.health === "onTarget") onTarget += 1;
    else if (c.health === "atRisk") atRisk += 1;
    else belowTarget += 1;
    weightedPass += c.passPct * c.total;
    totalClaims += c.total;
    if (!worst || c.passPct < worst.passPct) worst = c;
    const data = client.data[c.slaId];
    if (data?.alertEnabled) openAlerts += data.alerts.length;
  });
  return { onTarget, atRisk, belowTarget, overallPassPct: totalClaims ? round1(weightedPass / totalClaims) : 0, worst, openAlerts, contracted };
}

export function clientHealth(summary: ClientSummary): SlaHealth {
  if (summary.belowTarget > 0) return "belowTarget";
  if (summary.atRisk > 0) return "atRisk";
  return "onTarget";
}

/* ----------------------------- BVTPA exact seed data ----------------------------- */
/*
 * Primary client "BVTPA Main" uses the exact figures from the Claim Analysis
 * Performance report. All other clients use derived/scaled figures.
 *
 * Consistency guarantees enforced here:
 *   pass + notPass === total
 *   donutTotal === total − backlog
 *   complicateCount + nonComplicateCount === donutTotal
 */

interface ClientSeed {
  id: string;
  name: string;
  tag: ViewMode;
  trendDelta: number;
  targets: Partial<Record<SlaId, Omit<SlaTarget, "inContract">>>;
  slas: Partial<Record<SlaId, Omit<FactoryInput, "seed" | "target" | "unit" | "passTargetPct">>>;
}

const CLIENT_SEEDS: ClientSeed[] = [
  /* ---- BVTPA Main (primary demo client — exact report figures) ---- */
  {
    id: "bvtpa",
    name: "BVTPA Main Account",
    tag: "insurer",
    trendDelta: -1.8,
    targets: {
      faxClaim:       { target: 25, unit: "mins", passTargetPct: 80 },
      preArrangement: { target: 2,  unit: "days", passTargetPct: 90 },
      creditClaim:    { target: 14, unit: "days", passTargetPct: 95 },
      reimbursement:  { target: 7,  unit: "days", passTargetPct: 99 },
    },
    slas: {
      faxClaim: {
        slaId: "faxClaim",
        total: 17148, pass: 13011, notPass: 3782 /* +355 backlog = 17148? no: 13011+3782=16793; total=17148; backlog=355 */,
        backlog: 355,
        complicateCount: 2365, nonComplicateCount: 14428, // donutTotal=16793
      },
      preArrangement: {
        slaId: "preArrangement",
        total: 1134, pass: 1016, notPass: 118,
        backlog: 0,
        complicateCount: 777, nonComplicateCount: 357, // donutTotal=1134
      },
      creditClaim: {
        slaId: "creditClaim",
        total: 35057, pass: 33324, notPass: 1733,
        backlog: 0,
        complicateCount: 1929, nonComplicateCount: 33128, // donutTotal=35057
      },
      reimbursement: {
        slaId: "reimbursement",
        total: 145, pass: 144, notPass: 1,
        backlog: 0,
        complicateCount: 11, nonComplicateCount: 134, // donutTotal=145
      },
    },
  },
  /* ---- ABC Insurance ---- */
  {
    id: "abc",
    name: "ABC Insurance",
    tag: "insurer",
    trendDelta: 1.2,
    targets: {
      faxClaim:       { target: 25, unit: "mins", passTargetPct: 88 },
      preArrangement: { target: 2,  unit: "days", passTargetPct: 85 },
      creditClaim:    { target: 14, unit: "days", passTargetPct: 90 },
    },
    slas: {
      faxClaim:       { slaId: "faxClaim",       total: 14200, pass: 12100, notPass: 2100, backlog: 280, complicateCount: 2000, nonComplicateCount: 11920 },
      preArrangement: { slaId: "preArrangement", total: 980,   pass: 868,   notPass: 112,  backlog: 0,   complicateCount: 640,  nonComplicateCount: 340  },
      creditClaim:    { slaId: "creditClaim",    total: 28000, pass: 26100, notPass: 1900, backlog: 0,   complicateCount: 1540, nonComplicateCount: 26460},
    },
  },
  /* ---- Siam Health Provider ---- */
  {
    id: "siam",
    name: "Siam Health Provider",
    tag: "provider",
    trendDelta: 0.9,
    targets: {
      faxClaim:       { target: 30, unit: "mins", passTargetPct: 88 },
      preArrangement: { target: 3,  unit: "days", passTargetPct: 85 },
      creditClaim:    { target: 14, unit: "days", passTargetPct: 90 },
    },
    slas: {
      faxClaim:       { slaId: "faxClaim",       total: 12800, pass: 11650, notPass: 1150, backlog: 190, complicateCount: 1900, nonComplicateCount: 10710},
      preArrangement: { slaId: "preArrangement", total: 2600,  pass: 2184,  notPass: 416,  backlog: 0,   complicateCount: 1820, nonComplicateCount: 780  },
      creditClaim:    { slaId: "creditClaim",    total: 4300,  pass: 3870,  notPass: 430,  backlog: 0,   complicateCount: 237,  nonComplicateCount: 4063 },
    },
  },
  /* ---- Bangkok Provident ---- */
  {
    id: "bkk",
    name: "Bangkok Provident",
    tag: "insurer",
    trendDelta: -0.6,
    targets: {
      faxClaim:      { target: 25, unit: "mins", passTargetPct: 92 },
      creditClaim:   { target: 10, unit: "days", passTargetPct: 90 },
      reimbursement: { target: 7,  unit: "days", passTargetPct: 90 },
    },
    slas: {
      faxClaim:      { slaId: "faxClaim",      total: 15200, pass: 14290, notPass: 910,  backlog: 340, complicateCount: 2130, nonComplicateCount: 12730},
      creditClaim:   { slaId: "creditClaim",   total: 6100,  pass: 5368,  notPass: 732,  backlog: 0,   complicateCount: 336,  nonComplicateCount: 5764 },
      reimbursement: { slaId: "reimbursement", total: 380,   pass: 378,   notPass: 2,    backlog: 0,   complicateCount: 29,   nonComplicateCount: 351  },
    },
  },
  /* ---- Thai Re Group ---- */
  {
    id: "thaire",
    name: "Thai Re Group",
    tag: "insurer",
    trendDelta: 2.1,
    targets: {
      faxClaim:       { target: 25, unit: "mins", passTargetPct: 90 },
      preArrangement: { target: 2,  unit: "days", passTargetPct: 88 },
      creditClaim:    { target: 14, unit: "days", passTargetPct: 90 },
      reimbursement:  { target: 7,  unit: "days", passTargetPct: 95 },
    },
    slas: {
      faxClaim:       { slaId: "faxClaim",       total: 9800,  pass: 8036,  notPass: 1764, backlog: 160, complicateCount: 1380, nonComplicateCount: 8260 },
      preArrangement: { slaId: "preArrangement", total: 2100,  pass: 1890,  notPass: 210,  backlog: 0,   complicateCount: 1470, nonComplicateCount: 630  },
      creditClaim:    { slaId: "creditClaim",    total: 4700,  pass: 4277,  notPass: 423,  backlog: 0,   complicateCount: 259,  nonComplicateCount: 4441 },
      reimbursement:  { slaId: "reimbursement",  total: 210,   pass: 210,   notPass: 0,    backlog: 0,   complicateCount: 16,   nonComplicateCount: 194  },
    },
  },
  /* ---- Krung Health ---- */
  {
    id: "krung",
    name: "Krung Health",
    tag: "provider",
    trendDelta: 1.4,
    targets: {
      faxClaim:       { target: 30, unit: "mins", passTargetPct: 85 },
      preArrangement: { target: 2,  unit: "days", passTargetPct: 85 },
      creditClaim:    { target: 21, unit: "days", passTargetPct: 88 },
      reimbursement:  { target: 7,  unit: "days", passTargetPct: 90 },
    },
    slas: {
      faxClaim:       { slaId: "faxClaim",       total: 11400, pass: 10146, notPass: 1254, backlog: 200, complicateCount: 1600, nonComplicateCount: 9600 },
      preArrangement: { slaId: "preArrangement", total: 1900,  pass: 1672,  notPass: 228,  backlog: 0,   complicateCount: 1330, nonComplicateCount: 570  },
      creditClaim:    { slaId: "creditClaim",    total: 3600,  pass: 3240,  notPass: 360,  backlog: 0,   complicateCount: 198,  nonComplicateCount: 3402 },
      reimbursement:  { slaId: "reimbursement",  total: 4400,  pass: 4400,  notPass: 0,    backlog: 0,   complicateCount: 334,  nonComplicateCount: 4066 },
    },
  },
];

function buildClients(): Client[] {
  return CLIENT_SEEDS.map((seed, ci) => {
    const targets = {} as Record<SlaId, SlaTarget>;
    const data: Partial<Record<SlaId, SlaData>> = {};
    SLA_DEFS.forEach((def, si) => {
      const t = seed.targets[def.id];
      const s = seed.slas[def.id];
      if (t && s) {
        targets[def.id] = { ...t, inContract: true };
        data[def.id] = makeSlaData({
          seed: ci * 101 + si * 17 + 1,
          slaId: def.id,
          total: s.total,
          pass: s.pass,
          notPass: s.notPass,
          backlog: s.backlog,
          complicateCount: s.complicateCount,
          nonComplicateCount: s.nonComplicateCount,
          target: t.target,
          unit: t.unit,
          passTargetPct: t.passTargetPct,
        });
      } else {
        targets[def.id] = { target: 0, unit: def.unit, passTargetPct: 0, inContract: false };
      }
    });
    return { id: seed.id, name: seed.name, tag: seed.tag, trendDelta: seed.trendDelta, targets, data };
  });
}

export const INITIAL_CLIENTS: Client[] = buildClients();

export const DATE_RANGES = {
  thisMonth: { label: "This month" },
  last3: { label: "Last 3 months" },
  ytd: { label: "Year to date" },
} as const;
export type RangeKey = keyof typeof DATE_RANGES;

/* ----------------------------- Tone helpers (UI) ----------------------------- */

export function healthLabel(h: SlaHealth) {
  return h === "onTarget" ? "On target" : h === "atRisk" ? "At risk" : "Below target";
}

export function healthPillClasses(h: SlaHealth) {
  switch (h) {
    case "onTarget":   return "bg-success/15 text-success border-success/30";
    case "atRisk":     return "bg-warning/15 text-warning border-warning/30";
    default:           return "bg-destructive/15 text-destructive border-destructive/30";
  }
}

export function fmt(n: number) {
  return n.toLocaleString("en-US");
}
