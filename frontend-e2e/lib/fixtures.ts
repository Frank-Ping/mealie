import fs from "node:fs";
import path from "node:path";

export const E2E_DIR = path.resolve(__dirname, "..");
export const AUTH_DIR = path.join(E2E_DIR, ".auth");
export const ADMIN_STATE = path.join(AUTH_DIR, "admin.json");
export const FIXTURES_FILE = path.join(AUTH_DIR, "fixtures.json");

export const ADMIN = {
  email: "e2e-admin@example.com",
  password: "E2e-Admin-Pass-123",
  fullName: "E2E Admin",
  username: "e2eadmin",
};

export const MEMBER = {
  email: "e2e-member@example.com",
  password: "E2e-Member-Pass-123",
  fullName: "E2E Member",
  username: "e2emember",
};

/** Owned by the profile flow, which renames it; nothing else may assert on this user's name. */
export const PROFILE_USER = {
  email: "e2e-profile@example.com",
  password: "E2e-Profile-Pass-123",
  fullName: "E2E Profile User",
  username: "e2eprofile",
};

/** Names of seeded data. All prefixed with "E2E" so assertions can't match stock UI text by accident. */
export const NAMES = {
  recipe: "E2E Pancakes",
  recipe2: "E2E Garden Salad",
  ingredient: "2 cups e2e flour",
  instruction: "Whisk the e2e batter until smooth.",
  category: "E2E Breakfast",
  tag: "E2E Quick",
  tool: "E2E Skillet",
  cookbook: "E2E Cookbook",
  shoppingList: "E2E Groceries",
  shoppingList2: "E2E Hardware Store",
  shoppingItems: ["E2E Milk", "E2E Eggs"],
  food: "e2e flour",
  unit: "e2e cup",
  label: "E2E Dairy",
  group: "E2E Second Group",
  household: "E2E Second Household",
  mealplanNote: "E2E Leftovers Night",
  webhook: "E2E Webhook",
  notifier: "E2E Notifier",
  recipeAction: "E2E Recipe Action",
  apiToken: "E2E Token",
};

export interface Fixtures {
  groupSlug: string;
  householdSlug: string;
  adminId: string;
  memberId: string;
  recipeSlug: string;
  recipeId: string;
  recipe2Slug: string;
  cookbookSlug: string;
  shoppingListId: string;
  sharedRecipeToken: string;
  reportId: string;
  secondGroupId: string;
  secondHouseholdId: string;
  /** ISO date (YYYY-MM-DD, UTC) of the seeded meal plan entries. */
  mealplanDate: string;
}

export function loadFixtures(): Fixtures {
  return JSON.parse(fs.readFileSync(FIXTURES_FILE, "utf-8")) as Fixtures;
}
