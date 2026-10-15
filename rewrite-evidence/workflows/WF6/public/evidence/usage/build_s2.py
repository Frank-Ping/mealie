"""Generate a fresh frozen Vue build and copy verified bytes to isolated S2 runtime."""
import hashlib
import json
from pathlib import Path
import shutil
from record_command import run,EVIDENCE,ROOT
from run_s1 import SOURCE,environment

STAGE=EVIDENCE/'steps/S2'
RUNTIME=Path('/tmp/wf6-rerun-20261014-01-S2')

def main():
    assert not RUNTIME.exists(), 'Refuse to overwrite any existing S2 runtime.'
    RUNTIME.mkdir(mode=0o700)
    for name in ('auth','tmp','browser','static','tests'):(RUNTIME/name).mkdir(mode=0o700)
    env=environment();env['TMPDIR']=str(RUNTIME/'tmp')
    entry=run(['pnpm','generate'],SOURCE/'frontend','S2-fresh-Vue-build',stage='S2',env=env,
        permission='Approved public-font build network; default sandbox unchanged')
    if entry['exit_code']!=0:
        (STAGE/'build-artifact.json').write_text(json.dumps(dict(exit_code=entry['exit_code'],command_id=entry['command_id'],browser_acceptance_allowed=False))+'\n')
        raise SystemExit(entry['exit_code'])
    files=[]
    for source in sorted((SOURCE/'frontend/dist').rglob('*')):
        if source.is_file():
            relative=source.relative_to(SOURCE/'frontend/dist');target=RUNTIME/'static'/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,target)
            digest=hashlib.sha256(source.read_bytes()).hexdigest();assert hashlib.sha256(target.read_bytes()).hexdigest()==digest
            files.append(dict(path=str(relative),sha256=digest,bytes=source.stat().st_size))
    import subprocess
    head=subprocess.check_output(['git','-C',str(SOURCE),'rev-parse','HEAD'],text=True).strip()
    artifact=dict(exit_code=0,command_id=entry['command_id'],build_utc=entry['end_utc'],source_head=head,
        build_hash=hashlib.sha256(json.dumps(files,sort_keys=True).encode()).hexdigest(),files=files,served_path=str(RUNTIME/'static'),browser_acceptance_allowed=True,
        scope='Unchanged frozen Vue build; S2 gateway source tracked separately. No React build.')
    (STAGE/'build-artifact.json').write_text(json.dumps(artifact,indent=2)+'\n')
    (RUNTIME/'identity.json').write_text(json.dumps(dict(run_id=ROOT.name,stage_id='S2',build_hash=artifact['build_hash'],disposable_data=str(RUNTIME/'disposable-data'),port_backend=9006,port_gateway=9106),indent=2)+'\n')
    print(json.dumps(dict(build_hash=artifact['build_hash'],files=len(files),runtime=str(RUNTIME))))

if __name__=='__main__':main()
