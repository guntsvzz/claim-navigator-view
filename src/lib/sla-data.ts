import type { ViewMode } from "./mock-data";

/* ============================================================================
 * KPI & SLA Alerts — typed mock data + per-client SLA computation
 *
 * CORE RULE: SLA targets are PER-CLIENT (from each client's contract) and every
 * Pass / Not-Pass boundary, Pass% status, forecast and alert is computed against
 * THAT client's target. The same SLA can have different targets by company.
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
}

export const SLA_DEFS: SlaDef[] = [
  { id: "faxClaim", name: "SLA Fax Claim", short: "Fax Claim", unit: "mins" },
  { id: "preArrangement", name: "SLA Pre-Arrangement", short: "Pre-Arrangement", unit: "days" },
  { id: "creditClaim", name: "SLA Credit Claim", short: "Credit Claim", unit: "days" },
  { id: "reimbursement", name: "SLA Reimbursement", short: "Reimbursement", unit: "days" },
];

export const SLA_BY_ID: Record<SlaId, SlaDef> = SLA_DEFS.reduce(
  (acc, d) => ({ ...acc, [d.id]: d }),
  {} as Record<SlaId, SlaDef>,
);

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
  /** historical actual Pass% (null for future months) */
  passPct: number | null;
  /** forecast Pass% (null for past months, overlaps last actual for a continuous line) */
  forecast: number | null;
  /** [low, high] forecast band */
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
  /** overall Pass% delta vs last period (for the trend arrow) */
  trendDelta: number;
  targets: Record<SlaId, SlaTarget>;
  data: Partial<Record<SlaId, SlaData>>;
}

/* ----------------------------- Factory ----------------------------- */

const MINUTE_BUCKETS: { label: string; upper: number }[] = [
  { label: "0–25", upper: 25 },
  { label: "26–30", upper: 30 },
  { label: "31–60", upper: 60 },
  { label: "61–90", upper: 90 },
  { label: "91–120", upper: 120 },
  { label: "121–240", upper: 240 },
  { label: "241–480", upper: 480 },
  { label: "480+", upper: Infinity },
];

const DAY_BUCKETS: { label: string; upper: number }[] = [
  { label: "0–2", upper: 2 },
  { label: "3–7", upper: 7 },
  { label: "8–14", upper: 14 },
  { label: "15–21", upper: 21 },
  { label: "22–30", upper: 30 },
  { label: "31–45", upper: 45 },
  { label: "46–60", upper: 60 },
  { label: "60+", upper: Infinity },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Simple deterministic PRNG so numbers are stable across renders. */
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
  // hand out remainder to buckets with the largest fractional parts (jittered)
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) + rand() * 0.01 }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < order.length && remainder > 0; k++) {
    floored[order[k].i] += 1;
    remainder -= 1;
  }
  return floored;
}

interface FactoryInput {
  seed: number;
  total: number;
  /** the Pass% used to generate the distribution (the "true" current rate) */
  actualPassPct: number;
  target: number;
  unit: Unit;
  passTargetPct: number;
  complicatePct?: number;
}

function makeSlaData(input: FactoryInput): SlaData {
  const { seed, total, actualPassPct, target, unit, passTargetPct, complicatePct = 0.18 } = input;
  const rand = mulberry32(seed);
  const template = unit === "mins" ? MINUTE_BUCKETS : DAY_BUCKETS;

  const passIdx = template.map((b, i) => ({ b, i })).filter(({ b }) => b.upper <= target).map(({ i }) => i);
  const failIdx = template.map((_, i) => i).filter((i) => !passIdx.includes(i));

  const passCount = Math.round((total * actualPassPct) / 100);
  const failCount = total - passCount;

  // pass buckets front-loaded (most claims resolved fastest)
  const passWeights = passIdx.map((_, k) => Math.max(1, passIdx.length - k) ** 2 + rand() * 2);
  // fail buckets taper off toward the long tail
  const failWeights = failIdx.map((_, k) => Math.max(1, failIdx.length - k) + rand() * 1.5);

  const passAlloc = passIdx.length ? distribute(passCount, passWeights, rand) : [];
  const failAlloc = failIdx.length ? distribute(failCount, failWeights, rand) : [];

  const buckets: PeriodBucket[] = template.map((b, i) => {
    let count = 0;
    const pAt = passIdx.indexOf(i);
    if (pAt >= 0) count = passAlloc[pAt];
    const fAt = failIdx.indexOf(i);
    if (fAt >= 0) count = failAlloc[fAt];
    const complicate = Math.round(count * (complicatePct + rand() * 0.06));
    return {
      label: b.label,
      upper: b.upper,
      complicate,
      nonComplicate: count - complicate,
    };
  });

  // monthly trend that averages near actualPassPct with mild movement
  const monthly: MonthPoint[] = MONTHS.map((m, i) => {
    const drift = Math.sin((i / 11) * Math.PI) * 3 - (i > 8 ? (i - 8) * 1.2 : 0);
    const pct = clamp(actualPassPct + drift + (rand() - 0.5) * 2, 40, 99);
    const monthTotal = Math.round((total / 12) * (0.82 + rand() * 0.36));
    const pass = Math.round((monthTotal * pct) / 100);
    const complicate = Math.round(monthTotal * complicatePct);
    return {
      month: m,
      pass,
      notPass: monthTotal - pass,
      passPct: round1(pct),
      complicate,
      nonComplicate: monthTotal - complicate,
    };
  });

  // forecast: continue the last 4 months, projecting the recent slope forward
  const tail = monthly.slice(-4);
  const slope = (tail[tail.length - 1].passPct - tail[0].passPct) / 3;
  const forecast: ForecastPoint[] = [];
  tail.forEach((pt, idx) => {
    const isLast = idx === tail.length - 1;
    forecast.push({
      month: pt.month,
      passPct: pt.passPct,
      forecast: isLast ? pt.passPct : null,
      band: isLast ? [round1(pt.passPct - 0.6), round1(pt.passPct + 0.6)] : undefined,
    });
  });
  let running = tail[tail.length - 1].passPct;
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

  const status = healthFromPct(actualPassPct, passTargetPct);
  const alerts = makeAlerts(seed, status, actualPassPct, passTargetPct, slope);
  const history = makeHistory(seed, target, unit);

  return {
    totalClaims: total,
    backlog: Math.round(total * (0.03 + rand() * 0.04)),
    buckets,
    monthly,
    forecast,
    alerts,
    history,
    alertEnabled: status !== "onTarget",
  };
}

function makeAlerts(
  seed: number,
  status: SlaHealth,
  passPct: number,
  passTargetPct: number,
  slope: number,
): AlertEvent[] {
  const rand = mulberry32(seed * 7 + 3);
  const recipients = ["Team Lead", "Ops Manager", "Account Manager", "K. Wattana"];
  const pick = () => recipients[Math.floor(rand() * recipients.length)];
  const times = ["8 min ago", "42 min ago", "1 hr ago", "2 hrs ago", "5 hrs ago", "yesterday"];
  const out: AlertEvent[] = [];
  if (status === "belowTarget") {
    out.push({
      id: `al-${seed}-1`,
      text: `Pass% at ${round1(passPct)}% — below contract target of ${passTargetPct}%`,
      time: times[0],
      recipient: pick(),
      severity: "critical",
    });
  }
  if (status !== "onTarget") {
    out.push({
      id: `al-${seed}-2`,
      text: `Pass% within ${round1(Math.abs(passTargetPct - passPct))}% margin of target`,
      time: times[2],
      recipient: pick(),
      severity: "warning",
    });
  }
  if (slope < -0.4) {
    out.push({
      id: `al-${seed}-3`,
      text: `Pass% trending down (${round1(slope * 3)} pts over last quarter)`,
      time: times[3],
      recipient: pick(),
      severity: "warning",
    });
  }
  if (out.length === 0) {
    out.push({
      id: `al-${seed}-0`,
      text: `Pass% holding above target — no action required`,
      time: times[4],
      recipient: pick(),
      severity: "warning",
    });
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

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
export function round1(v: number) {
  return Math.round(v * 10) / 10;
}

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

/** Pass count computed from buckets against a client's CURRENT target. */
export function computePass(data: SlaData, target: number) {
  let pass = 0;
  data.buckets.forEach((b) => {
    if (b.upper <= target) pass += b.complicate + b.nonComplicate;
  });
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
  complicate: number;
  nonComplicate: number;
  health: SlaHealth;
}

/** Derive all target-dependent metrics for one in-contract SLA. */
export function computeSla(client: Client, slaId: SlaId): SlaComputed | null {
  const target = client.targets[slaId];
  const data = client.data[slaId];
  if (!target || !target.inContract || !data) return null;
  const pass = computePass(data, target.target);
  const total = data.totalClaims;
  const notPass = total - pass;
  const passPct = total ? round1((pass / total) * 100) : 0;
  let complicate = 0;
  data.buckets.forEach((b) => (complicate += b.complicate));
  return {
    slaId,
    def: SLA_BY_ID[slaId],
    target,
    total,
    pass,
    notPass,
    passPct,
    backlog: data.backlog,
    complicate,
    nonComplicate: total - complicate,
    health: healthFromPct(passPct, target.passTargetPct),
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
  let onTarget = 0;
  let atRisk = 0;
  let belowTarget = 0;
  let weightedPass = 0;
  let totalClaims = 0;
  let worst: SlaComputed | null = null;
  let openAlerts = 0;
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
  return {
    onTarget,
    atRisk,
    belowTarget,
    overallPassPct: totalClaims ? round1(weightedPass / totalClaims) : 0,
    worst,
    openAlerts,
    contracted,
  };
}

export function clientHealth(summary: ClientSummary): SlaHealth {
  if (summary.belowTarget > 0) return "belowTarget";
  if (summary.atRisk > 0) return "atRisk";
  return "onTarget";
}

/* ----------------------------- Seed data ----------------------------- */

interface SlaSeed {
  total: number;
  actualPassPct: number;
}
interface ClientSeed {
  id: string;
  name: string;
  tag: ViewMode;
  trendDelta: number;
  targets: Partial<Record<SlaId, Omit<SlaTarget, "inContract">>>;
  slas: Partial<Record<SlaId, SlaSeed>>;
}

const CLIENT_SEEDS: ClientSeed[] = [
  {
    id: "abc",
    name: "ABC Insurance",
    tag: "insurer",
    trendDelta: -1.8,
    targets: {
      faxClaim: { target: 25, unit: "mins", passTargetPct: 90 },
      preArrangement: { target: 2, unit: "days", passTargetPct: 85 },
      creditClaim: { target: 14, unit: "days", passTargetPct: 90 },
      reimbursement: { target: 30, unit: "days", passTargetPct: 88 },
    },
    slas: {
      faxClaim: { total: 17240, actualPassPct: 77 },
      preArrangement: { total: 3200, actualPassPct: 86 },
      creditClaim: { total: 5400, actualPassPct: 93 },
      reimbursement: { total: 4100, actualPassPct: 89 },
    },
  },
  {
    id: "siam",
    name: "Siam Health Provider",
    tag: "provider",
    trendDelta: 0.9,
    targets: {
      faxClaim: { target: 30, unit: "mins", passTargetPct: 88 },
      preArrangement: { target: 3, unit: "days", passTargetPct: 85 },
      creditClaim: { target: 14, unit: "days", passTargetPct: 90 },
    },
    slas: {
      faxClaim: { total: 12800, actualPassPct: 91 },
      preArrangement: { total: 2600, actualPassPct: 84 },
      creditClaim: { total: 4300, actualPassPct: 90 },
    },
  },
  {
    id: "bkk",
    name: "Bangkok Provident",
    tag: "insurer",
    trendDelta: -0.6,
    targets: {
      faxClaim: { target: 25, unit: "mins", passTargetPct: 92 },
      creditClaim: { target: 10, unit: "days", passTargetPct: 90 },
      reimbursement: { target: 30, unit: "days", passTargetPct: 90 },
    },
    slas: {
      faxClaim: { total: 15200, actualPassPct: 94 },
      creditClaim: { total: 6100, actualPassPct: 88 },
      reimbursement: { total: 3800, actualPassPct: 92 },
    },
  },
  {
    id: "thaire",
    name: "Thai Re Group",
    tag: "insurer",
    trendDelta: 2.1,
    targets: {
      faxClaim: { target: 20, unit: "mins", passTargetPct: 90 },
      preArrangement: { target: 2, unit: "days", passTargetPct: 88 },
      creditClaim: { target: 14, unit: "days", passTargetPct: 90 },
      reimbursement: { target: 45, unit: "days", passTargetPct: 85 },
    },
    slas: {
      faxClaim: { total: 9800, actualPassPct: 82 },
      preArrangement: { total: 2100, actualPassPct: 90 },
      creditClaim: { total: 4700, actualPassPct: 91 },
      reimbursement: { total: 5200, actualPassPct: 87 },
    },
  },
  {
    id: "krung",
    name: "Krung Health",
    tag: "provider",
    trendDelta: 1.4,
    targets: {
      faxClaim: { target: 30, unit: "mins", passTargetPct: 85 },
      preArrangement: { target: 2, unit: "days", passTargetPct: 85 },
      creditClaim: { target: 21, unit: "days", passTargetPct: 88 },
      reimbursement: { target: 30, unit: "days", passTargetPct: 90 },
    },
    slas: {
      faxClaim: { total: 11400, actualPassPct: 89 },
      preArrangement: { total: 1900, actualPassPct: 88 },
      creditClaim: { total: 3600, actualPassPct: 90 },
      reimbursement: { total: 4400, actualPassPct: 93 },
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
          total: s.total,
          actualPassPct: s.actualPassPct,
          target: t.target,
          unit: t.unit,
          passTargetPct: t.passTargetPct,
        });
      } else {
        // Not in this client's contract
        targets[def.id] = { target: 0, unit: def.unit, passTargetPct: 0, inContract: false };
      }
    });
    return {
      id: seed.id,
      name: seed.name,
      tag: seed.tag,
      trendDelta: seed.trendDelta,
      targets,
      data,
    };
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
    case "onTarget":
      return "bg-success/15 text-success border-success/30";
    case "atRisk":
      return "bg-warning/15 text-warning border-warning/30";
    default:
      return "bg-destructive/15 text-destructive border-destructive/30";
  }
}

export function fmt(n: number) {
  return n.toLocaleString("en-US");
}
