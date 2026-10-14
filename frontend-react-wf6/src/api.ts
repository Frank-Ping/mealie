import type { Recipe, RecipeSummary, RecipeCommentOut, RecipeCommentCreate } from '../../frontend/app/lib/api/types/recipe.ts';

export interface Identity { id: string; groupId: string; groupSlug: string; fullName: string; admin?: boolean; canManage?: boolean; canManageHousehold?: boolean; householdId?: string }
export interface RecipePage { items: RecipeSummary[]; total: number; total_pages: number; page: number }
interface Household { id: string; groupId: string; preferences?: { recipeDisableComments?: boolean } }
export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}
export class SessionError extends ApiError {}
export function accessToken(): string | null {
  const cookie = document.cookie.split(';').map(x => x.trim()).find(x => x.startsWith('mealie.access_token='));
  return cookie ? decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1)) : null;
}
export function clearAccessToken(): void { document.cookie = 'mealie.access_token=; Max-Age=0; Path=/; SameSite=Lax'; }
export async function logoutRequest(transport: typeof fetch = fetch, token = accessToken()): Promise<void> {
  const response = await transport('/api/auth/logout', { method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {}, credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) throw new ApiError(`Logout failed (${response.status}); local session was cleared`, response.status);
}
export function recipeListUrl(search: string, page = 1): string {
  const query = new URLSearchParams({ page: String(page), perPage: '50', orderBy: 'name' });
  if (search.trim()) query.set('search', search.trim());
  return '/api/recipes?' + query.toString();
}
export function commentsEnabled(recipe: Recipe, householdDisabled: boolean): boolean { return !householdDisabled && !recipe.settings?.disableComments; }
export function createRecipeApi(identity: Identity, getToken: () => string | null = accessToken, transport: typeof fetch = fetch) {
  const pending = new Set<AbortController>(); let closed = false;
  async function request<T>(url: string, signal: AbortSignal, body?: RecipeCommentCreate): Promise<T> {
    if (closed) throw new DOMException('Session closed', 'AbortError');
    signal.throwIfAborted(); const owned = new AbortController(); pending.add(owned);
    const cancel = () => owned.abort(); signal.addEventListener('abort', cancel, { once: true });
    try {
      const token = getToken();
      const response = await transport(url, { method: body ? 'POST' : 'GET', headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, credentials: 'same-origin', cache: 'no-store', signal: owned.signal, ...(body ? { body: JSON.stringify(body) } : {}) });
      owned.signal.throwIfAborted();
      if (response.status === 401) throw new SessionError('Anonymous or expired session (401)', 401);
      if (!response.ok) throw new ApiError(response.status === 404 ? 'Recipe not found' : `Recipe API request failed (${response.status})`, response.status);
      const result = await response.json() as T; owned.signal.throwIfAborted(); return result;
    } finally { pending.delete(owned); signal.removeEventListener('abort', cancel); }
  }
  async function verify(signal: AbortSignal) {
    const current = await request<Identity>('/api/users/self', signal);
    if (current.id !== identity.id || current.groupId !== identity.groupId || current.groupSlug !== identity.groupSlug || current.householdId !== identity.householdId) throw new SessionError('Session identity or group changed; use the Vue entry', 403);
  }
  function checkGroup(recipe: RecipeSummary) { if (recipe.groupId !== identity.groupId) throw new SessionError('Recipe group does not match the verified session', 403); }
  async function householdDisabled(signal: AbortSignal) {
    const household = await request<Household>('/api/households/self', signal);
    if (household.id !== identity.householdId || household.groupId !== identity.groupId) throw new SessionError('Household does not match the verified session', 403);
    return household.preferences?.recipeDisableComments === true;
  }
  return {
    cancel() { closed = true; for (const controller of pending) controller.abort(); pending.clear(); },
    async list(search: string, page: number, signal: AbortSignal): Promise<RecipePage> {
      await verify(signal); const data = await request<RecipePage>(recipeListUrl(search, page), signal);
      if (!Array.isArray(data.items)) throw new ApiError('Invalid recipe list response', 502);
      data.items.forEach(checkGroup); return data;
    },
    async detail(slug: string, signal: AbortSignal): Promise<Recipe> {
      await verify(signal); const data = await request<Recipe>('/api/recipes/' + encodeURIComponent(slug), signal); checkGroup(data); return data;
    },
    async comments(recipe: Recipe, signal: AbortSignal): Promise<{ enabled: boolean; items: RecipeCommentOut[] }> {
      await verify(signal); checkGroup(recipe);
      if (!commentsEnabled(recipe, await householdDisabled(signal))) return { enabled: false, items: [] };
      const items = await request<RecipeCommentOut[]>('/api/recipes/' + encodeURIComponent(recipe.slug ?? '') + '/comments', signal);
      if (!Array.isArray(items) || items.some(item => item.recipeId !== recipe.id)) throw new ApiError('Invalid recipe comment response', 502);
      return { enabled: true, items };
    },
    async submitComment(recipe: Recipe, text: string, signal: AbortSignal): Promise<RecipeCommentOut> {
      const trimmed = text.trim(); if (!trimmed) throw new ApiError('Comment cannot be blank', 400);
      await verify(signal); checkGroup(recipe);
      // Revalidate both original Vue disable conditions immediately before the write.
      const current = await request<Recipe>('/api/recipes/' + encodeURIComponent(recipe.slug ?? ''), signal); checkGroup(current);
      if (current.id !== recipe.id || !commentsEnabled(current, await householdDisabled(signal))) throw new ApiError('Comments are disabled', 403);
      const saved = await request<RecipeCommentOut>('/api/comments', signal, { recipeId: recipe.id ?? '', text: trimmed });
      if (!saved.id || saved.recipeId !== recipe.id || saved.userId !== identity.id || saved.text !== trimmed) throw new ApiError('Invalid comment creation response', 502);
      return saved;
    },
  };
}
export type RecipeApi = ReturnType<typeof createRecipeApi>;
