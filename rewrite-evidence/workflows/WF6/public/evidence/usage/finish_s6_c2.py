"""Summarize actual limited-extension acceptance without overwriting prior S6 results."""
import csv,datetime as dt,hashlib,json,subprocess
from pathlib import Path
from record_command import ROOT,EVIDENCE
from run_s1 import SOURCE,EVALUATOR
from summarize_s1_browser import summarize
import audit_s6_c2
STAGE=EVIDENCE/'steps/S6/continuation-02'
def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def report_stats(path):return json.loads(path.read_text())['stats'] if path.exists() else None
def main():
    builds=json.loads((STAGE/'build-artifacts.json').read_text());browser=STAGE/'browser-r2';runtime=Path('/tmp/wf6-rerun-20261014-01-S6-C2-R2')
    for r in builds['react_source_files']:assert hashlib.sha256((SOURCE/r['path']).read_bytes()).hexdigest()==r['sha256']
    for role in ['react','vue']:
        for r in builds[role]['files']:assert hashlib.sha256((runtime/role/r['path']).read_bytes()).hexdigest()==r['sha256']
    (STAGE/'build-artifact.json').write_text(json.dumps(builds['vue'],indent=2)+'\n');audit_s6_c2.snapshot()
    full=summarize(browser/'restored-frozen-results.json') if (browser/'restored-frozen-results.json').exists() else None
    if full:assert full['gate_checks']['inventory'] and full['gate_checks']['routes_66'] and full['gate_checks']['flows_15'] and full['gate_checks']['guard_1']
    four=report_stats(browser/'four-original-results.json');supp=report_stats(browser/'restored-supplemental.json');rollback=report_stats(browser/'rollback-supplemental.json');rollback_four=report_stats(browser/'rollback-frozen-results.json')
    def passed(stats,n):return bool(stats and stats['expected']==n and stats['unexpected']==0 and stats['skipped']==0 and stats['flaky']==0)
    gate='PASS' if full and full['gate_checks']['all_passed'] and passed(four,4) and passed(supp,7) and passed(rollback,1) and passed(rollback_four,4) else 'FAIL'
    repairs=json.loads((STAGE.parent/'repair-budget.json').read_text());assert repairs['used']==2;repairs['rounds'][-1]['status']='Final gate '+gate+'; no further repair allowed';write(STAGE.parent/'repair-budget.json',repairs);write(STAGE/'repair-budget.json',repairs)
    commands=[json.loads(l) for l in (STAGE.parent/'commands.jsonl').read_text().splitlines()]
    for name in ['React-strict-TypeScript','React-lint','business-unit-checks','shared-route-policy-matrix','React-production-build','Vue-boundary-production-build','Vue-boundary-targeted-lint']:assert any(r['label']=='S6-C2-R2-'+name and r['exit_code']==0 for r in commands)
    states=json.loads((STAGE/'switch-states.json').read_text());assert states[0]['map']['takeoverEnabled'] is False and states[-1]['map']['takeoverEnabled'] is True
    assert states[0]['backend_pid']==states[-1]['backend_pid'] and states[0]['backend_data_dir']==states[-1]['backend_data_dir']
    if (STAGE/'restored-seeded-identities.json').exists():assert json.loads((STAGE/'rollback-seeded-identities.json').read_text())==json.loads((STAGE/'restored-seeded-identities.json').read_text())
    if full:write(STAGE/'full-regression-summary.json',full)
    manifests=[]
    for folder in [STAGE/'browser',browser]:
        if folder.exists():
            for f in sorted(folder.rglob('*')):
                if f.is_file():manifests.append(dict(path=str(f.relative_to(STAGE)),bytes=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
    write(STAGE/'browser-manifest.json',dict(private_raw=True,original_bytes_preserved=True,files=manifests))
    ownership_path=browser/'route-ownership.json'
    if ownership_path.exists():
        ownership=json.loads(ownership_path.read_text());bytitle={c['title']:c for c in full['cases']} if full else {}
        with (STAGE/'route-ownership.csv').open('w',newline='') as f:
            w=csv.writer(f);w.writerow(['frozen_route','requested_url','initial_owner','full_strict_actual_status','vue_build','react_build','limitation'])
            for row in ownership['rows']:w.writerow([row['file'],row['url'],row['frontend'],','.join(bytitle['[route] '+row['file']]['actual_statuses']) if '[route] '+row['file'] in bytitle else 'not_executed',builds['vue']['build_hash'],builds['react']['build_hash'],'Root Vue index redirects to React; other ownership rows are initial HTTP responses, not all final runtime traces'])
    with (STAGE/'feature-inventory.csv').open('w',newline='') as f:
        w=csv.writer(f);w.writerow(['feature','owner','actual_result','remaining_scope']);w.writerows([['Real Logout and request/session cleanup','React -> Vue login','Original four '+str(four)+'; supplemental pending/401 check','No full OIDC/long-lived auth parity'],['Self-role Settings menu','React navigation only','Original member/admin flows; Vue links retained','Settings pages still Vue, not migrated'],['Comment read/create/persistence','React','Original comment flow; blank/submitting/failure/server success checks','Edit/delete comments not implemented'],['Own-group recipe list/search/detail','React','Full strict 2 target routes + frozen open/search if full exists','Not full recipe write UI'],['Other routes and settings pages','Vue','See full suite / rollback','Not React migration score'],['Whole-system deployment/coverage/cost/review','unverified','not_provided','No production/full-system equivalence claim']])
    scope_commit=subprocess.check_output(['git','-C',str(SOURCE),'log','--format=%H','--grep=Authorize limited auth navigation','-1'],text=True).strip();implementation_commits=subprocess.check_output(['git','-C',str(SOURCE),'log','--format=%H %s','-4'],text=True).splitlines()
    stats=dict(gate=gate,rounds_used=2,rounds_limit=2,scope_commit=scope_commit,implementation_head=subprocess.check_output(['git','-C',str(SOURCE),'rev-parse','HEAD'],text=True).strip(),recent_commits=implementation_commits,original_four=four,rollback_supplemental=rollback,rollback_frozen_four=rollback_four,restored_supplemental=supp,full_counts=full['categories'] if full else None,full_not_executed=full is None,builds={r:builds[r]['build_hash'] for r in ['vue','react']},react_source_hash=builds['react']['source_hash'],original_full_FAIL_preserved='../full-regression-summary.json',S1_usage='partial',S1_diagnostics='318 FAIL retained',coverage=None,cost=None,human_review_time=None)
    write(STAGE/'measurements.json',stats)
    counts=full['categories'] if full else None;count_text=f"routes {counts['routes']['passed']}/66, flows {counts['flows']['passed']}/15, guard {counts['guard']['passed']}/1" if counts else 'not_executed after earlier gate failure'
    text=f'''# S6 CONTINUE 02 limited authorized expansion / 明确授权的有限扩展

Latest S6 gate **{gate}**. S6 repair budget **2/2 used**; stop, no additional repairs or S7. Earlier S6 initial FAIL and continuation-01 scope audit remain historical and unchanged.
最新 S6 gate **{gate}**；修复额度 **2/2 已用**，停止、不进入 S7。原 S6 FAIL 及 continuation-01 均保留，不替换旧成绩。

## Approach → What happened → Why → What we would change

The actual user explicitly replaced the read-only restriction only for real React Logout, permission-based Settings navigation, and comments read/create/persistence. Contract amendment is append-only in scope commit `{scope_commit}`; actual Chinese prompt and feature inventory are preserved. Settings page rendering, recipe create/edit/delete and other domains remain Vue-owned. No evaluator, backend/API or schema assertions were modified; no test recognition/special split was implemented.
本次用户明确批准四项有限扩展，范围提交及契约保存；设置页面及其他领域仍由 Vue 提供，不能计 React 页面迁移。未改冻结 evaluator、后端/schema，也未识别测试或特殊分流。

Round 1 implemented all four functions and passed strict types/lint, 11 business units, route matrix and fresh builds. Target original frozen flows were **3 PASS / 1 FAIL**. Comment GET incorrectly used the recipe UUID on a slug-only endpoint; original network trace returned actual 500 and backend stderr identifies None.id from missing slug lookup. The visible React error was retained, never hidden through Vue fallback. This was an implementation error distinct from original scope gaps. Round 2 changed GET to encoded recipe.slug, kept POST recipeId/text, and added a regression unit that separates ID from slug. Both commits and the failed trace/log/report remain. We would verify endpoint semantics against original API call sites before coding and include the ID-versus-slug negative in the initial tests.
第 1 轮三项通过、评论失败：把 GET 的 slug 参数误用为 UUID，真实 500/后端 traceback 保留，React 显示错误而未回退。第 2 轮修正 slug，POST 仍为 recipeId/text，并加单测。两轮提交及失败均保留；这是真实实现错误，不与原范围缺失混淆。

Final strict React TypeScript/lint passed, business units **12/12**, shared policy **34/34**, targeted unchanged Vue middleware lint and both fresh production builds passed before browser acceptance. New original-four machine stats: `{four}`. Only after these original controls passed did the runner proceed to boundary checks and full frozen suite. Full all/strict inventory remains exactly 66 routes,15 flows,1 guard, no skip/retry/assertion changes. Latest full results: **{count_text}**; exact pass/fail/skip/flaky and raw errors are in full-regression-summary.json or explicitly not_executed. Selected/target repetitions are not new coverage counts.
最后一轮先静态和全新 build 成功，再测原四项；通过才进入边界及完整冻结 suite。库存 all/strict 66+15+1 不变、零新增重试，实际 **{count_text}**，失败/skip 如实留账，重复选择不计新增覆盖。

Explicit all-Vue rollback: real login/list/search/detail/shopping/return supplement `{rollback}`, original selected four `{rollback_four}`. Restored takeover: original four and seven independent supplemental cases `{supp}`. Switch states share only the final R2 fresh backend/data and comparable seeded fixture IDs; contexts/auth/output are independent from old stages and first repair. Route-map false/true states, hashes and actual services are preserved. Requested-document inventory has 64 Vue/2 React; root index is a Vue→React transition. Full mixed-app acceptance is not 66 React pages.
重新核实全 Vue 回退与恢复接管，两状态在同一 R2 独立种子数据库，旧段/首轮账号/context/output 不复用。开关与哈希保存；初始请求 64 Vue/2 React，根路径混合跳转，全 suite 成绩不能升级为 React 66 页。

Logout uses the existing real POST /api/auth/logout, cancels owned fetches, aborts bootstrap, drops user/components/menu/comment state and clears the access cookie, then document-navigates to Vue login on success. API reads use no-store and there is no persistent user data cache. In-flight aborted writes may already have reached the server; no server transaction rollback is claimed. A failed logout POST clears local state but stays as a visible error, not a success or silent 5xx fallback. The user-authorized authentication rule now redirects verified anonymous/401 on protected pilot URLs to Vue login preserving the target. Wrong-group identities still require an explicit Vue entry; configuration/resource/network/5xx errors remain visible on React. The supplemental pending-request/real401 check verifies the changed handoff, while the synthetic self500 case stays at the React URL; real missing assets stay non-HTML404.
真实 Logout 与请求/本地状态清理、整页 Vue 登录生效；API no-store，无持久用户缓存。已送达服务端的被取消请求不声称事务回滚。Logout 失败可见，不伪装成功；授权的匿名/401 交接进入登录，错误 group 显式入口，资源/网络/5xx 不静默回退。补充检查区分真实 401、注入 self500 与真实资源404。

Settings uses actual self.admin/canManage/householdId; member household navigation is a real link, admin link is exactly /admin/site-settings and conditional on actual admin=true. MUI menu anchors trigger full document navigation to existing Vue pages. Comment UI follows original Vue authenticated-user and both recipe.settings.disableComments/current household.preferences.recipeDisableComments conditions. Blank submits are disabled; submitting prevents double action; failures keep text/error and no optimistic success; server-created comment alone is displayed. Reload GET uses real server data. Both disable policies are covered by unit-level synthetic API fixtures; live flipping of household/recipe preference toggles was not separately measured. Delete/edit comments, full Markdown/localization/layout/OIDC parity and production use remain outside this extension.
Settings 按真实权限提供 Vue 链接；评论遵循原权限及两项禁用条件，空白/提交中/失败/服务端成功/刷新分别处理，不乐观伪造成功。禁用条件有 unit fixture 检查，未另测实时修改两项偏好的浏览器场景；评论编辑/删除和完整等价仍未实现。

Actual implementation head `{stats['implementation_head']}`; React source `{stats['react_source_hash']}`, React build `{stats['builds']['react']}`, Vue build `{stats['builds']['vue']}`. Every served file hash matched. Source audit allows only the explicit append-only contract documentation delta relative to S0; all remaining original Vue/backend/type/locale/evaluator manifest entries remain byte-identical. This exact exception is documented, not silently excluded from the freeze check. Scope, implementation (both rounds) and evidence acceptance are separately committed; raw logs/trace/DB/dependencies/credentials stay outside the checkout commit.
源码/build 字节核实；对 S0 清单仅允许用户批准的 append-only 契约文档差异，其余原 Vue/后端/types/locale/evaluator 不变，例外明确记录。范围/两轮实现/验收分别提交，原始数据与凭据不提交。

Three S6 segments remain disjoint. Prior finals are verified covered, current final_reply_included=false/provisional until external reconciliation; no inherited/old export totals are added. Three-hour budget is not reset and pauses remain separately excluded. S5 stays 2/2, S1 partial/unknown interruption gap and **318 diagnostic FAIL** remain. Coverage, fees and human review duration are not provided.
三段不重叠；前两段最终回复已覆盖、本段回复前 provisional，旧导出不重复累计。三小时预算不重置、人工停顿另列；S1/S5 原失败及用量缺口保留。

## Evidence / 证据

- [Actual prompt/boundary](request-boundary.json), [Scope amendment](scope-amendment.json), [Feature inventory](feature-inventory.csv), [Repairs](repair-budget.json)
- [First repair actual 3/1](browser/four-original-results.json), [Original four final](browser-r2/four-original-results.json)
- [Latest full raw](browser-r2/restored-frozen-results.json), [Full summary](full-regression-summary.json), [Supplement](browser-r2/restored-supplemental.json), [Redacted supplemental records](browser-r2/restored-requests-redacted.jsonl)
- [Rollback](browser-r2/rollback-supplemental.json), [Switch states](switch-states.json), [Ownership](route-ownership.csv)
- [Builds](build-artifacts.json), [Actual service](served-build.json), [Source state](source-state.json), [Diff](diff.patch), [File hashes](file-manifest.json), [Trace/screenshot hashes](browser-manifest.json)
- [First build](repair1-build-artifacts.json), [Repair diff](repair-2-source.diff), [Prior segment settlement](previous-segments-settlement.json), [All commands](../commands.jsonl), [Usage](../token-usage.json), [Budget](../../../experiment-budget.json)

Stop after S6, no S7. / S6 后停止，不进入 S7。
'''
    # Missing dependent outputs stay explicit rather than being claimed executed.
    if not full:text=text.replace('[Latest full raw](browser-r2/restored-frozen-results.json), [Full summary](full-regression-summary.json)', 'Full regression not_executed after an earlier gate failure')
    if not full:
        text=text.replace('[Supplement](browser-r2/restored-supplemental.json), [Redacted supplemental records](browser-r2/restored-requests-redacted.jsonl)', 'Dependent supplemental boundary suite not_executed because the original-four gate failed')
        text=text.replace('[Ownership](route-ownership.csv)', 'Current 66-route ownership inventory not_executed after gate failure; prior inventory retained separately')
        text=text.replace('The supplemental pending-request/real401 check verifies the changed handoff, while the synthetic self500 case stays at the React URL; real missing assets stay non-HTML404.', 'Original frozen Logout verifies real logout and the protected-direct URL login handoff. The new pending-request/500/resource suite was not_executed after the four-flow gate failed; no new live success is claimed for it.')
        text=text.replace('补充检查区分真实 401、注入 self500 与真实资源404。', '原冻结 Logout 通过；新 pending/500/resource 补充套件未执行，不算通过。')
        text=text.replace('Comment UI follows original Vue authenticated-user and both recipe.settings.disableComments/current household.preferences.recipeDisableComments conditions.', 'The implemented comment code follows original Vue authenticated-user and both recipe.settings.disableComments/current household.preferences.recipeDisableComments conditions; final live comment persistence remains FAIL.')
        text=text.replace('Only after these original controls passed did the runner proceed to boundary checks and full frozen suite.', 'The final original-four gate did not pass, so dependent boundary checks and the full frozen suite were not executed. No additional repairs or experiments occurred after the two-round cap.')
        text=text.replace('通过才进入边界及完整冻结 suite。', '四项最终未全通过，因此依赖边界/全 suite 未执行；达到上限后未再实验或修复。')
        text+='\n\n## Remaining failure audit / 剩余失败核查\n\nFinal repair original four: Logout/member Settings/admin Settings PASS; comment persistence FAIL. The first text expectation matched a TEXTAREA draft. Original trace contains no /api/comments POST or201; reload cancelled the pre-submit recipe revalidation GET. An implemented server-success append is not a demonstrated successful live submission. Unit synthetic API receipts are not live persistence evidence. Two repair rounds are exhausted, so no further source correction or rerun is permitted.\n最终评论首次文字断言匹配 textarea 草稿，trace 无 POST/201；刷新取消提交前请求，不能声称真实提交/持久化成功。两个修复轮次已用尽，停止。\n\n[Remaining DOM/network audit](remaining-failure-audit.json), [Original API sequence](repair2-api-request-sequence.json), [Comment endpoint network audit](repair2-comment-network-audit.json).\n'
    (STAGE/'result.md').write_text(text)
    (SOURCE/'rewrite-evidence/workflows/WF6/S6-C2-RESULT.md').write_text(f'# S6 limited extension / 有限扩展\n\nLatest gate {gate}. User explicitly authorized real Logout, self-role Settings Vue navigation and comments read/create/persistence; old read-only/four-failure results remain historical.\n本次有限范围由用户明确批准，原 FAIL 保留。\n\nTwo S6 repairs used: first comment GET used ID causing real500; second uses slug. Original four {four}; full strict {count_text}. No evaluator/backend/schema changes, skips or new retries.\n两轮及失败保留，最终成绩见原始证据，不作为 React 全站迁移成绩。\n\n[Full bilingual result](../../../../wf6-evidence/steps/S6/continuation-02/result.md)\n\nS1 partial/318 diagnostics FAIL retained; disjoint three segments, current final pending. Stop S6; no S7.\n')
    (EVIDENCE/'PROGRESS.md').write_text((EVIDENCE/'PROGRESS.md').read_text()+f'\nS6 CONTINUE 02 limited authorized extension: latest gate {gate}; repairs 2/2; original four and full results in [latest result](steps/S6/continuation-02/result.md). Earlier FAIL/S1 gaps remain; no S7.\n有限扩展新成绩与原 FAIL 分开留存，不进入 S7。\n')
    idx=EVIDENCE/'EVIDENCE_INDEX.md';idx.write_text(idx.read_text()+'\n- S6 continuation 02 explicit limited extension: [latest result](steps/S6/continuation-02/result.md), [feature scope](steps/S6/continuation-02/feature-inventory.csv), [repair history](steps/S6/continuation-02/repair-budget.json).\n')
    with (STAGE.parent/'attempts.jsonl').open('a') as f:f.write(json.dumps(dict(timestamp=dt.datetime.now(dt.timezone.utc).isoformat(),kind='continuation_final_outcome',segment='continuation-02',gate=gate,repairs_used=2,original_failures_retained=True,scope_authorized=True,counts=stats['full_counts']))+'\n')
    print(json.dumps(stats,ensure_ascii=False))
if __name__=='__main__':main()
