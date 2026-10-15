"""Capture only the accepted S6 implementation commit and clean final source states."""
import datetime as dt
import hashlib
import json
from pathlib import Path
from finish_s2 import SOURCE,EVALUATOR,EVIDENCE,git,write
from finish_s6_c1 import STAGE

state_path=STAGE/'source-state.json';(STAGE/'source-state-before-commit.json').write_bytes(state_path.read_bytes())
state=json.loads(state_path.read_text());head=git(SOURCE,'rev-parse','HEAD')
expected=['rewrite-evidence/workflows/WF6/S6-C1-RESULT.md']
changed=git(SOURCE,'diff-tree','--no-commit-id','--name-only','-r',head).splitlines();assert sorted(changed)==sorted(expected)
served=json.loads((STAGE/'served-build.json').read_text())
assert hashlib.sha256((SOURCE/'wf6/gateway.mjs').read_bytes()).hexdigest()==served['gateway_sha256']
assert hashlib.sha256((SOURCE/'wf6/route-map.json').read_bytes()).hexdigest()==served['route_map_sha256']
assert hashlib.sha256((SOURCE/'wf6/route-policy.mjs').read_bytes()).hexdigest()==served['route_policy_sha256']
for record in json.loads((STAGE/'build-artifacts.json').read_text())['react_source_files']:
    assert hashlib.sha256((SOURCE/record['path']).read_bytes()).hexdigest()==record['sha256'], record['path']
for role,repo in [('source',SOURCE),('evaluator',EVALUATOR)]:
    status=git(repo,'status','--porcelain=v1');assert not status
    state[role].update(actual_head=git(repo,'rev-parse','HEAD'),dirty=False,status_porcelain=status,untracked=[])
state.update(postcommit_utc=dt.datetime.now(dt.timezone.utc).isoformat(),acceptance_commit=head,
    build_policy='Both frontend build/source hashes remain their tested identities. All React source and gateway/map/policy byte hashes match the accepted commit.')
write(state_path,state)
manifest=json.loads((STAGE/'file-manifest.json').read_text());records={r['path']:r for r in manifest['source']}
for name in expected:
    content=(SOURCE/name).read_bytes();records[name]=dict(path=name,bytes=len(content),sha256=hashlib.sha256(content).hexdigest(),symlink=False)
manifest['source']=[records[k] for k in sorted(records)];manifest['postcommit_utc']=state['postcommit_utc'];write(STAGE/'file-manifest.json',manifest)
(STAGE/'diff-before-commit.patch').write_bytes((STAGE/'diff.patch').read_bytes())
(STAGE/'diff.patch').write_text('# Source tracked changes since pinned Vue input\n'+git(SOURCE,'diff','--binary',state['source']['pinned_input_sha'],'HEAD')+'\n# Final working source/evaluator diffs are empty.\n')
result=STAGE/'result.md';text=result.read_text().split('<!-- WF6-USAGE -->')[0].rstrip();result.write_text(text+f'\n\nAcceptance commit / 验收提交: `{head}` (`[WF6-S6]`). Gateway/map byte hashes match browser-tested inputs. Both checkouts clean; Vue/backend/evaluator frozen bytes unchanged.\n')
with (EVIDENCE/'decisions.jsonl').open('a') as f:f.write(json.dumps(dict(timestamp=state['postcommit_utc'],actor='agent',stage_id='S6',decision='S6 continuation: four original trace audits and existing explicit Vue functions 4/4 PASS; original four frozen FAIL retained. No application/evaluator change or source repair; S6 0/2, S5 2/2. Disjoint usage segments; stop, no S7.',commit=head))+'\n')
print(json.dumps(dict(commit=head,source_clean=True,evaluator_clean=True,committed_files=expected)))

# Current top-level snapshot follows the accepted continuation; prior snapshots remain archived.
import shutil
for name in ['source-state.json','file-manifest.json','diff.patch']:
    shutil.copy2(STAGE/name,STAGE.parent/name)
parent_result=STAGE.parent/'result.md'
body=parent_result.read_text().split('<!-- WF6-USAGE -->')[0].rstrip()
parent_result.write_text(body+f'\n\nLatest continuation acceptance commit / 续跑验收提交: `{head}` (`[WF6-S6]`); application bytes unchanged.\n')
