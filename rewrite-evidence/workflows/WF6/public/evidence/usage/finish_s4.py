"""Write measured S4 pilot results; keep retained Vue behavior and missing coverage separate."""
import json
from record_command import ROOT,EVIDENCE
from run_s1 import SOURCE

STAGE=EVIDENCE/'steps/S4'

def main():
    builds=json.loads((STAGE/'build-artifacts.json').read_text());frozen=json.loads((STAGE/'browser/frozen-results.json').read_text());supp=json.loads((STAGE/'browser/results.json').read_text())
    assert frozen['stats']['expected']==4 and frozen['stats']['unexpected']==0 and frozen['stats']['skipped']==0 and frozen['stats']['flaky']==0
    assert supp['stats']['expected']==3 and supp['stats']['unexpected']==0 and supp['stats']['skipped']==0 and supp['stats']['flaky']==0
    state=json.loads((STAGE/'source-state.json').read_text());assert not state['evaluator']['dirty']
    commands=[json.loads(l) for l in (STAGE/'commands.jsonl').read_text().splitlines()]
    labels=['S4-React-strict-TypeScript','S4-React-lint','S4-business-unit-checks','S4-shared-route-policy-matrix','S4-React-production-build','S4-Vue-boundary-production-build','S4-Vue-boundary-targeted-lint','S4-gateway-protocol-fixture']
    assert all(any(c['label']==label and c['exit_code']==0 for c in commands) for label in labels)
    repairs=json.loads((EVIDENCE/'source-repair-budget.json').read_text());assert repairs['used']==0
    requests=[json.loads(l) for l in (STAGE/'browser/requests-redacted.jsonl').read_text().splitlines()];assert len(requests)==3 and all(r['status']=='PASS' for r in requests)
    closure=json.loads((STAGE/'S3-settlement.json').read_text())
    metrics=dict(run_id=ROOT.name,stage='S4',gate='PASS',react_scope='Configured authenticated group list/server search/read-only detail',
        builds={k:{f:v[f] for f in ['build_hash','source_hash','command_id']} for k,v in builds.items() if k in ['vue','react']},
        frozen_selected=frozen['stats'],supplemental=supp['stats'],business_units=8,route_policy_cases=34,protocol_fixture_cases=1,strict_types='PASS',lint='PASS',
        source_repairs=repairs,coverage=None,cost=None,human_review_time=None,whole_suite='not_executed',baseline_Vue_types='S1 318 FAIL retained; not rerun as a whole Vue checker in S4')
    (STAGE/'measurements.json').write_text(json.dumps(metrics,indent=2)+'\n')
    text=f'''# S4 real recipe pilot / 真实食谱只读切片

Run `{ROOT.name}`. Gate **PASS**. S4 only; stop before S5. Shared S3/S4 source repairs: **0/2**.
Gate **PASS**；仅 S4，停止等待 S5 单独授权。共享源码修复 **0/2**。

## Approach → What happened → Why → What we would change

Implement the configured authenticated group's React list, real server search, keyboard-accessible React Router recipe links and read-only detail. Use a new independent fetch adapter for /api/recipes and /api/recipes/{{slug}}, with real /api/users/self revalidation before every recipe request. Refuse changed identity/group and reject returned recipes outside the verified group. Reuse only unchanged generated recipe types and 11 original en-US labels; no Nuxt composable runs as a React hook. Source mapping and hashes are in source-mapping.json. Vue remains responsible for non-pilot routes and write features.
实现配置 group 的真实列表、服务端搜索、键盘链接及只读详情；每次食谱请求前重新校验 self 与身份/group，拒绝身份变化或错误 group 数据。仅复用未修改生成类型及原 en-US 标签，不把 Vue 功能计作 React 成果。

Strict React TypeScript and lint passed, with **8/8 new business unit checks**, **34/34 shared route-policy cases**, independent transport fixture and targeted unchanged Vue middleware lint. Both fresh builds succeeded before browsers. React build `{builds['react']['build_hash']}`; Vue build `{builds['vue']['build_hash']}`; compiled React source `{builds['react']['source_hash']}`. Accepted bytes were SHA256-verified in the independent native S4 runtime. The build logged a nonfatal chunk-size warning at 535.55 kB; raw warning retained, threshold unchanged. No performance improvement or production-readiness claim is made.
strict types、lint、8 项新增业务 unit、34 项共用路由检查及两套新 build 均通过；先核实服务字节再启动浏览器。535.55 kB chunk 的非致命构建 warning 保留，未改阈值或声称性能/生产就绪。

The unchanged frozen evaluator selected exactly **4 tests**: configured list route, detail route, original open flow and original search flow. Selection inventory asserted two routes/two flows before execution; all **4/4 passed**, zero skips/retries, with original strict assertions. Test IDs, titles, grep and precise commands are preserved in frozen-selection.json and browser/frozen-results.json. This is not a new 66-route/15-flow suite score.
冻结 evaluator 先核实选择库存，再运行原列表/详情 route 和 open/search flow，**4/4**，零跳过/重试、未修改断言；不是完整 66 routes/15 flows 成绩。

The supplemental real-browser suite passed **3/3**. It proved real names/ingredients/instructions/tools/categories/tags, real recipe URL and keyboard Enter navigation, direct detail/refresh/query/hash, current identity, React→Vue shopping lists→React with new documents, and GET-only recipe requests. It verified loading by delaying an actual request without replacing the success response; real server search returned empty items, clearing restored both seeded recipes, and a real nonexistent recipe returned 404 with a visible React error. Explicit Vue, edit/parse/cook/create and other-group boundaries remain Vue-owned. The frozen normal search flow separately proves narrowing to the real Garden Salad result.
补充真实浏览器 **3/3**：完整字段、真实 URL/键盘 Enter、直达刷新/参数、身份及 Vue 往返通过；食谱请求仅 GET。Loading 只延迟真实请求，empty 来自真实搜索、清空恢复真实数据、error 来自真实 404；保留模式及显式 Vue 边界继续有效。

Backend/SQLite, seed accounts, auth, profiles/context and output are isolated under `/tmp/wf6-rerun-20261014-01-S4`; original frozen assertions and backend/API/schema were unchanged. The frozen suite uses its original localhost origin, while supplemental tests use a separate fresh context at the same gateway via loopback; each test remains same-origin. Only owned backend/gateway process groups were stopped. Private raw traces retain original login/session evidence; shareable request summaries exclude passwords/cookies/bearer values and request/response bodies.
数据库/账号/auth/context 与输出均独立；冻结断言及后端未改，只停止本轮 owned 服务。原始 trace 私有保留，另提供去敏请求摘要，不替换原日志。

S3 final reply was settled as `{closure['status']}`, final_reply_included={closure['final_reply_included']}, with total **{closure['total_tokens']}**. Actual S2-S3 closed execution was 3,094.165 seconds, not the earlier provisional snapshot. S1 stays **partial** with interruption completeness/gap uncertified; no zero fill or exact upgrade. Original S1 **318 type diagnostics FAIL**, historical 315 difference retained, cause unestablished. Coverage, cost and human review time are not provided. Whole Vue unit/lint/types/coverage and full mixed-app regression were not rerun here.
S3 最终回复与实际预算尾部已封账；S1 保持 **partial** 与未知中断缺口，318 类型诊断仍单列 **FAIL**，历史 315 差异不改写。S4 未测 coverage/费用/review 时间，未重跑整套 Vue 静态库存或混合全回归。

First implementation/static/build/browser acceptance passed; **no source repair round** was used. Existing history remains in attempts and older step directories. The shared three-hour budget continues by disjoint execution turns, with between-turn waits separately excluded. Before this final reply, S4 usage and budget tail remain provisional. Future authorized S5 must perform its broader user-path/exception/detection-negative work; none is claimed done now.
首次实现与验收通过，未用源码修复轮次；预算按不重叠执行区间延续，人工等待另列。回复前用量/尾部暂存；S5 更广的异常与检测负例尚未执行。

Missing functions include editing/creation/deletion/comments, cook/parse, public/shared/other-group migration, advanced filters, images/nutrition/timeline, rich Markdown/unit-conversion parity, non-English completeness and production deployment. Basic pagination exists, but a multi-page browser scenario was not measured. Retained Vue behavior is not a React migration score. The first slice does not establish a whole-system rewrite or superiority to a larger workflow.
功能库存明确未迁移范围；基础分页已写入，但多页浏览器场景未测。保留的 Vue 行为不计 React 成果，不能据小范围成绩声称全系统重写或优于大范围 workflow。

## Evidence / 证据

- [Actual request/boundary](request-boundary.json), [S3 settlement](S3-settlement.json)
- [Source mapping](source-mapping.json), [Feature inventory](feature-inventory.json), [Test inventory](test-inventory.json)
- [Exact frozen selection](frozen-selection.json), [Frozen results](browser/frozen-results.json), [Supplemental results](browser/results.json)
- [Redacted requests/states](browser/requests-redacted.jsonl), [Original trace manifest](browser-manifest.json), [Runtime isolation](runtime-isolation.json)
- [Both build manifests](build-artifacts.json), [Served provenance](served-build.json), [Commands/raw logs](commands.jsonl), [Attempts](attempts.jsonl)
- [Source state](source-state.json), [Complete diff](diff.patch), [File hashes](file-manifest.json)
- [Shared repairs](../../source-repair-budget.json), [Budget](../../experiment-budget.json), [Usage](token-usage.json), [Transcript coverage](transcript-coverage.json)

Stop after S4; no S5. Current final_reply_included=false until terminal/next-stage reconciliation.
S4 后停止，不进入 S5；本步最终回复待终端或下步核实。
'''
    (STAGE/'result.md').write_text(text)
    docs=SOURCE/'rewrite-evidence/workflows/WF6';(docs/'S4-RESULT.md').write_text('# S4 recipe pilot / 食谱只读切片\n\nGate PASS. Strict types/lint, 8 business units, 34 route cases, fresh builds, 4 unchanged frozen selected tests and 3 supplemental real browser tests passed. Shared source repairs 0/2.\n真实列表/搜索/只读详情通过，未迁移库存明确；不代表整套 suite 或系统完成。\n\n'+f"React build `{builds['react']['build_hash']}`; Vue build `{builds['vue']['build_hash']}`.\n\n"+'[Bilingual result and raw evidence](../../../../wf6-evidence/steps/S4/result.md). S1 partial/gap and original Vue 318 FAIL retained. Stop awaiting S5.\n')
    (EVIDENCE/'PROGRESS.md').write_text('# WF6 progress / 进度\n\nS0-S4 gates PASS; S3 final usage exact_reported. S1 usage partial/gap and original 318 type diagnostics FAIL preserved.\nS1 中断计量及类型错误保留。\n\nS4 PASS: configured-group read-only recipe pilot. Shared S3/S4 source repairs 0/2. S5-S7 not executed; stop awaiting separate S5 authorization.\nS4 只读切片通过，未执行 S5，等待单独授权。\n\n[Result](steps/S4/result.md) · [Budget](experiment-budget.json) · [Usage](usage/USAGE.md)\n')
    p=EVIDENCE/'EVIDENCE_INDEX.md';old=p.read_text().split('\n## S4 real recipe')[0].rstrip();p.write_text(old+'\n\n## S4 real recipe / 真实食谱\n\n'+ '\n'.join(f'- [{name}](steps/S4/{file})' for name,file in [('Result','result.md'),('Prompt','[REDACTED]'),('Boundary','request-boundary.json'),('S3 final settlement','S3-settlement.json'),('Mapping','source-mapping.json'),('Features','feature-inventory.json'),('Tests','test-inventory.json'),('Frozen selection','frozen-selection.json'),('Frozen results','browser/frozen-results.json'),('Supplemental results','browser/results.json'),('Redacted requests','browser/requests-redacted.jsonl'),('Commands','commands.jsonl'),('Attempts','attempts.jsonl'),('Builds','build-artifacts.json'),('Served','served-build.json'),('Source','source-state.json'),('Diff','diff.patch'),('Files','file-manifest.json'),('Transcript','visible-transcript.jsonl'),('Coverage','transcript-coverage.json'),('Provider commands','provider-command-events.jsonl'),('Usage','token-usage.json')])+'\n')
    print(json.dumps(dict(gate='PASS',frozen=frozen['stats'],supplemental=supp['stats'],repairs=0,builds=metrics['builds'])))

if __name__=='__main__':main()
