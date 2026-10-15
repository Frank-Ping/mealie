"""Audit S2 source and report the measured all-Vue gateway, preserving limitations."""
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import subprocess
from record_command import ROOT,EVIDENCE
from run_s1 import SOURCE,EVALUATOR

STAGE=EVIDENCE/'steps/S6/continuation-02'

def git(repo,*args):return subprocess.check_output(['git','--no-optional-locks','-C',str(repo),*args],text=True).strip()
def write(path,data):path.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
def snapshot():
    original=json.loads((EVIDENCE/'steps/S0/file-manifest.json').read_text());state=dict(snapshot_utc=dt.datetime.now(dt.timezone.utc).isoformat())
    contract='rewrite-evidence/workflows/WF6/WF6-CONTRACT.md'
    previous=subprocess.check_output(['git','-C',str(SOURCE),'show','1d4f20c48d630474906b822c08fc713ec0234de2:'+contract])
    current=(SOURCE/contract).read_bytes();baseline=next(r for r in original['source'] if r['path']==contract)
    assert hashlib.sha256(previous).hexdigest()==baseline['sha256']
    assert current.startswith(previous) and b'S6 CONTINUE 02 explicit scope amendment' in current[len(previous):]
    authorized_document_delta=dict(path=contract,previous_sha256=baseline['sha256'],current_sha256=hashlib.sha256(current).hexdigest(),scope='Explicit user-authorized append-only scope/401 handoff amendment; not application input or evaluator relaxation',authorization='[REDACTED]')
    original['source']=[r for r in original['source'] if r['path']!=contract]
    state['authorized_document_changes']=[authorized_document_delta]
    inventory={};patches=[]
    build=json.loads((STAGE/'build-artifact.json').read_text());served=json.loads((STAGE/'served-build.json').read_text())
    for role,repo,pin in [('source',SOURCE,'4b9ca06b6581f7152e164ea0fd9d4da366975a79'),('evaluator',EVALUATOR,'758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d')]:
        mismatch=[]
        for item in original[role]:
            p=repo/item['path'];content=os.readlink(p).encode() if p.is_symlink() else p.read_bytes() if p.is_file() else None
            if content is None or hashlib.sha256(content).hexdigest()!=item['sha256'] or p.is_symlink()!=item['symlink']:mismatch.append(item['path'])
        assert not mismatch, 'Frozen files changed: '+str(mismatch)
        untracked=git(repo,'ls-files','--others','--exclude-standard').splitlines();status=git(repo,'status','--porcelain=v1')
        state[role]=dict(path=str(repo),pinned_input_sha=pin,actual_head=git(repo,'rev-parse','HEAD'),dirty=bool(status),status_porcelain=status,untracked=untracked,
            remotes=git(repo,'remote','-v').splitlines(),verified_original_file_count=len(original[role]),frozen_file_mismatches=mismatch,served_build_hash=build['build_hash'])
        assert not state[role]['remotes']
        records=[]
        for name in sorted(set(git(repo,'ls-files').splitlines()+untracked)):
            p=repo/name
            if p.is_file():
                content=os.readlink(p).encode() if p.is_symlink() else p.read_bytes();records.append(dict(path=name,bytes=len(content),sha256=hashlib.sha256(content).hexdigest(),symlink=p.is_symlink()))
        inventory[role]=records
        patches.append('# '+role+' tracked changes since pin\n'+git(repo,'diff','--binary',pin,'HEAD')+'\n'+git(repo,'diff','--binary','HEAD'))
        for name in untracked:
            result=subprocess.run(['git','diff','--no-index','--binary','/dev/null',str(repo/name)],capture_output=True,text=True)
            patches.append(result.stdout)
    assert not state['evaluator']['dirty']
    state['served_build']=served
    write(STAGE/'source-state.json',state);write(STAGE/'file-manifest.json',dict(snapshot_utc=state['snapshot_utc'],**inventory));(STAGE/'diff.patch').write_text('\n'.join(patches))
    print('Original Vue/backend/evaluator tracked file hashes match; S2 gateway snapshot captured.')

if __name__=='__main__':snapshot()
