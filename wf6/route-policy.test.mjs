import test from 'node:test';
import assert from 'node:assert/strict';
import { ownsReact, explicitVue } from './route-policy.mjs';
import { readFile } from 'node:fs/promises';
const map = JSON.parse(await readFile(new URL('./route-map.json', import.meta.url)));
const cases = [
  ['/g/home', true], ['/g/home/', true], ['/g/home/r/recipe', true], ['/g/home/r/recipe/', true],
  ['/g/home?search=hello#section', true], ['/g/home/r/recipe?foo=1#ingredients', true],
  ['/g/home?wf6=vue', false], ['/g/home/r/recipe?wf6=vue#ingredients', false],
  ['/g/home/r/create', false], ['/g/home/r/create/', false], ['/g/home/r/create/new', false], ['/g/home/r/create/url?foo=1', false],
  ['/g/home/shared/r/id', false], ['/g/home/r/shared', false], ['/g/other', false], ['/g/other/r/recipe', false],
  ['/g/home/r/recipe?edit=true', false], ['/g/home/r/recipe?parse=true', false], ['/g/home/r/recipe?cook=true', false],
  ['/g/home/r/recipe?mode=edit', false], ['/g/home/r/recipe?view=cook', false], ['/g/home/r/recipe?edit=false&edit=true', false],
  ['/g/home/r/recipe?edit=false', true], ['/g/home/r/recipe?cook=0', true],
  ['/g/home/r/recipe/edit', false], ['/g/home/r/recipe/cook', false], ['/login', false], ['/shopping-lists', false],
  ['/g/home/r/%63reate', false], ['/g/home/r/a%2Fb', false], ['/g/home//', false], ['/g/home/r/%ZZ', false],
];
for (const [target, expected] of cases) test(`ownership ${target}`, () => assert.equal(ownsReact(target, map), expected));
test('explicit Vue preserves query/hash and prevents ownership', () => {
  const target = explicitVue('/g/home/r/recipe?foo=1#ingredients', map);
  assert.equal(target, '/g/home/r/recipe?foo=1&wf6=vue#ingredients'); assert.equal(ownsReact(target, map), false);
});
test('disabled takeover returns all Vue', () => { for (const [target] of cases) assert.equal(ownsReact(target, { ...map, takeoverEnabled: false }), false); });
