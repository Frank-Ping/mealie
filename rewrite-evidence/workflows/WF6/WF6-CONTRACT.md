# WF6-CONTRACT — wf6-rerun-20261014-01

S0–S7 numbering is authoritative. One implementation agent, serial work.

## Common contract / 共同契约


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

1. `prompt.txt`：实际收到的用户指令；可见追加消息、反馈和真实发生的人工决定也要保留。
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


## Persistent workspace requirements / 工作区要求

# WF6 实验要求

## 适用范围

本文件中的实验规则只适用于 **WF6 Route-level incremental coexistence** 的聊天、目录和文件。不要将这些限制或计量窗口套用于 WF1–WF5、历史报告或其他工作。直接的用户指令优先于本文件；用户明确修改实验范围、预算或步骤时，记录该决定后遵照执行。

工作区根目录：`C:\Users\auyhp\OneDrive\Desktop\574-agentic development\574-week12`。

执行前读取：

1. `WF6-plan.md`。
2. `WF6-step-prompts-bilingual.md`，特别是共同契约和当前步骤。
3. `COMPX574 - Agentic Development.pdf` 中的 Workflows、Evidence log 和 Report Content。
4. S0 创建之后的 `mealie-wf6-coexist/rewrite-evidence/workflows/WF6/WF6-CONTRACT.md` 与最新进度、结果和用量记录。

步骤编号以 `WF6-step-prompts-bilingual.md` 的 S0–S7 为准；`WF6-plan.md` 中较早的 S0–S5 是阶段分组，不是另一个执行顺序。

如果当前目录进入含独立 AGENTS.md 的 checkout，也读取其中的开发约定。WF6 专属的实验范围、阶段授权和计量规则继续有效；不要因切换目录丢失它们。保留原仓库 AGENTS.md，必要时仅在 WF6 checkout 中附加带明确标题的 WF6 规则，不编辑旧实验的文件。

## 开始与分步执行

- 新聊天名为 **WF6**。新建聊天后的首次初始化只读取这些文件并确认准备状态，等待用户发送 S0；不要因为聊天创建而执行实验。
- 只有收到 `[[WF6:S0:START]]` 或用户明确要求开始 S0，才启动 WF6 的 S0 与正式 token 窗口。若用户用自然语言开始步骤，保存实际原文并建立明确阶段边界，不伪造用户发过标记。
- 按 S0–S7 顺序，每次执行用户指定的一个步骤，结束后停止并返回验收结论。用户明确授权多个阶段时可按顺序执行并单独保存每阶段证据。
- 前置 gate 未通过，不执行依赖步骤；失败后可执行 S7 整理现有证据。缺失或未运行的检查不等于通过。
- 一个实施代理，串行完成。不启动并行实施或将 WF6 改造成 WF4。若用户另行授权审查代理，记录其任务、会话、独立用量与覆盖范围。
- 代码注释使用英文；用户解释默认中文。报告素材中英文对照。每个 bilingual prompt 只执行用户实际发送的一个版本。

| 步骤 | 任务 |
| --- | --- |
| S0 | 独立环境、冻结来源、契约、证据与计量工具 |
| S1 | 重新测量未修改 Vue baseline |
| S2 | 验证所有页面仍由 Vue 提供的同源网关 |
| S3 | 先证明 Vue 与最小 React 骨架双向跳转及真实会话 |
| S4 | 实现真实食谱列表、搜索和只读详情 |
| S5 | 验证用户路径、边界、异常与检测负例 |
| S6 | 显式回退、恢复接管、完整冻结回归 |
| S7 | 证据审计、双语报告素材和用量收尾 |

S2–S6 合计三小时模型执行与工具等待预算；依赖准备、S1 baseline、人工停顿和 S7 整理另列。S2、S5、S6 各最多两轮修复；S3/S4 共用最多两轮源码修复。达到限制时保留失败并停止，不降低门槛、不隐藏额外轮次。用户明确改变预算时记入决定日志。

## 隔离与固定输入

- 原 Vue commit：`4b9ca06b6581f7152e164ea0fd9d4da366975a79`。
- evaluator commit：`758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d`。
- 先核实 Git 对象、来源与内容；从固定原 Vue 建立独立 checkout，不从包含旧 React 工作的当前 HEAD 开始。
- 独立目录：`mealie-wf6-coexist/`、`mealie-wf6-evaluator/`、`wf6-evidence/`。
- 实验分支：`rewrite/wf6-route-coexistence`。
- 创建前检查已有目录。可继续已验证的 WF6 工作，不覆盖、不重置、不清理其他实验。
- 不读取或复制其他 workflow 的 React 实现、codemod 和语义适配。可以使用指定冻结 commit 中原 Vue、未修改生成类型、locale 和原 evaluator 输入。
- SQLite、测试账号、auth 文件、浏览器 context/profile、端口、运行目录、输出和计量窗口全部独立。localhost cookie 不按端口隔离，不能只更换端口。
- 运行在 sandbox 内并记录工具权限。不提供 upstream repository、package registry 或 production service 凭据；公开依赖匿名访问，只使用隔离本地测试凭据。
- 不配置推送 remote，不向 upstream 开 PR，不修改其他 workflow、原 Word 报告、后端 API/schema 或冻结 evaluator 断言。
- 本工作区根目录不是实验 Git 仓库，不在根目录初始化 Git。提交只在 WF6 checkout 内进行。

## WF6 的独特机制与本轮范围

同一个本地入口按路由提供 Vue 或 React；跨框架使用整页导航，显式开关可恢复全 Vue。这是真实运行共存实验。

- 第一轮仅为已认证测试用户所属配置 group 接管 `/g/<testGroupSlug>` 与 `/g/<testGroupSlug>/r/<slug>` 的只读食谱功能。
- React 实现真实 API 列表、搜索、真实链接、名称、配料、步骤、工具、分类、标签及 loading/empty/error 状态。
- Vue 保留登录、创建、编辑、评论、购物清单、管理和其他尚未迁移功能。它们不计作 React 完成成果。
- 新建 `frontend-react-wf6/`、`wf6/gateway.mjs` 与 `wf6/route-map.json`；Vue 只新增必要边界 middleware。
- 准确排除创建及子路由、共享页面、其他 group 与 Vue-owned edit/parse/cook 模式，保留 query/hash，防止误接管和跳转循环。
- React 启动后用真实 `/api/users/self` 核实身份与 group。匿名、401 或 group 不匹配使用明确 Vue 入口，不能展示错误 group 的数据。
- 先证明最小共存，再实施业务页面。若边界失败，停止扩展，保留失败；不要退化为脱离 Vue 的独立 React 两页实现。
- 目标栈：Vite、React 19、strict TypeScript、React Router、MUI、react-i18next。导航使用 React Router 的 `Link` 等实际 API；Nuxt composable 不能直接充当 React hook。
- 构建成功后才进行相应浏览器验收，记录实际服务的源码/build hash。不用失败构建留下的旧 dist 冒充本轮结果。
- 接管开启时 React 故障应被检查发现，不静默回退 Vue 掩盖失败。回退通过显式开关或明示旧前端入口发生。
- 分别记录 React、Vue、混合路径、边界和回退成绩。混合应用通过 66 routes 不代表 React 已迁移 66 页；两页只读 pilot 不代表完整系统重写或生产就绪。

## 每个步骤必须整理的证据

`wf6-evidence/steps/Sn/` 保存以下文件或写明缺失原因：

- `prompt.txt`：实际用户 prompt 与可见续跑/澄清/反馈；记录真正发生的人工决定。
- `visible-transcript.jsonl`：可取得的用户、可见助手、工具调用和输出，说明覆盖范围。不导出隐藏推理或系统/开发者指令，不把重建摘要称原始逐字 transcript。
- `commands.jsonl` 与 `logs/`：完整命令、cwd、必要的去敏环境、开始/结束 UTC、退出码、耗时、原始 stdout/stderr、机器结果。分享副本移除密码、cookie 与 bearer 值。
- `source-state.json`、`diff.patch`、`file-manifest.json`：source/evaluator SHA、dirty、实际修改与未跟踪实现文件、SHA256、服务的 build 标识。起始 commit 不冒充验收源码。
- `attempts.jsonl`：失败、原因假设、具体修复、重测与原日志链接；成功后保留失败历史。
- `result.md`：本步实际完成、PASS/FAIL/BLOCKED、测试成绩、未验证范围、证据链接与后续阶段。
- `token-usage.json`：本步 token 原始来源、边界、差额、覆盖状态和最后回复计入情况。

同步全局 `wf6-evidence/EVIDENCE_INDEX.md`、`PROGRESS.md`、`decisions.jsonl`、`timing.csv` 与 `usage/usage-ledger.csv`。coverage、人工 review 时间、费用无法取得就写未提供，不填零、不虚构。

原始 logs/trace/usage 留在兄弟证据目录，不从实验 checkout 提交。可提交的小型 baseline、结果、报告素材、阶段小结和索引指针放在 `mealie-wf6-coexist/rewrite-evidence/workflows/WF6/`，链接原始证据。提交用 `[WF6-Sn]` 前缀，排除依赖、数据库和凭据。

## 从 S0 开始记录 Token

1. 正式起点是实际 S0 用户执行请求。S0 建立环境和记录器本身也计入；此前计划、prompt 编写和新聊天初始化单列为 preparation，不混入 S0–S7。
2. 每步保存实际 session/turn ID、模型/设置、原日志与行号/offset、开始前及结束 provider 累计事件。缺失边界不能假设为零。
3. `total_tokens = input_tokens + output_tokens`。cached input 已包含在 input，reasoning output 已包含在 output；字段单列，不重复相加。cache-write 若暴露则保留真实字段及语义。
4. 累计快照只取差额。账号额度百分比与文本 token 估计不是 provider usage。费用无数据则未提供。
5. 每步 `token-usage.json` 与 ledger 均有一行；失败、阻塞、修复和澄清都计入实际所属步骤。未执行为 `not_executed`，未提供字段为 null。
6. 本步最终回复之前只能保存 `provisional` 且 `final_reply_included=false`。下一步开始结算上一阶段，或用户在回复结束后从终端运行 S0 建立的 collector。
7. S7 最后回复后由用户运行 `collect_usage.py finalize --all --wait-seconds 30` 收尾，不再用额外模型 turn 声称已计入它自己的最终回复。
8. 只有原始事件、身份、边界、最后回复覆盖与一致性都核实后标 `exact_reported`。否则保持 `provisional`、`partial` 或 `not_provided`；文件大小稳定本身不证明计数完整。
9. `[[WF6:Sn:CONTINUE]]` 属于同一步。已结算步骤续跑用互不重叠 `segments[]`，取最新续跑 turn 的 END/usage，保留旧导出并替换当前合计，不把两版合计相加。期间额外讨论单列。
10. 去重、counter reset、compaction、fork、跨 session/turn 迟到事件与重复 START 都按原始身份处理；不能截断负差额、重算继承历史或猜测缺口。无法还原则 partial。
11. S0 创建独立 collector 与 `tracking-config.json`、`stage-boundaries.jsonl`、`raw-token-events.jsonl`、`usage-ledger.json/csv`、`USAGE.md`，实际核实日志 schema并验证关键失败路径，不复制旧 tracker 的窗口。
12. 汇总分开列 S0准备、S1 baseline、S2–S6实验、S7报告与额外讨论。仅汇总不重叠区间，已知部分和缺失量分开。

## 阶段结束与最终报告

每步简洁回复：实际完成、gate、证据位置、失败/限制、input/cached/output/reasoning/total、计量状态和下一步。末尾用 `[[WF6:Sn:END]]`；用户只授权本步时不自动执行下一步。

最终报告素材用 Approach → What happened → Why → What we would change，关键结论链接 commit、原始日志或 trace。说明源码因素、人工判断、成本、时间、验证负担和局限。不要把 mock、局部检查或 Vue 保留行为升级为完整 React/真实部署成果，也不按小范围耗时宣称优于整站 rewrite。Contribution summary 不包含本次 agentic rewrite。

本文件只是持久化实验要求。它的创建不表示 S0 或 WF6 实验已经开始。

## Approved rerun and CLI handoff / 已批准的新 run 与 CLI 交接

Run ID: wf6-rerun-20261014-01. Use this run's nested mealie-wf6-coexist,
mealie-wf6-evaluator and wf6-evidence directories. The user approved restarting
S0; this supersedes earlier instructions not to repeat S0. Old records remain
historical and unchanged. This run's actual START request is in external
wf6-evidence/steps/S0/prompt.txt, with the original provider locator in tracking-config.
The initialization turn is preparation; desktop migration troubleshooting has no
imported original transcript and remains separately not_provided.

用户已批准嵌套目录及从 S0 重启；旧 run 保留，新 run 不复用旧成绩或计量起点。
本次真实 START 请求为 S0 起点；初始化属于 preparation，桌面排障单列。

Original stdout/stderr, tools, logs and traces retain their original language.
New code comments and technical/attempt explanations use English. Results,
step summaries and report material are bilingual. Preserve actual user prompts.
原始输出保持原文；新增技术说明与代码注释用英文；结果和报告素材中英文对照。

Pinned snapshots are explicitly declared shallow roots in the new stores.
All commit/tree/blob IDs and worktree bytes are verified against historical
origin stores. Full ancestor history is unavailable and is not claimed.
缺失父对象通过新 checkout 的显式 shallow 边界处理；完整祖先历史未恢复。

The actual runtime is Ubuntu WSL2 Codex CLI. Use /usr/bin/python3 for the
standalone evidence collector (not project backend execution). Revalidate
models, permissions and usage schema at subsequent turns; do not assume desktop
configuration or accounting windows. Unknown identity, resets, compaction gaps,
forks and unresolved duplicate START remain partial. A new session must receive
its own verified source configuration; never silently concatenate sessions.
CLI 的 collector 使用核实的 Linux Python；新会话须显式绑定来源与边界。

Finalize from Ubuntu after the final reply:
python3 -B wf6-evidence/usage/collect_usage.py finalize --stage S0 --wait-seconds 30
After S7, use finalize --all --wait-seconds 30 from this run root. No further model
turn is needed to include its own final reply. Only original verified events may
justify exact_reported; pre-reply records stay provisional.
最终回复结束后从终端收尾；S7 使用 --all；回复前保持 provisional。

## S6 CONTINUE 02 explicit scope amendment / 明确范围调整

The actual user CONTINUE request authorizes a limited extension to resolve the four frozen S6 FAIL: real React Logout through POST /api/auth/logout, role/permission-based Settings navigation to existing Vue household/admin pages, and real recipe comment read/create/persistence through existing API/types. This overrides the earlier read-only/no-comment/no-layout restriction only for these features. Source editing/creation, other domains and settings page implementation remain Vue-owned. No evaluator/backend/schema changes or test-specific routing are permitted.
用户明确授权以上四项有限扩展，替代对应的只读限制；其他规则继续有效，设置页面仍由 Vue 提供，不计 React 设置页迁移。

Authentication handoff amendment: anonymous/verified 401 on protected React pilot routes now clears local session state and deliberately document-navigates to Vue login (preserving the target). Logout cancels owned requests, clears local user data/cache and cookie, performs the real logout POST and enters Vue login. Resource/config/network errors and 5xx remain visible failures and never automatically fall back to Vue. Wrong-group identities keep an explicit Vue entry and cannot access pilot data.
认证交接变更：保护路由真实匿名/401 进入 Vue 登录；资源/5xx 不自动回退，错误 group 不展示数据。

Comments follow original Vue identity and recipe.settings.disableComments / current household.preferences.recipeDisableComments conditions. Blank input is rejected, submitting is disabled, server failures are visible, success requires the server response and reload reads server data. This does not authorize editing/deleting comments or recipe writes. S6 retains its two repair rounds and the existing three-hour budget; the four old FAIL and all original traces/commits remain historical.
评论遵循原 Vue 权限和禁用条件，仅授权读取/提交/持久化；不授权编辑/删除或食谱写入，预算和两轮上限不重置。

Reason: the unchanged evaluator requires direct controls on pilot pages; continuation-01 proved the older explicit Vue recovery paths worked but did not satisfy those original flows. Authoritative actual Chinese prompt and boundary: external steps/S6/continuation-02/prompt.txt and request-boundary.json.
原因：已有显式 Vue 功能可用但不满足原流程，本次用户明确批准有限直接实现；原 prompt 保留。

## S6 CONTINUE 03 final single-round authorization / 单轮追加授权

The actual user explicitly raises the S6 repair limit from 2 to 3, adding exactly one round for comment submission/persistence state separation. Prior exhausted 2/2 and FAIL records remain historical, and the three-hour budget is unchanged. Identity/group/disable checks stay intact. Draft is captured and hidden during submission, only real POST success renders published data, and failure restores the draft. No fourth repair, evaluator change, fixed wait or test identification is authorized. Actual prompt: steps/S6/continuation-03/prompt.txt.
用户仅批准追加一轮评论修复，上限 2→3；旧 FAIL 保留，三小时预算不重置，禁止自动第四轮。
