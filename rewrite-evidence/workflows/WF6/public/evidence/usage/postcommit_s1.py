"""Capture the docs-only evidence commit without changing accepted build identity."""
import datetime as dt
import json
from finish_s1 import git,write
from run_s1 import SOURCE,EVALUATOR,STAGE,EVIDENCE

path=STAGE/'source-state.json'
(STAGE/'source-state-before-evidence-commit.json').write_bytes(path.read_bytes())
state=json.loads(path.read_text())
head=git(SOURCE,'rev-parse','HEAD')
changed=git(SOURCE,'diff-tree','--no-commit-id','--name-only','-r',head).splitlines()
assert sorted(changed)==['rewrite-evidence/workflows/WF6/BASELINE.md','rewrite-evidence/workflows/WF6/comparison-baseline.json']
for role,repo in [('source',SOURCE),('evaluator',EVALUATOR)]:
    status=git(repo,'status','--porcelain=v1')
    assert not status, role+' checkout is dirty'
    state[role].update(actual_head=git(repo,'rev-parse','HEAD'),dirty=False,status_porcelain=status,untracked=[],remotes=git(repo,'remote','-v').splitlines())
state.update(postcommit_snapshot_utc=dt.datetime.now(dt.timezone.utc).isoformat(),evidence_commit=head,
    evidence_commit_files=changed,build_identity_policy='Accepted build was generated before the docs-only S1 commit; build-artifact source_head remains its actual build source HEAD.')
write(path,state)
(STAGE/'diff.patch').write_text('# Source: tracked changes since pinned input; only S0/S1 evidence documents\n'+git(SOURCE,'diff','--binary',state['source']['pinned_input_sha'],'HEAD')+'\n\n# Source and evaluator working diffs are empty.\n')
result=STAGE/'result.md'
with result.open('a') as file:file.write(f'\nEvidence-only commit / 仅证据提交: `{head}` (`[WF6-S1]`). Both checkouts are clean; all 1711 source and 1789 evaluator original manifest entries match. 实际 build HEAD 保持构建时 SHA，提交仅包含两个 baseline 文档。\n')
with (EVIDENCE/'decisions.jsonl').open('a') as file:file.write(json.dumps(dict(timestamp=state['postcommit_snapshot_utc'],actor='agent',stage_id='S1',decision='S1 PASS from full native2 frozen suite. Preserve mounted failures and interrupted measurement. Stop; S2-S6 budget remains unstarted.',evidence_commit=head))+'\n')
print(json.dumps(dict(evidence_commit=head,changed=changed,source_clean=True,evaluator_clean=True)))
