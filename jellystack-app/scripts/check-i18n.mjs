#!/usr/bin/env node
/**
 * CI guard: every `messages/<lang>.json` must have the exact same keys as
 * `messages/en.json` (the source of truth). Fails the build on missing or
 * extra keys.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.resolve(__dirname, "../messages");
const SOURCE_LOCALE = "en";

/** Flatten a nested object to dot-notation keys. */
function flatten(obj, prefix = "") {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return flatten(value, fullKey);
    }
    return [fullKey];
  });
}

async function loadLocale(locale) {
  const file = path.join(MESSAGES_DIR, `${locale}.json`);
  const raw = await readFile(file, "utf8");
  return flatten(JSON.parse(raw)).sort();
}

async function main() {
  const entries = await readdir(MESSAGES_DIR);
  const locales = entries
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.basename(f, ".json"));

  if (!locales.includes(SOURCE_LOCALE)) {
    console.error(`Missing source locale: ${SOURCE_LOCALE}.json`);
    process.exit(1);
  }

  const sourceKeys = new Set(await loadLocale(SOURCE_LOCALE));
  let failed = false;

  for (const locale of locales) {
    if (locale === SOURCE_LOCALE) continue;
    const keys = new Set(await loadLocale(locale));
    const missing = [...sourceKeys].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !sourceKeys.has(k));

    if (missing.length || extra.length) {
      failed = true;
      console.error(`\n❌ ${locale}.json mismatch with ${SOURCE_LOCALE}.json`);
      if (missing.length) console.error(`  Missing keys:\n    - ${missing.join("\n    - ")}`);
      if (extra.length) console.error(`  Extra keys:\n    - ${extra.join("\n    - ")}`);
    } else {
      console.log(`✓ ${locale}.json matches ${SOURCE_LOCALE}.json (${keys.size} keys)`);
    }
  }

  if (failed) process.exit(1);
  console.log(`\nAll ${locales.length} locale files in sync.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
