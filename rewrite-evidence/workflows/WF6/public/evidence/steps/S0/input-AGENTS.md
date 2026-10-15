# WF6 实验要求

## 适用范围

本文件中的实验规则只适用于 **WF6 Route-level incremental coexistence** 的聊天、目录和文件。不要将这些限制或计量窗口套用于 WF1–WF5、历史报告或其他工作。直接的用户指令优先于本文件；用户明确修改实验范围、预算或步骤时，记录该决定后遵照执行。

工作区根目录：`<WORKSPACE>`。

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

- `[REDACTED]`：实际用户 prompt 与可见续跑/澄清/反馈；记录真正发生的人工决定。
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
