"""Report rollback independently from the unchanged full regression and preserve all scope gaps."""
import csv,datetime as dt,hashlib,json,zipfile
from pathlib import Path
from record_command import ROOT,EVIDENCE
from run_s1 import SOURCE,EVALUATOR
from summarize_s1_browser import summarize
import finish_s2
STAGE=EVIDENCE/'steps/S6'
def write(path,data):path.write_text(json.dumps(data,indent=2)+'\n')
def main():
    browser=STAGE/'browser';builds=json.loads((STAGE/'build-artifacts.json').read_text());states=json.loads((STAGE/'switch-states.json').read_text());repairs=json.loads((STAGE/'repair-budget.json').read_text());closure=json.loads((STAGE/'S5-settlement.json').read_text())
    assert closure['status']=='exact_reported' and closure['final_reply_included'] and json.loads((EVIDENCE/'steps/S5/repair-budget.json').read_text())['used']==2
    rollback=summarize(browser/'rollback-frozen-results.json');full=summarize(browser/'restored-frozen-results.json');assert full['gate_checks']['inventory'] and full['gate_checks']['routes_66'] and full['gate_checks']['flows_15'] and full['gate_checks']['guard_1']
    supplement={phase:json.loads((browser/(phase+'-supplemental.json')).read_text())['stats'] for phase in ['rollback','restored']}
    for phase,n in [('rollback',1),('restored',4)]:assert supplement[phase]['expected']==n and supplement[phase]['unexpected']==0 and supplement[phase]['skipped']==0 and supplement[phase]['flaky']==0
    assert rollback['stats']['expected']==4 and rollback['stats']['unexpected']==0
    assert states[0]['phase']=='rollback' and states[0]['map']['takeoverEnabled'] is False and states[1]['phase']=='restored' and states[1]['map']['takeoverEnabled'] is True
    assert states[0]['backend_pid']==states[1]['backend_pid'] and states[0]['backend_data_dir']==states[1]['backend_data_dir']
    assert json.loads((STAGE/'rollback-seeded-identities.json').read_text())==json.loads((STAGE/'restored-seeded-identities.json').read_text())
    for record in builds['react_source_files']:assert hashlib.sha256((SOURCE/record['path']).read_bytes()).hexdigest()==record['sha256']
    runtime=Path('/tmp/wf6-rerun-20261014-01-S6')
    for role in ['vue','react']:
        for record in builds[role]['files']:assert hashlib.sha256((runtime/role/record['path']).read_bytes()).hexdigest()==record['sha256']
    (STAGE/'build-artifact.json').write_text(json.dumps(builds['vue'],indent=2)+'\n');finish_s2.STAGE=STAGE;finish_s2.snapshot()
    write(STAGE/'full-regression-summary.json',full);write(STAGE/'rollback-regression-summary.json',rollback)
    errors={}
    def visit(suite):
        for spec in suite.get('specs',[]):
            for test in spec.get('tests',[]):
                if test['status']=='unexpected':errors[spec['title']]=[e.get('message','') for r in test.get('results',[]) for e in r.get('errors',[])]
        for child in suite.get('suites',[]):visit(child)
    for suite in json.loads((browser/'restored-frozen-results.json').read_text())['suites']:visit(suite)
    expected_scope={
        '[flow] log out ends the session':('scope_gap','React pilot has no Logout control/full Vue layout; original flow requests Logout on React list.'),
        '[flow] a regular member is not offered admin pages':('scope_gap','React pilot has no Settings menu/household navigation expected by original flow.'),
        '[flow] an admin is offered admin pages':('scope_gap','React pilot has no Settings menu/admin navigation expected by original flow.'),
        '[flow] comment on a recipe and see it after reload':('scope_gap','Configured detail is React read-only; original comment textbox/Submit is absent. Comments remain accessible through explicit Vue entry, not on React pilot.')}
    failures=[]
    for case in full['cases']:
        if case['status']=='unexpected':
            classification,reason=expected_scope.get(case['title'],('unknown','Cause not established; inspect retained original errors/trace.'))
            failures.append(dict(**case,classification=classification,reason=reason,raw_errors=errors[case['title']],scope_repair_performed=False))
    provenance=[]
    for trace in (browser/'restored-frozen-test-results').rglob('trace.zip'):
        documents=[]
        with zipfile.ZipFile(trace) as archive:
            for name in archive.namelist():
                if name.endswith('.network'):
                    for raw in archive.read(name).splitlines():
                        snap=json.loads(raw).get('snapshot',{});response=snap.get('response',{});headers={h['name'].lower():h['value'] for h in response.get('headers',[])}
                        if snap.get('_resourceType')=='document':documents.append(dict(url=snap.get('request',{}).get('url'),status=response.get('status'),owner=headers.get('x-wf6-frontend'),build=headers.get('x-wf6-build')))
        context=(trace.parent/'error-context.md').read_text() if (trace.parent/'error-context.md').exists() else ''
        provenance.append(dict(trace=str(trace.relative_to(STAGE)),documents=documents,visible_error_context_available=bool(context),credential_fields_exported=False))
    write(STAGE/'failure-provenance-redacted.json',dict(rows=provenance,policy='Only document resource type, URL/status/framework/build; cookies/bearer/response bodies excluded. Original traces untouched.'))
    write(STAGE/'failure-classification.json',dict(failures=failures,policy='Original failures remain FAIL; scope gaps are not excused as PASS or repaired by expanding business scope. Unknown causes are not guessed.'))
    ownership=json.loads((browser/'route-ownership.json').read_text());case_by_title={c['title']:c for c in full['cases']};headers=['file','requested_url','rollback_initial_owner','restored_initial_owner','runtime_transition','frozen_strict_result','vue_build_hash','react_build_hash','scope_note']
    with (STAGE/'route-ownership.csv').open('w',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=headers);writer.writeheader()
        for row in ownership['rows']:
            case=case_by_title['[route] '+row['file']];writer.writerow(dict(file=row['file'],requested_url=row['url'],rollback_initial_owner='vue (disabled shared predicate; selected URLs/browser observed)',restored_initial_owner=row['frontend'],runtime_transition='Vue document redirects to React list; mixed' if row['file']=='index.vue' else 'React pilot' if row['frontend']=='react' else 'Vue retained; final runtime not individually traced on success',frozen_strict_result=case['actual_statuses'][0],vue_build_hash=builds['vue']['build_hash'],react_build_hash=builds['react']['build_hash'],scope_note=row['scope']))
    react_titles={'[flow] open a recipe from the recipe list','[flow] search narrows the recipe list','[flow] comment on a recipe and see it after reload'}
    mixed_titles={'[flow] log in with valid credentials and land on the recipe list','[flow] log out ends the session','[flow] a regular member is not offered admin pages','[flow] an admin is offered admin pages','[flow] create a recipe by name'}
    flow_inventory=[]
    for case in full['cases']:
        if case['category']=='flows':flow_inventory.append(dict(title=case['title'],owner='React' if case['title'] in react_titles else 'Mixed' if case['title'] in mixed_titles else 'Vue',result=case['actual_statuses'][0],classification=expected_scope[case['title']][0] if case['title'] in expected_scope else 'Original frozen business assertion',attribution_basis='Frozen flow source paths and measured route ownership; failure transitions backed by original trace'))
    with (STAGE/'flow-attribution.csv').open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=['title','owner','result','classification','attribution_basis']);w.writeheader();w.writerows(flow_inventory)
    attributed={role:dict(total=sum(r['owner']==role for r in flow_inventory),passed=sum(r['owner']==role and r['result']=='passed' for r in flow_inventory),failed=sum(r['owner']==role and r['result']!='passed' for r in flow_inventory)) for role in ['React','Vue','Mixed']}
    write(STAGE/'attribution-summary.json',dict(flows=attributed,requested_document_owners={'Vue':64,'React':2},mixed_root_index=True,policy='Vue and mixed successes are not React migration scores. Flow classification uses actual original paths and ownership.'))
    feature_rows=[('own-group list/server search','React','PASS frozen open/search + supplement','Read-only configured group'),('read-only detail fields','React','PASS frozen detail + supplement','Name/ingredients/steps/tools/categories/tags'),('login and invalid password','Vue / mixed','See full regression and rollback','Vue login enters React when enabled'),('shopping lists','Vue','See frozen shopping flows / rollback','Vue business; not migrated'),('create recipe','Vue then React detail/list','See frozen create flow','Write UI remains Vue; read-only result can enter React'),('Logout/Settings from React list','Missing React layout navigation','FAIL if original flow requires these controls','Explicit Vue entry exists but does not satisfy original assertions'),('comments at target detail URL','Not migrated on React','FAIL original comment flow if control absent','Explicit Vue can provide comments; no silent fallback'),('edit/parse/cook','Vue retained','Routing ownership from S5; full mode business not measured','No expansion'),('anonymous/other group','Vue required or Vue-owned','S5 real 401/group guards; not all public parity','No wrong-group recipe read'),('full system/production/long-lived auth','Unverified','not_provided','No production readiness'),('React multi-page pagination','React UI present','not_executed multi-page browser','Existing limitation'),('coverage/cost/human review','Unavailable this stage','not_provided','Not filled with zero')]
    with (STAGE/'feature-inventory.csv').open('w',newline='') as f:
        writer=csv.writer(f);writer.writerow(['feature','owner_or_status','measured_result','limitation']);writer.writerows(feature_rows)
    baseline=json.loads((EVIDENCE/'steps/S1/baseline-measurements.json').read_text());inventory=[]
    for phase in ['rollback','restored']:
        for role in ['vue','react']:
            inventory.append(dict(phase=phase,frontend=role,active_pages=role=='vue' or phase=='restored',build_status='PASS',build=builds[role]['build_hash'],types='S6 strict PASS' if role=='react' else 'S1 318 FAIL retained; whole checker not rerun S6',lint='S6 full React PASS' if role=='react' else 'S6 boundary middleware targeted PASS; whole Vue lint not rerun',units='S6 business 8/8' if role=='react' else 'S1 517/517 retained; not new S6 unit measurement',coverage=None))
    write(STAGE/'static-test-inventory.json',dict(states=inventory,route_policy='S6 34/34',Vue_baseline_lint=baseline['lint'],Vue_baseline_unit=baseline['unit'],warning='Historical baseline values are clearly dated; no new whole-Vue static success claimed.'))
    manifests=[]
    for file in sorted(browser.rglob('*')):
        if file.is_file():manifests.append(dict(path=str(file.relative_to(STAGE)),bytes=file.stat().st_size,sha256=hashlib.sha256(file.read_bytes()).hexdigest()))
    write(STAGE/'browser-manifest.json',dict(private_raw=True,original_bytes_preserved=True,files=manifests))
    gate='PASS' if full['gate_checks']['all_passed'] else 'FAIL';metrics=dict(stage='S6',gate=gate,rollback_gate='PASS',restored_ownership_gate='PASS',full_frozen_gate='PASS' if full['gate_checks']['all_passed'] else 'FAIL',full_counts=full['categories'],supplemental=supplement,repairs=repairs,source_at_acceptance=states[1]['source_commit'],builds={k:builds[k]['build_hash'] for k in ['vue','react']},failures=failures,coverage=None,cost=None,human_review_time=None)
    write(STAGE/'measurements.json',metrics)
    counts=full['categories'];failure_text='\n'.join('- `'+x['title']+'`: **FAIL**, '+x['classification']+'. '+x['reason'] for x in failures) or '- None.'
    text=f'''# S6 rollback and full regression / 回退与全量回归

Overall S6 gate **{gate}**. Explicit all-Vue rollback **PASS**; restored React ownership **PASS**; complete frozen regression **{metrics['full_frozen_gate']}**. S6 source/harness repair rounds **{repairs['used']}/2**, separate from preserved S5 **2/2**. No S7 executed.
S6 总 gate **{gate}**；显式全 Vue 回退通过、恢复 React 归属通过；完整冻结回归 **{metrics['full_frozen_gate']}**。S6 独立修复额度 {repairs['used']}/2，S5 2/2 及失败全部保留；未执行 S7。

## Approach → What happened → Why → What we would change

Use the same fresh S6 backend process/SQLite and comparable original seeded identities with new independent browser contexts. Build both frontends successfully first, then select an external explicit disabled route map; restart only the owned gateway to apply it. The rollback checks run real Vue login → list/search → detail → shopping list → return/refresh. Actual Nuxt DOM is visible, React DOM absent, all observed documents identify Vue, and a bounded document count detects loops in the measured path. Supplemental rollback **1/1**, original frozen list/detail/open/search selection **4/4**. Rollback is targeted evidence, not a second complete 82-test run.
同一 S6 隔离后端/SQLite/种子身份，context 独立；先构建再显式关闭配置、重启 owned 网关。真实 Vue 路径、查询参数/hash、刷新与返回通过，Nuxt 运行、React 不运行；补充 1/1、冻结只读选择 4/4。回退没有宣称另一次全量 82 项。

Restore the exact source route map through the gateway's supported WF6_ROUTE_MAP input and restart the owned gateway; original source map never changed. Restored supplemental **4/4** proves React real business/keyboard/direct-refresh, Vue round trip, API states and all 66 requested document ownership responses. Requested document owners are **64 Vue / 2 React**; the root index begins at Vue and redirects to the React list, so route ownership includes a mixed-transition annotation. This response inventory supplements original business assertions; it does not prove 64 independent final Vue runtimes or 66 migrated React pages.
恢复原 map，源码开关文件未改；补充 4/4 验证 React/混合/状态及所有路由请求归属。初始文档 64 Vue/2 React，根 index 是 Vue→React 混合跳转，CSV 明确标注；归属不替代业务断言，也不计 66 React 页。

Run the unchanged entire evaluator at all/strict, one worker, retries 0, no grep/skip/assertion edits. Inventory asserts exactly 66 route cases + 15 flow cases + 1 guard before execution. Actual **routes {counts['routes']['passed']}/66 PASS, {counts['routes']['failed']} FAIL; flows {counts['flows']['passed']}/15 PASS, {counts['flows']['failed']} FAIL; guard {counts['guard']['passed']}/1 PASS**. All category skip/flaky counts and runner errors are in full-regression-summary.json. Original exit code and failures remain unchanged; hybrid scores are not a React whole-system migration score.
原冻结 suite all/strict、单 worker、零重试；库存先核实 66+15+1，未 grep/跳过/改断言。实际 routes {counts['routes']['passed']}/66、flows {counts['flows']['passed']}/15、guard {counts['guard']['passed']}/1；失败、退出码、skip/flaky 均保留。混合成绩不代表 React 全站迁移。

### Retained failures / 保留失败

{failure_text}

Known missing controls are pilot/layout scope gaps, while their full-suite results remain FAIL. They are not expected-failure injection and are not marked PASS. No write feature or full layout is added to make this step green. Unknown additional failures stay unknown pending evidence. We would plan full navigation/logout parity and an explicit route policy for comment workflows before expanding the migration; changing original assertions or silently routing these tests to Vue would invalidate the yardstick. Current explicit Vue entry is useful but does not make original React-URL expectations pass.
已知缺少控件归类为 pilot/layout 范围缺失，但冻结成绩仍 FAIL，不能与 S5 预期故障注入混淆。未扩展写功能/布局、未改断言或静默回 Vue；后续需要明确导航/退出及评论范围策略。显式 Vue 入口存在不等于原测试已经通过。

Accepted application source `{states[1]['source_commit']}`; React build `{builds['react']['build_hash']}`, compiled React source `{builds['react']['source_hash']}`, Vue build `{builds['vue']['build_hash']}`. Switch configs, SHA256 and actual service states are preserved. All original Vue/backend/evaluator manifest bytes unchanged; postcommit audit will establish the evidence-only S6 acceptance commit. Both frontends' build/types/lint/unit inventories are listed separately for both states. React strict/lint 8/8 units and policy 34/34 passed S6; Vue boundary lint passed, whole Vue units/lint/typecheck were not rerun as new S6 measurements. S1 **318 diagnostics FAIL** and historical 315 comparison retained.
实际源码与两套 build/React source hash、配置和服务状态均保存；冻结原 Vue/后端/evaluator 字节不变。两种状态分别列静态库存；Vue 全量静态没有重测冒充通过，S1 类型 FAIL 与历史差异保留。

S5 final usage is exact_reported with final_reply_included=true, total **{closure['total_tokens']}**. S1 remains partial with unknown interruption completeness/gap and no zero fill. Three-hour budget includes this step's execution/tool waits and preserves closed earlier tails; between-user-turn pauses are excluded and review duration is not inferred. Before final reply S6 usage and budget tail remain provisional. Coverage, monetary cost and human review time are not provided. Backend/data/auth/contexts/output are independent of previous steps; both switch states share this S6 backend only. Owned services are stopped; original private logs/traces and separate redacted summaries are retained. No upstream remotes/PRs or other workflows/report files were modified.
S5 最终回复封账；S1 partial/未知缺口不补零。预算延续，不重置，人工等待另列；回复前 S6 用量/尾部暂存。coverage/费用/review 未提供；仅同一 S6 两状态共享隔离后端，旧记录保留。

## Evidence / 证据

- [Request](request-boundary.json), [S5 settlement](S5-settlement.json), [S5 retained repairs](S5-repairs-retained.json), [S6 repairs](repair-budget.json)
- [Rollback config](route-map-rollback.json), [Restored config](route-map-restored.json), [Actual switch states](switch-states.json)
- [Rollback real browser](browser/rollback-supplemental.json), [Rollback frozen selection](rollback-regression-summary.json), [Rollback requests](browser/rollback-requests-redacted.json)
- [Restored browser](browser/restored-supplemental.json), [Full strict result](full-regression-summary.json), [Raw original full JSON](browser/restored-frozen-results.json), [Failure classification](failure-classification.json), [Failure document provenance](failure-provenance-redacted.json)
- [Route ownership](route-ownership.csv), [Feature inventory](feature-inventory.csv), [Flow attribution](flow-attribution.csv), [Attribution summary](attribution-summary.json), [Static inventory](static-test-inventory.json)
- [Builds](build-artifacts.json), [Actual service/source hashes](served-build.json), [Runtime isolation](runtime-isolation.json), [Raw traces/screenshots](browser-manifest.json)
- [Commands/logs](commands.jsonl), [Attempts](attempts.jsonl), [Source state](source-state.json), [Diff](diff.patch), [File hashes](file-manifest.json)
- [Usage](token-usage.json), [Budget](../../experiment-budget.json), [Visible transcript coverage](transcript-coverage.json)

Stop after S6; await separate S7 authorization. / S6 后停止，等待单独 S7 授权。
'''
    (STAGE/'result.md').write_text(text)
    (SOURCE/'rewrite-evidence/workflows/WF6/S6-RESULT.md').write_text(f'# S6 rollback/full regression / 回退与全量回归\n\nGate {gate}. Explicit all-Vue rollback PASS (real journey 1/1, frozen selection 4/4), restored React ownership PASS (4/4 supplemental). Full unchanged strict suite routes {counts["routes"]["passed"]}/66, flows {counts["flows"]["passed"]}/15, guard {counts["guard"]["passed"]}/1.\n回退与恢复归属通过；全量冻结失败如实保留，不算 React 全站迁移。\n\nS6 repairs {repairs["used"]}/2; S5 2/2 preserved. No business expansion/assertion changes. S1 partial and 318 diagnostics FAIL retained.\nS6 独立额度、旧失败保留，S1 缺口/类型 FAIL 不改。\n\n[Full bilingual result and raw evidence](../../../../wf6-evidence/steps/S6/result.md)\n\nStop after S6; no S7. Usage and final reply pending external reconciliation.\n停止，未执行 S7；最终回复待核实。\n')
    (EVIDENCE/'PROGRESS.md').write_text(f'# WF6 progress / 进度\n\nS0-S5 gates PASS. S6 rollback/restored ownership PASS; full frozen regression {metrics["full_frozen_gate"]}; overall {gate}. S5 final usage exact_reported; S6 provisional.\nS6 回退/恢复归属通过，全回归如实保留。\n\nS1 partial/unknown interruption gap and 318 type diagnostics FAIL preserved. S5 repairs 2/2; S6 {repairs["used"]}/2. S7 not executed; stop awaiting separate authorization.\nS1/S5 失败及额度保留；未执行 S7。\n\n[Result](steps/S6/result.md) · [Budget](experiment-budget.json) · [Usage](usage/USAGE.md)\n')
    index=EVIDENCE/'EVIDENCE_INDEX.md';index.write_text(index.read_text()+'\n- S6 explicit rollback/full regression: [result](steps/S6/result.md), [strict summary](steps/S6/full-regression-summary.json), [failures](steps/S6/failure-classification.json), [ownership](steps/S6/route-ownership.csv).\n')
    with (STAGE/'attempts.jsonl').open('a') as f:
        for failure in failures:f.write(json.dumps(dict(timestamp=dt.datetime.now(dt.timezone.utc).isoformat(),kind='full_frozen_failure',**failure))+'\n')
        f.write(json.dumps(dict(timestamp=dt.datetime.now(dt.timezone.utc).isoformat(),kind='stage_outcome',gate=gate,rollback='PASS',restored_ownership='PASS',full_regression=metrics['full_frozen_gate'],repairs=repairs['used']))+'\n')
    print(json.dumps(dict(gate=gate,counts=counts,failures=[x['title'] for x in failures],repairs=repairs['used'])))
if __name__=='__main__':main()
