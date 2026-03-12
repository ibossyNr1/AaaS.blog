import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Variant {
  id: string;
  name: string;
  description: string;
  weight: number;
  config: Record<string, unknown>;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: "draft" | "running" | "paused" | "completed";
  variants: Variant[];
  trafficAllocation: number;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  targetAudience?: string;
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Deterministic hash-based variant assignment
// ---------------------------------------------------------------------------

/**
 * Simple deterministic hash: converts a string into a number using djb2.
 */
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // ensure unsigned 32-bit
}

/**
 * Deterministic assignment of a user to a variant index.
 * Uses hash(userId + experimentId) mod total weight to pick a variant
 * based on cumulative weights.
 */
export function hashAssignment(
  userId: string,
  experimentId: string,
  variants: Variant[],
): number {
  const hash = djb2Hash(`${userId}:${experimentId}`);
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  const bucket = hash % totalWeight;

  let cumulative = 0;
  for (let i = 0; i < variants.length; i++) {
    cumulative += variants[i].weight;
    if (bucket < cumulative) return i;
  }
  return variants.length - 1;
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

export async function getActiveExperiments(): Promise<Experiment[]> {
  const snap = await db
    .collection("experiments")
    .where("status", "==", "running")
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Experiment[];
}

export async function getAllExperiments(
  status?: string,
): Promise<Experiment[]> {
  let q: FirebaseFirestore.Query = db.collection("experiments");
  if (status && status !== "all") {
    q = q.where("status", "==", status);
  }
  q = q.orderBy("createdAt", "desc").limit(100);

  const snap = await q.get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Experiment[];
}

export async function getExperiment(
  id: string,
): Promise<Experiment | null> {
  const doc = await db.collection("experiments").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Experiment;
}

export async function createExperiment(
  data: Omit<Experiment, "id" | "createdAt" | "status">,
): Promise<Experiment> {
  const now = new Date().toISOString();
  const ref = db.collection("experiments").doc();
  const experiment: Omit<Experiment, "id"> = {
    ...data,
    status: "draft",
    createdAt: now,
  };
  await ref.set(experiment);
  return { id: ref.id, ...experiment };
}

export async function updateExperiment(
  id: string,
  data: Partial<Pick<Experiment, "status" | "name" | "description" | "variants" | "trafficAllocation" | "targetAudience" | "startedAt" | "endedAt">>,
): Promise<void> {
  await db.collection("experiments").doc(id).update(data);
}

export async function assignVariant(
  userId: string,
  experimentId: string,
): Promise<Variant | null> {
  const experiment = await getExperiment(experimentId);
  if (!experiment || experiment.status !== "running") return null;
  if (experiment.variants.length === 0) return null;

  const idx = hashAssignment(userId, experimentId, experiment.variants);
  return experiment.variants[idx];
}

export async function trackImpression(
  userId: string,
  experimentId: string,
  variantId: string,
): Promise<void> {
  await db.collection("experiment_events").add({
    userId,
    experimentId,
    variantId,
    type: "impression",
    timestamp: new Date().toISOString(),
  });
}

export async function trackConversion(
  userId: string,
  experimentId: string,
  variantId: string,
  eventName: string,
): Promise<void> {
  await db.collection("experiment_events").add({
    userId,
    experimentId,
    variantId,
    type: "conversion",
    eventName,
    timestamp: new Date().toISOString(),
  });
}

export async function getExperimentResults(
  experimentId: string,
): Promise<ExperimentResult[]> {
  const experiment = await getExperiment(experimentId);
  if (!experiment) return [];

  // Aggregate impressions per variant
  const impressionSnap = await db
    .collection("experiment_events")
    .where("experimentId", "==", experimentId)
    .where("type", "==", "impression")
    .get();

  const conversionSnap = await db
    .collection("experiment_events")
    .where("experimentId", "==", experimentId)
    .where("type", "==", "conversion")
    .get();

  const impressionCounts: Record<string, number> = {};
  const conversionCounts: Record<string, number> = {};

  impressionSnap.docs.forEach((doc) => {
    const vid = doc.data().variantId;
    impressionCounts[vid] = (impressionCounts[vid] || 0) + 1;
  });

  conversionSnap.docs.forEach((doc) => {
    const vid = doc.data().variantId;
    conversionCounts[vid] = (conversionCounts[vid] || 0) + 1;
  });

  return experiment.variants.map((v) => {
    const impressions = impressionCounts[v.id] || 0;
    const conversions = conversionCounts[v.id] || 0;
    const conversionRate = impressions > 0 ? conversions / impressions : 0;
    return {
      experimentId,
      variantId: v.id,
      impressions,
      conversions,
      conversionRate,
      confidence: 0, // computed pairwise below
    };
  });
}

/**
 * Compute statistical confidence using a simple two-proportion z-test.
 * Returns a value between 0 and 1 representing the confidence that the
 * treatment performs differently from the control.
 */
export function computeConfidence(
  control: ExperimentResult,
  treatment: ExperimentResult,
): number {
  const n1 = control.impressions;
  const n2 = treatment.impressions;

  if (n1 === 0 || n2 === 0) return 0;

  const p1 = control.conversionRate;
  const p2 = treatment.conversionRate;

  // Pooled proportion
  const p =
    (control.conversions + treatment.conversions) / (n1 + n2);

  if (p === 0 || p === 1) return 0;

  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  if (se === 0) return 0;

  const z = Math.abs(p2 - p1) / se;

  // Approximate two-tailed p-value using the complementary error function
  // erf approximation (Abramowitz & Stegun 7.1.26)
  const confidence = erf(z / Math.sqrt(2));
  return Math.min(Math.max(confidence, 0), 1);
}

/**
 * Approximation of the error function.
 */
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1.0 / (1.0 + p * ax);
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);

  return sign * y;
}
