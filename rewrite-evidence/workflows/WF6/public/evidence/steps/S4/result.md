# S4 real recipe pilot / 真实食谱只读切片

Run `wf6-rerun-20261014-01`. Gate **PASS**. S4 only; stop before S5. Shared S3/S4 source repairs: **0/2**.
Gate **PASS**；仅 S4，停止等待 S5 单独授权。共享源码修复 **0/2**。

## Approach → What happened → Why → What we would change

Implement the configured authenticated group's React list, real server search, keyboard-accessible React Router recipe links and read-only detail. Use a new independent fetch adapter for /api/recipes and /api/recipes/{slug}, with real /api/users/self revalidation before every recipe request. Refuse changed identity/group and reject returned recipes outside the verified group. Reuse only unchanged generated recipe types and 11 original en-US labels; no Nuxt composable runs as a React hook. Source mapping and hashes are in source-mapping.json. Vue remains responsible for non-pilot routes and write features.
实现配置 group 的真实列表、服务端搜索、键盘链接及只读详情；每次食谱请求前重新校验 self 与身份/group，拒绝身份变化或错误 group 数据。仅复用未修改生成类型及原 en-US 标签，不把 Vue 功能计作 React 成果。

Strict React TypeScript and lint passed, with **8/8 new business unit checks**, **34/34 shared route-policy cases**, independent transport fixture and targeted unchanged Vue middleware lint. Both fresh builds succeeded before browsers. React build `2b409d4deadf1bc17acc5a4a6634e638feca52550caec23a7d6f23f6dd1493f8`; Vue build `fbc34ee482a08eeb1d42e24054537674ab1ec6fc8afa51c5bed7e08d61114f66`; compiled React source `a29595c8ae1bce60b3db08a9185cbc40046c83fc224ece095bec30d2f487a7af`. Accepted bytes were SHA256-verified in the independent native S4 runtime. The build logged a nonfatal chunk-size warning at 535.55 kB; raw warning retained, threshold unchanged. No performance improvement or production-readiness claim is made.
strict types、lint、8 项新增业务 unit、34 项共用路由检查及两套新 build 均通过；先核实服务字节再启动浏览器。535.55 kB chunk 的非致命构建 warning 保留，未改阈值或声称性能/生产就绪。

The unchanged frozen evaluator selected exactly **4 tests**: configured list route, detail route, original open flow and original search flow. Selection inventory asserted two routes/two flows before execution; all **4/4 passed**, zero skips/retries, with original strict assertions. Test IDs, titles, grep and precise commands are preserved in frozen-selection.json and browser/frozen-results.json. This is not a new 66-route/15-flow suite score.
冻结 evaluator 先核实选择库存，再运行原列表/详情 route 和 open/search flow，**4/4**，零跳过/重试、未修改断言；不是完整 66 routes/15 flows 成绩。

The supplemental real-browser suite passed **3/3**. It proved real names/ingredients/instructions/tools/categories/tags, real recipe URL and keyboard Enter navigation, direct detail/refresh/query/hash, current identity, React→Vue shopping lists→React with new documents, and GET-only recipe requests. It verified loading by delaying an actual request without replacing the success response; real server search returned empty items, clearing restored both seeded recipes, and a real nonexistent recipe returned 404 with a visible React error. Explicit Vue, edit/parse/cook/create and other-group boundaries remain Vue-owned. The frozen normal search flow separately proves narrowing to the real Garden Salad result.
补充真实浏览器 **3/3**：完整字段、真实 URL/键盘 Enter、直达刷新/参数、身份及 Vue 往返通过；食谱请求仅 GET。Loading 只延迟真实请求，empty 来自真实搜索、清空恢复真实数据、error 来自真实 404；保留模式及显式 Vue 边界继续有效。

Backend/SQLite, seed accounts, auth, profiles/context and output are isolated under `/tmp/wf6-rerun-20261014-01-S4`; original frozen assertions and backend/API/schema were unchanged. The frozen suite uses its original localhost origin, while supplemental tests use a separate fresh context at the same gateway via loopback; each test remains same-origin. Only owned backend/gateway process groups were stopped. Private raw traces retain original login/session evidence; shareable request summaries exclude passwords/cookies/bearer values and request/response bodies.
数据库/账号/auth/context 与输出均独立；冻结断言及后端未改，只停止本轮 owned 服务。原始 trace 私有保留，另提供去敏请求摘要，不替换原日志。

S3 final reply was settled as `exact_reported`, final_reply_included=True, with total **9499827**. Actual S2-S3 closed execution was 3,094.165 seconds, not the earlier provisional snapshot. S1 stays **partial** with interruption completeness/gap uncertified; no zero fill or exact upgrade. Original S1 **318 type diagnostics FAIL**, historical 315 difference retained, cause unestablished. Coverage, cost and human review time are not provided. Whole Vue unit/lint/types/coverage and full mixed-app regression were not rerun here.
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

Acceptance commit / 验收提交: `b977deed0fec5de86bee28a5cacc5f99ed5ced53` (`[WF6-S4]`). Gateway/map byte hashes match browser-tested inputs. Both checkouts clean; Vue/backend/evaluator frozen bytes unchanged.

<!-- WF6-USAGE -->
## Provider usage / Provider 用量

Status: exact_reported; final_reply_included=True

input_tokens=6687491 | cached_input_tokens=6595328 | cache_write_input_tokens=0 | output_tokens=46028 | reasoning_output_tokens=20539 | total_tokens=6733519

Authoritative source: token-usage.json and ../../usage/usage-ledger.json. Values replace earlier exports, never add to them.
