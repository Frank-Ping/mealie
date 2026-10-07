// Fixture harness v3 (after gate #2 round 3):
//   1. STRICT — pure codemod output must exactly match the blessed snapshot
//      fixtures/expected/<name>.codemod.tsx. No exemptions, no markers.
//   2. REFINEMENT — the optional human-polished file fixtures/expected/<name>.tsx
//      may differ from the codemod snapshot ONLY on lines carrying a WF4-REFINED
//      marker (marked insertions or marked replacements). Anything else fails.
// A file can therefore never exempt itself from regression checking by carrying
// a marker — the codemod half is always strictly compared.
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { convertVue, convertTs } from "./src/index.mjs";
import { buildComposableIndex } from "./src/composable-index.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
const samplesDir = join(root, "fixtures", "samples");
const expectedDir = join(root, "fixtures", "expected");
const actualDir = join(root, "fixtures", "actual");
const composablesDir = join(root, "..", "..", "frontend", "app", "composables");

const update = process.argv.includes("--update-actual");
const index = buildComposableIndex(composablesDir);

// Every line in `refined` that does not exactly mirror `codemod` must carry
// WF4-REFINED. Marked lines are either insertions (next refined line realigns)
// or 1:1 replacements.
export function checkRefinement(codemodText, refinedText) {
  const cod = codemodText.split("\n");
  const ref = refinedText.split("\n");
  const violations = [];
  let i = 0, j = 0;
  while (i < cod.length && j < ref.length) {
    if (cod[i] === ref[j]) { i++; j++; continue; }
    if (ref[j].includes("WF4-REFINED")) {
      if (j + 1 < ref.length && ref[j + 1] === cod[i]) j++; // marked insertion
      else { i++; j++; }                                    // marked replacement
      continue;
    }
    violations.push({ refinedLine: j + 1, codemod: cod[i], refined: ref[j] });
    i++; j++;
  }
  while (j < ref.length) {
    if (!ref[j].includes("WF4-REFINED")) violations.push({ refinedLine: j + 1, codemod: "<eof>", refined: ref[j] });
    j++;
  }
  while (i < cod.length) {
    violations.push({ refinedLine: -1, codemod: cod[i], refined: "<deleted by refinement>" });
    i++;
  }
  return violations;
}

let strictPass = 0, refinePass = 0, fail = 0;
for (const sample of readdirSync(samplesDir)) {
  const dir = join(samplesDir, sample);
  const inputFile = readdirSync(dir).find((f) => f.endsWith(".vue") || f.endsWith(".ts"));
  if (!inputFile) continue;
  const input = readFileSync(join(dir, inputFile), "utf8");
  const result = inputFile.endsWith(".vue") ? convertVue(input, join(dir, inputFile), index) : convertTs(input, join(dir, inputFile), index);
  if (update) writeFileSync(join(actualDir, `${sample}.tsx`), result.code);

  const snapshotPath = join(expectedDir, `${sample}.codemod.tsx`);
  if (!existsSync(snapshotPath)) { console.log(`?? ${sample}: no codemod snapshot (skipped)`); continue; }
  const snapshot = readFileSync(snapshotPath, "utf8");
  if (snapshot !== result.code) {
    console.log(`STRICT-DIFF ${sample}: codemod output drifted from blessed snapshot`);
    fail++;
    continue;
  }
  strictPass++;
  console.log(`STRICT-OK ${sample}`);

  const refinedPath = join(expectedDir, `${sample}.tsx`);
  if (!existsSync(refinedPath)) continue;
  const violations = checkRefinement(snapshot, readFileSync(refinedPath, "utf8"));
  if (violations.length) {
    console.log(`REFINEMENT-VIOLATION ${sample}:`);
    for (const v of violations.slice(0, 5)) console.log(`   L${v.refinedLine}\n     codemod: ${v.codemod}\n     refined: ${v.refined}`);
    fail++;
  }
  else {
    refinePass++;
    console.log(`REFINEMENT-OK ${sample}`);
  }
}
console.log(`\n${strictPass} strict-ok, ${refinePass} refinement-ok, ${fail} failures`);
process.exit(fail ? 1 : 0);
