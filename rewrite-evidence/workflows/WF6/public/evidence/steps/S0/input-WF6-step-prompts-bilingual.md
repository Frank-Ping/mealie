# WF6 分步执行 Prompt 中英文对照

本文提供八个可逐步复制的 prompt，以及全过程证据和每步 token 记录要求。本文只准备指令，没有执行 WF6、创建实验 checkout 或产生实验成绩。

This document provides eight copyable prompts with evidence collection and per-step token accounting. These are execution instructions only. WF6 has not been executed by creating this document.

## 使用方法 How to use

1. 建议为 WF6 开一个独立聊天，从 S0 开始。每步只发送中文或英文其中一个版本，不要将两种版本重复执行。
   Use a dedicated WF6 chat. Start with S0 and send either the Chinese or English version of each step, not both.
2. 每次只执行当前步骤，收到完成或失败结论后再发送下一步。步骤需要的前置验收未通过时，不运行依赖它的步骤；仍可执行 S7 整理失败证据。
   Execute one step at a time. Do not run dependent steps after a failed prerequisite. S7 can still package a failed experiment.
3. S0 会要求建立 `WF6-CONTRACT.md`。S1–S7 每次先读它，再执行本步；因此不要跳过 S0。
   S0 creates `WF6-CONTRACT.md`. S1–S7 read this contract before execution; do not skip S0.
4. 每步都记录 token，包括准备、失败、修复、验证和报告整理。回复结束前的数据可以是 provisional，不能假装已包含尚未生成的最后回复。
   Record tokens for every step, including setup, failed attempts, repairs, verification and reporting. A pre-reply snapshot is provisional until the final reply is included.
5. 每步回复显示完毕后，可以在终端运行本文末尾的 finalize 命令。下一步也应先补齐上一阶段的计数。最后 S7 必须由终端收尾，避免再发模型消息产生新的未计量回复。
   Finalize after each reply from a terminal, or settle the previous step at the next step's start. Finalize S7 from a terminal after its reply, without another model turn.
6. 以下路径以 `<WORKSPACE>` 为工作区根目录。所有待创建目录和脚本都是未来执行 S0 后的产物，当前不存在不代表错误。
   Paths below are relative to that workspace root. Proposed directories and the collector are created when S0 is executed; they are not deliverables already present.

## 步骤与完成检查 Steps and gates

| 步骤 Step | 任务 Task | 完成检查 Gate |
| --- | --- | --- |
| S0 | 隔离、实验契约、证据与计量 Isolation, contract and accounting | 输入固定；计量来源核实；记录器可用，或明确记录缺失 |
| S1 | 新环境 Vue baseline Fresh Vue baseline | 构建与冻结浏览器检查可复现；原有类型错误单列 |
| S2 | 全 Vue 网关 All-Vue gateway | 网关没有破坏 Vue、API 和登录 |
| S3 | 最小共存验证 Minimal coexistence proof | 同源会话与 Vue ↔ React 双向跳转成立 |
| S4 | 列表、搜索、只读详情 Real recipe slice | 真实 API 功能、来源检查和 React 静态检查通过 |
| S5 | 用户路径与边界 User journey and boundaries | 身份、链接、刷新、返回、错误归属和检测机制通过 |
| S6 | 回退与完整回归 Rollback and full regression | 显式回退证明；冻结 suite 全量结果如实保留 |
| S7 | 证据核验、报告素材、用量收尾 Evidence audit and report material | 所有声明有来源；所有步骤有 usage 行；最后回复待终端结算 |

八步将原 `WF6-plan.md` 的阶段进一步拆开。S3/S4 属于原计划的 React 共存与实现阶段，共用最多两轮源码修复额度；不要因拆分 prompt 增加修复上限。S2–S6 的模型执行与工具等待时间合计最多三小时；依赖准备、S1 baseline、人工停顿和 S7 报告整理另列。此预算用于停止实验，不保证完成。

The eight prompts expand the phases in `WF6-plan.md`. S3/S4 share the original React implementation phase's maximum of two source-repair rounds. Splitting prompts must not increase the repair allowance. S2–S6 share a three-hour execution budget including tool waits; dependency preparation, S1 baseline, pauses between user prompts and S7 reporting are recorded separately.

## 全程共同要求 Common contract requirements

S0 要将以下要求写入实验中的 `rewrite-evidence/workflows/WF6/WF6-CONTRACT.md`。S1–S7 的两种语言版本均引用同一份契约。

S0 writes these requirements into the experiment's `rewrite-evidence/workflows/WF6/WF6-CONTRACT.md`. Both language versions of S1–S7 use the same contract.

### 实验边界 Experiment boundaries

- Workflow：同一入口按路由运行 Vue 或 React，跨边界整页跳转，显式开关退回全 Vue。使用一个实施代理。
  One implementation agent; route-level Vue/React coexistence at one entry point, document navigation across boundaries, and explicit all-Vue rollback.
- 输入：原 Vue commit `4b9ca06b6581f7152e164ea0fd9d4da366975a79`；evaluator commit `758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d`。先验证对象存在与内容来源。
  Verify and pin those source and evaluator commits before use.
- 独立目录：`mealie-wf6-coexist/`、`mealie-wf6-evaluator/`、`wf6-evidence/`。创建前检查，不覆盖已有内容；存在已识别的 WF6 工作时核对后继续，不能重置。
  Use separate directories. Inspect existing content and continue verified WF6 work without overwriting or resetting it.
- 分支：`rewrite/wf6-route-coexistence`。不复制其他 workflow 的 React 实现、codemod 或语义适配；原始 Vue、生成类型、locale 和冻结测试是共享输入。
  Use the dedicated branch. Do not copy another workflow's target implementation or converters; only frozen source resources and evaluator inputs are shared.
- 不修改旧 workflow、原报告、后端 API/schema 或 evaluator 断言。Vue 只增加必要的边界 middleware；React 使用计划里的 target stack，代码注释用英文。
  Preserve earlier experiments, reports, backend API/schema and evaluator assertions. Add only the necessary Vue boundary middleware. Use the planned React stack and English code comments.
- 代理必须在 sandbox 中运行并记录工具权限，不向代理提供 upstream repository、package registry 或 production service 凭据。公开依赖使用匿名访问；只允许本实验隔离的测试账号凭据。
  Run the agent in a sandbox and record tool permissions. Do not provide upstream-repository, package-registry or production-service credentials. Access public dependencies anonymously and use only isolated local test credentials.
- 第一轮只迁移已认证用户所属配置 group 的列表、搜索、只读详情；其他领域和高级功能继续由 Vue 提供。
  Limit the pilot to the configured user's group and the read-only recipe slice; other domains and advanced operations remain Vue-owned.
- 数据库、测试账号、auth 文件、浏览器 context、端口、运行目录、输出和 token 窗口全部独立。cookie 不按 localhost 端口隔离，不能只换端口。
  Isolate data, auth state, browser context, ports, runtime directories, outputs and accounting windows. Port changes alone do not isolate localhost cookies.

### 每步证据包 Per-step evidence bundle

每步 `wf6-evidence/steps/Sn/` 都至少包含下面项目，没运行或拿不到的项目写明原因：

Each `wf6-evidence/steps/Sn/` contains the following, with an explicit reason for any unavailable item:

1. `[REDACTED]`：实际收到的用户指令；可见追加消息、反馈和真实发生的人工决定也要保留。
   Actual prompt and visible follow-ups; retain human feedback and decisions only when they occurred.
2. `visible-transcript.jsonl`：可取得的用户、可见助手回复、工具调用和输出。标明覆盖范围；不导出隐藏思考或系统/开发者指令，不把人工重建记录称为逐字原始 transcript。
   Available user/visible-assistant/tool transcript; disclose coverage and reconstruction. Exclude hidden reasoning and system/developer instructions.
3. `commands.jsonl` 与 `logs/`：完整命令、cwd、必要且去敏的环境、开始/结束 UTC、退出码、耗时、原始 stdout/stderr 和结果报告。
   Exact commands, cwd, relevant redacted environment, UTC timestamps, exit codes, durations, raw stdout/stderr and reports.
4. `source-state.json`、`diff.patch`、`file-manifest.json`：source/evaluator commit、dirty 状态、所有已跟踪及未跟踪实现文件的 SHA256、必要 diff、实际服务的 build 标识。
   Commit IDs, dirty state, SHA256 inventory including untracked implementation files, relevant diff and the build actually served.
5. `attempts.jsonl`：每次失败、原因假设、具体修改及重测证据。失败原日志保留，不能只留下成功版本。
   Failed attempts, cause hypotheses, exact repairs and reruns. Preserve failures instead of replacing them with green runs.
6. `result.md`：本步范围、实际完成、检查结果、未验证项、gate PASS/FAIL/BLOCKED、后续可执行步骤、证据链接。
   Scope, completed work, check results, limitations, gate decision, permissible next steps and evidence links.
7. `token-usage.json`：本步 token、累计值边界、原始事件定位、覆盖状态、最后回复是否计入。
   Token deltas, cumulative boundaries, raw-event locators, coverage status and final-reply inclusion.

同时更新全局 `EVIDENCE_INDEX.md`、`PROGRESS.md`、`decisions.jsonl`、`timing.csv` 和 `usage/usage-ledger.csv`。实现提交按 `[WF6-Sn]` 标识；证据来自测量时的实际源码，不以起始 commit 冒充完整快照。可分享的证据移除密码、cookie 和 bearer 值，但保留接口、状态码与去敏说明。

Maintain the global index, progress, actual decision log, timing and usage ledger. Prefix commits `[WF6-Sn]` and identify the measured source snapshot. Redact credentials and tokens from shareable evidence while preserving request paths, status codes and a redaction note.

原始包和全局索引位于兄弟目录 `wf6-evidence/`，不能从实验 checkout 直接提交。可提交的 `BASELINE.md`、`comparison-baseline.json`、阶段小结、`WF6-RESULTS.md`、`WF6-REPORT-MATERIAL.md` 和索引指针放在 `mealie-wf6-coexist/rewrite-evidence/workflows/WF6/`，链接外部原始证据。`[WF6-Sn]` 提交只包含 checkout 内的实现与这些小型文件。不要为提交兄弟目录而在整个工作区根目录初始化 Git。

Raw bundles and the global index live in sibling `wf6-evidence/`, outside the experiment checkout's commit scope. Put committable baseline/comparison documents, step summaries, WF6-RESULTS.md, WF6-REPORT-MATERIAL.md and index pointers under `mealie-wf6-coexist/rewrite-evidence/workflows/WF6/`, linking to external raw evidence. `[WF6-Sn]` commits include only checkout implementation and these small documents. Do not initialize Git in the parent workspace to capture sibling evidence.

### Token 口径 Token accounting

- 每步用用户消息标记 `[[WF6:S0:START]]` 至 `[[WF6:S7:START]]` 开始，以可见最终答复末尾 `[[WF6:Sn:END]]` 标明本步工作结束。
  Use explicit user START markers and visible final-reply END markers for every step.
- 明确记录 session ID、实际 turn ID、原日志路径、行号/byte offset、模型与设置、开始前累计计数和结束累计计数。
  Record session/turn identity, log source and event locations, model/settings, and start/end cumulative counters.
- `total = input + output`。cached input 是 input 的子集，reasoning output 是 output 的子集。若 provider 暴露 cache-write，单列其原始字段和语义；不重复相加。
  Total equals input plus output. Cached input and reasoning output are subsets. Preserve any cache-write field separately without double counting.
- 只计算累计计数的差额，不直接相加累计快照。不用账号用量百分比或保存文本的 token 估计冒充 provider usage；未知费用写“未提供”。
  Sum non-overlapping deltas, never cumulative snapshots. Account percentages and text-volume estimates are not provider usage; unavailable monetary cost remains unavailable.
- 开始边界取 START 用户消息之前、能确认身份的最后累计事件。无可靠边界不能假定为零；字段缺失写 null/未提供，未发送步骤记 not_executed。
  Use the last verified cumulative event before START. Missing boundaries or fields remain null; an unsent step is not_executed, not a fabricated usage value.
- 有重复事件、counter reset、compaction、fork、会话更换或跨步迟到事件时保留原始记录、分段、去重并标明质量。不能把负差额截为零或把继承历史重算。未能准确恢复的数据标 partial。
  Preserve and audit duplicates, resets, compaction, forks, session changes and late events. Split counter epochs, avoid inherited-history duplication, and mark unrecoverable gaps partial.
- prompt 已发送但步骤阻塞、失败或中断，仍计入该步真实 tokens。修复与澄清消息使用 `[[WF6:Sn:CONTINUE]]`，继续归入同一步；明确关闭步骤后的额外讨论单列。
  Count blocked/failed/interrupted execution. CONTINUE messages retain the same step; discussion after explicit closure is tracked separately.
- CONTINUE 重开已结算步骤时，collector 用 `segments[]` 保存互不重叠的区间，查找最新 CONTINUE 所属 turn 的最终 END 和对应 usage。保留旧统计版本，但用新的阶段合计替换当前行，不把新累计合计再加到旧结果。关闭与重开之间的额外讨论独立计量，不被首次 START 至最新 END 的整体差值吞入。
  On CONTINUE after settlement, store disjoint segments[] and locate the latest CONTINUE turn's final END and matching usage. Preserve older exports but replace the current step total rather than adding the new cumulative total to the old one. Keep intervening discussion outside those segments.
- 重复 START 必须按实际用户消息身份、时间和日志位置识别。先判定它是重复指令、续跑或明确新尝试；不得仅因相同标记出现而重置计量、丢掉失败或重复计算继承历史。
  Identify repeated START messages by actual identity, time and log location, then distinguish duplicate instructions, continuation and explicit new attempts. Repeated marker text alone must not reset accounting, erase failures or duplicate inherited history.
- 本步最后回复前，更新 provisional 数值，并明确 `final_reply_included=false`。下一步开始先结算上一步，或用户在终端 finalize。S7 最后回复后由用户运行 collector 收尾。
  Before replying, write provisional usage with final_reply_included=false. Settle it at the next step or externally. Finalize S7 externally after its final reply.
- collector 只能在确认最后答复与对应 usage 均已落盘、且无身份/边界歧义时标 exact_reported。稳定文件大小本身不证明最后事件已计入；不确定时继续 provisional/partial。
  exact_reported requires both the final reply and its matching usage plus valid boundaries. A stable file size alone is insufficient.
- 最终汇总按互不重叠的步骤和额外讨论区间计算；分别报告 S0 准备、S1 baseline、S2–S6 实验、S7 报告整理。已知部分与缺失部分分开。
  Sum disjoint windows and separate preparation, baseline, experiment, reporting and any extra discussion. Report known usage and missing coverage separately.

### 每步回复格式 Per-step reply format

本步完成或停止时，回复应简洁列出：实际完成、gate、关键证据文件、失败/限制、input/cached/output/reasoning/total、provisional 或 exact 状态、下一步。结尾写对应 END 标记；不自动执行下一步。

At completion or stop, report actual work, gate, key evidence, failures/limits, input/cached/output/reasoning/total usage, coverage status and next step. End with the step's END marker and do not execute the next step automatically.

## S0 建立隔离与证据计量 Establish isolation and accounting

### 中文 Prompt

```text
[[WF6:S0:START]]
执行 WF6 的 S0，只建立独立环境、实验契约和证据/token 记录工具，暂不实现应用。

工作区：<WORKSPACE>。
读取 WF6-plan.md、WF6-step-prompts-bilingual.md，以及作业 PDF 的 Workflows、
Evidence log 和 Report Content。将本文件的全部共同要求写入实验的
rewrite-evidence/workflows/WF6/WF6-CONTRACT.md，并在后续每步读取。

核实原 Vue commit 4b9ca06b6581f7152e164ea0fd9d4da366975a79 和 evaluator
commit 758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d。创建独立
mealie-wf6-coexist、mealie-wf6-evaluator 和 wf6-evidence，分支
rewrite/wf6-route-coexistence。不覆盖已有目录，不重置已存在的 WF6 工作。
只取得指定原始 commit，不读取其他 workflow 的 React 工作树或实现。
不配置推送 remote，不改旧实验、报告、后端接口或原 evaluator。

记录实际模型/设置、sandbox、运行环境、输入 SHA、计划/配置 hash、版本、
候选端口和独立 data/auth/browser 位置。可用的 workspace runtime 先核实，
依赖准备耗时单列。一个实施代理；不得静默启动并行实施。

创建证据目录、EVIDENCE_INDEX.md、PROGRESS.md、timing.csv、decisions.jsonl，
以及 usage/tracking-config.json、stage-boundaries.jsonl、raw-token-events.jsonl、
usage-ledger.json/csv 和 USAGE.md。定位本次实际 session，不以旧日志冒充。

在 wf6-evidence/usage/collect_usage.py 新写计量与可见 transcript 导出器。
验证真实日志 schema，按本文件 Token 口径采集。不要改用账号额度百分比。
为重复事件、缺字段、计数下降、尾部半行和最后回复迟到验证关键失败路径。
脚本提供 finalize --stage S0 --wait-seconds 30 和 finalize --all 的接口；
通过 tracking-config 解析工作区与 session。输出实际可运行的 PowerShell 命令。
finalize --all 同步 usage-ledger、各步 token-usage 和 USAGE.md，验证索引并
生成最终证据 manifest。缺少用量源时明确标记并保留，不虚构数字。

保存 S0 的实际 prompt、可见 transcript、工具/命令记录、输入 provenance、
契约和记录器验证结果。建立 [WF6-S0] 准备提交，不包含依赖、数据库或凭据。
记录本步真实 token，包括建立记录器本身的成本。最后回复前保存 provisional
数据并说明最后回复待结算；报告 S0 gate 后停止。
结尾写 [[WF6:S0:END]]。
```

### English Prompt

```text
[[WF6:S0:START]]
Execute S0 of WF6: establish isolation, the experiment contract and evidence/token
recording only. Do not implement the application yet.

Workspace: <WORKSPACE>.
Read WF6-plan.md, WF6-step-prompts-bilingual.md and the assignment's Workflows,
Evidence log and Report Content. Write all common requirements from this document
to rewrite-evidence/workflows/WF6/WF6-CONTRACT.md in the experiment checkout.
Read that contract before every subsequent step.

Verify Vue commit 4b9ca06b6581f7152e164ea0fd9d4da366975a79 and evaluator commit
758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d. Create separate mealie-wf6-coexist,
mealie-wf6-evaluator and wf6-evidence directories, using branch
rewrite/wf6-route-coexistence. Do not overwrite directories or reset existing WF6
work. Obtain only the specified original commit, not other workflows' React code.
Do not configure a push remote or modify earlier experiments, reports, backend
interfaces or evaluator assertions.

Record the actual model/settings, sandbox, environment, input SHAs, plan/config
hashes, versions, candidate ports and isolated data/auth/browser paths. Verify
available workspace runtimes and record dependency setup time separately.
Use one implementation agent; do not silently start parallel implementation.

Create the evidence folders, EVIDENCE_INDEX.md, PROGRESS.md, timing.csv,
decisions.jsonl and usage/tracking-config.json, stage-boundaries.jsonl,
raw-token-events.jsonl, usage-ledger.json/csv and USAGE.md. Identify this actual
session; never substitute an older experiment's session log.

Implement a new collector/visible-transcript exporter at
wf6-evidence/usage/collect_usage.py. Verify the real log schema and follow this
document's token contract, not account quota percentages. Verify duplicate events,
missing fields, counter decreases, incomplete final lines and delayed final-reply
usage. Provide finalize --stage S0 --wait-seconds 30 and finalize --all interfaces,
resolving workspace/session from tracking-config. Return runnable PowerShell
commands. finalize --all must synchronize the ledger, per-step usage and USAGE.md,
check the evidence index and generate a final evidence manifest. Preserve missing
telemetry explicitly; do not invent counts.

Save the actual S0 prompt, visible transcript, tool/command records, provenance,
contract and collector checks. Make a [WF6-S0] preparation commit without
dependencies, databases or credentials. Record S0 tokens including recorder setup.
Before the final reply, save provisional usage and disclose its pending final-reply
usage. Report the S0 gate and stop. End with [[WF6:S0:END]].
```

## S1 建立新的 Vue baseline Establish a fresh Vue baseline

### 中文 Prompt

```text
[[WF6:S1:START]]
执行 S1。先读 WF6-CONTRACT.md，核实独立目录与输入，结算 S0 最后回复的
tokens；仍缺失就标 provisional/partial，不能写零。

在本 WF6 的独立环境中运行未修改 Vue baseline。记录 frozen install、Vue
build、unit pass/fail/skip、lint、type diagnostics、可取得的 coverage 和
冻结 evaluator 的 66 routes、15 flows、route-table guard。使用真实本地
FastAPI、独立 SQLite 和 seeded data。确认启动脚本所有写入/清理目标属于
本 WF6 的 disposable data 目录，不能清理其他实验的数据。

保存每条命令的原始输出、退出码、耗时、机器结果、源码/evaluator hash、
实际 build 和环境。已有 Vue 类型错误单列；本次实际结果优先，不能照抄
旧 baseline 的数字。覆盖率不可取得就写未提供，不补成零。

baseline 无法运行时，保留环境失败和修复；不得改源码或削弱 evaluator。
无法建立可信 baseline 时 gate 为 BLOCKED，停止依赖实现，可继续做 S7。
如通过则写 BASELINE.md 和 comparison-baseline.json，并做 [WF6-S1] 证据提交。

按共同要求整理完整 S1 证据包，记录本步 input/cached/output/reasoning/total
以及起止原始事件；回复前保存 provisional 并注明尾部待结算。
报告 gate 后停止，结尾写 [[WF6:S1:END]]。
```

### English Prompt

```text
[[WF6:S1:START]]
Execute S1. Read WF6-CONTRACT.md, verify isolated paths and inputs, and settle S0's
final-reply tokens. Missing coverage remains provisional/partial, never zero.

Measure the unchanged Vue app in the independent WF6 environment: frozen install,
build, unit pass/fail/skip, lint, type diagnostics, available coverage and the frozen
66-route/15-flow suite plus route-table guard. Use the real local FastAPI backend,
isolated SQLite and seeded data. Confirm every startup script write/cleanup target
is inside this WF6 disposable data directory, not another experiment's data.

Save raw output, exit codes, duration, machine-readable results, source/evaluator
hashes, actual build and environment for each command. List existing Vue type
errors separately. Use observed results rather than copying an earlier baseline.
Unavailable coverage stays unavailable, not zero.

Preserve environment failures and repairs without changing source or weakening
the evaluator. If a credible baseline cannot be established, mark BLOCKED and stop
dependent implementation; S7 may still package the failure. If accepted, write
BASELINE.md and comparison-baseline.json and make a [WF6-S1] evidence commit.

Complete the S1 evidence bundle and record input/cached/output/reasoning/total with
raw event boundaries. Save provisional usage before replying and disclose the
pending final-reply usage. Report the gate, stop, and end with [[WF6:S1:END]].
```

## S2 建立全 Vue 网关 Establish an all-Vue gateway

### 中文 Prompt

```text
[[WF6:S2:START]]
执行 S2。读 WF6-CONTRACT.md 和 S1 结果，先补齐 S1 tokens；S1 gate 未通过时
只记录阻塞，不开始实现。

新写 wf6/gateway.mjs 和 wf6/route-map.json。先关闭 React 接管，所有页面
继续由 Vue 提供，API/媒体交给独立后端。使用本地同源入口，正确处理状态码、
请求体、cookie/Set-Cookie、Vue 资源和 history fallback。候选端口先查占用。
区分资源 404 与 HTML 页面 fallback，不把不存在的脚本返回成 index.html。

用真实后端验证 /api/app/about、Vue 登录、食谱列表/详情、一个保留的购物
清单页面、直接 URL 与刷新。明确当前均由 Vue 提供。先构建成功再启动浏览器；
不能让失败 build 的旧 dist 提供结果。

保存 route map、服务启动/停止命令、请求/响应与登录去敏记录、browser trace、
资源来源和 build hash。失败后保留原始日志，S2 最多两轮修复；仍失败就停止。

完成 [WF6-S2] 提交及完整证据包。更新 S2–S6 累计执行预算，记录本步 tokens
和可核实边界；当前最后回复的 usage 标 provisional。报告 gate 后停止。
结尾写 [[WF6:S2:END]]。
```

### English Prompt

```text
[[WF6:S2:START]]
Execute S2. Read WF6-CONTRACT.md and S1 results, then settle S1 tokens. If S1 failed
its gate, record the blocker without starting implementation.

Write wf6/gateway.mjs and wf6/route-map.json. Keep React takeover disabled so every
page is served by Vue; send API/media to the isolated backend. Use one local origin
and correctly handle status codes, request bodies, cookies/Set-Cookie, Vue assets
and history fallback. Check candidate ports first. Missing asset requests must
return a real 404 rather than index.html.

With the real backend, verify /api/app/about, Vue login, recipe list/detail, one
retained shopping-list page, direct URLs and refresh. Confirm all are Vue-owned.
Build successfully before browser checks; never serve stale dist after a failed
build.

Preserve the route map, service commands, redacted request/login evidence, browser
trace, asset provenance and build hash. Keep initial failures. Allow at most two
repair rounds for S2; stop if it remains blocked.

Make a [WF6-S2] commit and complete the evidence bundle. Update the cumulative S2–S6
budget and record this step's tokens and boundaries. Mark current final-reply usage
provisional. Report the gate, stop, and end with [[WF6:S2:END]].
```

## S3 先证明最小共存 Prove minimal coexistence first

### 中文 Prompt

```text
[[WF6:S3:START]]
执行 S3。读共同契约与 S2 gate，补齐 S2 tokens。只有全 Vue 网关通过后才继续。

建立 frontend-react-wf6 的最小可构建骨架，使用计划的 React target stack，
资源前缀 /_wf6/。先不实现食谱业务。加入 React 来源标记、简单导航、真实
/api/users/self 会话读取与 groupSlug 校验。Vue 负责登录；401、匿名或身份
不匹配时使用明确的 Vue 入口，保留目标 URL，不能形成跳转循环。

为配置 group 的列表和详情 HTML 路由建立准确接管规则，排除 r/create 及
其后代、共享与其他 group 路径，以及 edit/parse/cook 等留在 Vue 的模式。
React 接管判断必须先于 FastAPI 食谱 metadata HTML 路由。网关和 Vue 共用
route map，加入唯一必要的 wf6-boundary.global.ts，使 Nuxt 内部导航确实
触发整页切换；React 返回 Vue 也整页跳转。

先验证 Vue 登录 → React 骨架 → Vue 购物清单 → React 骨架、刷新与登录状态。
骨架只是共存技术探针，不计入业务完成率，不要求完整业务 suite 此时全绿。
来源标记必须来自真实 React build，不能在 Vue 页写 React 标记来通过检查。

保存会话/接口去敏证据、document 请求、两套资源来源、修改 Vue 的完整 diff、
build/static 检查和原始失败。S3/S4 共用最多两轮源码修复，记录已使用轮次。
边界无法成立就停止，不继续做一个脱离 Vue 的两页 React 应用。

完成 [WF6-S3] 提交与证据包；更新预算、tokens 和 provisional 尾部状态。
报告共存 gate 后停止，结尾写 [[WF6:S3:END]]。
```

### English Prompt

```text
[[WF6:S3:START]]
Execute S3. Read the common contract and S2 gate, and settle S2 tokens. Proceed only
after the all-Vue gateway is accepted.

Create a minimal buildable frontend-react-wf6 using the planned target stack and
/_wf6/ asset prefix. Do not implement recipe business features yet. Add a genuine
React provenance marker, simple navigation and real /api/users/self loading with
groupSlug validation. Vue owns login. For 401, anonymous or mismatched identity,
use an explicit Vue entry, preserve the destination and prevent redirect loops.

Define exact HTML takeover routes for the configured group's list/detail. Exclude
r/create and descendants, shared/other-group paths, and Vue-owned edit/parse/cook
modes. Gateway takeover must precede FastAPI's recipe metadata HTML route. Use one
route map in the gateway and the sole necessary wf6-boundary.global.ts middleware
so Nuxt client navigation triggers document navigation. Returning to Vue must also
load a document.

Verify Vue login → React skeleton → Vue shopping lists → React skeleton, refresh
and preserved login. The skeleton is a technical probe, not migrated business
coverage; the full business suite need not pass yet. React identity must come
from an actual React build, not a marker attached to a Vue page.

Save redacted session/API evidence, document requests, both asset origins, the full
Vue diff, static/build checks and initial failures. S3/S4 share at most two source
repair rounds; record consumption. If coexistence cannot be established, stop
rather than building detached React pages.

Make a [WF6-S3] commit and complete evidence, budget and token records, leaving
pending final-reply usage provisional. Report the gate, stop, and end with
[[WF6:S3:END]].
```

## S4 实现真实食谱切片 Implement the real recipe slice

### 中文 Prompt

```text
[[WF6:S4:START]]
执行 S4。先读共同契约和 S3 结果，补齐 S3 tokens；只有共存 gate 通过才继续。

在原 Vue 源码中检查两个路由及 API/types/locale 的依赖，记录源码对应关系。
直接实现配置 group 的 React 食谱列表、搜索和只读详情。使用真实 /api/recipes
及对应详情接口，核实用户 group；不能用当前用户数据冒充其他 group 内容。
显示名称、配料、步骤、工具、分类、标签，并包含 loading/empty/error 状态。
搜索必须影响真实结果，清空后恢复；食谱卡片用可键盘访问的 React Router Link。

允许复用原始生成类型和确认与 Vue/Nuxt 无关的底层输入，原文件不改。
自己实现 React 请求适配；不把 Nuxt composable 直接当 React hook，也不读取
其他 workflow 的 React 代码。使用 en-US 原字符串，并记录未迁移模式与功能。
编辑、评论等可以经显式 Vue 完整功能入口访问，但不能算 React 已迁移。

运行 React strict types、lint、有意义的业务单元检查、build，以及冻结
evaluator 的列表/详情 route 检查和 open/search 两个原始 flow。保存具体测试
ID 和运行选择命令；不是整套 suite 的成绩。浏览器使用真实后端和 seeded data。
如果原 evaluator 无法安全选择测试，完整运行并单列所需结果，不改原断言。

保存原失败→修改→重测、源码对应表、移植/新增测试库存和缺失功能库存。
S3/S4 合计最多两轮源码修复；用完即停，不降低验收标准。

完成 [WF6-S4] 提交、证据和预算/token 记录；最后回复前标 provisional。
报告业务 gate 后停止，结尾写 [[WF6:S4:END]]。
```

### English Prompt

```text
[[WF6:S4:START]]
Execute S4. Read the common contract and S3 results, settle S3 tokens, and proceed
only after the coexistence gate passes.

Inspect the original Vue routes and API/type/locale dependencies and record the
source-to-target mapping. Directly implement React list/search/read-only detail for
the configured group using real /api/recipes and its detail API. Validate the user's
group; never display their data as another group's content. Show names, ingredients,
instructions, tools, categories and tags, with loading/empty/error states. Search
must change real results and clear correctly. Use keyboard-accessible React Router Link components.

Reuse unchanged original generated types and verified framework-independent inputs
only. Write a React request adapter rather than treating Nuxt composables as hooks;
do not read other workflows' React code. Use original en-US strings and inventory
unmigrated functions/modes. Editing/commenting may use the explicit full-Vue entry,
but must not count as React migration.

Run strict React types, lint, meaningful business unit checks, build, the frozen
list/detail route checks and the original open/search flows. Save test IDs and
selection commands; these are selected results, not full-suite acceptance. Use the
real backend and seeded data. If safe test selection is unavailable, run the whole
suite and extract the relevant results without changing assertions.

Preserve failure→repair→rerun evidence, source mapping, ported/new test inventory
and missing features. S3/S4 share at most two source-repair rounds; stop at the
limit instead of weakening acceptance.

Make a [WF6-S4] commit and complete evidence, budget and token records. Save current
usage as provisional before replying. Report the gate, stop, and end with
[[WF6:S4:END]].
```

## S5 验证用户路径与边界 Verify the journey and boundaries

### 中文 Prompt

```text
[[WF6:S5:START]]
执行 S5。读共同契约与 S4 gate，结算 S4 tokens。前置失败则记录，不继续验收。

在独立补充套件中验证完整路径：Vue 登录 → React 列表 → 搜索 → React 详情
→ Vue 购物清单 → 返回 React。保留 URL、session/group、关键真实 API 与
document 请求证据，并确认目标确实运行 React，旧页面确实运行 Vue。

检查真实链接的键盘导航、直接打开详情、刷新、前进/后退、query/hash 保留、
创建路由排除、edit/parse/cook/完整 Vue 入口、匿名/401和 group 不匹配。
确认没有跨 group 错误数据、循环跳转、资源 404 被 HTML 隐藏、未完成 build
被旧 dist 替代。原 evaluator 保持冻结，新增归属检查不能代替业务断言。

做一次隔离的检测负例：接管保持开启，暂时让 React 资源不可用。检查应捕捉
目标页失败，不能因静默落回 Vue 而继续成功。保存失败预期与实际结果，恢复
原 build 后重跑；这个负例单独标 expected_failure，不冒充应用回归故障。

保存 trace/截图、服务/build hash、请求和结果、原始失败及修复；最多两轮
本步修复，遵守总预算。不得新增写功能来让只读 pilot 看起来完整。

完成 [WF6-S5] 提交和全证据包，记录本步 tokens 与 provisional 尾部状态。
报告边界 gate 和限制后停止，结尾写 [[WF6:S5:END]]。
```

### English Prompt

```text
[[WF6:S5:START]]
Execute S5. Read the contract and S4 gate and settle S4 tokens. Do not proceed if a
required earlier gate failed.

In an independent supplemental suite, verify Vue login → React list → search →
React detail → Vue shopping lists → React list. Preserve URLs, session/group,
real API and document requests. Confirm targets execute React and retained pages
execute Vue.

Check keyboard link navigation, direct detail URLs, refresh, back/forward, query
and hash preservation, create-route exclusion, edit/parse/cook/full-Vue entry,
anonymous/401 and mismatched group handling. Detect wrong-group data, redirect
loops, asset 404s hidden by HTML and stale builds after build failure. Keep the
original evaluator frozen; provenance checks supplement business assertions.

Run one isolated detection negative case: keep takeover enabled but temporarily
make React assets unavailable. Target-page checks must detect failure rather than
silently succeed through Vue. Preserve expected/actual outcomes, restore the build
and rerun. Label this expected_failure separately from unexpected regressions.

Save trace/screenshots, service/build hashes, requests/results and failures/repairs.
Allow at most two S5 repair rounds within the total budget. Do not add write
features merely to make the read-only pilot look complete.

Make a [WF6-S5] commit and complete evidence and token records with pending reply
usage provisional. Report the boundary gate and limits, stop, and end with
[[WF6:S5:END]].
```

## S6 验证回退与完整回归 Verify rollback and full regression

### 中文 Prompt

```text
[[WF6:S6:START]]
执行 S6。读共同契约与已完成的 gates，结算 S5 tokens。正常验收依赖前置通过；
前置失败时可保存已能执行的显式回退检查，但不得称整条 workflow 通过。

保持同一输入和可比较的 seeded data，先关闭接管开关，证明目标 URL 真正
返回 Vue，登录与原用户路径可运行；再恢复开关，证明两条目标路由重新由
React 承担。检查 middleware 不造成循环。保存开关配置、hash和来源证据。

恢复接管后执行全部冻结 66 routes、15 flows 与 guard，保存实际 pass/fail/skip、
原始 JSON 和日志。不能把 smoke 说成 strict，不能把重复测量模式算新增覆盖。
原断言不改、不删、不跳过。评论等未迁移行为可能失败，必须保留并分别归类为
范围缺失、实现回归、环境问题或检查问题，无法判定则写原因未确定。

回退状态和接管状态分别记录 Vue 与 React 的 build/types/lint/unit 测试库存。
建立 route-ownership.csv 与 feature-inventory.csv，明确 React 只读范围、
Vue 保留功能、混合路径、未验证项。混合应用 66/66 不等于 React 迁移 66 页。

本步不扩展业务范围。若有边界回归，最多两轮修复并重测受影响结果；保持失败
历史和预算。保存 [WF6-S6] 快照、全部证据与本步 token/provisional 状态。
报告回退和完整回归两类结论后停止，结尾写 [[WF6:S6:END]]。
```

### English Prompt

```text
[[WF6:S6:START]]
Execute S6. Read the contract and completed gates and settle S5 tokens. Normal
acceptance requires earlier gates. After a blocker, an executable rollback check
may still be recorded, but the entire workflow must not be called accepted.

With the same inputs and comparable seeded data, disable takeover and prove the
target URLs genuinely return Vue with working login and the original journey.
Re-enable takeover and prove both target routes execute React again. Check for
middleware loops. Save switch configurations, hashes and provenance evidence.

With takeover restored, run all frozen 66 routes, 15 flows and the guard, retaining
actual pass/fail/skip, raw JSON and logs. Do not call smoke strict or count repeated
modes as new coverage. Do not alter/delete/skip original assertions. Unmigrated
comment behaviour may fail; retain and classify results as scope gaps, regressions,
environment issues or checker issues, with unknown causes labelled unknown.

For rollback and takeover, record Vue and React build/types/lint/unit inventories
separately. Create route-ownership.csv and feature-inventory.csv identifying React
read-only scope, Vue-retained functions, mixed journeys and unverified items.
Hybrid 66/66 does not mean React migrated 66 pages.

Do not expand business scope. For boundary regressions, allow at most two repairs
and rerun affected checks, preserving failures and budget. Save the [WF6-S6]
snapshot, all evidence and provisional step-token usage. Report separate rollback
and full-regression conclusions, stop, and end with [[WF6:S6:END]].
```

## S7 核验全部证据并整理报告 Audit evidence and prepare report material

### 中文 Prompt

```text
[[WF6:S7:START]]
执行 S7，只核验现有 WF6 证据与整理报告，不新增应用功能。前面失败或预算
结束也可执行本步。读共同契约，先结算 S6 或最近已执行步骤最后回复的 tokens。

逐项核对 S0–S6：实际 prompts/可见 transcripts、上下文与配置、固定来源、
频繁提交及验收源码快照、原始 build/test/browser 结果、失败→修复→重测、
时间、人工决定和审查时间、逐步 token 边界与来源。未执行/未提供/无法还原
必须明示，不补造人工活动或成功日志。每步都应有 usage-ledger 行与状态。

检查来源归属表、功能/测试库存、回退与负例，区分“代码存在、命令运行、
本地真实 browser 通过、完整混合应用结果、React 实际功能和生产部署”。
若日志用 mock 或旧 build，只能说明相应证据，不能升级为真实后端成果。

生成 WF6-RESULTS.md、WF6-REPORT-MATERIAL.md、EVIDENCE_INDEX.md 和
evidence-manifest.json。报告素材中英文对照，按 Approach → What happened
→ Why → What we would change 组织。包含具体源码因素、人工判断、成本/时间、
验收负担、适用条件与局限，每条关键结论链接 commit、日志或 trace。
与 WF3/4/5 比较机制，不用小范围耗时证明全站更快，不把共存成功等同完整重写。
Contribution summary 不纳入本次 agentic rewrite。原 Word 报告保持不变。

分别汇总 S0准备、S1 baseline、S2–S6实验、S7整理和额外讨论的 tokens。
累计快照不相加，cached/reasoning 不重复计算；partial 已知量和缺口单列。
本步仍记录真实 tokens，不能把报告整理视为零成本。

提交 [WF6-S7] 报告与索引，检查证据链接可定位、manifest 不自包含，列出所有
未决缺口。本步最终回复未生成时 S7 必须标 provisional，不能提前封账。
给出用户在本次回复显示结束后可运行的 collector finalize --all 命令；该命令
同步最终 usage、摘要与 manifest，并只在原始事件完整时标 exact_reported。
完成核验与报告后停止，不自动补迁移功能。结尾写 [[WF6:S7:END]]。
```

### English Prompt

```text
[[WF6:S7:START]]
Execute S7: audit existing WF6 evidence and prepare report material only. Do not
add application features. This step is valid after earlier failure or budget
exhaustion. Read the contract and settle S6 or the last executed step's final tokens.

Audit S0–S6 for actual prompts/visible transcripts, supplied context/config, pinned
inputs, frequent commits and measured-source snapshots, raw build/test/browser
results, failures→repairs→reruns, timing, actual human decisions/review time and
per-step token sources/boundaries. Disclose not_executed/unavailable/unrecoverable
items rather than fabricating human activity or green logs. Every step needs a
usage-ledger row with its coverage status.

Audit ownership, feature/test inventory, rollback and negative cases. Distinguish
code presence, command execution, real local browser acceptance, full hybrid
results, actual React features and production deployment. Mocked network or stale
build evidence must not become a real-backend success claim.

Produce WF6-RESULTS.md, WF6-REPORT-MATERIAL.md, EVIDENCE_INDEX.md and
evidence-manifest.json. Make the report material bilingual and organize it as
Approach → What happened → Why → What we would change. Include concrete codebase
factors, human judgement, cost/time, verification effort, applicability and limits,
with commits/logs/traces for key claims. Compare mechanisms with WF3/4/5 rather than
using a smaller scope to claim a faster full rewrite. Exclude this agentic rewrite
from the semester Contribution summary. Leave original Word reports unchanged.

Summarize tokens separately for S0 setup, S1 baseline, S2–S6 experiment, S7 reporting
and extra discussion. Never sum cumulative snapshots or double count cached/
reasoning subsets. Separate partial known usage from missing coverage. Count S7
itself rather than treating report preparation as free.

Make the [WF6-S7] report/index commit, verify evidence links and a non-self-including
manifest, and list unresolved gaps. S7 remains provisional before its final reply;
do not seal accounting prematurely. Return a runnable collector finalize --all
command for the user after this reply. It must synchronize final usage, summaries
and manifest and mark exact_reported only with complete original events.
Stop after the audit/report, without expanding migration. End with [[WF6:S7:END]].
```

## 中断或修复时的补充 Prompt Continuation prompt

同一步未完成、需要另一个 turn 继续时使用。将 `Sn` 替换为实际步骤，例如 `S4`。
Use this for another turn within an unfinished step. Replace `Sn`, for example with `S4`.

### 中文

```text
[[WF6:Sn:CONTINUE]]
继续同一个 Sn，不创建新实验或重置 token 边界。先读 WF6-CONTRACT.md、本步
result/attempts/progress，核实此前来源、失败和修复次数。在剩余预算及修复
上限内处理当前阻塞，保留原日志和源码变化；若不能解决就保存失败并停止。
本条指令、澄清、修复、工具等待和最终回复都归入 Sn 的证据与 token 记录。
回复前更新本步 provisional usage，结束时写 [[WF6:Sn:END]]，不执行下一步。
```

### English

```text
[[WF6:Sn:CONTINUE]]
Continue the same Sn without creating another experiment or resetting token
boundaries. Read WF6-CONTRACT.md and this step's result/attempts/progress, verifying
prior source, failures and repair consumption. Address the blocker within the
remaining budget/repair allowance and preserve logs and source changes. If it
cannot be resolved, record failure and stop. Include this prompt, clarifications,
repairs, tool waits and final reply in Sn's evidence and token accounting. Update
provisional usage before replying, end with [[WF6:Sn:END]], and do not run the next step.
```

## 最后回复后的 Token 收尾 Finalizing after a reply

下面是 S0 应创建并验证的 collector 接口，不是目前已经存在的脚本。S0 返回的命令以实际核实的 Python 路径为准。以下使用当前已找到的 bundled Python；如果未来路径改变，使用 S0 记录的路径。

This is the collector interface S0 must implement and verify. The collector does not exist merely because these prompts exist. Use the actual Python path verified in S0; the example uses the currently available bundled runtime.

每步回复结束后，例如 S0：
After a step's reply, for example S0:

```powershell
Set-Location -LiteralPath '<WORKSPACE>'
& 'C:\Users\auyhp\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -X utf8 '.\wf6-evidence\usage\collect_usage.py' finalize --stage S0 --wait-seconds 30
```

S1–S7 将 `S0` 替换为对应编号。如果你在同一步又发送了 CONTINUE，应在最新 turn 真正结束后重新 finalize。collector 应按 segments 更新并替换该步当前合计，保留旧导出版本，避免旧 END 提前封账或新旧合计重复相加。等待后仍没有对应最终事件时保持 provisional，稍后直接重跑脚本，不发新模型消息来补记。

Replace S0 with S1–S7. After CONTINUE, finalize once its latest turn finishes. Recompute disjoint segments, replace the current step total and retain prior exports; do not seal at an older END or add two versions of the total. If final usage is missing, retain provisional status and rerun locally later, without a model turn.

S7 最后回复结束后统一收尾：
After S7's final reply, reconcile all steps:

```powershell
Set-Location -LiteralPath '<WORKSPACE>'
& 'C:\Users\auyhp\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -X utf8 '.\wf6-evidence\usage\collect_usage.py' finalize --all --wait-seconds 30
```

这是本地读取/汇总，不调用模型，因此不会为计数本身新增模型 token。最终仍只能报告 provider 实际暴露的字段；没有数据不能承诺 exact。

This local export does not call a model and adds no model-token usage. It can report only fields actually exposed by the provider; missing telemetry prevents an exact claim.

## 建议的逐步用量表 Suggested usage ledger

```text
step_id,status,session_id,turn_ids,start_event,end_event,input_tokens,cached_input_tokens,output_tokens,reasoning_output_tokens,total_tokens,final_reply_included,source_log,coverage_notes
S0,not_executed,,,,,,,,,,,,
S1,not_executed,,,,,,,,,,,,
S2,not_executed,,,,,,,,,,,,
S3,not_executed,,,,,,,,,,,,
S4,not_executed,,,,,,,,,,,,
S5,not_executed,,,,,,,,,,,,
S6,not_executed,,,,,,,,,,,,
S7,not_executed,,,,,,,,,,,,
```

状态定义 Status meanings：

- `exact_reported`：身份、范围、计数和最后回复覆盖均已核实。Identity, scope, counters and final-reply inclusion verified.
- `provisional`：当前已保存计数，最后回复或结束事件未结算。Saved usage is awaiting final-reply/end-event settlement.
- `partial`：已知部分真实，但存在未能恢复的缺口。Known usage is real but coverage has unrecoverable gaps.
- `not_provided`：已执行步骤没有可取得的 provider usage。The step ran but provider usage is unavailable.
- `not_executed`：未执行本步骤，不假装有实际 token 测量。The step was not executed; no actual measurement is claimed.

## 依据与计量限制 Sources and accounting limits

实验范围沿用 `WF6-plan.md`，证据项目对应作业 PDF 的 Evidence log 与 Report Content。本文件不修改既有报告，也不把历史工作成本计入未来 WF6 执行窗口。编写本 prompt 文档的成本属于准备之外的已发生工作；若要比较，另列为 prompt preparation，不能悄悄计入或抹去。

The experiment follows `WF6-plan.md`; evidence maps to the assignment's Evidence log and Report Content. Historical work is outside future WF6 execution windows. Preparing this prompt document is separate pre-experiment work and should be labelled prompt preparation if included in a comparison.

cached input 的子集关系可参照官方 [Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching) 的 usage 字段和计算示例。本地 Codex 计数应以实际 provider 日志 schema 为准，而不是假设 API 文档证明当前桌面日志总能提供全部字段。原 WF4-R2/R3 的计量记录证明本地曾有 `token_count` 累计事件，也记录了最终回复延迟；未来 S0 仍须重新核实。

The official [Prompt caching guide](https://developers.openai.com/api/docs/guides/prompt-caching) documents cached input within input usage. Local Codex accounting still depends on its actual provider-log schema, not a guarantee that API documentation describes every desktop field. Prior WF4-R2/R3 records show cumulative token_count events and final-reply lag, but S0 must verify the new session again.
