# S6 CONTINUE 01: existing explicit Vue recovery / 已有显式 Vue 功能核查

S6 overall gate **FAIL retained**. Explicit recovery checks **4/4 PASS**, selected unchanged read-only frozen checks **4/4 PASS**. Application source unchanged; S6 repair counter remains **0/2**, S5 **2/2** unchanged. No S7 executed.
S6 总 gate **仍为 FAIL**；已有显式 Vue 功能补充 **4/4**、冻结只读选择 **4/4** 通过。应用未改，S6 修复仍 **0/2**、S5 **2/2** 保留；未执行 S7。

## Approach → What happened → Why → What we would change

Inspect each original failure trace byte-for-byte, its failed action, actual Vue-login/React document responses and visible snapshot. All four traces contain the existing explicit Vue entry, but the original frozen flow never selects it before waiting for Logout, Settings or comment controls on React. Trace SHA256 and document/action locators are in original-trace-review.json. Prior commit `e225779cadb9dde291a3aeaca1ef688c5a4905ec`, original full report/4 failures and logs remain unmodified; pre-continuation top-level exports are preserved here under prior-* filenames.
逐项核对四个原 trace、失败动作和快照；已有入口均在页面，但冻结 flow 没有点击它。原 trace、四项失败、原提交及原报告保留，续跑前导出单独保存。

With a fresh isolated S6-C1 backend/database/auth/context, build the same unchanged application, then exercise the existing general-purpose explicit Vue link. Each transition has a real document response identifying Vue and its build, Nuxt runtime visible, React runtime absent and a new document identity. No test-specific routing, automatic fallback, evaluator modification or new React write UI is used.
新建独立续跑后端/数据库/auth/context，从未改应用构建；通用显式入口有实际 Vue document/build、新文档与 Nuxt 执行证据，无测试特殊分流、静默回退或新 React 写功能。

| Original failure / 原失败 | Existing functionality checked / 已有功能实测 | Frozen status / 冻结成绩 |
|---|---|---|
| Logout | Explicit entry → existing Vue Logout → actual login URL; later React detail gets real 401, no recipe data, then explicit Vue login | FAIL retained: original flow expects Logout on React and automatic login redirect on later direct URL |
| Member Settings | Explicit entry → Vue Settings; household link visible, admin links absent for real member identity | FAIL retained: original flow looks for Settings directly on React list |
| Admin Settings | Explicit entry → Vue Settings → real Site Settings heading | FAIL retained: original flow looks for Settings directly on React list |
| Comments | Explicit detail entry preserves query/hash → original Vue textbox/Submit → actual POST 201 → visible comment after reload → existing group link returns React | FAIL retained: original flow expects a comment textbox on read-only React detail |

These results refine the scope diagnosis: capabilities remain usable in Vue through a deliberate user action; the whole frozen flow is not equivalent on the React URL. Supplying comments directly on React would expand write scope. Making the original logout/Settings expectations pass requires new React authentication/full-layout behavior or changing the original path, rather than repairing the already-working boundary. Neither is authorized as a boundary repair here. A navigation-only new link would not replace the required original menu or logout assertions. The existing explicit Vue paths are therefore recorded as supplemental PASS, not substituted into evaluator results. We would agree explicit migration/navigation scope and future parity requirements before extending the pilot.
这些功能并未从混合应用丢失：需要用户明确进入 Vue。补充路径通过不等于原 React URL flow 等价。评论直接写入 React 超出范围；Logout/Settings 原断言要求新增 React 认证/完整布局行为或修改原执行路径，不是修复已通过的边界。本次不擅自扩展、不把新导航链接替换原菜单/退出断言，也不把补充 PASS 替换冻结 FAIL；未来扩展前应明确布局/认证范围。

Fresh strict React types/lint, business units **8/8**, shared route policy **34/34**, targeted Vue middleware lint and both builds passed before browser checks. Actual source `e225779cadb9dde291a3aeaca1ef688c5a4905ec`, React source `a29595c8ae1bce60b3db08a9185cbc40046c83fc224ece095bec30d2f487a7af`, React build `2b409d4deadf1bc17acc5a4a6634e638feca52550caec23a7d6f23f6dd1493f8`, Vue build `65f086f03f54a76585c488e2b0631a9bf9301fc1f6deaa4b923d523ad1ed06dd`. Every served file and application source hash matched. Original Vue/backend/evaluator manifest files remain unchanged. No source repair was needed and no full 82-test repeat was run: initial S6 strict result remains **66 routes PASS, 11 flows PASS / 4 FAIL, guard PASS** on its original build. This segment's new build has the separately measured four read-only and four explicit Vue checks; it is not assigned the old full-suite score as a new run.
先静态检查及两套新构建成功，再测浏览器；所有服务字节和源码哈希核实，冻结原 Vue/后端/断言未改。无需源码修复；未把旧 82 项成绩套到新 build，旧全回归仍 66/11/1 与四 FAIL，本段仅测四项只读与四项显式 Vue 功能。

Original first S6 final reply is provider-covered and its exact segment total is **7,711,295**. CONTINUE has its own verified request/turn identity and disjoint segment; the closed-to-CONTINUE wait is excluded from the three-hour budget, not treated as review time. Old exports remain historical and are not added to the replacement current total. Current final reply/usage remains provisional and final_reply_included=false until external reconciliation. S1 stays partial with unknown interruption gap and original **318 diagnostics FAIL**; S5 failures/repair counts remain. Costs, coverage and review duration are not provided.
上一 S6 最终回复覆盖已核实；CONTINUE 单独身份和不重叠 segment，等待另列、旧导出不重复相加。回复前当前累计 provisional；S1 partial/中断缺口/318 FAIL 和 S5 失败额度均不改。费用/coverage/review 未提供。

## Evidence / 证据

- [Actual continuation request](request-boundary.json), [Prior exact segment](previous-segment-settlement.json), [Original traces individually reviewed](original-trace-review.json)
- [Four real existing functions](browser/results.json), [Request/transition summary](browser/requests-redacted.jsonl), [Raw traces/screenshots](browser-manifest.json)
- [Selected frozen business checks](browser/frozen-results.json), [Fresh builds](build-artifacts.json), [Actual served build](served-build.json), [Original source mapping](source-audit-inputs.json)
- [Source state](source-state.json), [Hashes](file-manifest.json), [Diff](diff.patch), [Runtime isolation](runtime-isolation.json)
- [Original full result](../full-regression-summary.json), [Original failures](../failure-classification.json), [Repair allowance](../repair-budget.json), [All S6 commands](../commands.jsonl), [All S6 usage](../token-usage.json)

Stop after S6 CONTINUE. No S7. / S6 续跑后停止，不进入 S7。

Acceptance commit / 验收提交: `1d4f20c48d630474906b822c08fc713ec0234de2` (`[WF6-S6]`). Gateway/map byte hashes match browser-tested inputs. Both checkouts clean; Vue/backend/evaluator frozen bytes unchanged.
