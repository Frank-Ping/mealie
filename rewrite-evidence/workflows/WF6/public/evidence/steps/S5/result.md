# S5 user journey and detection / 用户路径与故障检测

Gate **PASS**. S5 only; no S6. S5 repair allowance **2/2 used**, both harness fixes, zero application-source changes. A further S5 failure would stop without another repair.
Gate **PASS**；仅 S5，未执行 S6。S5 修复额度 **2/2 已用**，均为补充验收 harness；未修改应用。达到上限后不得再修复。

## Approach → What happened → Why → What we would change

Fresh React/Vue builds and strict React types/lint, 8 business units, 34 route cases and targeted Vue boundary lint passed before browser acceptance. Exact frozen four-test selection remained unchanged; the latest run passed **4/4**. Independent supplemental checks passed **8/8**, zero skipped/flaky/retries. This does not claim the complete 66-route/15-flow suite, coverage or production readiness. Actual application source at test time: `b977deed0fec5de86bee28a5cacc5f99ed5ced53`. React source `a29595c8ae1bce60b3db08a9185cbc40046c83fc224ece095bec30d2f487a7af`, React build `2b409d4deadf1bc17acc5a4a6634e638feca52550caec23a7d6f23f6dd1493f8`, Vue build `cb2b9a5e0868eb5c5616d7c9996b5d57e7f59fa2297cf1ebeaaf1c655fd40b8c`. All served file hashes and build command identities were audited against the new S5 artifacts, and application byte hashes remain the accepted S4 inputs.
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

S4 settled `exact_reported`, final_reply_included=true, total 6733519. S1 remains partial with unknown interruption coverage gap, no zero fill, and original **318 diagnostics FAIL**, historical 315 (+3) comparison/cause limitations retained. Three-hour budget continues in disjoint turns; between-turn wait is separately excluded. S5 final reply and budget tail are provisional until terminal/next-step reconciliation. Coverage, cost and human review duration: not provided.
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

Acceptance commit / 验收提交: `a4487ac3e1331cd116d08dcca41cc8de23a5eb2b` (`[WF6-S5]`). Gateway/map byte hashes match browser-tested inputs. Both checkouts clean; Vue/backend/evaluator frozen bytes unchanged.

<!-- WF6-USAGE -->
## Provider usage / Provider 用量

Status: exact_reported; final_reply_included=True

input_tokens=5656914 | cached_input_tokens=5552256 | cache_write_input_tokens=0 | output_tokens=27523 | reasoning_output_tokens=7181 | total_tokens=5684437

Authoritative source: token-usage.json and ../../usage/usage-ledger.json. Values replace earlier exports, never add to them.
