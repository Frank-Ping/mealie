// Builds a name → composable-path index from the Vue app's composables dir,
// replacing Nuxt's auto-import resolution for use* functions.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export function buildComposableIndex(composablesDir) {
  const index = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!entry.endsWith(".ts")) continue;
      const src = readFileSync(full, "utf8");
      const rel = relative(composablesDir, full).replace(/\\/g, "/").replace(/\.ts$/, "");
      for (const m of src.matchAll(/export\s+(?:async\s+)?function\s+(use[A-Z]\w+)/g)) index.set(m[1], rel);
      for (const m of src.matchAll(/export\s+const\s+(use[A-Z]\w+)/g)) index.set(m[1], rel);
      // default-export style: export function useX as default pattern not used in mealie
    }
  };
  walk(composablesDir);
  return index;
}
