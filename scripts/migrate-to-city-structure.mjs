// Copy existing Firestore data into the country > city > collection layout.
//
//   countries/{MY|US}/cities/{PP|JB|PL}/{announcements|events|faqs|facilities|services|rules|settings|
//                                         gallery_events|newsletter_subscribers|volunteers|reports}/{docId}
//
// Safe by design: it only COPIES (never deletes or edits the old data), keeps document ids,
// never overwrites a document that already exists in the new place, and prints a verification table.
//
//   Dry run (default):  node scripts/migrate-to-city-structure.mjs
//   Really copy:        node scripts/migrate-to-city-structure.mjs --apply
//
// Needs FIREBASE_SERVICE_ACCOUNT_PATH (a service-account JSON stored OUTSIDE the repository).
import { readFile } from "node:fs/promises";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const apply = process.argv.includes("--apply");
const credentialsPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!credentialsPath) {
  console.error("Set FIREBASE_SERVICE_ACCOUNT_PATH to a service-account JSON stored outside the repository.");
  process.exit(1);
}
const db = getFirestore(initializeApp({ credential: cert(JSON.parse(await readFile(credentialsPath, "utf8"))) }));

const COLLECTIONS = [
  "announcements", "events", "faqs", "facilities", "services", "rules", "settings",
  "gallery_events", "newsletter_subscribers", "volunteers", "reports",
];
const SITES = {
  MY_PP: { country: "MY", city: "PP", countryName: "Malaysia", cityName: "Pulau Tikus", displayName: "Pulau Tikus, Penang" },
  MY_JB: { country: "MY", city: "JB", countryName: "Malaysia", cityName: "Johor Bahru", displayName: "Johor Bahru, Johor" },
  US_PL: { country: "US", city: "PL", countryName: "United States", cityName: "Portland", displayName: "Portland, United States" },
};
// Where each site's data lives today.
const SOURCES = {
  MY_PP: [{ path: "", rootCollections: true }],
  MY_JB: [{ path: "locations/MY_JB" }],
  US_PL: [{ path: "locations/US_PL" }, { path: "locations/US" }],
};
// The old ROOT collections were shared; route each document by its countryCode field.
function siteForRootDoc(data) {
  const code = String(data?.countryCode || "").toUpperCase();
  if (SITES[code]) return code;
  if (code === "US") return "US_PL";
  return "MY_PP";                                   // missing / "MY" -> Pulau Tikus (the original site)
}
const destRef = (site, name) => db.collection("countries").doc(SITES[site].country)
  .collection("cities").doc(SITES[site].city).collection(name);

const report = [];
async function copyDoc(site, name, doc, sourceLabel) {
  const data = { ...doc.data() };
  data.countryCode = site;                           // always the full site code, e.g. MY_JB
  data.cityCode = SITES[site].city;
  const target = destRef(site, name).doc(doc.id);
  const existing = await target.get();
  if (existing.exists) return "skipped";
  if (apply) await target.create(data);
  return "copied";
}

// 1) parent documents (so the console shows readable names)
for (const [code, site] of Object.entries(SITES)) {
  console.log(`${apply ? "write" : "plan "}  countries/${site.country}/cities/${site.city}`);
  if (apply) {
    await db.collection("countries").doc(site.country).set({ name: site.countryName, code: site.country }, { merge: true });
    await db.collection("countries").doc(site.country).collection("cities").doc(site.city)
      .set({ name: site.cityName, displayName: site.displayName, code, status: "active" }, { merge: true });
  }
}

// 2) copy
for (const name of COLLECTIONS) {
  const tally = Object.fromEntries(Object.keys(SITES).map((site) => [site, { found: 0, copied: 0, skipped: 0 }]));
  // old root collection (shared by everyone, routed by countryCode)
  for (const doc of (await db.collection(name).get()).docs) {
    const site = siteForRootDoc(doc.data());
    tally[site].found += 1;
    tally[site][await copyDoc(site, name, doc, "root")] += 1;
  }
  // old locations/{code}/{collection}
  for (const [site, sources] of Object.entries(SOURCES)) {
    for (const source of sources.filter((item) => item.path)) {
      for (const doc of (await db.doc(source.path).collection(name).get()).docs) {
        tally[site].found += 1;
        tally[site][await copyDoc(site, name, doc, source.path)] += 1;
      }
    }
  }
  report.push([name, tally]);
}

// 3) verification
console.log(`\n${apply ? "APPLIED" : "DRY RUN (nothing written)"} — documents per site`);
console.log("collection".padEnd(24), ...Object.keys(SITES).map((site) => site.padEnd(22)));
for (const [name, tally] of report) {
  console.log(name.padEnd(24), ...Object.keys(SITES).map((site) => {
    const t = tally[site];
    return `${t.found} found/${t.copied} new/${t.skipped} kept`.padEnd(22);
  }));
}
if (apply) {
  console.log("\nVerifying destination counts…");
  for (const name of COLLECTIONS) {
    const counts = [];
    for (const site of Object.keys(SITES)) counts.push(`${site}=${(await destRef(site, name).get()).size}`);
    console.log(name.padEnd(24), counts.join("  "));
  }
}
console.log("\nOld data was NOT touched. Delete it manually from the Firebase console only after you have checked the website and the admin pages.");
