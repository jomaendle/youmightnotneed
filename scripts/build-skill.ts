/**
 * Writes the catalog reference the agent skill loads on demand.
 *
 * The rendering lives in `packages/catalog/src/markdown.ts`, because the
 * website serves the same markdown over HTTP and `apps/web` cannot import
 * from `scripts/`. What is left here is the file writing, which is the part
 * check-freshness must not do when it imports this module.
 *
 * Run: pnpm refresh:skill
 */
import { realpathSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { renderCatalogReference } from "../packages/catalog/src/markdown.ts";
import { rules } from "../packages/catalog/src/rules/index.ts";

const here = dirname(fileURLToPath(import.meta.url));

/** Where the generated reference lives. Read by check-freshness too. */
export const SKILL_CATALOG_FILE = join(
  here,
  "../skills/youmightnotneed/references/catalog.md",
);

/**
 * Re-exported so check-freshness keeps importing the renderer through this
 * module, and its byte-comparison against the committed file is unchanged.
 */
export { renderCatalogReference };

/**
 * Only write when run directly. check-freshness imports renderCatalogReference
 * to compare against the committed file, and a write on import would repair
 * the drift it is meant to detect.
 */
function isEntryPoint(): boolean {
  const argv1 = process.argv[1];
  if (argv1 === undefined) return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(argv1)).href;
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  writeFileSync(SKILL_CATALOG_FILE, renderCatalogReference(), "utf8");
  console.info(
    `Wrote ${rules.length} rules to skills/youmightnotneed/references/catalog.md.`,
  );
}
