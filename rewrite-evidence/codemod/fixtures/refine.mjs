// Applies the gate-#2 human refinements on top of the blessed codemod snapshots.
// Every refined line carries a WF4-REFINED marker, which test.mjs's bounded
// refinement check relies on. Re-run after any codemod change:
//   node fixtures/refine.mjs && node test.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const expectedDir = join(root, "expected");

const refinements = {
  "page-home": [
    {
      insertBefore: 'import { useEffect } from "react";',
      line: "// WF4-REFINED: human gate-2 polish — staleness guards, awaited helper call, effect deps",
    },
    {
      from: "async function redirectPublicUserToDefaultGroup() {",
      to: "async function redirectPublicUserToDefaultGroup(isStale: () => boolean) { // WF4-REFINED: staleness guard threaded from the effect",
    },
    {
      from: 'const { data } = await apiClient.get<AppInfo>("/api/app/about");',
      to: 'const { data } = await apiClient.get<AppInfo>("/api/app/about");\n    if (isStale()) return; // WF4-REFINED: a superseded effect run must not navigate',
    },
    {
      from: "let cancelled = false;",
      to: "let cancelled = false;\n    const isStale = () => cancelled; // WF4-REFINED: shared staleness check for this effect run",
    },
    {
      from: "redirectPublicUserToDefaultGroup();",
      to: "await redirectPublicUserToDefaultGroup(isStale); // WF4-REFINED: await so request failures reach the catch; thread the guard",
    },
    {
      from: "}, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow",
      to: "}, [groupSlug]); // WF4-REFINED: re-run when auth resolves; the original useAsyncData did not watch auth either — confirm the trigger against the init flow",
    },
    {
      from: "const groupSlug = auth.user.value?.groupSlug; // was computed — plain read stays reactive",
      to: "const groupSlug = auth.user?.groupSlug; // WF4-REFINED: auth port will expose plain values (the codemod deliberately keeps .value reads visible)",
    },
    {
      from: "activityPreferences.value.defaultActivity,",
      to: "activityPreferences.defaultActivity, // WF4-REFINED: prefs port will expose plain values",
    },
    {
      from: "if (!isDemo && isFirstLogin && auth.user.value?.admin) {",
      to: "if (!isDemo && isFirstLogin && auth.user?.admin) { // WF4-REFINED: auth port will expose plain values",
    },
  ],
  "domain-recipe-chips": [
    {
      insertBefore: 'import { Chip } from "@mui/material";',
      line: "// WF4-REFINED: human gate-2 polish — emit payload types",
    },
    {
      from: "onItemSelected?: (...args: unknown[]) => void; // WF4-REVIEW: payload types",
      to: "onItemSelected?: (item: RecipeCategory | RecipeTag | RecipeTool, urlPrefix: UrlPrefixParam) => void; // WF4-REFINED (r3): callback prop stays optional, but the second param is required — the component has a default and always passes it",
    },
  ],
};

let failed = false;
for (const [sample, rules] of Object.entries(refinements)) {
  const snapshotPath = join(expectedDir, `${sample}.codemod.tsx`);
  const lines = readFileSync(snapshotPath, "utf8").split("\n");
  for (const rule of rules) {
    if (rule.insertBefore) {
      const idx = lines.findIndex((l) => l.includes(rule.insertBefore));
      if (idx < 0) { console.error(`MISS ${sample}: anchor "${rule.insertBefore}"`); failed = true; continue; }
      lines.splice(idx, 0, rule.line);
      continue;
    }
    const idx = lines.findIndex((l) => l.includes(rule.from));
    if (idx < 0) { console.error(`MISS ${sample}: "${rule.from}"`); failed = true; continue; }
    const crlf = lines[idx].endsWith("\r");
    const indent = lines[idx].match(/^\s*/)[0];
    const parts = rule.to.split("\n");
    parts[0] = indent + parts[0];
    lines[idx] = parts.join(crlf ? "\r\n" : "\n") + (crlf ? "\r" : "");
  }
  writeFileSync(join(expectedDir, `${sample}.tsx`), lines.join("\n"));
  console.log(`refined ${sample} (${rules.length} rules)`);
}
process.exit(failed ? 1 : 0);
