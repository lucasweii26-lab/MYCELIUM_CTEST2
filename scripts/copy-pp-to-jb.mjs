import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const sourceCity = { country: "MY", city: "PP", siteCode: "MY_PP" };
const targetCity = { country: "MY", city: "JB", siteCode: "MY_JB" };

const colls = [
  "announcements",
  "events",
  "faqs",
  "facilities",
  "services",
  "rules",
  "gallery_events",
  "newsletter_subscribers",
  "volunteers",
  "reports",
  "settings"
];

async function copyCollection(sourceColl, targetColl) {
  console.log(`\n--- Copying ${sourceColl} ---`);
  const snap = await db.collection(`countries/${sourceCity.country}/cities/${sourceCity.city}/${sourceColl}`).get();
  for (const doc of snap.docs) {
    const data = { ...doc.data() };
    data.siteCode = targetCity.siteCode;
    await db.doc(`countries/${targetCity.country}/cities/${targetCity.city}/${targetColl}/${doc.id}`).set(data);
    console.log(`copied ${doc.id}`);
  }
}

async function run() {
  console.log(`Copy all from ${sourceCity.siteCode} → ${targetCity.siteCode}`);
  for (const c of colls) {
    await copyCollection(c, c);
  }
  console.log("\n✅ ALL DONE: PP copied to JB");
}
run().catch(e=>console.error(e));
