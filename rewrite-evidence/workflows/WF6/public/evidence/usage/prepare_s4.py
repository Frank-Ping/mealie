"""Prepare isolated S4 runtime and pinned lint dependencies without altering earlier tools."""
import json
from pathlib import Path
import shutil
from record_command import ROOT,EVIDENCE,run
from run_s1 import SOURCE,environment

STAGE=EVIDENCE/'steps/S4';RUNTIME=Path('/tmp/wf6-rerun-20261014-01-S4');REACT=SOURCE/'frontend-react-wf6'

def main():
    assert not RUNTIME.exists();RUNTIME.mkdir(mode=0o700)
    for name in ['deps','auth','tmp','browser','tests','vue','react']:(RUNTIME/name).mkdir(mode=0o700)
    env=environment();env['TMPDIR']=str(RUNTIME/'tmp');package=json.loads((REACT/'package.json').read_text());metadata=[]
    for name,version in {'eslint':'9','@eslint/js':'9','typescript-eslint':'8','eslint-plugin-react-hooks':'5','globals':'16'}.items():
        entry=run(['npm','view',name+'@'+version,'version','--json'],REACT,'S4-pin-lint-'+name,stage='S4',env=env,permission='Approved anonymous npm metadata/install in owned S4 runtime')
        assert entry['exit_code']==0;value=json.loads((EVIDENCE/entry['stdout']).read_text());exact=value[-1] if isinstance(value,list) else value;package['devDependencies'][name]=exact;metadata.append(dict(package=name,pinned_version=exact,command_id=entry['command_id']))
    package['scripts'].update(lint='eslint . --max-warnings=0',test='node --test src/business.test.ts')
    text=json.dumps(package,indent=2)+'\n';(REACT/'package.json').write_text(text);(RUNTIME/'deps/package.json').write_text(text);shutil.copy2(REACT/'package-lock.json',RUNTIME/'deps/package-lock.json')
    entry=run(['npm','install','--ignore-scripts','--no-audit','--no-fund'],RUNTIME/'deps','S4-native-pinned-dependency-install',stage='S4',env=env,permission='Approved anonymous npm install; no credentials')
    assert entry['exit_code']==0;shutil.copy2(RUNTIME/'deps/package-lock.json',REACT/'package-lock.json')
    link=REACT/'node_modules';assert link.is_symlink() and link.resolve()==Path('/tmp/wf6-rerun-20261014-01-S3/deps/node_modules');link.unlink();link.symlink_to(RUNTIME/'deps/node_modules',target_is_directory=True)
    (STAGE/'dependency-versions.json').write_text(json.dumps(dict(package=package,lint_metadata=metadata,native_dependency_root=str(RUNTIME/'deps'),install_scripts=False),indent=2)+'\n')
    (RUNTIME/'identity.json').write_text(json.dumps(dict(run_id=ROOT.name,stage_id='S4',data_dir=str(RUNTIME/'disposable-data'),ports=[9006,9106]),indent=2)+'\n')

if __name__=='__main__':main()
