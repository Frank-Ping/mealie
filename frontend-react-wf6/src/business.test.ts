import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecipeApi, recipeListUrl, SessionError, ApiError, type Identity } from './api.ts';
import { ingredientText, recipeLink } from './model.ts';

const identity: Identity = { id: 'user', groupId: 'group', groupSlug: 'home', fullName: 'Test' };
const signal = () => new AbortController().signal;
function transport(answer: (url: string) => Response): typeof fetch {
  return async (input, init) => {
    assert.equal((init?.headers as Record<string, string>).authorization, 'Bearer unit-token');
    return answer(String(input));
  };
}
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });

test('list search encodes real query/pagination; clear search removes the filter', () => {
  assert.equal(new URL(recipeListUrl('Garden Salad'), 'http://local').searchParams.get('search'), 'Garden Salad');
  assert.equal(new URL(recipeListUrl(''), 'http://local').searchParams.has('search'), false);
  assert.equal(new URL(recipeListUrl('salt & pepper', 2), 'http://local').searchParams.get('page'), '2');
});
test('ingredient display, original text, structured quantity/unit/food/note and zero fallback', () => {
  assert.equal(ingredientText({ display: '2 cups flour', originalText: 'original' }), '2 cups flour');
  assert.equal(ingredientText({ originalText: 'original' }), 'original');
  assert.equal(ingredientText({ quantity: 2, unit: { name: 'cups', id: 'u' }, food: { name: 'flour', id: 'f' }, note: 'sifted' }), '2 cups flour sifted');
  assert.equal(ingredientText({ quantity: 0, note: 'to taste' }), 'to taste');
});
test('recipe links encode group and slug rather than concatenating unsafe segments', () => assert.equal(recipeLink('home', 'salt & pepper'), '/g/home/r/salt%20%26%20pepper'));
test('list adapter verifies identity before requesting owned data', async () => {
  const calls: string[] = [];
  const api = createRecipeApi(identity, () => 'unit-token', transport(url => { calls.push(url); return json(url === '/api/users/self' ? identity : { items: [{ groupId: 'group', slug: 'pancakes', name: 'Pancakes' }], total: 1, total_pages: 1, page: 1 }); }));
  const page = await api.list('Pancakes', 1, signal()); assert.equal(page.items[0]?.slug, 'pancakes'); assert.equal(calls[0], '/api/users/self');
});
test('changed identity refuses recipe request rather than showing a new group', async () => {
  const calls: string[] = [];
  const api = createRecipeApi(identity, () => 'unit-token', transport(url => { calls.push(url); return json({ ...identity, groupId: 'different' }); }));
  await assert.rejects(api.list('', 1, signal()), SessionError); assert.deepEqual(calls, ['/api/users/self']);
});
test('foreign recipe group is rejected even after a valid self response', async () => {
  const api = createRecipeApi(identity, () => 'unit-token', transport(url => json(url === '/api/users/self' ? identity : { items: [{ groupId: 'different', slug: 'foreign' }] })));
  await assert.rejects(api.list('', 1, signal()), SessionError);
});
test('detail slug is URL encoded and group ownership validated', async () => {
  const calls: string[] = []; const api = createRecipeApi(identity, () => 'unit-token', transport(url => { calls.push(url); return json(url === '/api/users/self' ? identity : { groupId: 'group', name: 'Real response', slug: 'salt & pepper' }); }));
  assert.equal((await api.detail('salt & pepper', signal())).name, 'Real response'); assert.equal(calls[1], '/api/recipes/salt%20%26%20pepper');
});
test('401 is a session failure and 404 remains an explicit detail error', async () => {
  const expired = createRecipeApi(identity, () => 'unit-token', transport(() => json({}, 401))); await assert.rejects(expired.list('', 1, signal()), SessionError);
  const missing = createRecipeApi(identity, () => 'unit-token', transport(url => url === '/api/users/self' ? json(identity) : json({}, 404)));
  await assert.rejects(missing.detail('missing', signal()), (error: unknown) => error instanceof ApiError && error.status === 404);
});
