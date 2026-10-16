// Run locally with a Firebase service-account JSON kept outside this repository.
// Usage: node scripts/set-admin-claim.mjs admin@example.com US [grant|revoke]
import { readFile } from "node:fs/promises";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [email, location = "US", operation = "grant"] = process.argv.slice(2);
const credentialsPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!email || !["MY", "US"].includes(location) || !["grant", "revoke"].includes(operation) || !credentialsPath) {
  console.error("Usage: FIREBASE_SERVICE_ACCOUNT_PATH=<outside-repo-json> node scripts/set-admin-claim.mjs <email> <MY|US> [grant|revoke]");
  process.exit(1);
}

const serviceAccount = JSON.parse(await readFile(credentialsPath, "utf8"));
const app = initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
const claims = { ...user.customClaims };
const locations = new Set(Array.isArray(claims.adminLocations) ? claims.adminLocations : []);

if (operation === "grant") {
  locations.add(location);
  claims.admin = true;
  claims.adminLocations = [...locations];
  claims[location === "MY" ? "myAdmin" : "usAdmin"] = true;
} else {
  locations.delete(location);
  delete claims[location === "MY" ? "myAdmin" : "usAdmin"];
  if (locations.size) claims.adminLocations = [...locations];
  else {
    delete claims.adminLocations;
    delete claims.admin;
  }
}

await auth.setCustomUserClaims(user.uid, claims);
console.log(`Updated ${email}: admin=${claims.admin === true}, adminLocations=${JSON.stringify(claims.adminLocations || [])}`);
await app.delete();
