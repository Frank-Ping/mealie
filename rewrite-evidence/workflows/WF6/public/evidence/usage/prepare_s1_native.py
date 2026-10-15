"""Copy only accepted build bytes to a fresh Linux filesystem runtime."""
import datetime as dt
import hashlib
import json
from pathlib import Path
import shutil
from run_s1 import SOURCE, STAGE

NATIVE = Path('/tmp/wf6-rerun-20261014-01-S1-native2')

def main():
    assert not NATIVE.exists(), 'Refuse to overwrite an existing native runtime.'
    build = json.loads((STAGE/'build-artifact.json').read_text())
    assert build['exit_code'] == 0 and build['browser_acceptance_allowed']
    NATIVE.mkdir(mode=0o700)
    for name in ('static','auth','tmp','browser'):
        (NATIVE/name).mkdir(mode=0o700)
    for item in build['files']:
        source=SOURCE/'frontend/dist'/item['path']
        target=NATIVE/'static'/item['path']
        assert hashlib.sha256(source.read_bytes()).hexdigest()==item['sha256']
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(source,target)
        assert hashlib.sha256(target.read_bytes()).hexdigest()==item['sha256']
    record=dict(created_utc=dt.datetime.now(dt.timezone.utc).isoformat(),run_id='wf6-rerun-20261014-01',stage_id='S1',
        native_root=str(NATIVE),static_dir=str(NATIVE/'static'),build_hash=build['build_hash'],verified_files=len(build['files']),
        scope='Identical accepted build bytes and fresh runtime outputs only. No application source or evaluator assertion changes.',
        hypothesis='First traces show prolonged resource transfers and incomplete modules at frozen assertion deadlines. Native filesystem placement is an environment-only diagnostic, not a proven causal claim.')
    (NATIVE/'identity.json').write_text(json.dumps(record,indent=2)+'\n')
    (STAGE/'native-runtime.json').write_text(json.dumps(record,indent=2)+'\n')
    print(json.dumps(record))

if __name__=='__main__':main()
