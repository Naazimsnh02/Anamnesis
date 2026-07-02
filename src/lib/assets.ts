import { readFileSync } from "node:fs";
import { join } from "node:path";

type ManifestEntry = { file: string; source: string };
type Manifest = Record<string, ManifestEntry>;

/**
 * Reads the Gemini asset manifest at build time (server-only). If an asset
 * wasn't generated, callers fall back to the hand-authored SVG, so the page
 * renders identically whether or not the API key was present.
 */
function readManifest(): Manifest {
  try {
    const path = join(process.cwd(), "public", "generated", "manifest.json");
    return JSON.parse(readFileSync(path, "utf8")) as Manifest;
  } catch {
    return {};
  }
}

const manifest = readManifest();

export function generatedAsset(id: string): string | null {
  return manifest[id]?.file ?? null;
}
