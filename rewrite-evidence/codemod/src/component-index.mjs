// Builds a component-name → path index from the Vue app's components dir,
// replacing Nuxt's component auto-import (templates use <BaseButton/> etc.
// without imports).
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export function buildComponentIndex(componentsDir) {
  const index = new Map();
  const collisions = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!entry.endsWith(".vue")) continue;
      const name = entry.replace(/\.vue$/, "");
      const rel = relative(componentsDir, full).replace(/\\/g, "/").replace(/\.vue$/, "");
      if (index.has(name) && index.get(name) !== rel) collisions.push(name);
      if (!index.has(name)) index.set(name, rel);
    }
  };
  walk(componentsDir);
  return { index, collisions };
}
