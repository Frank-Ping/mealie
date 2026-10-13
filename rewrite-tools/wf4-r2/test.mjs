import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { convert, refineInMemory } from './convert.mjs';
import { loadManifest, snapshotSamples, publishArtifacts, repo } from './run.mjs';

const manifest=loadManifest(path.join(repo,'rewrite-tools/wf4-r2/manifest.json'));
export function validateFixtures(cases) {
  assert.deepEqual(cases.map(c=>c.id).sort(),[...manifest.requiredFixtureIds].sort(),'Required fixture inventory changed/missing');
  for(const item of cases) { assert.ok(typeof item.source==='string'&&item.source.length); assert.ok(item.blocked || Array.isArray(item.expected)&&item.expected.length,'Missing expected verdict'); }
}
const cases=JSON.parse(fs.readFileSync(new URL('./fixtures/cases.json',import.meta.url),'utf8'));
validateFixtures(cases);
for(const item of cases) test('fixture: '+item.id,()=>{
  const result=convert(item.source,{component:'Fixture',path:item.path||'fixture.vue'});
  if(item.blocked) { assert.equal(result.output,null); assert.equal(result.diagnostics[0].rule,item.blocked); assert.equal(result.diagnostics[0].blocking,true); }
  else { assert.deepEqual(result.diagnostics,[]); for(const expected of item.expected) assert.ok(result.output.includes(expected),`${item.id}: missing ${expected}\n${result.output}`); }
  assert.deepEqual(convert(item.source,{component:'Fixture',path:item.path||'fixture.vue'}),result,'Generation must be deterministic');
});
test('missing required fixture/expected verdict fails hard',()=>{
  assert.throws(()=>validateFixtures(cases.slice(1)));
  assert.throws(()=>validateFixtures(cases.map(c=>c.id==='leaf'?{id:c.id,source:c.source}:c)));
});
test('import relocation is AST-scoped and does not rewrite business strings',()=>{
  const source='<template><div>{{truncateText(marker)}}</div></template><script setup lang="ts">import {truncateText} from "~/lib/sanitize/text"; interface Props {} const props=defineProps<Props>(); const marker="~/lib/foo";</script>';
  const result=convert(source);
  assert.deepEqual(result.diagnostics,[]);
  assert.ok(result.output.includes('"../reused/lib/sanitize/text"'));
  assert.ok(result.output.includes('"~/lib/foo"'));
});
test('all five actual source samples have verdicts and deterministic bytes',()=>{
  const first=snapshotSamples(manifest),second=snapshotSamples(manifest);
  assert.equal(first.length,5); assert.deepEqual(second,first);
  assert.ok(first.every(s=>s.output || s.diagnostics.length));
});
test('refinement failure cannot mutate original or return partially patched files',()=>{
  const original={'a.tsx':'unique anchor','b.tsx':'other'};
  assert.throws(()=>refineInMemory(original,[{file:'a.tsx',anchor:'anchor',replacement:'changed'},{file:'b.tsx',anchor:'missing',replacement:'bad'}]));
  assert.deepEqual(original,{'a.tsx':'unique anchor','b.tsx':'other'});
  assert.throws(()=>refineInMemory({'a':'repeat repeat'},[{file:'a',anchor:'repeat',replacement:'changed'}]));
});
test('publication refuses overwrite and invalid paths without publishing partial tree',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'wf4-r2-test-'));
  const output=path.join(root,'pure');
  publishArtifacts(output,{'a.tsx':'good'});
  assert.throws(()=>publishArtifacts(output,{'a.tsx':'bad'}));
  assert.equal(fs.readFileSync(path.join(output,'a.tsx'),'utf8'),'good');
  const bad=path.join(root,'bad');
  assert.throws(()=>publishArtifacts(bad,{'a.tsx':'good','../escape':'bad'}));
  assert.equal(fs.existsSync(bad),false);
  // Only the freshly-created test root is cleaned, using the same native filesystem API.
  fs.rmSync(root,{recursive:true,force:true});
});
