"""Capture final authorized round results; preserve all prior exhausted FAIL evidence."""
import csv,datetime as dt,hashlib,json,subprocess
from pathlib import Path
from record_command import ROOT,EVIDENCE
from run_s1 import SOURCE,EVALUATOR
from summarize_s1_browser import summarize
import audit_s6_c3
STAGE=EVIDENCE/'steps/S6/continuation-03'
def write(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def stats(name):
    f=STAGE/'browser'/name
    return json.loads(f.read_text())['stats'] if f.exists() else None
def good(value,n):return bool(value and value['expected']==n and value['unexpected']==0 and value['skipped']==0 and value['flaky']==0)
def main():
    builds=json.loads((STAGE/'build-artifacts.json').read_text());runtime=Path('/tmp/wf6-rerun-20261014-01-S6-C3');browser=STAGE/'browser'
    for r in builds['react_source_files']:assert hashlib.sha256((SOURCE/r['path']).read_bytes()).hexdigest()==r['sha256']
    for role in ['vue','react']:
        for r in builds[role]['files']:assert hashlib.sha256((runtime/role/r['path']).read_bytes()).hexdigest()==r['sha256']
    write(STAGE/'build-artifact.json',builds['vue']);audit_s6_c3.snapshot()
    comment=stats('comment-original-results.json');persistence=stats('persistence-results.json');four=stats('four-original-results.json');supp=stats('restored-supplemental.json');rollback=stats('rollback-supplemental.json');rb4=stats('rollback-frozen-results.json')
    full=summarize(browser/'restored-frozen-results.json') if (browser/'restored-frozen-results.json').exists() else None
    gate='PASS' if good(comment,1) and good(persistence,1) and good(four,4) and good(supp,4) and good(rollback,1) and good(rb4,4) and full and full['gate_checks']['all_passed'] else 'FAIL'
    if full:write(STAGE/'full-regression-summary.json',full)
    proof=[json.loads(l) for l in (browser/'persistence-redacted.jsonl').read_text().splitlines()] if (browser/'persistence-redacted.jsonl').exists() else []
    if good(persistence,1):assert len(proof)==1 and proof[0]['actualPOST']==201 and proof[0]['actualGET']==200 and proof[0]['sameServerRecordAfterRefresh'] and proof[0]['successfulWriteCount']==1
    repairs=json.loads((STAGE.parent/'repair-budget.json').read_text());assert repairs['limit']==3 and repairs['used']==3;repairs['rounds'][-1]['status']='Final gate '+gate+'; no fourth repair';write(STAGE.parent/'repair-budget.json',repairs);write(STAGE/'repair-budget.json',repairs)
    manifests=[]
    for f in sorted(browser.rglob('*')):
        if f.is_file():manifests.append(dict(path=str(f.relative_to(STAGE)),bytes=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
    write(STAGE/'browser-manifest.json',dict(private_raw=True,original_bytes_preserved=True,files=manifests))
    metrics=dict(gate=gate,repair_limit=3,used=3,original_comment=comment,real_persistence=persistence,original_four=four,restored_supplemental=supp,rollback_supplemental=rollback,rollback_selected=rb4,full_counts=full['categories'] if full else None,full_status='measured' if full else 'not_executed',proof=proof,Vue_build_policy=builds['vue'].get('reuse_policy'),React_build=builds['react']['build_hash'],Vue_build=builds['vue']['build_hash'],React_source=builds['react']['source_hash'],source_at_acceptance=subprocess.check_output(['git','-C',str(SOURCE),'rev-parse','HEAD'],text=True).strip(),coverage=None,cost=None,human_review_time=None)
    write(STAGE/'measurements.json',metrics)
    if full:
        by_title={c['title']:c for c in full['cases']};ownership=json.loads((browser/'route-ownership.json').read_text())
        with (STAGE/'route-ownership.csv').open('w',newline='') as f:
            w=csv.writer(f);w.writerow(['route','requested_url','initial_owner','actual_frozen_result','build','limitation'])
            for row in ownership['rows']:w.writerow([row['file'],row['url'],row['frontend'],','.join(by_title['[route] '+row['file']]['actual_statuses']),row['build'],'Root Vue index redirects to React; initial HTTP ownership is separate from business checks'])
    with (STAGE/'feature-inventory.csv').open('w',newline='') as f:
        w=csv.writer(f);w.writerow(['feature','owner','actual_result','limitation']);w.writerows([['List/search/detail','React','See frozen routes/open/search flows','Configured own group only'],['Logout/role Settings navigation','React -> Vue','Original four flow results','Settings/login pages are Vue, not React migration'],['Comment submission/persistence','React',str(persistence),'Only read/create; no edit/delete'],['Vue retained domains','Vue','See rollback/full strict','Not React migration score'],['Coverage/cost/review time','not_provided','not_provided','No zero fill']])
    counts=full['categories'] if full else None;count_text=f"routes {counts['routes']['passed']}/66, flows {counts['flows']['passed']}/15, guard {counts['guard']['passed']}/1" if counts else 'not_executed after prerequisite failure or budget limit'
    proof_text=json.dumps(proof,ensure_ascii=False)
    text=f'''# S6 CONTINUE 03 final authorized comment repair / 评论状态最终单轮修复

Latest S6 gate **{gate}**. User authorized cap **2→3**, exactly one added round; now **3/3 used**. Prior exhausted 2/2, original four FAIL, C2 first GET500 and C2 refresh FAIL remain unchanged. No fourth round or S7.
最新 S6 gate **{gate}**；用户只批准追加一轮，上限 2→3，现 **3/3 已用**。此前用尽/FAIL/trace/提交均保留，不执行第四轮或 S7。

## Approach → What happened → Why → What we would change

Reviewed C2 original trace, remaining-failure-audit and comments.tsx/api.ts. The frozen first text assertion targeted the draft textarea, then reload cancelled pre-POST validation. Only comments.tsx changed: capture the draft snapshot, acquire a synchronous submission lock, clear/hide the input while submitting, append only the actual successful server record to a dedicated published region, restore draft on failure and release the lock. No fixed wait, test recognition, evaluator change or identity/group/disable-policy relaxation. API request semantics and authenticated checks remain unchanged. We would model draft/pending/published states separately from the beginning and require a real POST/GET same-ID proof rather than generic text visibility alone.
核对原 trace 后仅修改评论 UI：捕获草稿、同步锁、提交中清空/收起输入，只有真实服务端返回才进已发布区，失败恢复草稿。未加固定等待/测试识别，未改断言/权限校验。以后应最初就区分三种状态，并以真实 POST/GET 同 ID 为持久化依据。

Strict React TypeScript/lint, 12 business units, 34 route-policy cases and targeted Vue boundary lint passed before browsers. React build is new. Vue application/middleware bytes were unchanged, so the previous successful C2-R2 Vue build was copied with every SHA256 verified; it is explicitly reused, not a new Vue generation or a failed stale dist. Original whole Vue type checking is not rerun: S1 **318 diagnostics FAIL** remains. Source `{metrics['source_at_acceptance']}`, React source `{metrics['React_source']}`, React build `{metrics['React_build']}`, Vue build `{metrics['Vue_build']}`. All served build and source hashes matched; evaluator/backend/original Vue/types/locale manifest bytes remain unchanged except explicit append-only contract authorization documented separately.
先静态和新 React build 通过；Vue 未改，逐文件核实复用上一成功 build，不冒充新 Vue 构建或失败旧 dist。原 Vue 类型 318 FAIL 保留，源码/两套服务哈希均记录。契约追加授权是明确文档例外，原后端/evaluator/类型等未改。

Gate order: original comment **{comment}** → independent live persistence **{persistence}** → original four **{four}** → restored boundary/business/66-ownership supplement **{supp}** → full unchanged all/strict evaluator **{count_text}**. Inventory is 66 routes+15 flows+1 guard, retries0; no skip/assertion weakening. Any missing dependent result is not_executed. Selected repetitions are not added coverage. Full counts/skip/flaky/runner errors retain original JSON.
顺序为原评论→独立真实持久化→原四项→边界/归属→全量严格 suite；实际结果如上，缺失检查 not_executed，重复选择不算新增覆盖。

Actual persistence evidence (credential-free receipt): `{proof_text}`. The supplemental test checks real POST201 recipeId/text/userId/commentId, then reload GET200 contains that exact ID/text/recipe/user in the server array and the published region. It also injects a separately labelled POST500 to prove draft restoration/error and absence from the published region; successful path uses actual backend data and no synthetic success body. A draft or unit fixture is never counted as durability evidence.
持久化以真实 POST201 与刷新 GET200 中同一 ID/text/recipe/user 为证据，并检查已发布区域。单列注入 POST500 检查恢复草稿/错误，成功路径未伪造响应；草稿/单测不计持久化。

Explicit all-Vue rollback supplement **{rollback}**, selected original read-only checks **{rb4}**; takeover restored on the same fresh C3 backend/data, with comparable seeded identities and independent contexts. Modes/create/other-group/explicit Vue and missing assets remain covered by prior measured boundaries and this restored supplemental scope; complete API fault/permission mutation parity is not claimed. Requested document owners remain 64 Vue/2 React, including root Vue→React transition. Settings pages and other retained Vue functions are not React migration scores. Full-system rewrite, comment edit/delete, production/coverage and long-lived OIDC parity remain unverified.
回退与恢复均有各自成绩，使用同一 C3 隔离种子数据，context 独立。Vue 页面成绩不计 React 迁移；不扩展为全系统/生产/完整认证等价。

Prior three S6 final replies are provider-covered. This is fourth disjoint segment, same stage; three-hour budget is unchanged and between-turn waits separately excluded. Original exports are archived, not added again. Current final reply/usage and timing tail are provisional until terminal/next-step reconciliation. S1 partial/unknown interruption gap/318 FAIL and S5 original failures remain. Coverage, cost and review duration: not provided.
前三段最终回复已覆盖，本段为第四个不重叠 segment；预算不重置、停顿另列，旧导出不重复相加。回复前 provisional，S1 缺口/类型 FAIL 与 S5 失败保留。

## Evidence / 证据

- [Actual prompt/boundary](request-boundary.json), [Prior settlement](previous-segments-settlement.json), [Old cap record](prior-repair-budget.json), [Current cap](repair-budget.json), [Trace audit](trace-review.json)
- [Original comment](browser/comment-original-results.json), [Real persistence](browser/persistence-results.json), [POST/GET proof](browser/persistence-redacted.jsonl), [Original four](browser/four-original-results.json)
- [Rollback](browser/rollback-supplemental.json), [Restored supplement](browser/restored-supplemental.json), [Full raw](browser/restored-frozen-results.json), [Full summary](full-regression-summary.json)
- [Fresh React/reused Vue](build-artifacts.json), [Actual served provenance](served-build.json), [Switch states](switch-states.json), [Raw artifacts](browser-manifest.json)
- [Source state](source-state.json), [Hashes](file-manifest.json), [Diff](diff.patch), [Feature inventory](feature-inventory.csv), [All commands](../commands.jsonl), [Usage](../token-usage.json)

Stop S6; no S7. / S6 后停止，不进入 S7。
'''
    if not full:
        text=text.replace('[Full raw](browser/restored-frozen-results.json), [Full summary](full-regression-summary.json)', 'Full regression not_executed; no overall PASS claim')
    (STAGE/'result.md').write_text(text)
    (SOURCE/'rewrite-evidence/workflows/WF6/S6-C3-RESULT.md').write_text(f'# S6 final authorized round / 单轮追加修复\n\nLatest gate {gate}, repair cap 3/3 used. Original comment {comment}; live server persistence {persistence}; original four {four}; full strict {count_text}.\n旧 FAIL 保留，真实持久化以 POST/GET 同记录核实，不能用草稿/单测冒充。\n\nReact new build; Vue verified successful build reused unchanged. No evaluator/backend/schema change or fourth repair. S1 partial/318 type diagnostics FAIL retained; four disjoint S6 segments, current final pending. Stop S6, no S7.\n新 React build 与复用 Vue 如实记录，原缺口保留，停止。\n\n[Full bilingual evidence](../../../../wf6-evidence/steps/S6/continuation-03/result.md)\n')
    prog=EVIDENCE/'PROGRESS.md';prog.write_text(prog.read_text()+f'\nS6 CONTINUE03 latest gate {gate}; comment state repair3/3, [real persistence/full results](steps/S6/continuation-03/result.md); original failures preserved, S1 partial retained, no S7.\n')
    idx=EVIDENCE/'EVIDENCE_INDEX.md';idx.write_text(idx.read_text()+'\n- S6 continuation03 final authorized comment state fix: [result](steps/S6/continuation-03/result.md), [measurements](steps/S6/continuation-03/measurements.json).\n')
    with (STAGE.parent/'attempts.jsonl').open('a') as f:f.write(json.dumps(dict(timestamp=dt.datetime.now(dt.timezone.utc).isoformat(),kind='final_authorized_round',round=3,gate=gate,scope='Comment state separation only',original_failures_preserved=True,no_fourth_round=True))+'\n')
    print(json.dumps(metrics,ensure_ascii=False))
if __name__=='__main__':main()
