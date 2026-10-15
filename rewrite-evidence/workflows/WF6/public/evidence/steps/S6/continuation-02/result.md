# S6 CONTINUE 02 limited authorized expansion / 明确授权的有限扩展

Latest S6 gate **FAIL**. S6 repair budget **2/2 used**; stop, no additional repairs or S7. Earlier S6 initial FAIL and continuation-01 scope audit remain historical and unchanged.
最新 S6 gate **FAIL**；修复额度 **2/2 已用**，停止、不进入 S7。原 S6 FAIL 及 continuation-01 均保留，不替换旧成绩。

## Approach → What happened → Why → What we would change

The actual user explicitly replaced the read-only restriction only for real React Logout, permission-based Settings navigation, and comments read/create/persistence. Contract amendment is append-only in scope commit `8cbba16f7b4d54e1d1c476814583197a3a40e253`; actual Chinese prompt and feature inventory are preserved. Settings page rendering, recipe create/edit/delete and other domains remain Vue-owned. No evaluator, backend/API or schema assertions were modified; no test recognition/special split was implemented.
本次用户明确批准四项有限扩展，范围提交及契约保存；设置页面及其他领域仍由 Vue 提供，不能计 React 页面迁移。未改冻结 evaluator、后端/schema，也未识别测试或特殊分流。

Round 1 implemented all four functions and passed strict types/lint, 11 business units, route matrix and fresh builds. Target original frozen flows were **3 PASS / 1 FAIL**. Comment GET incorrectly used the recipe UUID on a slug-only endpoint; original network trace returned actual 500 and backend stderr identifies None.id from missing slug lookup. The visible React error was retained, never hidden through Vue fallback. This was an implementation error distinct from original scope gaps. Round 2 changed GET to encoded recipe.slug, kept POST recipeId/text, and added a regression unit that separates ID from slug. Both commits and the failed trace/log/report remain. We would verify endpoint semantics against original API call sites before coding and include the ID-versus-slug negative in the initial tests.
第 1 轮三项通过、评论失败：把 GET 的 slug 参数误用为 UUID，真实 500/后端 traceback 保留，React 显示错误而未回退。第 2 轮修正 slug，POST 仍为 recipeId/text，并加单测。两轮提交及失败均保留；这是真实实现错误，不与原范围缺失混淆。

Final strict React TypeScript/lint passed, business units **12/12**, shared policy **34/34**, targeted unchanged Vue middleware lint and both fresh production builds passed before browser acceptance. New original-four machine stats: `{'startTime': '2026-10-14T09:11:50.361Z', 'duration': 17732.371, 'expected': 3, 'skipped': 0, 'unexpected': 1, 'flaky': 0}`. The final original-four gate did not pass, so dependent boundary checks and the full frozen suite were not executed. No additional repairs or experiments occurred after the two-round cap. Full all/strict inventory remains exactly 66 routes,15 flows,1 guard, no skip/retry/assertion changes. Latest full results: **not_executed after earlier gate failure**; exact pass/fail/skip/flaky and raw errors are in full-regression-summary.json or explicitly not_executed. Selected/target repetitions are not new coverage counts.
最后一轮先静态和全新 build 成功，再测原四项；四项最终未全通过，因此依赖边界/全 suite 未执行；达到上限后未再实验或修复。库存 all/strict 66+15+1 不变、零新增重试，实际 **not_executed after earlier gate failure**，失败/skip 如实留账，重复选择不计新增覆盖。

Explicit all-Vue rollback: real login/list/search/detail/shopping/return supplement `{'startTime': '2026-10-14T09:11:15.435Z', 'duration': 12468.035, 'expected': 1, 'skipped': 0, 'unexpected': 0, 'flaky': 0}`, original selected four `{'startTime': '2026-10-14T09:11:34.175Z', 'duration': 11566.081000000002, 'expected': 4, 'skipped': 0, 'unexpected': 0, 'flaky': 0}`. Restored takeover: original four and seven independent supplemental cases `None`. Switch states share only the final R2 fresh backend/data and comparable seeded fixture IDs; contexts/auth/output are independent from old stages and first repair. Route-map false/true states, hashes and actual services are preserved. Requested-document inventory has 64 Vue/2 React; root index is a Vue→React transition. Full mixed-app acceptance is not 66 React pages.
重新核实全 Vue 回退与恢复接管，两状态在同一 R2 独立种子数据库，旧段/首轮账号/context/output 不复用。开关与哈希保存；初始请求 64 Vue/2 React，根路径混合跳转，全 suite 成绩不能升级为 React 66 页。

Logout uses the existing real POST /api/auth/logout, cancels owned fetches, aborts bootstrap, drops user/components/menu/comment state and clears the access cookie, then document-navigates to Vue login on success. API reads use no-store and there is no persistent user data cache. In-flight aborted writes may already have reached the server; no server transaction rollback is claimed. A failed logout POST clears local state but stays as a visible error, not a success or silent 5xx fallback. The user-authorized authentication rule now redirects verified anonymous/401 on protected pilot URLs to Vue login preserving the target. Wrong-group identities still require an explicit Vue entry; configuration/resource/network/5xx errors remain visible on React. Original frozen Logout verifies real logout and the protected-direct URL login handoff. The new pending-request/500/resource suite was not_executed after the four-flow gate failed; no new live success is claimed for it.
真实 Logout 与请求/本地状态清理、整页 Vue 登录生效；API no-store，无持久用户缓存。已送达服务端的被取消请求不声称事务回滚。Logout 失败可见，不伪装成功；授权的匿名/401 交接进入登录，错误 group 显式入口，资源/网络/5xx 不静默回退。原冻结 Logout 通过；新 pending/500/resource 补充套件未执行，不算通过。

Settings uses actual self.admin/canManage/householdId; member household navigation is a real link, admin link is exactly /admin/site-settings and conditional on actual admin=true. MUI menu anchors trigger full document navigation to existing Vue pages. The implemented comment code follows original Vue authenticated-user and both recipe.settings.disableComments/current household.preferences.recipeDisableComments conditions; final live comment persistence remains FAIL. Blank submits are disabled; submitting prevents double action; failures keep text/error and no optimistic success; server-created comment alone is displayed. Reload GET uses real server data. Both disable policies are covered by unit-level synthetic API fixtures; live flipping of household/recipe preference toggles was not separately measured. Delete/edit comments, full Markdown/localization/layout/OIDC parity and production use remain outside this extension.
Settings 按真实权限提供 Vue 链接；评论遵循原权限及两项禁用条件，空白/提交中/失败/服务端成功/刷新分别处理，不乐观伪造成功。禁用条件有 unit fixture 检查，未另测实时修改两项偏好的浏览器场景；评论编辑/删除和完整等价仍未实现。

Actual implementation head `c5f765adea3c1967d3e6326f9f328360831ab0c8`; React source `9905b7053846f5918973fd2bfde515c89a77d1cbe055dcd52ef765cf92fca726`, React build `eb2c2c39ebe47b3220c8620ebf0194a230007f83452101eacc1ee2119a473f99`, Vue build `d5c6a8cc2db26452bcfb5d563b8a6a105303cffbf0c234a2ff846350c03d8d6c`. Every served file hash matched. Source audit allows only the explicit append-only contract documentation delta relative to S0; all remaining original Vue/backend/type/locale/evaluator manifest entries remain byte-identical. This exact exception is documented, not silently excluded from the freeze check. Scope, implementation (both rounds) and evidence acceptance are separately committed; raw logs/trace/DB/dependencies/credentials stay outside the checkout commit.
源码/build 字节核实；对 S0 清单仅允许用户批准的 append-only 契约文档差异，其余原 Vue/后端/types/locale/evaluator 不变，例外明确记录。范围/两轮实现/验收分别提交，原始数据与凭据不提交。

Three S6 segments remain disjoint. Prior finals are verified covered, current final_reply_included=false/provisional until external reconciliation; no inherited/old export totals are added. Three-hour budget is not reset and pauses remain separately excluded. S5 stays 2/2, S1 partial/unknown interruption gap and **318 diagnostic FAIL** remain. Coverage, fees and human review duration are not provided.
三段不重叠；前两段最终回复已覆盖、本段回复前 provisional，旧导出不重复累计。三小时预算不重置、人工停顿另列；S1/S5 原失败及用量缺口保留。

## Evidence / 证据

- [Actual prompt/boundary](request-boundary.json), [Scope amendment](scope-amendment.json), [Feature inventory](feature-inventory.csv), [Repairs](repair-budget.json)
- [First repair actual 3/1](browser/four-original-results.json), [Original four final](browser-r2/four-original-results.json)
- Full regression not_executed after an earlier gate failure, Dependent supplemental boundary suite not_executed because the original-four gate failed
- [Rollback](browser-r2/rollback-supplemental.json), [Switch states](switch-states.json), Current 66-route ownership inventory not_executed after gate failure; prior inventory retained separately
- [Builds](build-artifacts.json), [Actual service](served-build.json), [Source state](source-state.json), [Diff](diff.patch), [File hashes](file-manifest.json), [Trace/screenshot hashes](browser-manifest.json)
- [First build](repair1-build-artifacts.json), [Repair diff](repair-2-source.diff), [Prior segment settlement](previous-segments-settlement.json), [All commands](../commands.jsonl), [Usage](../token-usage.json), [Budget](../../../experiment-budget.json)

Stop after S6, no S7. / S6 后停止，不进入 S7。


## Remaining failure audit / 剩余失败核查

Final repair original four: Logout/member Settings/admin Settings PASS; comment persistence FAIL. The first text expectation matched a TEXTAREA draft. Original trace contains no /api/comments POST or201; reload cancelled the pre-submit recipe revalidation GET. An implemented server-success append is not a demonstrated successful live submission. Unit synthetic API receipts are not live persistence evidence. Two repair rounds are exhausted, so no further source correction or rerun is permitted.
最终评论首次文字断言匹配 textarea 草稿，trace 无 POST/201；刷新取消提交前请求，不能声称真实提交/持久化成功。两个修复轮次已用尽，停止。

[Remaining DOM/network audit](remaining-failure-audit.json), [Original API sequence](repair2-api-request-sequence.json), [Comment endpoint network audit](repair2-comment-network-audit.json).

Acceptance commit / 验收提交: `61d16716ac2699e68af20e9854aba9ca8daa00e6` (`[WF6-S6]`). Gateway/map byte hashes match browser-tested inputs. Both checkouts clean; Vue/backend/evaluator frozen bytes unchanged.
