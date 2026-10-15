"""Freeze anonymous registry metadata and install only independent Linux React tools."""
import hashlib
import json
from pathlib import Path
import shutil
from record_command import ROOT,EVIDENCE,run
from run_s1 import SOURCE,environment

STAGE=EVIDENCE/'steps/S3';RUNTIME=Path('/tmp/wf6-rerun-20261014-01-S3');REACT=SOURCE/'frontend-react-wf6'

def main():
    assert not RUNTIME.exists(), 'Refuse to overwrite any existing S3 runtime.'
    RUNTIME.mkdir(mode=0o700)
    for name in ['deps','auth','tmp','browser','tests','vue','react']:(RUNTIME/name).mkdir(mode=0o700)
    env=environment();env['TMPDIR']=str(RUNTIME/'tmp')
    specs={'react':'19','react-dom':'19','react-router':'7','@mui/material':'7','@emotion/react':'11','@emotion/styled':'11','i18next':'25','react-i18next':'16',
        'vite':'8','@vitejs/plugin-react':'latest','typescript':'5.9','@types/react':'19','@types/react-dom':'19','@types/node':'24'}
    versions={};sources=[]
    for name,version in specs.items():
        result=run(['npm','view',name+'@'+version,'version','--json'],REACT,'S3-public-registry-version-'+name,stage='S3',env=env,permission='Approved anonymous npm metadata and isolated dependency preparation')
        assert result['exit_code']==0
        raw=json.loads((EVIDENCE/result['stdout']).read_text());versions[name]=raw[-1] if isinstance(raw,list) else raw
        sources.append(dict(package=name,requested_range=version,pinned_version=versions[name],command_id=result['command_id']))
    dev=set(['vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node'])
    package=dict(name='mealie-wf6-react-probe',version='0.0.0',private=True,type='module',scripts={'typecheck':'tsc --noEmit','build':'vite build'},
        dependencies={k:v for k,v in versions.items() if k not in dev},devDependencies={k:v for k,v in versions.items() if k in dev})
    content=json.dumps(package,indent=2)+'\n';(REACT/'package.json').write_text(content);(RUNTIME/'deps/package.json').write_text(content)
    result=run(['npm','install','--ignore-scripts','--no-audit','--no-fund'],RUNTIME/'deps','S3-native-React-dependency-install',stage='S3',env=env,permission='Approved anonymous npm dependency install into owned native runtime; no credentials')
    assert result['exit_code']==0
    shutil.copy2(RUNTIME/'deps/package-lock.json',REACT/'package-lock.json')
    assert not (REACT/'node_modules').exists();(REACT/'node_modules').symlink_to(RUNTIME/'deps/node_modules',target_is_directory=True)
    gitignore=REACT/'.gitignore';gitignore.write_text('node_modules\n/dist/\n')
    (STAGE/'dependency-versions.json').write_text(json.dumps(dict(versions=versions,metadata_sources=sources,linux_native_target=str(RUNTIME/'deps'),lock_sha256=hashlib.sha256((REACT/'package-lock.json').read_bytes()).hexdigest(),ignored_install_scripts=True),indent=2)+'\n')
    (RUNTIME/'identity.json').write_text(json.dumps(dict(run_id=ROOT.name,stage_id='S3',data_dir=str(RUNTIME/'disposable-data'),auth_dir=str(RUNTIME/'auth'),ports=[9006,9106]),indent=2)+'\n')
    print(json.dumps(dict(versions=versions,runtime=str(RUNTIME))))

if __name__=='__main__':main()
