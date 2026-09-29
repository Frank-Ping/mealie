/**
 * Thin REST client used only to seed fixture data. The tests themselves never call the API:
 * they only drive the browser, so the same suite can grade any frontend served at the same URLs.
 */
import { request, type APIRequestContext } from "@playwright/test";

export const DEFAULT_ADMIN = { email: "changeme@example.com", password: "MyPassword" };

export class MealieApi {
  private constructor(
    readonly ctx: APIRequestContext,
    readonly baseURL: string,
  ) {}

  /** Log in through the real auth endpoint. The server answers with the session cookie the SPA reads. */
  static async login(baseURL: string, email: string, password: string): Promise<MealieApi> {
    const ctx = await request.newContext({ baseURL });
    const res = await ctx.post("/api/auth/token", {
      form: { username: email, password, remember_me: "true" },
    });
    if (!res.ok()) {
      await ctx.dispose();
      throw new Error(`login as ${email} failed: ${res.status()} ${await res.text()}`);
    }
    return new MealieApi(ctx, baseURL);
  }

  static async tryLogin(baseURL: string, email: string, password: string): Promise<MealieApi | null> {
    try {
      return await MealieApi.login(baseURL, email, password);
    }
    catch {
      return null;
    }
  }

  private async call<T>(method: "get" | "post" | "put" | "patch" | "delete", path: string, data?: unknown): Promise<T> {
    const res = await this.ctx[method](path, data === undefined ? undefined : { data });
    if (!res.ok()) {
      throw new Error(`${method.toUpperCase()} ${path} -> ${res.status()}: ${(await res.text()).slice(0, 500)}`);
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  get<T = any>(path: string) {
    return this.call<T>("get", path);
  }

  post<T = any>(path: string, data?: unknown) {
    return this.call<T>("post", path, data ?? {});
  }

  put<T = any>(path: string, data: unknown) {
    return this.call<T>("put", path, data);
  }

  patch<T = any>(path: string, data: unknown) {
    return this.call<T>("patch", path, data);
  }

  /** Upload a multipart form (used for the migration that produces a report). */
  async postMultipart<T = any>(path: string, multipart: Record<string, string | { name: string; mimeType: string; buffer: Buffer }>) {
    const res = await this.ctx.post(path, { multipart });
    if (!res.ok()) {
      throw new Error(`POST ${path} -> ${res.status()}: ${(await res.text()).slice(0, 500)}`);
    }
    return (await res.json()) as T;
  }

  /** Return the first item of a paginated list whose `key` equals `value`, or create it. */
  async getOrCreate<T extends Record<string, any>>(listPath: string, key: string, value: string, create: () => Promise<T>): Promise<T> {
    const page = await this.get<{ items: T[] }>(`${listPath}${listPath.includes("?") ? "&" : "?"}perPage=-1`);
    return page.items.find(item => item[key] === value) ?? (await create());
  }

  async storageState(path: string) {
    await this.ctx.storageState({ path });
  }

  async dispose() {
    await this.ctx.dispose();
  }
}
