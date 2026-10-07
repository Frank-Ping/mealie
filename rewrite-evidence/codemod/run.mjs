// CLI: node run.mjs <input.vue|input.ts> [--out <file>]
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { convertVue, convertTs } from "./src/index.mjs";
import { buildComposableIndex } from "./src/composable-index.mjs";

const args = process.argv.slice(2);
if (!args.length) {
  console.error("usage: node run.mjs <input.vue|input.ts> [--out <file>] [--composables <dir>]");
  process.exit(1);
}
const input = resolve(args[0]);
const outIdx = args.indexOf("--out");
const composablesIdx = args.indexOf("--composables");
const composablesDir = composablesIdx >= 0 ? resolve(args[composablesIdx + 1]) : resolve("../../frontend/app/composables");

const index = buildComposableIndex(composablesDir);
const source = readFileSync(input, "utf8");
const result = input.endsWith(".vue") ? convertVue(source, input, index) : convertTs(source, input, index);

if (result.ctx.unmapped?.size) {
  console.error(`[wf4] unmapped components: ${[...result.ctx.unmapped].join(", ")}`);
}
if (result.notes?.length) {
  console.error(`[wf4] notes: ${result.notes.join("; ")}`);
}

if (outIdx >= 0) {
  writeFileSync(args[outIdx + 1], result.code);
  console.error(`[wf4] wrote ${args[outIdx + 1]}`);
}
else {
  process.stdout.write(result.code);
}
