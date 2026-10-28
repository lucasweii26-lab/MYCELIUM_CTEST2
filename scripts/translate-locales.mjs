#!/usr/bin/env node
/* Generates locales/<code>.json from locales/en.json with the Google Gemini API and keeps
   locales/manifest.json (the list of languages the language dialog shows) up to date.
   Usage (Node 18+):
     GOOGLE_AI_API_KEY=your-key node scripts/translate-locales.mjs ja ko fr de
     GOOGLE_AI_API_KEY=your-key node scripts/translate-locales.mjs --all
     node scripts/translate-locales.mjs --list
   Optional: GOOGLE_AI_MODEL (default gemini-2.0-flash)
*/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localesDir = path.join(root, "locales");
const manifestPath = path.join(localesDir, "manifest.json");

const BUILT_IN = new Set(["en", "es", "zh-CN", "ms", "ta"]);
const SKIP_SECTIONS = new Set(["legalDocs"]);
const MODEL = process.env.GOOGLE_AI_MODEL || "gemini-3.8-flash";
const CHUNK_CHARS = 5000;

// Read the language list straight from language-picker.js so there is one source of truth.
const pickerSource = fs.readFileSync(path.join(root, "language-picker.js"), "utf8");
const languages = [...pickerSource.matchAll(/^\s*\["([A-Za-z-]+)", "([^"]+)", "([^"]+)"/gm)]
  .map(([, code, native, english]) => ({ code, native, english }));
const byCode = new Map(languages.map((entry) => [entry.code, entry]));

const args = process.argv.slice(2);
const readManifest = () => { try { return JSON.parse(fs.readFileSync(manifestPath, "utf8")).languages || []; } catch { return []; } };

if (args.includes("--list")) {
  const done = new Set(readManifest());
  for (const { code, english } of languages) {
    console.log(`${BUILT_IN.has(code) ? "built-in" : done.has(code) ? "ready   " : "missing "}  ${code.padEnd(6)} ${english}`);
  }
  process.exit(0);
}

const wanted = args.includes("--all")
  ? languages.map((l) => l.code).filter((c) => !BUILT_IN.has(c))
  : args.filter((a) => !a.startsWith("--"));

if (!wanted.length) { console.error("Give language codes, --all or --list."); process.exit(1); }

const unknown = wanted.filter((code) => !byCode.has(code));
if (unknown.length) {
  console.error(`Unknown language code(s): ${unknown.join(", ")} (see --list)`);
  process.exit(1);
}

if (!process.env.GOOGLE_AI_API_KEY) {
  console.error("Set GOOGLE_AI_API_KEY first (get it from Google AI Studio).");
  process.exit(1);
}

const english = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));

// Split the English pack into chunks of whole top-level sections.
const sections = Object.keys(english).filter((key) => !SKIP_SECTIONS.has(key));
const chunks = [];
let current = {};
for (const key of sections) {
  const size = JSON.stringify(english[key]).length;
  if (Object.keys(current).length && JSON.stringify(current).length + size > CHUNK_CHARS) {
    chunks.push(current);
    current = {};
  }
  current[key] = english[key];
}
if (Object.keys(current).length) chunks.push(current);

const tokensOf = (text) =>
  (String(text).match(/\{[^}]+\}|%[sd]|<\/?[a-z][^>]*>/gi) || []).sort().join("|");

async function callApi(languageName, chunk) {
  const systemPrompt = [
    "You translate website interface text for MYCELIUM, a gated residential community website.",
    `Translate every string value from English into ${languageName}.`,
    "Return ONLY valid JSON with exactly the same keys and nesting as the input. No extra text, no markdown.",
    "Keep placeholders such as {name} or %s and any HTML tags unchanged. Do not translate brand names (MYCELIUM, MYCELIUM Residences).",
    "Tone: warm, calm, plain and natural for residents; keep button labels short. Keep ALL-CAPS labels in capitals where the language has capitals.",
  ].join("\n");

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: { text: systemPrompt } },
          contents: [{ role: "user", parts: [{ text: JSON.stringify(chunk) }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status} ${errText.slice(0, 200)}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "");
      return JSON.parse(cleaned);
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
}

// Keep only translated strings that still match the English structure and placeholders.
function validate(source, translated, trail = "") {
  if (Array.isArray(source)) {
    if (!Array.isArray(translated) || translated.length !== source.length) return undefined;
    return source.map((item, index) => {
      const result = validate(item, translated[index], `${trail}[${index}]`);
      return result === undefined ? item : result;
    });
  }
  if (source && typeof source === "object") {
    if (!translated || typeof translated !== "object") return undefined;
    const out = {};
    for (const key of Object.keys(source)) {
      const result = validate(source[key], translated[key], `${trail}.${key}`);
      if (result !== undefined) out[key] = result;
    }
    return out;
  }
  if (typeof translated !== "string" || !translated.trim()) return undefined;
  if (tokensOf(source) !== tokensOf(translated)) {
    console.warn(`  dropped (placeholder mismatch): ${trail}`);
    return undefined;
  }
  return translated;
}

fs.mkdirSync(localesDir, { recursive: true });
const ready = new Set(readManifest());

for (const code of wanted) {
  const { english: name, native } = byCode.get(code);
  console.log(`\n${code}  ${name} (${native})  -  ${chunks.length} chunk(s)`);
  const pack = {};
  try {
    for (const [index, chunk] of chunks.entries()) {
      process.stdout.write(`  chunk ${index + 1}/${chunks.length} ... `);
      const translated = await callApi(`${name} (${native})`, chunk);
      Object.assign(pack, validate(chunk, translated) || {});
      console.log("ok");
    }
    fs.writeFileSync(
      path.join(localesDir, `${code}.json`),
      JSON.stringify(pack, null, 2) + "\n"
    );
    ready.add(code);
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({ languages: [...ready].sort() }, null, 2) + "\n"
    );
  } catch (error) {
    console.error(`  FAILED: ${error.message}`);
  }
}

console.log("\nDone. Languages in manifest:", [...ready].sort().join(", ") || "(none)");
