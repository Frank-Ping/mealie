import { expect, type Page } from "@playwright/test";

/**
 * Errors caused by the headless test browser rather than by the app. Keep this list short and
 * specific: anything added here stops counting against every frontend under test.
 */
const ENVIRONMENT_ERRORS: RegExp[] = [
  // Headless Chromium always denies the Screen Wake Lock API ("Keep Screen Awake" on recipe/list pages).
  /NotAllowedError: Wake Lock permission request denied/,
];

// Network failures already show up as console errors; 4xx are expected for some permission checks
// (e.g. a public page probing an authed endpoint), so only 5xx answers count, tracked separately.
const IGNORED_CONSOLE = [/^Failed to load resource: the server responded with a status of 4\d\d/];

const STUB_TEXT = /\b(TODO|FIXME|Not implemented|Coming soon|Lorem ipsum|Placeholder page|Under construction)\b/i;

export interface HealthMonitor {
  /** Assert nothing went wrong since the monitor was attached. */
  assertHealthy(): Promise<void>;
}

export function monitorPage(page: Page): HealthMonitor {
  const problems: string[] = [];
  const envNoise = (text: string) => ENVIRONMENT_ERRORS.some(re => re.test(text));

  page.on("pageerror", (err) => {
    const text = `${err.name}: ${err.message}`;
    if (!envNoise(text)) problems.push(`uncaught exception: ${text}`);
  });
  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error" && !envNoise(text) && !IGNORED_CONSOLE.some(re => re.test(text))) {
      problems.push(`console.error: ${text.slice(0, 300)}`);
    }
  });
  page.on("response", (res) => {
    if (res.status() >= 500) problems.push(`HTTP ${res.status()} ${res.request().method()} ${res.url()}`);
  });

  return {
    async assertHealthy() {
      // Let in-flight requests settle so late errors are caught too.
      await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
      const body = await page.locator("body").innerText();
      const stub = body.match(STUB_TEXT);
      expect(stub?.[0], "page contains stub/placeholder text").toBeUndefined();
      expect(problems, "page raised errors").toEqual([]);
    },
  };
}

/** Wait until some <input>/<textarea> on the page holds exactly `value` (edit forms show real data). */
export async function expectFieldValue(page: Page, value: string) {
  await expect
    .poll(
      () => page.evaluate(v => Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea"))
        .some(el => el.value === v), value),
      { message: `a form field with value "${value}"` },
    )
    .toBe(true);
}

/** Path without trailing slash (the static server redirects /login -> /login/). */
export function normalizedPath(page: Page): string {
  const p = new URL(page.url()).pathname;
  return p.length > 1 ? p.replace(/\/$/, "") : p;
}
