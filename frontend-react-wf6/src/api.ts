import type { Recipe, RecipeSummary } from '../../frontend/app/lib/api/types/recipe.ts';

export interface Identity { id: string; groupId: string; groupSlug: string; fullName: string }
export interface RecipePage { items: RecipeSummary[]; total: number; total_pages: number; page: number }
export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}
export class SessionError extends ApiError {}

export function accessToken(): string | null {
  const cookie = document.cookie.split(';').map(x => x.trim()).find(x => x.startsWith('mealie.access_token='));
  return cookie ? decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1)) : null;
}

export function recipeListUrl(search: string, page = 1): string {
  const query = new URLSearchParams({ page: String(page), perPage: '50', orderBy: 'name' });
  if (search.trim()) query.set('search', search.trim());
  return '/api/recipes?' + query.toString();
}

export function createRecipeApi(identity: Identity, getToken: () => string | null = accessToken, transport: typeof fetch = fetch) {
  async function get<T>(url: string, signal: AbortSignal): Promise<T> {
    const token = getToken();
    const response = await transport(url, { headers: token ? { authorization: `Bearer ${token}` } : {}, credentials: 'same-origin', signal });
    if (response.status === 401) throw new SessionError('Anonymous or expired session (401)', 401);
    if (!response.ok) throw new ApiError(response.status === 404 ? 'Recipe not found' : `Recipe API request failed (${response.status})`, response.status);
    return await response.json() as T;
  }
  async function verify(signal: AbortSignal) {
    const current = await get<Identity>('/api/users/self', signal);
    if (current.id !== identity.id || current.groupId !== identity.groupId || current.groupSlug !== identity.groupSlug) throw new SessionError('Session identity or group changed; use the Vue entry', 403);
  }
  function checkGroup(recipe: RecipeSummary) {
    if (recipe.groupId !== identity.groupId) throw new SessionError('Recipe group does not match the verified session', 403);
  }
  return {
    async list(search: string, page: number, signal: AbortSignal): Promise<RecipePage> {
      await verify(signal);
      const data = await get<RecipePage>(recipeListUrl(search, page), signal);
      if (!Array.isArray(data.items)) throw new ApiError('Invalid recipe list response', 502);
      data.items.forEach(checkGroup);
      return data;
    },
    async detail(slug: string, signal: AbortSignal): Promise<Recipe> {
      await verify(signal);
      const data = await get<Recipe>('/api/recipes/' + encodeURIComponent(slug), signal);
      checkGroup(data);
      return data;
    },
  };
}
export type RecipeApi = ReturnType<typeof createRecipeApi>;
