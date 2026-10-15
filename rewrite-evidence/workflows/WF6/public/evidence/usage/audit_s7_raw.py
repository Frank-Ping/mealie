"""Corroborate summaries directly against original Playwright JSON and trace network."""
import json,zipfile
from pathlib import Path
from urllib.parse import urlsplit
from finish_s7 import E,T,write,now,sha
reports=[]
for path,passed,failed in [('steps/S1/browser-native/results.json',82,0),('steps/S6/browser/restored-frozen-results.json',78,4),('steps/S6/continuation-03/browser/restored-frozen-results.json',82,0)]:
 d=json.loads((E/path).read_text());assert d['stats']['expected']==passed and d['stats']['unexpected']==failed and d['stats']['skipped']==0 and d['stats']['flaky']==0 and not d['errors'];reports.append(dict(path=path,sha256=sha(E/path),stats=d['stats']))
proof=json.loads((E/'steps/S6/continuation-03/browser/persistence-redacted.jsonl').read_text().splitlines()[-1]);assert proof['sameServerRecordAfterRefresh']
trace=next((E/'steps/S6/continuation-03/browser/persistence-test-results').glob('**/trace.zip'));z=zipfile.ZipFile(trace);events=[]
for name in z.namelist():
 if not name.endswith('.network'):continue
 for line in z.read(name).splitlines():
  r=json.loads(line).get('snapshot',{});request=r.get('request',{});response=r.get('response',{});path=urlsplit(request.get('url','')).path
  if path=='/api/comments' or path.endswith('/comments'):
   content=response.get('content',{});resource=content.get('_file') or ('resources/'+content['_sha1'] if content.get('_sha1') else None);body=None
   if resource and resource in z.namelist():
    try:body=json.loads(z.read(resource))
    except (ValueError,UnicodeDecodeError):pass
   records=body if isinstance(body,list) else [body] if isinstance(body,dict) else []
   same=any(x.get('id')==proof['commentId'] and x.get('recipeId')==proof['recipeId'] and x.get('text')==proof['text'] for x in records)
   events.append(dict(network_member=name,started_utc=r.get('startedDateTime'),method=request.get('method'),path=path,status=response.get('status'),body_resource=resource,same_comment_id_recipe_text=same))
assert any(x['method']=='POST' and x['status']==201 and x['same_comment_id_recipe_text'] for x in events),events
assert any(x['method']=='GET' and x['status']==200 and x['same_comment_id_recipe_text'] for x in events),events
write(T/'raw-test-trace-audit.json',dict(timestamp=now(),raw_reports=reports,trace_path=str(trace.relative_to(E)),trace_sha256=sha(trace),comment_network=events,redaction='Only method/path/status/body-resource ID and boolean same-record result; no cookie/bearer/password. Raw trace is unchanged.'))
print(json.dumps(dict(raw_reports=reports,comment_network=events)))
