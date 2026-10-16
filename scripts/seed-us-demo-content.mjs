// Import fictional USA demo content into locations/US without overwriting existing data.
// Keep FIREBASE_SERVICE_ACCOUNT_PATH pointed at a JSON file outside this repository.
import { readFile } from "node:fs/promises";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const credentialsPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!credentialsPath) {
  console.error("Set FIREBASE_SERVICE_ACCOUNT_PATH to a service-account JSON stored outside the repository.");
  process.exit(1);
}

const data = JSON.parse(await readFile(new URL("../data/us-demo-content.json", import.meta.url), "utf8"));
const app = initializeApp({ credential: cert(JSON.parse(await readFile(credentialsPath, "utf8"))) });
const db = getFirestore(app);
const root = db.collection("locations").doc("US");
function missingOnly(existing, desired) {
  const patch = {};
  for (const [key, value] of Object.entries(desired)) {
    const current = existing?.[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = missingOnly(current && typeof current === "object" ? current : {}, value);
      if (Object.keys(nested).length) patch[key] = nested;
    } else if (current === undefined || current === null || current === "" || (Array.isArray(current) && current.length === 0)) {
      patch[key] = value;
    }
  }
  return patch;
}

async function fillBlankFields(ref, desired) {
  const snapshot = await ref.get();
  const patch = missingOnly(snapshot.data() || {}, desired);
  if (!snapshot.exists || Object.keys(patch).length) await ref.set(patch, { merge: true });
}

// Firestore may already contain empty setup documents. Fill missing values but preserve edits.
await fillBlankFields(root.collection("settings").doc("main"), data.settings);
await fillBlankFields(root.collection("settings").doc("ai"), {
  countryCode: "US",
  path: data.aiKnowledge.path,
  systemContext_en: data.aiKnowledge.systemContext_en,
  systemPrompt: data.aiKnowledge.systemContext_en,
  knowledgeBase: data.aiKnowledge.systemContext_en,
});
// Add missing rule translations to an existing US rules document without replacing edited content.
await fillBlankFields(root.collection("rules").doc("community"), data.rules);

const records = [
  ["settings/map", { facilityMapPins: {
    communityGarden: { x: 11, y: 76 }, gym: { x: 7.7, y: 69.8 },
    shareOffice: { x: 52.6, y: 42.8 }, bicycleStation: { x: 94, y: 42 },
    recycleCentre: { x: 39.7, y: 86.7 }, evCharging: { x: 58, y: 73 },
    woodlandTrail: { x: 81, y: 47 }, clubhouse: { x: 57, y: 51 }
  } }],
  ["settings/newsletter", data.newsletter],
  ...data.facilities.map(({ id, ...item }) => [`facilities/${id}`, { ...item, countryCode: "US" }]),
  ...data.announcements.map(({ id, ...item }) => [`announcements/${id}`, { ...item, countryCode: "US" }]),
  ...data.events.map(({ id, ...item }) => [`events/${id}`, { ...item, countryCode: "US" }]),
  ...data.faq.map((item, index) => [`faqs/${String(index + 1).padStart(2, "0")}`, { ...item, countryCode: "US" }]),
];

let created = 0;
let skipped = 0;
let servicesUpdated = 0;
for (const [path, value] of records) {
  const [collection, id] = path.split("/");
  try {
    await root.collection(collection).doc(id).create(value);
    created += 1;
  } catch (error) {
    if (error.code === 6 || error.code === "already-exists") {
      skipped += 1;
      continue;
    }
    throw error;
  }
}

// These eight US service cards are explicitly demo content; refresh only their known fields.
for (const [index, item] of data.services.entries()) {
  const service = { ...item, countryCode: "US" };
  await root.collection("services").doc(String(index + 1).padStart(2, "0")).set(service, { merge: true });
  servicesUpdated += 1;
}

console.log(`USA demo import finished: ${created} created, ${skipped} existing non-service docs left untouched, ${servicesUpdated} US demo service docs refreshed.`);
await app.delete();
