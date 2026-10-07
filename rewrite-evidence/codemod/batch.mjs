// Phase C full run: convert the whole Vue frontend with the codemod.
//   pages/components/layouts/*.vue → frontend-react/src/**.tsx
//   composables/**/*.ts (excl. __tests__) → frontend-react/src/composables/**.ts
//   app/lib/** + app/lang/messages/** copied verbatim (framework-free, D1/D2)
// Writes a coverage report to rewrite-evidence/runs/<run-id>-wf4-phase-c-full-run/.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync, cpSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseSfc } from "@vue/compiler-sfc";
import { convertVue, convertTs } from "./src/index.mjs";
import { buildComposableIndex } from "./src/composable-index.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = join(root, "..", "..");
const appDir = join(repoRoot, "frontend", "app");
const outDir = join(repoRoot, "frontend-react", "src");

const runId = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19) + "Z";
const reportDir = join(repoRoot, "rewrite-evidence", "runs", `${runId}-wf4-phase-c-full-run`);
mkdirSync(reportDir, { recursive: true });

function walk(dir, exts, skipTests = true) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (skipTests && (entry === "__tests__" || entry === "node_modules")) continue;
      out.push(...walk(full, exts, skipTests));
      continue;
    }
    if (exts.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

const index = buildComposableIndex(join(appDir, "composables"));
const files = [];
const unmappedHist = new Map();
let markersTotal = 0, reviewJTotal = 0;

function record(rel, status, extra = {}) {
  files.push({ file: rel, status, ...extra });
}

function convertAll(relScope, ext, converter) {
  const scopeDir = join(appDir, relScope);
  const targets = walk(scopeDir, [ext]);
  for (const file of targets) {
    const rel = relative(appDir, file).replace(/\\/g, "/");
    const source = readFileSync(file, "utf8");
    try {
      if (ext === ".vue") {
        const { descriptor } = parseSfc(source, { filename: rel });
        if (descriptor.script && !descriptor.scriptSetup) {
          record(rel, "skipped-options-api");
          continue;
        }
      }
      const result = converter(source, file, index);
      const outExt = ext === ".vue" ? ".tsx" : ".ts";
      const outPath = join(outDir, rel).replace(/\.[^.]+$/, outExt);
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, result.code);
      const markers = (result.code.match(/WF4-REVIEW/g) ?? []).length;
      const jMarkers = (result.code.match(/\[J\]/g) ?? []).length;
      markersTotal += markers;
      reviewJTotal += jMarkers;
      for (const u of result.ctx.unmapped ?? []) unmappedHist.set(u, (unmappedHist.get(u) ?? 0) + 1);
      record(rel, "ok", { markers, jMarkers, unmapped: [...(result.ctx.unmapped ?? [])] });
    }
    catch (err) {
      record(rel, "error", { error: String(err.message ?? err).slice(0, 300) });
    }
  }
}

convertAll("pages", ".vue", convertVue);
convertAll("components", ".vue", convertVue);
convertAll("layouts", ".vue", convertVue);
convertAll("composables", ".ts", convertTs);

// Verbatim copies (framework-free zone, rules §1)
cpSync(join(appDir, "lib"), join(outDir, "lib"), { recursive: true });
cpSync(join(appDir, "lang", "messages"), join(outDir, "lang", "messages"), { recursive: true });

// Verify the copied lib really is framework-free
const libFiles = walk(join(outDir, "lib"), [".ts", ".js"], false);
const libVueDeps = libFiles.filter((f) => /from\s+["'](vue|nuxt|#app)/.test(readFileSync(f, "utf8")));

const ok = files.filter((f) => f.status === "ok");
const errors = files.filter((f) => f.status === "error");
const skipped = files.filter((f) => f.status === "skipped-options-api");

const report = {
  runId,
  totals: {
    filesProcessed: files.length,
    converted: ok.length,
    errors: errors.length,
    skippedOptionsApi: skipped.length,
    wf4ReviewMarkers: markersTotal,
    judgementMarkers: reviewJTotal,
    libFilesCopied: libFiles.length,
    libFilesWithVueDeps: libVueDeps.map((f) => relative(outDir, f)),
  },
  unmappedComponents: Object.fromEntries([...unmappedHist.entries()].sort((a, b) => b[1] - a[1])),
  files,
};

writeFileSync(join(reportDir, "codemod-coverage.json"), JSON.stringify(report, null, 2));

const md = [
  `# WF4 Phase C full-run coverage — ${runId}`,
  "",
  `- files processed: **${files.length}** (target 229 .vue + 124 composables = 353)`,
  `- converted: **${ok.length}** · codemod errors: **${errors.length}** · skipped (options API): **${skipped.length}**`,
  `- WF4-REVIEW markers (residual queue): **${markersTotal}**, of which explicit [J]: **${reviewJTotal}**`,
  `- lib copied: ${libFiles.length} files, Vue/Nuxt deps found: ${libVueDeps.length}`,
  "",
  "## Unmapped judgement components (placeholder queue)",
  "",
  ...[...unmappedHist.entries()].sort((a, b) => b[1] - a[1]).map(([c, n]) => `- \`${c}\`: ${n} site(s)`),
  "",
  "## Errors",
  "",
  ...errors.map((e) => `- \`${e.file}\`: ${e.error}`),
  "",
  "## Skipped (options API)",
  "",
  ...skipped.map((e) => `- \`${e.file}\``),
  "",
  "Full per-file data: `codemod-coverage.json`.",
].join("\n");
writeFileSync(join(reportDir, "COVERAGE.md"), md);

console.log(md.split("\n").slice(0, 10).join("\n"));
console.log(`\nreport: ${relative(repoRoot, reportDir)}`);
