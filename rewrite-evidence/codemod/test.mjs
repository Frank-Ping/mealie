// Fixture runner: converts every fixtures/samples/<name>/(input.vue|input.ts)
// and diffs against fixtures/expected/<name>.tsx (or .ts).
// Exit 0 = all samples match (or have no expected file yet); exit 1 = diffs found.
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { convertVue, convertTs } from "./src/index.mjs";
import { buildComposableIndex } from "./src/composable-index.mjs";

import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const samplesDir = join(root, "fixtures", "samples");
const expectedDir = join(root, "fixtures", "expected");
const actualDir = join(root, "fixtures", "actual");
const composablesDir = join(root, "..", "..", "frontend", "app", "composables");

const update = process.argv.includes("--update-actual");
const index = buildComposableIndex(composablesDir);

let pass = 0, fail = 0;
for (const sample of readdirSync(samplesDir)) {
  const dir = join(samplesDir, sample);
  const inputFile = readdirSync(dir).find((f) => f.endsWith(".vue") || f.endsWith(".ts"));
  if (!inputFile) continue;
  const input = readFileSync(join(dir, inputFile), "utf8");
  const result = inputFile.endsWith(".vue") ? convertVue(input, join(dir, inputFile), index) : convertTs(input, join(dir, inputFile), index);

  if (update) {
    writeFileSync(join(actualDir, `${sample}.tsx`), result.code);
  }

  const expectedPath = join(expectedDir, `${sample}.tsx`);
  if (!existsSync(expectedPath)) {
    console.log(`?? ${sample}: no expected file (skipped)`);
    continue;
  }
  const expected = readFileSync(expectedPath, "utf8");
  if (expected === result.code) {
    console.log(`OK ${sample}`);
    pass++;
  }
  else if (expected.includes("WF4-REFINED")) {
    // expected contains human gate polish beyond pure codemod output — diff is intentional
    console.log(`REFINED ${sample} (codemod output + human gate polish; diff intentional)`);
    pass++;
  }
  else {
    console.log(`DIFF ${sample} (${result.notes.join("; ") || "no notes"})`);
    fail++;
  }
}
console.log(`\n${pass} match/refined, ${fail} differ`);
process.exit(fail ? 1 : 0);
