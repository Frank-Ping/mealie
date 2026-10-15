"""Verify report links, manifests, accounting partitions and documentation-only commit."""
import hashlib,json,os,re,subprocess,sys
from pathlib import Path
from finish_s7 import E,S,V,D,T,write,now,sha,git
from collect_usage import manifest

def validate_links():
 bad=[];checked=0
 for p in [E/'WF6-RESULTS.md',E/'WF6-REPORT-MATERIAL.md',E/'EVIDENCE_INDEX.md',T/'result.md',D/'WF6-RESULTS.md',D/'WF6-REPORT-MATERIAL.md',D/'EVIDENCE_INDEX.md']:
  for link in re.findall(r'\]\(([^)]+)\)',p.read_text()):
   if re.match(r'https?://',link):continue
   checked+=1
   if not (p.parent/link.split('#')[0]).exists():bad.append(dict(file=str(p),link=link))
 assert not bad,bad
 return checked

def snapshot():
 state={'timestamp':now(),'scope':'S7 documentation audit only; actual accepted application/build remains S6 C3; no new service started.','served_build':json.loads((E/'steps/S6/continuation-03/served-build.json').read_text())};inventory={}
 for role,repo in [('source',S),('evaluator',V)]:
  rows=[]
  for name in git(repo,'ls-files').splitlines():
   p=repo/name
   if p.is_file():rows.append(dict(path=name,sha256=sha(p),bytes=len(os.readlink(p).encode()) if p.is_symlink() else p.stat().st_size,symlink=p.is_symlink()))
  inventory[role]=rows;state[role]=dict(head=git(repo,'rev-parse','HEAD'),status=git(repo,'status','--porcelain=v1'),untracked=git(repo,'ls-files','--others','--exclude-standard').splitlines(),remotes=git(repo,'remote','-v'))
 write(T/'source-state.json',state);write(T/'file-manifest.json',inventory)
 (T/'diff.patch').write_text(git(S,'diff','--binary','06569c09ec71e75d4ecf066f0b3b5aada4da1728','HEAD')+'\n'+git(S,'diff','--binary','HEAD')+'\n')
 return state

checked=validate_links()
state=snapshot()
if '--postcommit' in sys.argv:
 head=state['source']['head'];files=git(S,'diff-tree','--no-commit-id','--name-only','-r',head).splitlines();assert sorted(files)==sorted(['rewrite-evidence/workflows/WF6/'+x for x in ['WF6-RESULTS.md','WF6-REPORT-MATERIAL.md','EVIDENCE_INDEX.md']]);assert not state['source']['status'] and not state['evaluator']['status'];state['report_commit']=head;write(T/'source-state.json',state)
 manifest(E)
 m=json.loads((E/'evidence-manifest.json').read_text());assert not m['self_included'];assert all(Path(r['path']).name!='evidence-manifest.json' for r in m['files'])
 bad=[r['path'] for r in m['files'] if sha(E/r['path'])!=r['sha256']];assert not bad,bad
 write(T/'manifest-validation.json',dict(timestamp=now(),verified_files=len(m['files']),mismatches=bad,self_included=False,report_links_checked=checked,note='Validation record and the containing recorder command require final manifest regeneration; external finalize regenerates after final usage.'))
print(json.dumps(dict(report_links_checked=checked,source_state=state),ensure_ascii=False))
