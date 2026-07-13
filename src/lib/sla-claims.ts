import { SLA_DEFS, SLA_BUCKETS, type SlaId, clamp, round1 } from "./sla-data";

/* ============================================================================
 * Claims-based data model: ALL SLA report numbers derive from claims[]
 * ========================================================================== */

export type CaseType = "complicate" | "nonComplicate";

export interface Claim {
  id: string;
  slaId: SlaId;
  clientId: string;
  caseType: CaseType;
  duration: number; // minutes for fax, days for others
  month: number; // 1..12
  isBacklog: boolean;
}

/* ============================================================================
 * PRNG for stable, deterministic claim generation
 * ========================================================================== */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ============================================================================
 * Claim generation: produces claims to match seed targets
 * ========================================================================== */

interface ClaimGenTarget {
  total: number;
  backlog: number;
  pass: number;
  complicate: number;
  nonComplicate: number;
}

function generateClaims(slaId: SlaId, clientId: string, seed: number, target: ClaimGenTarget): Claim[] {
  const rand = mulberry32(seed);
  const base = target.total - target.backlog;
  const notPass = base - target.pass;
  const def = SLA_DEFS.find((d) => d.id === slaId)!;
  const buckets = SLA_BUCKETS[slaId];
  const passTarget = def.bvtpaTarget;

  // Partition claims into pass/notPass based on buckets
  const passIdx = buckets.reduce<number[]>((a, b, i) => (b.upper <= passTarget ? [...a, i] : a), []);
  const failIdx = buckets.reduce<number[]>((a, b, i) => (b.upper > passTarget ? [...a, i] : a), []);

  // Generate duration ranges for each bucket
  const durationRanges = buckets.map((b, i) => {
    const prev = i === 0 ? 0 : buckets[i - 1].upper + 1;
    return { min: prev, max: b.upper === Infinity ? b.upper + 100 : b.upper };
  });

  const claims: Claim[] = [];
  let claimId = 0;

  // Distribute pass claims across pass-buckets
  const passWeights = passIdx.map((_, k) => Math.max(1, passIdx.length - k) ** 2);
  const passBucketCounts = distribute(target.pass, passWeights, rand);

  // Distribute notPass claims across fail-buckets
  const failWeights = failIdx.map((_, k) => Math.max(1, failIdx.length - k));
  const failBucketCounts = distribute(notPass, failWeights, rand);

  // Add pass claims
  passIdx.forEach((bucketIdx, idx) => {
    const count = passBucketCounts[idx];
    const range = durationRanges[bucketIdx];
    for (let i = 0; i < count; i++) {
      const isCaseType = rand() < target.complicate / base;
      const duration =
        range.max === Infinity
          ? range.min + Math.floor(rand() * 100)
          : range.min + Math.floor(rand() * (range.max - range.min + 1));
      const month = 1 + Math.floor(rand() * 12);
      claims.push({
        id: `${clientId}-${slaId}-${claimId++}`,
        slaId,
        clientId,
        caseType: isCaseType ? "complicate" : "nonComplicate",
        duration: Math.max(0, duration),
        month: clamp(month, 1, 12),
        isBacklog: false,
      });
    }
  });

  // Add notPass claims
  failIdx.forEach((bucketIdx, idx) => {
    const count = failBucketCounts[idx];
    const range = durationRanges[bucketIdx];
    for (let i = 0; i < count; i++) {
      const isCaseType = rand() < target.complicate / base;
      const duration =
        range.max === Infinity
          ? range.min + Math.floor(rand() * 100)
          : range.min + Math.floor(rand() * (range.max - range.min + 1));
      const month = 1 + Math.floor(rand() * 12);
      claims.push({
        id: `${clientId}-${slaId}-${claimId++}`,
        slaId,
        clientId,
        caseType: isCaseType ? "complicate" : "nonComplicate",
        duration: Math.max(0, duration),
        month: clamp(month, 1, 12),
        isBacklog: false,
      });
    }
  });

  // Add backlog claims
  for (let i = 0; i < target.backlog; i++) {
    const isCaseType = rand() < target.complicate / base;
    const duration = Math.floor(rand() * 200) + 100; // backlog durations are long
    const month = 1 + Math.floor(rand() * 12);
    claims.push({
      id: `${clientId}-${slaId}-${claimId++}`,
      slaId,
      clientId,
      caseType: isCaseType ? "complicate" : "nonComplicate",
      duration,
      month: clamp(month, 1, 12),
      isBacklog: true,
    });
  }

  return claims.sort(() => rand() - 0.5); // shuffle for realistic order
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

/* ============================================================================
 * Claim seed targets for BVTPA Main Account (exact report figures)
 * ========================================================================== */

const SEED_TARGETS: Record<SlaId, ClaimGenTarget> = {
  faxClaim: {
    total: 17148,
    backlog: 355,
    pass: 13011,
    complicate: 2365,
    nonComplicate: 14428,
  },
  preArrangement: {
    total: 1134,
    backlog: 0,
    pass: 1016,
    complicate: 777,
    nonComplicate: 357,
  },
  creditClaim: {
    total: 35057,
    backlog: 0,
    pass: 33324,
    complicate: 1929,
    nonComplicate: 33128,
  },
  reimbursement: {
    total: 145,
    backlog: 0,
    pass: 144,
    complicate: 11,
    nonComplicate: 134,
  },
};

/* ============================================================================
 * Global claim cache (per SLA, per client)
 * ========================================================================== */

const claimsCache: Map<string, Claim[]> = new Map();

export function getClaims(slaId: SlaId, clientId: string): Claim[] {
  const key = `${slaId}:${clientId}`;
  if (!claimsCache.has(key)) {
    const seed = SLA_DEFS.findIndex((d) => d.id === slaId) * 101 + (clientId.charCodeAt(0) || 0) * 17;
    const target = SEED_TARGETS[slaId];
    claimsCache.set(key, generateClaims(slaId, clientId, seed, target));
  }
  return claimsCache.get(key)!;
}

/* ============================================================================
 * Pure derivation functions (filtered claims → UI data)
 * ========================================================================== */

export interface SlaViewData {
  totalClaims: number;
  backlogCount: number;
  donutTotal: number;
  passCount: number;
  notPassCount: number;
  passPct: number;
  notPassPct: number;
  complicate: number;
  nonComplicate: number;
  complicatePct: number;
  nonComplicatePct: number;
  periodBuckets: Array<{
    label: string;
    upper: number;
    complicate: number;
    nonComplicate: number;
    total: number;
    complicatePct: number;
    nonComplicatePct: number;
    totalPct: number;
  }>;
  monthly: Array<{
    month: string;
    pass: number;
    notPass: number;
    passPct: number;
    complicate: number;
    nonComplicate: number;
    total: number;
  }>;
  caseTypeByMonth: (monthNum: number) => {
    month: string;
    complicate: { pass: number; notPass: number; passPct: number; total: number };
    nonComplicate: { pass: number; notPass: number; passPct: number; total: number };
  };
}

export function getSlaView(slaId: SlaId, clientId: string): SlaViewData {
  const claims = getClaims(slaId, clientId);
  const def = SLA_DEFS.find((d) => d.id === slaId)!;
  const target = def.bvtpaTarget;
  const buckets = SLA_BUCKETS[slaId];

  // Filter to non-backlog claims (the "base")
  const base = claims.filter((c) => !c.isBacklog);

  // Count totals
  const totalClaims = claims.length;
  const backlogCount = claims.filter((c) => c.isBacklog).length;
  const donutTotal = base.length;
  const passCount = base.filter((c) => c.duration <= target).length;
  const notPassCount = donutTotal - passCount;
  const passPct = donutTotal ? round1((passCount / donutTotal) * 100) : 0;
  const notPassPct = donutTotal ? round1(((donutTotal - passCount) / donutTotal) * 100) : 0;

  // Case type counts
  const complicate = base.filter((c) => c.caseType === "complicate").length;
  const nonComplicate = donutTotal - complicate;
  const complicatePct = donutTotal ? round1((complicate / donutTotal) * 100) : 0;
  const nonComplicatePct = donutTotal ? round1((nonComplicate / donutTotal) * 100) : 0;

  // Period buckets: break down by duration range
  const periodBuckets = buckets.map((b) => {
    const inBucket = base.filter(
      (c) => c.duration >= (buckets[buckets.indexOf(b)] === b && buckets.indexOf(b) > 0 ? buckets[buckets.indexOf(b) - 1].upper + 1 : 0) && c.duration <= b.upper
    );
    const bucketComplicate = inBucket.filter((c) => c.caseType === "complicate").length;
    const bucketNonComplicate = inBucket.length - bucketComplicate;
    const bucketTotal = inBucket.length;
    return {
      label: b.label,
      upper: b.upper,
      complicate: bucketComplicate,
      nonComplicate: bucketNonComplicate,
      total: bucketTotal,
      complicatePct: bucketTotal ? round1((bucketComplicate / bucketTotal) * 100) : 0,
      nonComplicatePct: bucketTotal ? round1((bucketNonComplicate / bucketTotal) * 100) : 0,
      totalPct: donutTotal ? round1((bucketTotal / donutTotal) * 100) : 0,
    };
  });

  // Monthly data (by month 1..12)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthly = monthNames.map((month, idx) => {
    const monthNum = idx + 1;
    const monthClaims = base.filter((c) => c.month === monthNum);
    const monthPass = monthClaims.filter((c) => c.duration <= target).length;
    const monthNotPass = monthClaims.length - monthPass;
    const monthComplicate = monthClaims.filter((c) => c.caseType === "complicate").length;
    const monthNonComplicate = monthClaims.length - monthComplicate;
    return {
      month,
      pass: monthPass,
      notPass: monthNotPass,
      passPct: monthClaims.length ? round1((monthPass / monthClaims.length) * 100) : 0,
      complicate: monthComplicate,
      nonComplicate: monthNonComplicate,
      total: monthClaims.length,
    };
  });

  // Case type breakdown for a given month
  const caseTypeByMonth = (monthNum: number) => {
    const monthClaims = base.filter((c) => c.month === monthNum);
    const monthName = monthNames[monthNum - 1];

    const complicateClaims = monthClaims.filter((c) => c.caseType === "complicate");
    const nonComplicateClaims = monthClaims.filter((c) => c.caseType === "nonComplicate");

    const complicatePass = complicateClaims.filter((c) => c.duration <= target).length;
    const nonComplicatePass = nonComplicateClaims.filter((c) => c.duration <= target).length;

    return {
      month: monthName,
      complicate: {
        pass: complicatePass,
        notPass: complicateClaims.length - complicatePass,
        passPct: complicateClaims.length ? round1((complicatePass / complicateClaims.length) * 100) : 0,
        total: complicateClaims.length,
      },
      nonComplicate: {
        pass: nonComplicatePass,
        notPass: nonComplicateClaims.length - nonComplicatePass,
        passPct: nonComplicateClaims.length ? round1((nonComplicatePass / nonComplicateClaims.length) * 100) : 0,
        total: nonComplicateClaims.length,
      },
    };
  };

  return {
    totalClaims,
    backlogCount,
    donutTotal,
    passCount,
    notPassCount,
    passPct,
    notPassPct,
    complicate,
    nonComplicate,
    complicatePct,
    nonComplicatePct,
    periodBuckets,
    monthly,
    caseTypeByMonth,
  };
}
