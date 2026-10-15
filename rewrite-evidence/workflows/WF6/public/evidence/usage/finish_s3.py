"""Audit the accepted skeleton and write bilingual S3 results without claiming business migration."""
import datetime as dt
import hashlib
import json
from pathlib import Path
import sys
import finish_s2
from record_command import EVIDENCE,ROOT
from run_s1 import SOURCE,EVALUATOR

STAGE=EVIDENCE/'steps/S3'

def report():
    artifacts=json.loads((STAGE/'build-artifacts.json').read_text())
    browser=json.loads((STAGE/'browser/results.json').read_text())
    assert browser['stats']['expected']==4 and browser['stats']['unexpected']==0 and browser['stats']['skipped']==0 and browser['stats']['flaky']==0
    requests=[json.loads(l) for l in (STAGE/'browser/requests-redacted.jsonl').read_text().splitlines()]
    assert len(requests)==5 and all(r['status']=='PASS' for r in requests)
    state=json.loads((STAGE/'source-state.json').read_text());assert not state['evaluator']['dirty']
    commands=[json.loads(l) for l in (STAGE/'commands.jsonl').read_text().splitlines()]
    for label in ['S3-React-strict-TypeScript','S3-shared-route-policy-matrix','S3-React-production-build','S3-Vue-boundary-production-build','S3-Vue-boundary-targeted-lint','S3-gateway-protocol-fixture']:
        assert any(r['label']==label and r['exit_code']==0 for r in commands),label
    repair=json.loads((EVIDENCE/'source-repair-budget.json').read_text());assert repair['used']==0
    versions=json.loads((STAGE/'dependency-versions.json').read_text())['versions']
    metrics=dict(run_id=ROOT.name,stage='S3',gate='PASS',scope='Real coexistence technical skeleton only; no recipe API/list/search/detail business implementation',
        browser_stats=browser['stats'],route_policy_tests=34,protocol_tests=1,react_strict_types='PASS',vue_boundary_lint='PASS',
        react_build_hash=artifacts['react']['build_hash'],vue_build_hash=artifacts['vue']['build_hash'],react_source_hash=artifacts['react']['source_hash'],
        versions=versions,repair_budget=repair,checks=[r['test'] for r in requests],
        inherited_type_diagnostics=dict(status='FAIL',current=318,historical=315,cause='Not established'),S1_usage='partial; earlier interrupted segment gap retained',
        not_executed=['S4 business implementation','full frozen 66 routes/15 flows in skeleton mode','whole Vue typecheck/lint/unit remeasurement','React full feature coverage','production/TLS/OIDC/long-lived refresh'],cost=None,human_review_time=None)
    (STAGE/'measurements.json').write_text(json.dumps(metrics,indent=2)+'\n')
    text=f'''# S3 real coexistence skeleton / 真实共存骨架

Run `{ROOT.name}`. Gate **PASS**. Only S3; no S4 business pages. S3/S4 shared source repairs: **0/2 used**.
Gate **PASS**；仅 S3 技术骨架，未实现 S4 业务页。共享源码修复 **0/2**。

## Approach → What happened → Why → What we would change

Build a minimal Vite/React 19, strict TypeScript, React Router, MUI, react-i18next probe. All package versions and npm lockfile are frozen from anonymous public metadata, with dependencies under the independent Linux `/tmp/wf6-rerun-20261014-01-S3/deps`. React assets use `/_wf6/`; visible provenance is rendered by the actual React build and includes its compiled source hash. React uses real BrowserRouter/Link APIs; Vue crossing uses the sole new wf6-boundary.global.ts middleware and document navigation. No original Vue page/component, backend/API/schema or frozen evaluator assertion changed.
最小骨架使用指定 target stack，依赖版本及 lock 固定；真实 React 渲染来源标记。Vue 只新增一个边界 middleware，原页面/组件、后端及冻结断言未改。

Gateway and Vue import one route-policy.mjs and consume one route map. Only configured `home` list and single-slug detail routes are React-owned, before any backend metadata HTML route. Create and descendants, shared pages, other groups, edit/parse/cook modes and explicit `wf6=vue` remain Vue-owned. Query/hash are preserved across document transitions and explicit Vue entries. Enabled React failures are visible rather than silently served as Vue. Config is fixed to the freshly seeded user's real group; identity is independently checked through real /api/users/self.
网关与 Vue 使用同一 map 与接管函数；配置 group 限定列表/单 slug 详情，排除创建/共享/其他 group/保留模式及显式 Vue 入口。接管在后端 HTML metadata 之前决策；真实身份/group 另行校验。

React strict TypeScript passed. Shared policy matrix: **34/34**. Independent transport fixture passed (not a real-backend score). Both fresh production builds passed, followed by targeted Vue middleware lint. Vue build `{artifacts['vue']['build_hash']}`; React build `{artifacts['react']['build_hash']}`; React compiled source `{artifacts['react']['source_hash']}`. Every served asset was SHA256-verified against its new build before browser launch.
React strict TS、34 项路由矩阵、补充传输检查、两套新 build 与 middleware lint 均通过；浏览器启动前逐文件核实服务字节。

Real Chromium browser checks: **4/4**, zero skips/retries. The tests proved: Vue UI login enters React by a new document; React Link detail navigation keeps the same document; React shopping link loads Vue in a new document; an existing visible frozen Vue anchor returns to React through middleware with another document. Real user id/group remain correct. Direct detail URL, query/hash and refresh retain identity and actual React build provenance. Both Vue and React asset prefixes and document request/source hashes are recorded at one origin.
真实浏览器 **4/4**、零跳过/重试：Vue 登录→React→Vue 购物清单→经已有 Vue 链接返回 React，跨边界均为新 document；React 内部 Link 不换 document。身份/group、直达/刷新、query/hash 与两套真实资源来源均验证。

HTTP boundary cases confirmed Vue-owned create/descendants/shared/other group/edit/parse/cook/explicit Vue and React-owned pilot HTML from the actual builds. Anonymous and expired-token sessions received real 401 and exposed an explicit Vue entry retaining target query/hash, with bounded document navigation and no authenticated identity UI. A real additional account in the seeded second group received /api/users/self 200 with a different group; React refused it, offered Vue, and displayed no authenticated/pilot navigation. No intercepted/mock session or recipe data was used for browser acceptance.
真实边界检查涵盖全部保留路径。匿名/过期 token 得到真实 401 后显式回交 Vue；真实第二 group 账号得到 self 200 但被 pilot 拒绝，无错误 group 的认证 UI 或导航。未使用 mock 会话/食谱数据冒充验收。

S2 final reply coverage was settled as exact_reported: input 8,195,770; cached 8,108,416; output 33,264; reasoning 8,894; total 8,229,034. S1 stays **partial**, final reply covered but earlier interruption completeness/missing quantity uncertified; no zero fill or upgrade. Its original **318 diagnostics FAIL** and historical **315** comparison remain separate, with causality unestablished. This step does not assert the whole Vue checker passing or a full business suite passing.
S2 最终回复已计入并封账；S1 保持 **partial**，中断缺口不补零或升为 exact。318 类型诊断仍单列 **FAIL**，历史 315 差异原因未建立；不宣称完整 Vue types 或业务 suite 通过。

The three-hour budget continues from S2. S2 execution closed at 1,349.765 seconds; the 439.054-second between-turn interval is recorded separately and excluded, without inferring human review activity. S3 begins at the actual request 2026-10-14T04:31:30.756Z. Budget and current S3 usage remain provisional before this final reply. No application/source repair round was consumed; one evidence-helper invocation failed because python -c lacked its module path, was preserved, and rerun through the explicit helper script. This is not a hidden application repair.
预算延续 S2，不重置；阶段间 439.054 秒等待单列排除，不推断人工 review。S3 从本次实际请求起算，回复前预算与用量暂存。一次证据脚本导入路径失败已保留并修正，不是应用源码修复轮次。

The skeleton proves coexistence/session routing, not migrated recipes. S4 list/search/read-only details, complete routes/flows, accessibility breadth, long-lived refresh/OIDC and production behavior are not established. Costs and human review time not provided. Future authorized S4 should implement the business slice inside this verified boundary and keep the remaining two shared source-repair rounds explicit.
骨架仅证明共存/会话边界，不计食谱迁移成果。S4、完整业务回归、长期会话及生产行为未建立；费用/review 时间未提供。后续需单独授权，继续共用两轮源码修复上限。

## Evidence / 证据

- [Actual request/boundary](request-boundary.json), [S2 final settlement](S2-settlement.json)
- [Pinned dependency versions](dependency-versions.json), [Both build manifests](build-artifacts.json), [Actually served identities](served-build.json)
- [Original commands/logs](commands.jsonl), [Attempts and classification](attempts.jsonl)
- [Browser machine result](browser/results.json), [Redacted session/document evidence](browser/requests-redacted.jsonl), [Original private traces](browser/test-results/)
- [Supplemental test source/config](supplemental-tests/), [Isolation](runtime-isolation.json)
- [Source state](source-state.json), [Full diff including Vue middleware](diff.patch), [Files/hashes](file-manifest.json)
- [Shared source repairs](../../source-repair-budget.json), [Execution budget](../../experiment-budget.json), [Provider usage](token-usage.json), [Transcript coverage](transcript-coverage.json)

Official API references consulted: [React Router declarative setup](https://reactrouter.com/start/declarative/installation), [Vite public base](https://vite.dev/config/shared-options.html#base), [MUI installation](https://mui.com/material-ui/getting-started/installation/). Actual correctness evidence is the commands/builds/browser above.
所阅官方 API 文档列于上方，实际验收以本次构建和浏览器证据为准。

Stop after S3. Current final_reply_included=false until terminal/next-stage settlement; S4 not executed.
S3 后停止，本步最终回复待核实；不自动执行 S4。
'''
    (STAGE/'result.md').write_text(text)
    docs=SOURCE/'rewrite-evidence/workflows/WF6';(docs/'S3-RESULT.md').write_text('# S3 coexistence skeleton / 共存骨架\n\nGate PASS. Strict React types, 34 route cases, two fresh builds and 4 real browser tests passed. Shared S3/S4 source repairs: 0/2.\n真实双向整页导航、会话/group、路由排除与匿名/过期/不同 group 回交通过；仅骨架，未迁移业务。\n\n'+f"Vue build `{artifacts['vue']['build_hash']}`; React build `{artifacts['react']['build_hash']}`.\n\n"+'[Bilingual result and raw evidence](../../../../wf6-evidence/steps/S3/result.md). Raw traces/data/credentials remain outside Git. S1 stays partial; original Vue types 318 FAIL retained. Stop awaiting S4.\n')
    (EVIDENCE/'PROGRESS.md').write_text('# WF6 progress / 进度\n\nS0/P1/S1/S2 gates PASS; S2 final usage exact_reported. S1 usage partial with earlier interruption gap; original Vue type diagnostics 318 FAIL retained.\nS1 中断计量与类型错误保留。\n\nS3 PASS: real dual-frontend technical skeleton and boundaries. S3/S4 shared source repairs 0/2. S4-S7 not executed; stop awaiting S4 authorization.\nS3 仅共存探针通过，未扩展业务，停止等待 S4。\n\n[Result](steps/S3/result.md) · [Budget](experiment-budget.json) · [Source repairs](source-repair-budget.json) · [Usage](usage/USAGE.md)\n')
    p=EVIDENCE/'EVIDENCE_INDEX.md';old=p.read_text().split('\n## S3 real coexistence')[0].rstrip();p.write_text(old+'\n\n## S3 real coexistence / 真实共存\n\n'+ '\n'.join(f'- [{name}](steps/S3/{file})' for name,file in [('Result','result.md'),('Prompt','[REDACTED]'),('Boundary','request-boundary.json'),('S2 final usage','S2-settlement.json'),('Commands','commands.jsonl'),('Attempts','attempts.jsonl'),('Dependencies','dependency-versions.json'),('Two builds','build-artifacts.json'),('Served provenance','served-build.json'),('Browser results','browser/results.json'),('Session/document summary','browser/requests-redacted.jsonl'),('Source','source-state.json'),('Diff','diff.patch'),('Files','file-manifest.json'),('Transcript','visible-transcript.jsonl'),('Coverage','transcript-coverage.json'),('Provider commands','provider-command-events.jsonl'),('Usage','token-usage.json')])+'\n')
    print(json.dumps(dict(gate='PASS',browser=browser['stats'],route_cases=34,source_repairs=0,builds={r:artifacts[r]['build_hash'] for r in ['vue','react']})))

if __name__=='__main__':
    if sys.argv[1]=='snapshot':finish_s2.STAGE=STAGE;finish_s2.snapshot()
    elif sys.argv[1]=='report':report()
