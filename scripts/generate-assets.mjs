#!/usr/bin/env node
/**
 * Anamnesis — landing-page asset generation (development-only).
 *
 * Generates bespoke hero artwork and section textures with Gemini's image
 * models, in the landing page's exact visual language (heritage ink-blue +
 * warm amber on cool porcelain). Results are cached to public/generated/ and
 * committed, so the page never depends on a live API call at request time.
 *
 * Usage:
 *   node scripts/generate-assets.mjs            # generate any missing assets
 *   node scripts/generate-assets.mjs --force    # regenerate everything
 *   node scripts/generate-assets.mjs hero       # regenerate one asset by id
 *
 * The key is read from GEMINI_API_KEY (falling back to LLM_API_KEY, which the
 * Cognee stack already uses — both are the same Google AI Studio key). Nothing
 * is ever hardcoded. If generation fails, the landing page falls back to
 * hand-authored SVG, so a missing key is non-fatal.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "generated");

// --- minimal .env loader (no dependency) -----------------------------------
function loadEnv(file) {
  const path = join(ROOT, file);
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
loadEnv(".env");
loadEnv(".env.local");

const API_KEY = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
const MODELS = [
  process.env.GEMINI_IMAGE_MODEL,
  "gemini-3-pro-image-preview",
  "gemini-2.5-flash-image",
  "gemini-2.0-flash-preview-image-generation",
].filter(Boolean);

// Shared style so every asset reads as one system.
const STYLE =
  "Fine-art editorial abstraction, museum print quality. Palette strictly: " +
  "cool porcelain off-white background (#F2F4F3), deep heritage ink-blue (#1E3A5F), " +
  "and a single restrained warm amber accent (#D98A3D). Composition centered on ONE " +
  "continuous luminous thread that weaves between a few scattered points of light, " +
  "like a clinical vitals trace resolving into a constellation of connected memory. " +
  "Elegant, quiet, generous negative space, subtle paper grain. " +
  "STRICTLY NO text, NO letters, NO glowing orbs or blobs, NO neon, NO 3D render " +
  "look, NO generic tech gradients, NO medical clichés (no stethoscopes, no crosses).";

const ASSETS = [
  {
    id: "hero",
    file: "hero.png",
    aspect: "16:9",
    prompt:
      "A wide hero artwork for a persistent clinical-memory product. A single " +
      "fine ink-blue thread enters from the left as a calm heartbeat trace and " +
      "unspools across the canvas into a sparse, elegant network of connected " +
      "nodes on the right — one node glowing warm amber, as if a single memory " +
      "has just been recalled. Vast porcelain space around it. " +
      STYLE,
  },
  {
    id: "divider",
    file: "divider.png",
    aspect: "21:9",
    prompt:
      "An ultra-wide, very minimal horizontal band: one continuous ink-blue " +
      "thread drifting gently across an otherwise empty porcelain field, with " +
      "two or three faint amber points along its path. Reads as a section " +
      "divider / connective thread. " +
      STYLE,
  },
  {
    id: "graph",
    file: "graph.png",
    aspect: "4:3",
    prompt:
      "An abstract portrait of a living knowledge graph: delicate ink-blue " +
      "threads linking a constellation of small nodes across an implied timeline, " +
      "a few nodes warm amber to suggest active, recalled memories. Depth through " +
      "layering and focus, not color noise. " +
      STYLE,
  },
];

async function generateOne(asset, model) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [{ role: "user", parts: [{ text: asset.prompt }] }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: asset.aspect ? { aspectRatio: asset.aspect } : undefined,
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p.inlineData?.data);
  if (!img) throw new Error("no image part in response");
  return Buffer.from(img.inlineData.data, "base64");
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const only = args.filter((a) => !a.startsWith("--"));

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  if (!API_KEY) {
    console.log(
      "\n⚠  No GEMINI_API_KEY / LLM_API_KEY found. Skipping generation — " +
        "the landing page will use its built-in SVG fallbacks.\n"
    );
    process.exit(0);
  }

  const manifest = {};
  const targets = ASSETS.filter((a) => only.length === 0 || only.includes(a.id));

  for (const asset of targets) {
    const outPath = join(OUT_DIR, asset.file);
    if (existsSync(outPath) && !force) {
      console.log(`• ${asset.id}: cached (${asset.file}) — skipping`);
      manifest[asset.id] = { file: `/generated/${asset.file}`, source: "cache" };
      continue;
    }

    let done = false;
    for (const model of MODELS) {
      try {
        process.stdout.write(`• ${asset.id}: generating with ${model}… `);
        const buf = await generateOne(asset, model);
        writeFileSync(outPath, buf);
        console.log(`ok (${(buf.length / 1024).toFixed(0)} KB)`);
        manifest[asset.id] = {
          file: `/generated/${asset.file}`,
          source: "gemini",
          model,
          generatedAt: new Date().toISOString(),
        };
        done = true;
        break;
      } catch (err) {
        console.log(`failed (${err.message})`);
      }
    }
    if (!done) {
      console.log(`  ↳ ${asset.id}: all models failed — SVG fallback will be used`);
    }
  }

  writeFileSync(
    join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  console.log("\nDone. Manifest → public/generated/manifest.json\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
