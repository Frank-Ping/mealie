/**
 * Seeds a fresh backend with everything the route and flow tests need, via the REST API only.
 * Writes the admin session (cookies) and the ids/slugs of the seeded data into .auth/.
 * Safe to re-run against an already-seeded backend (E2E_REUSE_SERVER=1): lookups before creates.
 */
import fs from "node:fs";
import type { FullConfig } from "@playwright/test";
import { DEFAULT_ADMIN, MealieApi } from "./lib/api";
import { ADMIN, ADMIN_STATE, AUTH_DIR, FIXTURES_FILE, MEMBER, NAMES, PROFILE_USER, type Fixtures } from "./lib/fixtures";

// A valid, empty zip archive (just the end-of-central-directory record).
const EMPTY_ZIP = Buffer.from([0x50, 0x4B, 0x05, 0x06, ...Array.from({ length: 18 }, () => 0)]);

async function adminSession(baseURL: string): Promise<MealieApi> {
  const existing = await MealieApi.tryLogin(baseURL, ADMIN.email, ADMIN.password);
  if (existing) {
    return existing;
  }

  // First run on an empty database: take over the seeded default admin. Changing its email also
  // clears the backend's "first login" flag, so the SPA doesn't bounce every visit to /admin/setup.
  const api = await MealieApi.login(baseURL, DEFAULT_ADMIN.email, DEFAULT_ADMIN.password);
  const self = await api.get("/api/users/self");
  await api.put(`/api/users/${self.id}`, {
    ...self,
    email: ADMIN.email,
    username: ADMIN.username,
    fullName: ADMIN.fullName,
  });
  await api.put("/api/users/password", { currentPassword: DEFAULT_ADMIN.password, newPassword: ADMIN.password });
  await api.dispose();
  return MealieApi.login(baseURL, ADMIN.email, ADMIN.password);
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]!.use.baseURL!;
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const api = await adminSession(baseURL);
  const self = await api.get("/api/users/self");

  // --- organizers, foods, units, labels --------------------------------------------------------
  const category = await api.getOrCreate("/api/organizers/categories", "name", NAMES.category, () =>
    api.post("/api/organizers/categories", { name: NAMES.category }));
  const tag = await api.getOrCreate("/api/organizers/tags", "name", NAMES.tag, () =>
    api.post("/api/organizers/tags", { name: NAMES.tag }));
  const tool = await api.getOrCreate("/api/organizers/tools", "name", NAMES.tool, () =>
    api.post("/api/organizers/tools", { name: NAMES.tool }));
  await api.getOrCreate("/api/foods", "name", NAMES.food, () => api.post("/api/foods", { name: NAMES.food }));
  await api.getOrCreate("/api/units", "name", NAMES.unit, () => api.post("/api/units", { name: NAMES.unit }));
  await api.getOrCreate("/api/groups/labels", "name", NAMES.label, () =>
    api.post("/api/groups/labels", { name: NAMES.label, color: "#1976D2" }));

  // --- recipes -----------------------------------------------------------------------------------
  const recipes = await api.get<{ items: any[] }>("/api/recipes?perPage=-1");
  async function recipe(name: string) {
    const found = recipes.items.find(r => r.name === name);
    const slug: string = found ? found.slug : await api.post("/api/recipes", { name });
    return api.get(`/api/recipes/${slug}`);
  }
  let pancakes = await recipe(NAMES.recipe);
  pancakes = await api.patch(`/api/recipes/${pancakes.slug}`, {
    description: "Fluffy pancakes used by the E2E yardstick.",
    recipeYield: "4 servings",
    recipeIngredient: [{ note: NAMES.ingredient, display: NAMES.ingredient, referenceId: crypto.randomUUID() }],
    recipeInstructions: [{ id: crypto.randomUUID(), title: "", summary: "", text: NAMES.instruction, ingredientReferences: [] }],
    recipeCategory: [category],
    tags: [tag],
    tools: [tool],
  });
  const salad = await recipe(NAMES.recipe2);
  await api.patch(`/api/recipes/${salad.slug}`, { tags: [tag] });

  // --- cookbook, shopping list, meal plan --------------------------------------------------------
  const cookbook = await api.getOrCreate("/api/households/cookbooks", "name", NAMES.cookbook, () =>
    api.post("/api/households/cookbooks", {
      name: NAMES.cookbook,
      public: false,
      queryFilterString: `tags.id CONTAINS ALL ["${tag.id}"]`,
    }));

  const list = await api.getOrCreate("/api/households/shopping/lists", "name", NAMES.shoppingList, async () => {
    const created = await api.post("/api/households/shopping/lists", { name: NAMES.shoppingList });
    for (const note of NAMES.shoppingItems) {
      await api.post("/api/households/shopping/items", { shoppingListId: created.id, note, display: note });
    }
    return created;
  });

  await api.getOrCreate("/api/households/shopping/lists", "name", NAMES.shoppingList2, () =>
    api.post("/api/households/shopping/lists", { name: NAMES.shoppingList2 }));

  const favorites = await api.get<{ ratings: any[] }>("/api/users/self/favorites");
  if (!favorites.ratings.some(r => r.recipeId === pancakes.id)) {
    await api.post(`/api/users/${self.id}/favorites/${pancakes.slug}`);
  }

  const date = todayUtc();
  const plans = await api.get<{ items: any[] }>(`/api/households/mealplans?start_date=${date}&end_date=${date}&perPage=-1`);
  if (!plans.items.some(p => p.recipeId === pancakes.id)) {
    await api.post("/api/households/mealplans", { date, entryType: "dinner", recipeId: pancakes.id });
  }
  if (!plans.items.some(p => p.title === NAMES.mealplanNote)) {
    await api.post("/api/households/mealplans", { date, entryType: "lunch", title: NAMES.mealplanNote, text: "" });
  }

  // --- household integrations shown on settings pages ------------------------------------------
  await api.getOrCreate("/api/households/webhooks", "name", NAMES.webhook, () =>
    api.post("/api/households/webhooks", {
      enabled: false,
      name: NAMES.webhook,
      url: "http://127.0.0.1:9/e2e",
      webhookType: "mealplan",
      scheduledTime: "12:00",
    }));
  await api.getOrCreate("/api/households/events/notifications", "name", NAMES.notifier, () =>
    api.post("/api/households/events/notifications", { name: NAMES.notifier, appriseUrl: "json://127.0.0.1:9/e2e" }));
  await api.getOrCreate("/api/households/recipe-actions", "title", NAMES.recipeAction, () =>
    api.post("/api/households/recipe-actions", { actionType: "link", title: NAMES.recipeAction, url: "https://example.com/{{recipe.slug}}" }));

  // --- sharing, reports --------------------------------------------------------------------------
  const shares = await api.get<any[]>(`/api/shared/recipes?recipe_id=${pancakes.id}`);
  const share = shares[0] ?? (await api.post("/api/shared/recipes", { recipeId: pancakes.id }));

  const reports = await api.get<any[]>("/api/groups/reports?report_type=migration");
  const report = reports[0] ?? (await api.postMultipart("/api/groups/migrations", {
    migration_type: "mealie_alpha",
    add_migration_tag: "false",
    archive: { name: "e2e-empty.zip", mimeType: "application/zip", buffer: EMPTY_ZIP },
  }));

  // --- admin: second group/household, a non-admin member -----------------------------------------
  const group2 = await api.getOrCreate("/api/admin/groups", "name", NAMES.group, () =>
    api.post("/api/admin/groups", { name: NAMES.group }));
  const household2 = await api.getOrCreate("/api/admin/households", "name", NAMES.household, () =>
    api.post("/api/admin/households", { name: NAMES.household, groupId: self.groupId }));
  const createUser = (user: typeof MEMBER) => api.getOrCreate("/api/admin/users", "email", user.email, () =>
    api.post("/api/admin/users", { ...user, group: self.group, household: self.household, admin: false }));
  const member = await createUser(MEMBER);
  await createUser(PROFILE_USER);

  await api.storageState(ADMIN_STATE);
  await api.dispose();

  const fixtures: Fixtures = {
    groupSlug: self.groupSlug,
    householdSlug: self.householdSlug,
    adminId: self.id,
    memberId: member.id,
    recipeSlug: pancakes.slug,
    recipeId: pancakes.id,
    recipe2Slug: salad.slug,
    cookbookSlug: cookbook.slug,
    shoppingListId: list.id,
    sharedRecipeToken: share.id,
    reportId: report.id,
    secondGroupId: group2.id,
    secondHouseholdId: household2.id,
    mealplanDate: date,
  };
  fs.writeFileSync(FIXTURES_FILE, JSON.stringify(fixtures, null, 2));
}
