# S1 unchanged Vue baseline / 未修改 Vue 基线

Run: `wf6-rerun-20261014-01`. Gate: **PASS**. Only S1 executed; S2 remains unauthorized and unexecuted.
本次仅执行 S1；gate 为 **PASS**，未进入 S2，S2–S6 三小时预算未启动。

P1 final reply is settled as exact_reported through provider source line 703; S1 begins at the actual natural-language request on line 709, with distinct turn identity. No fabricated START marker or overlapping preparation usage.
P1 最终回复已核实封账至源日志第 703 行；S1 从实际自然语言请求第 709 行起算，turn 独立，不与 preparation 重叠。

## Approach → What happened → Why → What we would change

Measure frozen Vue input `4b9ca06b6581f7152e164ea0fd9d4da366975a79` and evaluator `758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d` with frozen installs, static generation, units, coverage, lint, actual type diagnostics and the complete real-browser yardstick. The build was produced from docs-only S0 HEAD `955e790f86c9c4ff2d56e06b9e54d948cbf0e698`; build manifest SHA256 is `51e1fc21edd74fdb002a57a5e11b8085932a0898945685edb45177aece86d733`. Backend code is served from the evaluator checkout, whose frozen backend tree was verified identical to the source input in S0.
从固定 Vue 与 evaluator 输入重新安装、构建并测量；实际 build 来自仅增加 S0 文档的 HEAD，后端使用已在 S0 核实相同的冻结后端树。

Frozen installs and accepted Vue generation passed. Units: 517/517 passed, 0 failed, 0 skipped across 48 files. Lint: 521 files, 0 errors, 0 warnings. Coverage reran the same tests and is not an additional test count.
冻结安装及验收构建通过。Unit 实际成绩如上；lint 无错误或警告；coverage 重跑相同测试，不重复计数。

| Frozen category / 类别 | Mounted first attempt / 首轮 | Linux native runtime / 原生目录重测 |
|---|---|---|
| routes | 0/66 pass; 66 fail; 0 skip | 66/66 pass; 0 fail; 0 skip |
| flows | 1/15 pass; 14 fail; 0 skip | 15/15 pass; 0 fail; 0 skip |
| guard | 1/1 pass; 0 fail; 0 skip | 1/1 pass; 0 fail; 0 skip |

Coverage / 覆盖率: statements 15.1%, branches 12.89%, functions 7.9%, lines 15.09%. This is the frozen configured include/exclude scope, not whole-system coverage.
覆盖率仅对应冻结 Vitest 配置的 include/exclude 范围，不代表全系统覆盖。

Actual Vue typecheck reports 318 diagnostics, separately recorded as FAIL. The initial missing-checker failure is retained; diagnostic-only TypeScript 5.9.3 and vue-tsc 3.1.5 were installed outside the app manifests. No source errors were repaired; no historical diagnostic count is assumed.
实际 Vue typecheck 报出 318 条诊断，单独记 FAIL。保留最初缺少工具的失败；辅助 checker 安装于运行目录，未修改应用 manifest 或源码。

First generation returned exit 0 but logged sandbox font-provider DNS failures; its original logs/build inventory remain. Reviewed public-font regeneration supplied the accepted artifact. A restricted socket preflight failed before server startup and is retained. The first full browser attempt used mounted output/data/static paths. Its first failure trace showed a blank document and unfinished module requests at the unchanged assertion deadline. An interrupted native attempt has incomplete passing logs and is not accepted; the final complete remeasurement used byte-verified identical static assets plus fresh SQLite/auth/profile/output paths under `/tmp/wf6-rerun-20261014-01-S1-native2`. Assertions, fixture seeds, strict/all selection, 10-second expectations, 45-second test limits and retries=0 were unchanged. The path change is an environment diagnosis; it does not isolate each contributing cause or prove a code fix.
保留字体网络及 socket 权限失败。首轮完整浏览器失败 trace 显示超时点仍有资源未完成；第二轮仅将相同 build 字节及独立运行数据/输出放到 Ubuntu 原生文件系统，源码、seed、断言、严格模式、超时及 retries=0 不变。目录调整不能单独证明每个因素的因果关系，也不是源码修复。

Future authorized stages should use verified Linux-native runtime paths and record every attempt. Existing Vue type errors stay separate. This baseline gives no React completion, route coexistence, boundary or fallback evidence. Costs and human review time are not provided. Complete ancestor Git history remains unavailable behind declared shallow boundaries; pinned tree/blob provenance and working bytes were verified.
后续获授权步骤应继续使用核实过的 Linux 原生运行目录并保留重测历史；类型错误单列。本步骤不构成 React、路由共存、边界或回退成绩。费用与人工 review 时间未提供；Git 完整祖先历史仍缺失，冻结 tree/blob 与工作文件已核实。

Intermediate native measurement was interrupted after 72 passing log entries and has no complete result or original exit status; it is excluded from acceptance. Its owned backend was verified and stopped before native2. Resume also preserved a transient port failure, case-alias helper failure and symlink-audit helper failure. Missing command timestamps/exit codes remain null in recovered records.
中断轮次仅有前 72 项通过日志，没有完整结果或原始退出码，不作为验收；后端核实停止后才重测 native2。端口、大小写目录及 symlink 审计脚本失败均保留，缺失字段不补造。

## Evidence / 证据

- [Actual request and boundary](request-boundary.json), [P1 settlement](P1-settlement.json)
- [Commands](commands.jsonl), [Failures/repairs](attempts.jsonl), [Original logs](logs/)
- [Build manifest](build-artifact.json), [Native runtime identity](native-runtime.json)
- [First full browser report](browser/results.json), [Native full browser report](browser-native/results.json)
- [First trace observations](machine/first-trace-observations.json), [Native output byte manifest](native-output-manifest.json)
- [Machine measurements](baseline-measurements.json), [Coverage](coverage/coverage-summary.json), [Types](machine/type-diagnostics.json)
- [Source state](source-state.json), [Diff](diff.patch), [File hashes](file-manifest.json)
- [Visible transcript](visible-transcript.jsonl), [Coverage statement](transcript-coverage.json), [Provider usage](token-usage.json)

Before the final response usage remains provisional with final_reply_included=false. Terminal collector settlement or the next authorized stage must verify the final response event. Old exports are preserved rather than added.
最终回复前用量保持 provisional，final_reply_included=false；需终端 collector 或下一授权步骤核实尾部，旧导出保留但不相加。

Evidence-only commit / 仅证据提交: `f318d69d033e5269415f0b94d4beebd8d70a00dc` (`[WF6-S1]`). Both checkouts are clean; all 1711 source and 1789 evaluator original manifest entries match. 实际 build HEAD 保持构建时 SHA，提交仅包含两个 baseline 文档。

<!-- WF6-USAGE -->
## Provider usage / Provider 用量

Status: partial; final_reply_included=True

input_tokens=None | cached_input_tokens=None | cache_write_input_tokens=None | output_tokens=None | reasoning_output_tokens=None | total_tokens=None

Authoritative source: token-usage.json and ../../usage/usage-ledger.json. Values replace earlier exports, never add to them.
