# S6 rollback and full regression / 回退与全量回归

Overall S6 gate **FAIL**. Explicit all-Vue rollback **PASS**; restored React ownership **PASS**; complete frozen regression **FAIL**. S6 source/harness repair rounds **0/2**, separate from preserved S5 **2/2**. No S7 executed.
S6 总 gate **FAIL**；显式全 Vue 回退通过、恢复 React 归属通过；完整冻结回归 **FAIL**。S6 独立修复额度 0/2，S5 2/2 及失败全部保留；未执行 S7。

## Approach → What happened → Why → What we would change

Use the same fresh S6 backend process/SQLite and comparable original seeded identities with new independent browser contexts. Build both frontends successfully first, then select an external explicit disabled route map; restart only the owned gateway to apply it. The rollback checks run real Vue login → list/search → detail → shopping list → return/refresh. Actual Nuxt DOM is visible, React DOM absent, all observed documents identify Vue, and a bounded document count detects loops in the measured path. Supplemental rollback **1/1**, original frozen list/detail/open/search selection **4/4**. Rollback is targeted evidence, not a second complete 82-test run.
同一 S6 隔离后端/SQLite/种子身份，context 独立；先构建再显式关闭配置、重启 owned 网关。真实 Vue 路径、查询参数/hash、刷新与返回通过，Nuxt 运行、React 不运行；补充 1/1、冻结只读选择 4/4。回退没有宣称另一次全量 82 项。

Restore the exact source route map through the gateway's supported WF6_ROUTE_MAP input and restart the owned gateway; original source map never changed. Restored supplemental **4/4** proves React real business/keyboard/direct-refresh, Vue round trip, API states and all 66 requested document ownership responses. Requested document owners are **64 Vue / 2 React**; the root index begins at Vue and redirects to the React list, so route ownership includes a mixed-transition annotation. This response inventory supplements original business assertions; it does not prove 64 independent final Vue runtimes or 66 migrated React pages.
恢复原 map，源码开关文件未改；补充 4/4 验证 React/混合/状态及所有路由请求归属。初始文档 64 Vue/2 React，根 index 是 Vue→React 混合跳转，CSV 明确标注；归属不替代业务断言，也不计 66 React 页。

Run the unchanged entire evaluator at all/strict, one worker, retries 0, no grep/skip/assertion edits. Inventory asserts exactly 66 route cases + 15 flow cases + 1 guard before execution. Actual **routes 66/66 PASS, 0 FAIL; flows 11/15 PASS, 4 FAIL; guard 1/1 PASS**. All category skip/flaky counts and runner errors are in full-regression-summary.json. Original exit code and failures remain unchanged; hybrid scores are not a React whole-system migration score. Frozen flows by path attribution: React 2 PASS / 1 FAIL, Vue 7 PASS / 0 FAIL, mixed 2 PASS / 3 FAIL. These disjoint counts total the 15 flows; Vue successes do not add React migrated features.
冻结 flow 按路径分列：React 2 通过/1 失败、Vue 7 通过/0 失败、混合 2 通过/3 失败，合计 15 项。
原冻结 suite all/strict、单 worker、零重试；库存先核实 66+15+1，未 grep/跳过/改断言。实际 routes 66/66、flows 11/15、guard 1/1；失败、退出码、skip/flaky 均保留。混合成绩不代表 React 全站迁移。

### Retained failures / 保留失败

- `[flow] log out ends the session`: **FAIL**, scope_gap. React pilot has no Logout control/full Vue layout; original flow requests Logout on React list.
- `[flow] a regular member is not offered admin pages`: **FAIL**, scope_gap. React pilot has no Settings menu/household navigation expected by original flow.
- `[flow] an admin is offered admin pages`: **FAIL**, scope_gap. React pilot has no Settings menu/admin navigation expected by original flow.
- `[flow] comment on a recipe and see it after reload`: **FAIL**, scope_gap. Configured detail is React read-only; original comment textbox/Submit is absent. Comments remain accessible through explicit Vue entry, not on React pilot.

Known missing controls are pilot/layout scope gaps, while their full-suite results remain FAIL. They are not expected-failure injection and are not marked PASS. No write feature or full layout is added to make this step green. Unknown additional failures stay unknown pending evidence. We would plan full navigation/logout parity and an explicit route policy for comment workflows before expanding the migration; changing original assertions or silently routing these tests to Vue would invalidate the yardstick. Current explicit Vue entry is useful but does not make original React-URL expectations pass.
已知缺少控件归类为 pilot/layout 范围缺失，但冻结成绩仍 FAIL，不能与 S5 预期故障注入混淆。未扩展写功能/布局、未改断言或静默回 Vue；后续需要明确导航/退出及评论范围策略。显式 Vue 入口存在不等于原测试已经通过。

Accepted application source `a4487ac3e1331cd116d08dcca41cc8de23a5eb2b`; React build `2b409d4deadf1bc17acc5a4a6634e638feca52550caec23a7d6f23f6dd1493f8`, compiled React source `a29595c8ae1bce60b3db08a9185cbc40046c83fc224ece095bec30d2f487a7af`, Vue build `3520a9f725c01e2c0a431a38299152d667b7f304b98f4f35f39054094e7bc231`. Switch configs, SHA256 and actual service states are preserved. All original Vue/backend/evaluator manifest bytes unchanged; postcommit audit will establish the evidence-only S6 acceptance commit. Both frontends' build/types/lint/unit inventories are listed separately for both states. React strict/lint 8/8 units and policy 34/34 passed S6; Vue boundary lint passed, whole Vue units/lint/typecheck were not rerun as new S6 measurements. S1 **318 diagnostics FAIL** and historical 315 comparison retained.
实际源码与两套 build/React source hash、配置和服务状态均保存；冻结原 Vue/后端/evaluator 字节不变。两种状态分别列静态库存；Vue 全量静态没有重测冒充通过，S1 类型 FAIL 与历史差异保留。

S5 final usage is exact_reported with final_reply_included=true, total **5684437**. S1 remains partial with unknown interruption completeness/gap and no zero fill. Three-hour budget includes this step's execution/tool waits and preserves closed earlier tails; between-user-turn pauses are excluded and review duration is not inferred. Before final reply S6 usage and budget tail remain provisional. Coverage, monetary cost and human review time are not provided. Backend/data/auth/contexts/output are independent of previous steps; both switch states share this S6 backend only. Owned services are stopped; original private logs/traces and separate redacted summaries are retained. No upstream remotes/PRs or other workflows/report files were modified.
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

Acceptance commit / 验收提交: `e225779cadb9dde291a3aeaca1ef688c5a4905ec` (`[WF6-S6]`). Gateway/map byte hashes match browser-tested inputs. Both checkouts clean; Vue/backend/evaluator frozen bytes unchanged.

<!-- WF6-USAGE -->
## Provider usage / Provider 用量

Status: provisional; final_reply_included=False

input_tokens=6552668 | cached_input_tokens=6392192 | cache_write_input_tokens=0 | output_tokens=21176 | reasoning_output_tokens=3406 | total_tokens=6573844

Authoritative source: token-usage.json and ../../usage/usage-ledger.json. Values replace earlier exports, never add to them.
