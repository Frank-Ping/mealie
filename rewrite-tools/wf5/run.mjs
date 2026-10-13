import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { convert } from './convert.mjs';

const require = createRequire(new URL('../../frontend-react/package.json',import.meta.url));
const ts=require('typescript');
const {parse}=require('@vue/compiler-sfc');
export const repo=fileURLToPath(new URL('../../',import.meta.url));
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
const git=(...args)=>execFileSync(process.platform==='win32'?'C:/Program Files/Git/cmd/git.exe':'git',['-C',repo,...args],{encoding:'utf8'}).trim();
function walk(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]); }
function relative(file) { return path.relative(repo,file).split(path.sep).join('/'); }
export function loadManifest(filename) {
  const manifest=JSON.parse(fs.readFileSync(filename,'utf8'));
  if(manifest.samples.length!==5||new Set(manifest.samples.map(s=>s.id)).size!==5) throw new Error('Required five-sample inventory mismatch');
  for(const sample of manifest.samples) {
    if(!sample.path.startsWith('frontend/app/') || path.isAbsolute(sample.path) || sample.path.split('/').includes('..')) throw new Error('Unsafe source path');
    if(!fs.existsSync(path.join(repo,sample.path))) throw new Error(`Missing required source: ${sample.path}`);
  }
  return manifest;
}
export function snapshotSamples(manifest) {
  return manifest.samples.map(sample=>{
    const input=fs.readFileSync(path.join(repo,sample.path),'utf8');
    const result=convert(input,{...sample,path:sample.path});
    return {...sample,sourceSha256:hash(fs.readFileSync(path.join(repo,sample.path))),...result,
      syntax:result.output?'pass':'not generated', semantic:'pending review',
      dependencyClosure:sample.id==='common'?'blocked: UserApi transport and theme equivalence pending':result.output?'local helper closure only':'blocked'};
  });
}

function testInventory() {
  const files=walk(path.join(repo,'frontend/app')).filter(f=>/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(f));
  return files.map(file=>{
    const source=fs.readFileSync(file,'utf8');
    const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
    const assertions=[],cases=[],imports=[];
    function visit(node) {
      if(ts.isImportDeclaration(node)) imports.push(node.moduleSpecifier.text);
      if(ts.isCallExpression(node)) {
        const name=node.expression.getText(ast);
        const location=ast.getLineAndCharacterOfPosition(node.getStart(ast));
        if(ts.isIdentifier(node.expression)&&node.expression.text==='expect') assertions.push({line:location.line+1,subject:node.arguments[0]?.getText(ast)||''});
        if(/^(?:test|it)(?:\.(?:each|skip|todo|only))?$/.test(name)) cases.push({line:location.line+1,name:node.arguments[0]?.getText(ast)||'',callee:name});
      }
      ts.forEachChild(node,visit);
    }
    visit(ast);
    return {path:relative(file),sha256:hash(fs.readFileSync(file)),imports,cases,assertions,
      parity:['frontend/app/lib/sanitize/text.test.ts','frontend/app/lib/validators/redirect.test.ts'].includes(relative(file))?'reused byte-identical, same subjects and matchers; runtime run required':'unmigrated; no preservation claim for React'};
  });
}
function routeInventory() {
  return walk(path.join(repo,'frontend/app/pages')).filter(f=>f.endsWith('.vue')).sort().map(file=>{
    const source=fs.readFileSync(file,'utf8');
    const descriptor=parse(source).descriptor;
    let metadata=null;
    if(descriptor.scriptSetup) {
      const ast=ts.createSourceFile(file+'.ts',descriptor.scriptSetup.content,ts.ScriptTarget.Latest,true);
      for(const stmt of ast.statements) if(ts.isExpressionStatement(stmt)&&ts.isCallExpression(stmt.expression)&&stmt.expression.expression.getText(ast)==='definePageMeta') metadata=stmt.expression.arguments[0]?.getText(ast)||null;
    }
    const segments=relative(file).slice('frontend/app/pages/'.length,-4).split('/');
    if(segments.at(-1)==='index') segments.pop();
    const route=segments.map(s=>s.startsWith('[')?s.startsWith('[...')?'*':':'+s.slice(1,-1):s).join('/');
    return {source:relative(file),sourceSha256:hash(fs.readFileSync(file)),candidatePath:'/'+route,metadata,compiled:false,status:'inventory only; compare to frozen yardstick before route publication'};
  });
}
function reuse() {
  const paths=['lib/api/types/recipe.ts','lib/sanitize/text.ts','lib/sanitize/text.test.ts','lib/icons/index.ts','lib/icons/icons.ts','lib/icons/icon-type.ts','lib/validators/redirect.ts','lib/validators/redirect.test.ts'];
  return paths.map(p=>{
    const source=path.join(repo,'frontend/app',p),destination=path.join(repo,'frontend-react/src/reused',p);
    const bytes=fs.readFileSync(source);
    fs.mkdirSync(path.dirname(destination),{recursive:true}); fs.writeFileSync(destination,bytes);
    return {source:relative(source),target:relative(destination),sha256:hash(bytes),mode:'byte-identical reuse; no source edit'};
  });
}
export function publishArtifacts(directory, files) {
  // Directory must be new; immutable prior snapshots are never overwritten.
  if(fs.existsSync(directory)) throw new Error('Artifact directory already exists');
  const staging=directory+'.staging-'+crypto.randomUUID();
  fs.mkdirSync(staging,{recursive:true});
  try {
    for(const [name,text] of Object.entries(files)) {
      if(path.isAbsolute(name)||name.split(/[\\/]/).includes('..')) throw new Error('Unsafe artifact path');
      const file=path.join(staging,name); fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file,text);
    }
    fs.renameSync(staging,directory);
  } catch(error) {
    // No published output changed. Retain failed staging for investigation.
    throw error;
  }
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const manifest=loadManifest(path.join(repo,'rewrite-tools/wf5/manifest.json'));
  if(git('diff',manifest.sourceCommit,'--','frontend/','mealie/')) throw new Error('Frozen source/backend changed');
  const samples=snapshotSamples(manifest);
  const round=process.env.WF5_ROUND||process.env.WF4_ROUND||manifest.round;
  if(!/^round-[1-3]$/.test(round)) throw new Error('At most three declared rounds');
  const revision=process.env.WF5_REVISION||process.env.WF4_REVISION;
  if(revision&&!/^[2-9]$/.test(revision)) throw new Error('Invalid within-round revision');
  const artifacts=path.join(repo,'rewrite-evidence/workflows/WF5-artifacts',round,...(revision?['revision-'+revision]:[]));
  fs.mkdirSync(artifacts,{recursive:true});
  const pure={};
  for(const sample of samples) if(sample.output) pure[sample.component+'.tsx']=sample.output;
  const toolHashes=Object.fromEntries(['convert.mjs','run.mjs','manifest.json','test.mjs','fixtures/cases.json'].map(name=>[name,hash(fs.readFileSync(path.join(repo,'rewrite-tools/wf5',name)))]));
  const infraHashes=Object.fromEntries(walk(path.join(repo,'frontend-react/src/infra')).map(file=>[relative(file),hash(fs.readFileSync(file))]));
  pure['manifest.json']=JSON.stringify({sourceCommit:manifest.sourceCommit,canonicalHead:git('rev-parse','HEAD'),toolHashes,infraHashes,lockSha256:hash(fs.readFileSync(path.join(repo,'frontend-react/pnpm-lock.yaml'))),samples:samples.map(({output,...rest})=>rest),fileHashes:Object.fromEntries(Object.entries(pure).map(([p,text])=>[p,hash(text)]))},null,2)+'\n';
  publishArtifacts(path.join(artifacts,'pure'),pure);
  publishArtifacts(path.join(artifacts,'refined'),{...pure,'refinement-manifest.json':JSON.stringify({operations:[],note:'No semantic refinements applied; blocked samples absent, not fabricated. Same generated bytes as pure.'},null,2)+'\n'});
  const generated=path.join(repo,'frontend-react/src/generated');
  fs.mkdirSync(generated,{recursive:true});
  // A new round cannot leave prior generated files accidentally compiled.
  const expected=new Set(Object.keys(pure).filter(name=>name.endsWith('.tsx')));
  for(const file of fs.readdirSync(generated)) if(file.endsWith('.tsx')&&!expected.has(file)) throw new Error('Unexpected prior generated file; publication needs reviewed removal');
  for(const name of expected) fs.writeFileSync(path.join(generated,name),pure[name]);
  const evidence=path.join(repo,'rewrite-evidence/workflows/WF5-B'); fs.mkdirSync(evidence,{recursive:true});
  const write=(name,value)=>fs.writeFileSync(path.join(evidence,name),JSON.stringify(value,null,2)+'\n');
  write('source-test-inventory.json',testInventory());
  write('route-inventory.json',routeInventory());
  write('reuse-manifest.json',reuse());
  write(round+(revision?'-revision-'+revision:'')+'-results.json',samples.map(({output,...rest})=>rest));
  console.log(JSON.stringify({round,samples:5,generated:samples.filter(s=>s.output).map(s=>s.id),blocked:samples.filter(s=>!s.output).map(s=>({id:s.id,diagnostics:s.diagnostics})),artifacts:relative(artifacts)},null,2));
}
