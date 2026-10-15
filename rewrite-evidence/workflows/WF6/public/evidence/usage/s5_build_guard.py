"""Reject a failed build attempt even when an earlier dist remains on disk."""
import hashlib,json
from pathlib import Path
from record_command import ROOT,EVIDENCE,run
from run_s1 import SOURCE,environment
RUNTIME=Path('/tmp/wf6-rerun-20261014-01-S5');STAGE=EVIDENCE/'steps/S5'
def allowed(artifact,attempt):
    return artifact.get('exit_code')==0 and artifact.get('browser_acceptance_allowed') is True and attempt.get('exit_code')==0 and artifact.get('command_id')==attempt.get('command_id')
def main():
    artifact=json.loads((STAGE/'build-artifacts.json').read_text())['react'];entries=[json.loads(l) for l in (STAGE/'commands.jsonl').read_text().splitlines()];good=next(r for r in entries if r['command_id']==artifact['command_id']);assert allowed(artifact,good)
    dist=SOURCE/'frontend-react-wf6/dist';before={str(p.relative_to(dist)):hashlib.sha256(p.read_bytes()).hexdigest() for p in dist.rglob('*') if p.is_file()}
    bad=RUNTIME/'tests/intentional-invalid-vite.config.mjs';bad.write_text('export default { WF6_EXPECTED_SYNTAX_FAILURE: ; };\n')
    attempt=run(['node',str(SOURCE/'frontend-react-wf6/node_modules/vite/bin/vite.js'),'build','--config',str(bad)],SOURCE/'frontend-react-wf6','S5-expected-failure-stale-build-guard',stage='S5',env=environment())
    assert attempt['exit_code']!=0;assert not allowed(artifact,attempt)
    after={str(p.relative_to(dist)):hashlib.sha256(p.read_bytes()).hexdigest() for p in dist.rglob('*') if p.is_file()};assert before==after
    result=dict(status='PASS',classification='expected_failure',failure_command=attempt['command_id'],actual_failure_exit_code=attempt['exit_code'],old_dist_remained=True,old_dist_accepted_for_failed_attempt=False,accepted_success_build=good['command_id'],scope='Isolated invalid temporary config; S5 acceptance guard; not a product source failure or a source repair round')
    (STAGE/'stale-build-negative.json').write_text(json.dumps(result,indent=2)+'\n')
    with (STAGE/'attempts.jsonl').open('a') as f:f.write(json.dumps(result)+'\n')
    print(json.dumps(result))
if __name__=='__main__':main()
