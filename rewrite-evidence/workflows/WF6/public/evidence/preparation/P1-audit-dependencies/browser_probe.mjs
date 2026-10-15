// Inspect installed Linux Chromium capability with an isolated blank-page fixture.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(root, "mealie-wf6-evaluator/frontend-e2e/node_modules/@playwright/test"));
const executable = chromium.executablePath();
const header = fs.readFileSync(executable).subarray(0, 4);
if (header.toString("hex") !== "7f454c46") throw new Error("Chromium executable is not Linux ELF");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto("about:blank");
  console.log(JSON.stringify({
    status: "PASS", platform: process.platform, executable,
    browserVersion: browser.version(), fixtureUrl: page.url(),
    scope: "Dependency capability only; no Mealie application, backend, account, seeded data or evaluator assertion was exercised.",
  }, null, 2));
} finally {
  await browser.close();
}
