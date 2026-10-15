"""Build strict React and the single Vue boundary patch; retain artifact/source identities."""
import hashlib
import json
from pathlib import Path
import shutil
from record_command import ROOT,EVIDENCE,run
from run_s1 import SOURCE,environment
RUNTIME=Path('/tmp/wf6-rerun-20261014-01-S5');REACT=SOURCE/'frontend-react-wf6';STAGE=EVIDENCE/'steps/S5'

def command(argv,cwd,label,env):
    result=run(argv,cwd,label,stage='S5',env=env,permission='Approved bounded build/public-font access; default sandbox unchanged')
    if result['exit_code']!=0:raise SystemExit(result['exit_code'])
    return result

def artifact(folder,destination,command_id,source_hash):
    files=[]
    for p in sorted(folder.rglob('*')):
        if p.is_file():
            relative=p.relative_to(folder);digest=hashlib.sha256(p.read_bytes()).hexdigest();target=destination/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target)
            assert hashlib.sha256(target.read_bytes()).hexdigest()==digest
            files.append(dict(path=str(relative),bytes=p.stat().st_size,sha256=digest))
    return dict(command_id=command_id,source_hash=source_hash,files=files,build_hash=hashlib.sha256(json.dumps(files,sort_keys=True).encode()).hexdigest(),served_path=str(destination),exit_code=0,browser_acceptance_allowed=True)

def main():
    assert (STAGE/'dependency-versions.json').exists()
    env=environment();env['TMPDIR']=str(RUNTIME/'tmp')
    files=[p for p in REACT.rglob('*') if p.is_file() and 'node_modules' not in p.parts and 'dist' not in p.parts]
    files+=list((SOURCE/'wf6').glob('route-policy.*'))
    records=[dict(path=str(p.relative_to(SOURCE)),sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in sorted(files)]
    source_hash=hashlib.sha256(json.dumps(records,sort_keys=True).encode()).hexdigest();env['WF6_REACT_SOURCE_HASH']=source_hash
    command(['node',str(REACT/'node_modules/typescript/bin/tsc'),'--noEmit'],REACT,'S5-React-strict-TypeScript',env)
    command(['node',str(REACT/'node_modules/eslint/bin/eslint.js'),'.','--max-warnings=0'],REACT,'S5-React-lint',env)
    command(['node','--test',str(REACT/'src/business.test.ts')],REACT,'S5-business-unit-checks',env)
    command(['node','--test',str(SOURCE/'wf6/route-policy.test.mjs')],SOURCE,'S5-shared-route-policy-matrix',env)
    entry=command(['node',str(REACT/'node_modules/vite/bin/vite.js'),'build'],REACT,'S5-React-production-build',env)
    react=artifact(REACT/'dist',RUNTIME/'react',entry['command_id'],source_hash)
    assert '/_wf6/assets/' in (RUNTIME/'react/index.html').read_text()
    entry=command(['node',str(SOURCE/'frontend/node_modules/nuxt/bin/nuxt.mjs'),'generate','--spa'],SOURCE/'frontend','S5-Vue-boundary-production-build',env)
    vue=artifact(SOURCE/'frontend/dist',RUNTIME/'vue',entry['command_id'],hashlib.sha256((SOURCE/'frontend/app/middleware/wf6-boundary.global.ts').read_bytes()).hexdigest())
    command(['node',str(SOURCE/'frontend/node_modules/eslint/bin/eslint.js'),'app/middleware/wf6-boundary.global.ts','--max-warnings=0'],SOURCE/'frontend','S5-Vue-boundary-targeted-lint',env)
    (STAGE/'build-artifacts.json').write_text(json.dumps(dict(react=react,vue=vue,react_source_files=records,vue_original_type_diagnostics='S1 318 FAIL retained; full Vue typecheck is not claimed passing'),indent=2)+'\n')
    print(json.dumps(dict(react_build_hash=react['build_hash'],vue_build_hash=vue['build_hash'],react_source_hash=source_hash)))

if __name__=='__main__':main()
