"""Read the first failed trace; retain observations separately from original evidence."""
import collections
import hashlib
import json
import zipfile
from run_s1 import STAGE

path=STAGE/'browser/test-results/routes-admin-route-admin-vue-routes/trace.zip'
resources=[]
events=collections.Counter()
with zipfile.ZipFile(path) as archive:
    for name in archive.namelist():
        if name.endswith('.network'):
            for line in archive.read(name).splitlines():
                item=json.loads(line)['snapshot']
                resources.append(dict(path=item['request']['url'].split('9006')[-1],status=item['response']['status'],
                    mime_type=item['response'].get('content',{}).get('mimeType'),duration_ms=item.get('time'),timings=item.get('timings')))
        if name.endswith('.trace'):
            for line in archive.read(name).splitlines():
                item=json.loads(line)
                events[item.get('type','unknown')+':'+str(item.get('method',''))]+=1
result=dict(trace=str(path),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),event_counts=dict(events),
    resource_count=len(resources),pending_resources=sum(r['status']==-1 for r in resources),
    resources_over_10_seconds=sum((r['duration_ms'] or 0)>10000 for r in resources),resources=resources,
    interpretation='Observed blank page and unfinished resource requests at the assertion deadline. This trace alone does not prove a source defect or filesystem cause. Native runtime remeasurement preserves all frozen assertions and deadlines.')
(STAGE/'machine/first-trace-observations.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='resources'}))
