"""Summarize actual frozen Playwright machine results without weakening assertions."""
import json
from pathlib import Path
from run_s1 import STAGE

def summarize(path):
    report=json.loads(path.read_text())
    cases=[]
    def visit(suite):
        for spec in suite.get('specs',[]):
            for test in spec.get('tests',[]):
                category='flows' if '/flows/' in '/'+spec.get('file','') else 'routes' if spec.get('title','').startswith('[route]') else 'guard'
                cases.append(dict(category=category,title=spec['title'],file=spec.get('file'),project=test.get('projectName'),
                    status=test['status'],expected_status=test.get('expectedStatus'),
                    actual_statuses=[r.get('status') for r in test.get('results',[])],
                    duration_ms=sum(r.get('duration',0) for r in test.get('results',[])),retries=[r.get('retry') for r in test.get('results',[])]))
        for child in suite.get('suites',[]):visit(child)
    for suite in report.get('suites',[]):visit(suite)
    counts={}
    for category in ('routes','flows','guard'):
        selected=[c for c in cases if c['category']==category]
        counts[category]=dict(total=len(selected),passed=sum(c['status']=='expected' and c['actual_statuses']==['passed'] for c in selected),
            failed=sum(c['status']=='unexpected' for c in selected),skipped=sum(c['status']=='skipped' for c in selected),flaky=sum(c['status']=='flaky' for c in selected))
    return dict(source=str(path),stats=report.get('stats'),categories=counts,cases=cases,
        gate_checks=dict(inventory=len(cases)==82,routes_66=counts['routes']['total']==66,flows_15=counts['flows']['total']==15,guard_1=counts['guard']['total']==1,
            all_passed=all(c['status']=='expected' and c['actual_statuses']==['passed'] and c['retries']==[0] for c in cases) and not report.get('errors')),
        runner_errors=report.get('errors'))

if __name__=='__main__':
    for name in ('browser','browser-native'):
        path=STAGE/name/'results.json'
        if path.exists():
            result=summarize(path)
            (STAGE/'machine'/(name+'-summary.json')).write_text(json.dumps(result,indent=2)+'\n')
            print(json.dumps(dict(attempt=name,stats=result['stats'],categories=result['categories'],gate_checks=result['gate_checks'])))
