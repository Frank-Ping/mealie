"""Audit accepted S5 bytes and retain unexpected test failures separately from detection negatives."""
import datetime as dt
import hashlib,json,shutil
from pathlib import Path
from record_command import ROOT,EVIDENCE
from run_s1 import SOURCE,EVALUATOR
import finish_s2
STAGE=EVIDENCE/'steps/S5'

def main():
    builds=json.loads((STAGE/'build-artifacts.json').read_text());served=json.loads((STAGE/'served-build.json').read_text());browser=STAGE/'browser-r2'
    frozen=json.loads((browser/'frozen-results.json').read_text());supp=json.loads((browser/'results.json').read_text());negative=json.loads((STAGE/'detection-negative.json').read_text());guard=json.loads((STAGE/'stale-build-negative.json').read_text());repairs=json.loads((STAGE/'repair-budget.json').read_text())
    for machine,n in [(frozen,4),(supp,8)]:assert machine['stats']['expected']==n and machine['stats']['unexpected']==0 and machine['stats']['skipped']==0 and machine['stats']['flaky']==0
    assert negative['status']=='PASS' and [r['exit_code'] for r in negative['outcomes']]==[0,1,0]
    assert guard['status']=='PASS' and repairs['used']==2
    rows=[json.loads(l) for l in (STAGE/'commands.jsonl').read_text().splitlines()]
    for label in ['S5-React-strict-TypeScript','S5-React-lint','S5-business-unit-checks','S5-shared-route-policy-matrix','S5-React-production-build','S5-Vue-boundary-production-build','S5-Vue-boundary-targeted-lint']:
        assert any(r['label']==label and r['exit_code']==0 for r in rows)
    runtime=Path('/tmp/wf6-rerun-20261014-01-S5-R2');verifications={}
    for role in ['react','vue']:
        artifact=builds[role];matched=next(r for r in rows if r['command_id']==artifact['command_id']);assert matched['exit_code']==0 and artifact['exit_code']==0
        for record in artifact['files']:assert hashlib.sha256((runtime/role/record['path']).read_bytes()).hexdigest()==record['sha256']
        verifications[role]=dict(actual_served_directory=str(runtime/role),build_hash=artifact['build_hash'],source_hash=artifact['source_hash'],successful_build_command=matched['command_id'],all_file_hashes_match=True)
    for record in builds['react_source_files']:assert hashlib.sha256((SOURCE/record['path']).read_bytes()).hexdigest()==record['sha256']
    (STAGE/'runtime-build-verification.json').write_text(json.dumps(verifications,indent=2)+'\n')
    (STAGE/'build-artifact.json').write_text(json.dumps(builds['vue'],indent=2)+'\n');finish_s2.STAGE=STAGE;finish_s2.snapshot()
    artifacts=[]
    for directory in [STAGE/'browser',STAGE/'browser-r1',browser]:
        for file in sorted(directory.rglob('*')):
            if file.is_file():artifacts.append(dict(path=str(file.relative_to(STAGE)),bytes=file.stat().st_size,sha256=hashlib.sha256(file.read_bytes()).hexdigest()))
    (STAGE/'browser-manifest.json').write_text(json.dumps(dict(private_raw_artifacts=True,original_bytes_preserved=True,files=artifacts),indent=2)+'\n')
    metric=dict(stage='S5',gate='PASS',frozen_selected=frozen['stats'],supplemental=supp['stats'],repairs=repairs,application_source_repairs=0,expected_detection_failure=negative,stale_build_guard=guard,coverage=None,cost=None,human_review_time=None,whole_suite='not_executed',source_before_document_commit=finish_s2.git(SOURCE,'rev-parse','HEAD'),builds=verifications)
    (STAGE/'measurements.json').write_text(json.dumps(metric,indent=2)+'\n')
    closure=json.loads((STAGE/'S4-settlement.json').read_text());assert closure['status']=='exact_reported' and closure['final_reply_included']
    text=f'''# S5 user journey and detection / 用户路径与故障检测

Gate **PASS**. S5 only; no S6. S5 repair allowance **2/2 used**, both harness fixes, zero application-source changes. A further S5 failure would stop without another repair.
Gate **PASS**；仅 S5，未执行 S6。S5 修复额度 **2/2 已用**，均为补充验收 harness；未修改应用。达到上限后不得再修复。

## Approach → What happened → Why → What we would change

Fresh React/Vue builds and strict React types/lint, 8 business units, 34 route cases and targeted Vue boundary lint passed before browser acceptance. Exact frozen four-test selection remained unchanged; the latest run passed **4/4**. Independent supplemental checks passed **8/8**, zero skipped/flaky/retries. This does not claim the complete 66-route/15-flow suite, coverage or production readiness. Actual application source at test time: `{metric['source_before_document_commit']}`. React source `{verifications['react']['source_hash']}`, React build `{verifications['react']['build_hash']}`, Vue build `{verifications['vue']['build_hash']}`. All served file hashes and build command identities were audited against the new S5 artifacts, and application byte hashes remain the accepted S4 inputs.
先新建两套 build 并通过静态检查，再进行浏览器。冻结选择 **4/4**、补充 **8/8**，无跳过/重试；不是全套 66/15 或 coverage 成绩。源码、服务目录、成功构建命令与实际字节均核实，应用保持 S4 验收字节。

| Attribution / 归属 | Actual result / 实测结果 |
|---|---|
| React | Frozen list/detail routes + open/search flows **4/4**; supplemental real loading/empty/404 and injected API-500/retry **2/2**. Real content/keyboard checks also appear in mixed cases. |
| Vue | Actual login, seeded shopping lists and explicit legacy entry **PASS observations within mixed/boundary cases**; not separate migrated pages or an independent Vue suite score. |
| Mixed / 混合 | Two real Vue→React→Vue→React cases **2/2**, including real search/detail, existing Vue group navigation, same identity/group, new documents across boundaries and React client history. |
| Boundary / 边界 | Four supplemental cases **4/4**: retained modes/entry, expanded route + asset matrix, actual anonymous/invalid-token 401, real second-group identity with zero pilot recipe calls. Shared policy **34/34** separately. |
| Detection / 检测 | Control PASS → expected failure detected → restored PASS. This expected failure is separate from normal application regression results. |

Category counts partition the eight supplemental cases into React 2, mixed 2, boundary 4; Vue observations overlap them and are not added to the denominator. API 500 is explicitly synthetic failure injection; Retry recovery uses the actual backend. Loading delays a real request without replacing success data; empty and missing-detail 404 are actual backend responses. The second-group user was created only in each disposable database using real admin API, and actual self.groupId matched the real second group. Anonymous/expired and wrong-group cases rendered explicit Vue/login links and no recipe data requests. All recipe requests in the measured normal journey were GET; seed setup writes are not application UI migration.
八项补充按 React 2、混合 2、边界 4 分列；Vue 观察不重复加入分母。500 是明确故障注入，恢复为真实 API；loading 延迟真实请求，empty/404 为后端真实结果。第二 group 使用隔离数据库中真实账号；匿名/过期/错误 group 未请求食谱数据。种子准备的写请求不计 UI 成果。

Keyboard real links, direct detail, refresh, React back/forward and preserved query/hash passed. Explicit Vue navigation retained target query/hash, real Nuxt runtime was visible and React runtime absent. HTTP ownership checks covered create and descendants, shared, detail subpath, edit/parse/cook, configured/other-group routes and Vue login/shopping/admin. Vue business rendering was exercised for login/shopping/explicit entry; each mode's full editor/cook behavior was not asserted. Missing JS/image requests with Accept:text/html returned actual 404 and non-HTML content type. A bounded document-request count and actual new-document identities detected loops in the measured journey; arbitrary routes and long-running refresh/OIDC/session parity are not claimed.
键盘、直达、刷新、前进后退、query/hash 和显式 Vue 入口通过。创建/子路由/shared/模式/其他 group 的 HTTP 归属通过；未声称每种 editor/cook 的全业务验收。缺资源是实际非 HTML 404，测量路径无循环；未验证任意路由和长期认证全等价。

The detection negative atomically moved only this final S5 runtime copy's React assets while takeover remained true. The identical real detail business/owner probe had control exit 0, asset-unavailable exit 1 with a missing heading, and restored exit 0. Missing asset 404 was verified independently. No Vue success replaced React, and restoration was checked against every original build file hash. Raw trace/screenshots and reports preserve the expected failure. An isolated invalid Vite config separately produced actual build exit 1 while the prior dist stayed byte-identical; the tested acceptance guard rejects an artifact whose command ID/exit does not match the successful build. This is a supplemental harness guard check, not a claim that every external launcher implements it or that production build fault handling is complete.
检测负例仅临时移走最终运行副本的 React assets，接管保持 true；同一 probe 正常退出 0、缺资源退出 1、恢复退出 0，缺资源 404 与恢复字节也核实。未静默回 Vue。另一个隔离无效 Vite config 构建实际失败，旧 dist 未变，但 guard 拒绝失败尝试；此为补充 harness 机制检查，不推广为所有 launcher 或生产行为保证。

Unexpected failure history is retained: initial supplemental **7 PASS / 1 FAIL**, caused by the test's second same-URL goto not making a new document/self request; trace confirms first anonymous real 401. Repair 1 used distinct case queries without weakening assertions; subsequent supplemental **8/8** passed. The detection control then failed because newly seeded auth cookies were 127.0.0.1-scoped while its URL used localhost; trace shows actual 401. Repair 2 aligned the probe origin with the verified auth state, kept assertions/timeouts, and the final normal/detection runs passed. These are harness/context errors, not React source regressions or expected negatives; they consumed both S5 repair rounds and their elapsed/token costs remain in S5. We would parameterize origin consistently and use independent case URLs from the start to avoid this verification overhead.
保留初轮 7/1 与 R1 control 失败，不把它们改称预期负例。第一轮修复相同 URL 无新文档的问题；第二轮修复 localhost/127 cookie origin 不一致，均未削弱断言或修改 React。两轮耗时/token 均归 S5；下次应统一 origin，并一开始使用独立 case URL。

Runtime, SQLite, accounts, auth/context, outputs and tmp paths were fresh for initial, R1 and R2 attempts. Old attempts/runs remain untouched; owned services stopped, frozen backend/schema/evaluator assertions and original Vue bytes preserved. Raw logs/traces remain private originals; credential-free request summaries are separate. No new write UI was added. Full explicit switch rollback/restoration and complete frozen regression belong to S6 and remain not_executed here.
各尝试数据库/auth/context/输出独立；所有失败保留，只停止 owned 服务，未修改冻结后端/断言/原 Vue。原始私有日志/trace 与去敏摘要分开。未新增写功能；S6 的开关回退与全回归尚未执行。

S4 settled `{closure['status']}`, final_reply_included=true, total {closure['total_tokens']}. S1 remains partial with unknown interruption coverage gap, no zero fill, and original **318 diagnostics FAIL**, historical 315 (+3) comparison/cause limitations retained. Three-hour budget continues in disjoint turns; between-turn wait is separately excluded. S5 final reply and budget tail are provisional until terminal/next-step reconciliation. Coverage, cost and human review duration: not provided.
S4 最终回复已封账；S1 保持 partial 与未知缺口，318 类型诊断 FAIL/历史 315 差异保留。三小时按不重叠区间延续，人工等待另列；S5 最终回复/预算尾部待核实。coverage/费用/review 时间未提供。

## Evidence / 证据

- [Request/boundary](request-boundary.json), [S4 settlement](S4-settlement.json)
- [Latest frozen](browser-r2/frozen-results.json), [Latest supplemental](browser-r2/results.json), [Redacted requests](browser-r2/requests-redacted.jsonl)
- [Initial failure](browser/results.json), [Repair 1](browser-r1/results.json), [Control failure](browser-r1/probe-control.json)
- [Repair rounds](repair-budget.json), [Attempts](attempts.jsonl), [Repair 1 diff](repair-1-test.diff), [Repair 2 diff](repair-2-test.diff)
- [Detection sequence](detection-negative.json), [Stale build negative](stale-build-negative.json), [Raw artifacts](browser-manifest.json)
- [Fresh builds](build-artifacts.json), [Actual served verification](runtime-build-verification.json), [Gateway/source provenance](served-build.json), [Runtime isolation](runtime-isolation.json)
- [Commands/raw English streams](commands.jsonl), [Source state](source-state.json), [Diff](diff.patch), [File hashes](file-manifest.json)
- [Tokens](token-usage.json), [Budget](../../experiment-budget.json), [Visible coverage](transcript-coverage.json)

Stop after S5; await separate S6 authorization. / S5 后停止，等待单独 S6 授权。
'''
    (STAGE/'result.md').write_text(text)
    summary='# S5 user journey/boundary/detection / 用户路径、边界与检测\n\nGate PASS. Frozen selection 4/4; supplemental 8/8. React 2, mixed 2, boundary 4 supplemental cases; Vue login/shopping/explicit entry observations overlap these and are not React migration scores.\n冻结选择 4/4、补充 8/8；Vue 保留行为不计 React 迁移成绩。\n\nTwo harness repairs consumed S5 2/2; both failure traces retained, zero application source changes. Takeover-on asset-negative: control 0 → expected failure 1 → restored 0; unchanged restored bytes verified.\n两轮 harness 修复及失败均保留；接管开启的资源检测负例通过，恢复字节核实。\n\nS1 partial/unknown gap and 318 type diagnostics FAIL remain. Full suite and S6 switch rollback not executed. Usage/final reply and budget tail require external settlement; stop after S5.\nS1 缺口/类型 FAIL 保留；未执行 S6，停止。\n\n[Full bilingual result and raw evidence](../../../../wf6-evidence/steps/S5/result.md)\n'
    (SOURCE/'rewrite-evidence/workflows/WF6/S5-RESULT.md').write_text(summary)
    (EVIDENCE/'PROGRESS.md').write_text('# WF6 progress / 进度\n\nS0-S5 gates PASS. S4 final usage exact_reported; S5 provisional before final reply. S1 partial/interruption gap and 318 type diagnostics FAIL preserved.\nS5 已通过，S1 缺口及类型 FAIL 保留。\n\nS5 repairs 2/2 used, application source unchanged. S6-S7 not executed; stop awaiting separate S6 authorization.\nS5 修复上限已用；未执行 S6，等待授权。\n\n[Result](steps/S5/result.md) · [Budget](experiment-budget.json) · [Usage](usage/USAGE.md)\n')
    index=EVIDENCE/'EVIDENCE_INDEX.md';index.write_text(index.read_text()+'\n- S5 real journey/boundaries/detection: [bilingual result](steps/S5/result.md), [raw artifact manifest](steps/S5/browser-manifest.json), [repairs](steps/S5/repair-budget.json).\n')
    with (STAGE/'attempts.jsonl').open('a') as f:f.write(json.dumps(dict(timestamp=dt.datetime.now(dt.timezone.utc).isoformat(),classification='final_acceptance',gate='PASS',normal_frozen=4,normal_supplemental=8,expected_negative_preserved=True,repair_rounds_used=2,application_source_changes=False))+'\n')
    print(json.dumps(dict(gate='PASS',frozen='4/4',supplemental='8/8',repairs='2/2',application_source_changes=False)))
if __name__=='__main__':main()
