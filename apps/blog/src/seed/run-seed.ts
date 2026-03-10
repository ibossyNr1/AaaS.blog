import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { seedEntities } from "./seed-data";

initializeApp({ projectId: "aaas-platform" });
const db = getFirestore();

const COLLECTION_MAP: Record<string, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

async function seed() {
  for (const entity of seedEntities) {
    const { slug, type, ...data } = entity;
    const col = COLLECTION_MAP[type];
    await db.collection(col).doc(slug).set({ ...data, type });
    console.log(`Seeded ${type}/${slug}`);
  }
  console.log(`Done. ${seedEntities.length} entities seeded.`);
}

seed().catch(console.error);
