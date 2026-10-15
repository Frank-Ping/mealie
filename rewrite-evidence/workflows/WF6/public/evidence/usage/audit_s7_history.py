"""Check historical Git snapshots and disjoint provider response ownership."""
import hashlib,json,subprocess
from pathlib import Path
from finish_s7 import E,S,V,T,write,now,git
checks=[]
for f in [E/'steps'/f'S{i}' for i in range(7)]+[E/'steps/S6'/f'continuation-0{i}' for i in range(1,4)]:
 state=json.loads((f/'source-state.json').read_text()); inv=json.loads((f/'file-manifest.json').read_text());roles=[]
 for role,repo in [('source',S),('evaluator',V)]:
  r=state.get(role,{});head=r.get('actual_head') or r.get('head') or r.get('actual_sha')
  if not head:
   roles.append(dict(role=role,status='not_provided',reason='Snapshot HEAD schema unavailable; audit does not infer it.'));continue
  tree=subprocess.check_output(['git','-C',str(repo),'ls-tree','-rz','--full-tree',head]);mapping={}
  for line in tree.split(b'\0'):
   if line:
    meta,path=line.split(b'\t');mapping[path.decode()]=meta.split()[2].decode()
  rows=inv[role];ids=list(dict.fromkeys(mapping[x['path']] for x in rows if x['path'] in mapping));raw=subprocess.check_output(['git','-C',str(repo),'cat-file','--batch'],input=('\n'.join(ids)+'\n').encode());pos=0;blobs={}
  for oid in ids:
   end=raw.index(b'\n',pos);header=raw[pos:end].split();size=int(header[2]);body=raw[end+1:end+1+size];pos=end+size+2;blobs[oid]=hashlib.sha256(body).hexdigest()
  mismatch=[x['path'] for x in rows if x['path'] in mapping and blobs[mapping[x['path']]]!=x['sha256']];absent=[x['path'] for x in rows if x['path'] not in mapping]
  roles.append(dict(role=role,head=head,verified_matches=len(rows)-len(mismatch)-len(absent),mismatches=mismatch,not_in_recorded_commit=absent,interpretation='Documentation acceptance updates or implementation files captured before their commit remain explicit differences; original manifest is retained.'))
 checks.append(dict(stage=str(f.relative_to(E)),roles=roles))
l=json.loads((E/'usage/usage-ledger.json').read_text());seen=set();duplicates=[];segments=[]
for stage in l['stages']:
 for s in stage['segments']:
  for response in s['response_ids']:
   if response in seen:duplicates.append(response)
   seen.add(response)
  assert s['usage']['total_tokens']==s['usage']['input_tokens']+s['usage']['output_tokens']
  segments.append(dict(stage=stage['stage_id'],turn=s['turn_id'],start=s['boundary'],end=s['end_event'],final_reply=s['final_reply_included'],response_count=len(s['response_ids'])))
for key in ['preparation','extra_discussion']:
 for response in l[key]['response_ids']:
  if response in seen:duplicates.append(response)
  seen.add(response)
assert not duplicates
write(T/'historical-source-and-accounting-audit.json',dict(timestamp=now(),snapshots=checks,segments=segments,duplicate_response_ids=duplicates,total_distinct_provider_responses=len(seen),coverage='Checks known reported provider responses only; S1 unknown gap is not reconstructed. No inherited legacy/cumulative snapshots added.'))
print(json.dumps(dict(snapshots=checks,duplicate_response_ids=duplicates),ensure_ascii=False))
