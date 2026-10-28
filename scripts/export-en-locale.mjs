#!/usr/bin/env node
/* Rebuilds locales/en.json from the English text that lives in app.js (the `i18n.en` object plus the
   later `i18n.en.xxx = ...` additions). Run it whenever you change English UI text, then re-run
   scripts/translate-locales.mjs for the languages you maintain.

     node scripts/export-en-locale.mjs
*/
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const start = source.indexOf("const i18n = {");
const end = source.indexOf("function t(", start);
if (start < 0 || end < 0) { console.error("Could not find the i18n block in app.js"); process.exit(1); }

const context = vm.createContext({ console });
vm.runInContext(`${source.slice(start, end)}\n;globalThis.__i18n = i18n;`, context);
const english = JSON.parse(JSON.stringify(context.__i18n.en));

fs.mkdirSync(path.join(root, "locales"), { recursive: true });
fs.writeFileSync(path.join(root, "locales", "en.json"), JSON.stringify(english, null, 2) + "\n");
console.log(`locales/en.json written (${Object.keys(english).length} sections).`);
