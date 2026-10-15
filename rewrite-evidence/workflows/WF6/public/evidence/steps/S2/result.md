# S2 all-Vue gateway / 全 Vue 同源网关

Run `wf6-rerun-20261014-01`. Gate **PASS**. React takeover disabled; no React build or middleware installed. All page routing remains Vue-owned.
Gate **PASS**；React 接管关闭，未安装 React 或 Vue 边界 middleware，全部页面仍由 Vue 提供。

## Approach → What happened → Why → What we would change

Write a loopback Node HTTP gateway and one route map. Stream API/media requests to a fresh isolated FastAPI/SQLite backend. Serve the fresh unchanged Vue build, preserve proxy status/method/body/query/cookies and separate Set-Cookie headers, and distinguish missing assets from document history fallback. HTML/asset headers identify Vue and the verified build. The gateway refuses enabled React configuration in S2 rather than accepting unimplemented ownership.
新增 Node 网关与统一 route map；API/媒体流式转发，Vue 静态资源与 HTML fallback 分开；配置拒绝尚未实现的 React 接管。状态、请求体及会话透传均验证。

Fresh Vue generation passed before browser acceptance. Build SHA256 `af9a32e7318fd2c82d289f49f335d13168ddb476bf3d0ec152834ebc6f14c914`; actual build HEAD `f318d69d033e5269415f0b94d4beebd8d70a00dc`. Assets were copied byte-for-byte to `/tmp/wf6-rerun-20261014-01-S2/static`. Git source/evaluator original manifest files remain unchanged; actual gateway hash is in served-build.json. Independent ports 9106/9006 were bind-checked before startup. SQLite, auth, browser context/profile and output are independent of S1 and older runs. Only verified owned process groups are stopped.
先完成新构建并逐文件核实原生目录副本，再启动浏览器。端口启动前检查；数据库、auth、context/profile 与输出均独立，源码和 evaluator 冻结文件未变。

The actual Chromium acceptance test passed, with zero skips/retries. It performed real UI login and /api/users/self identity/group checks, recipe list/card/detail with seeded ingredients/instructions/tool/category/tag, Vue shopping-list index/detail, direct detail URL plus preserved query/hash, refresh, and return to the recipe list. All observed document/asset requests identify Vue and the fresh build, and browser application requests share one gateway origin. Supplemental transport checks passed with a separate synthetic backend, including POST bodies, cookie forwarding, two Set-Cookie headers, status 418, HEAD and missing JS/CSS/image 404. Synthetic checks are not counted as real browser/API acceptance.
真实 Chromium 测试通过，无跳过或重试；经 Vue 登录验证真实身份/group、食谱与购物清单、直达与刷新、query/hash 保留及同源请求。补充传输 fixture 单列，不冒充真实后端验收。

S1 latest final reply is covered, but the earlier interrupted segment has no final END/completion, so phase-wide usage stays **partial**, missing quantity unknown. Known reported S1 usage: {'input_tokens': 30194364, 'cached_input_tokens': 29885568, 'cache_write_input_tokens': 0, 'output_tokens': 114262, 'reasoning_output_tokens': 61765, 'total_tokens': 30308626}. Provider response deduplication and disjoint turn accounting remain; snapshots/old exports are not added. Original 318 Vue type diagnostics remain **FAIL**; historical raw log has 315 (+3 difference), cause not established. Exact first-line sets and hashes are retained separately. These diagnostic differences precede any S2 application changes and cannot be called gateway regressions.
S1 最新最终回复覆盖已核实，早前中断段完整性未认证，所以总账保持 **partial**，缺失量未知。318 类型诊断仍单列 **FAIL**；历史原始日志 315，差 +3，准确原因未建立，不能认定网关引入回归。

Build tooling automatically recreated Linux node_modules after the changed case alias and restored dependencies from the existing lockfile; raw logs remain. Package manifests/lockfile stayed frozen. The trigger for recreation was not independently proven; path/config differences are a hypothesis. The wait is charged to S2, not preparation. No S2 application repair round was needed by the accepted tests. Future stages must explicitly authorize ownership changes and verify real cross-framework navigation/session behavior.
目录大小写变化后，构建工具自动重建依赖（准确触发原因未独立证实），原始日志保留，冻结 manifest/lockfile 未变；等待计入 S2。验收未使用源码修复轮次；跨框架行为留待单独授权步骤。

The three-hour S2-S6 model/tool budget starts at actual request 2026-10-14T04:01:41.937Z; experiment-budget.json tracks only execution segments and excludes S0/preparation/S1 and between-turn human pauses. Before this final reply, budget and S2 usage are provisional. Costs/human review time not provided. Targeted S2 tests do not claim a new 66-route/15-flow suite run, React migration, production/TLS/WebSocket readiness or S3 completion.
预算从本次实际请求起算，排除先前步骤及人工停顿；回复前时间与用量均暂存。未重跑的完整冻结 suite 不算通过，无 React 成果或生产就绪结论。

## Evidence / 证据

- [Actual request/boundary](request-boundary.json), [S1 settlement](S1-settlement.json)
- [Fresh build](build-artifact.json), [Served build/source attribution](served-build.json)
- [Commands and original English logs](commands.jsonl), [Attempts](attempts.jsonl)
- [Browser machine report](browser/results.json), [Redacted request/session summary](browser/requests-redacted.json), [Original trace](browser/test-results/)
- [Supplemental test source/config](supplemental-tests/), [Runtime isolation](runtime-isolation.json)
- [Source state](source-state.json), [Actual diff](diff.patch), [Hashes](file-manifest.json)
- [Type difference](../S1/type-history-comparison.md), [Raw diagnostic comparison](../S1/type-history-comparison.json)
- [Visible transcript coverage](transcript-coverage.json), [Usage](token-usage.json), [Budget](../../experiment-budget.json)

Stop after S2; await a separate S3 prompt. S2 final_reply_included=false until terminal/next-step settlement.
S2 后停止，等待单独 S3 指令；本步最终回复待终端或下步核实。

Acceptance commit / 验收提交: `f2a2bd95327c91b85ff4c690811a4f0ab08f4c87` (`[WF6-S2]`). Gateway/map byte hashes match browser-tested inputs. Both checkouts clean; Vue/backend/evaluator frozen bytes unchanged.

<!-- WF6-USAGE -->
## Provider usage / Provider 用量

Status: exact_reported; final_reply_included=True

input_tokens=8195770 | cached_input_tokens=8108416 | cache_write_input_tokens=0 | output_tokens=33264 | reasoning_output_tokens=8894 | total_tokens=8229034

Authoritative source: token-usage.json and ../../usage/usage-ledger.json. Values replace earlier exports, never add to them.
