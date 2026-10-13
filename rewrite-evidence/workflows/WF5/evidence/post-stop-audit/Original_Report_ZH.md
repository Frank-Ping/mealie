# WF4-R2 Gate 2 独立审核

审核日期：2026-10-14，Pacific/Auckland。原始执行日志使用 UTC，日期为 2026-10-13。

**审核建议：Gate 2 不通过，维持 NOT READY 和停止批量转换。** 三个固定样本仍受阻，至少 3/5＝60%，已超过批准的 30% 停止阈值。此外，本次独立复现了两项审核工具缺陷、三项已实现行为缺陷，并发现逐轮语义审核记录不完整。常规检查通过不能解除这些阻塞。

本次没有修复实现、修改原始 Vue/backend/evaluator、修改既有实验记录、增加正式样本审核轮次或开始批量转换。唯一新增的仓库文件是本报告；所有测试和故障注入在独立临时副本执行。最终决定仍由用户作出。

## 1. 审核范围、版本和证据

- 正式源码：`<WORKSPACE>/mealie-wf4-rerun`。
- 被审核 HEAD：`8b0fae128ea823ebee4a6507d274df1f8987e8d1`。
- 冻结原源码：`4b9ca06b6581f7152e164ea0fd9d4da366975a79`；冻结 evaluator：`758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d`。
- 选定产物：`rewrite-evidence/workflows/WF4-R2-artifacts/round-3/revision-4/`。
- 独立临时副本：`<EXECUTION_COPY>`。
- 新审核证据：`<WORKSPACE>/wf4-r2-evidence/gate2-independent-review/20261013T111104Z/`。

已读取 AGENTS.md、Gate 2 提交说明、plan、decisions、conversion-rules、state，并核对原始五文件、转换器、runner、fixtures、生成文件、基础设施、原/新测试、各轮结果、风险探针、历史失败和用量边界。三个并行只读子任务分别检查组件语义、基础设施语义、来源与记录；本报告中的执行结论来自实际保存的独立运行结果。

临时副本的 1,805 个 Git tracked 文件与正式源码审核前字节完全相同。依赖来自已安装 pnpm 包的独立文件拷贝：15,414 个文件、798 个副本内部链接；没有链接到正式源码的 node_modules，也没有进行新的网络安装。运行 Node v24.19.0；目标依赖、strict tsconfig 和 lockfile 保持原样。

关键索引：

| 证据 | 内容 |
| --- | --- |
| setup.json (`setup.json`; original source reference retained in the publication manifest) | 临时副本、版本、文件一致性、依赖复制范围 |
| [check-results.json](check-results.json) | 六项常规检查的完整命令、cwd、时间、退出码 |
| [fault-results.json](fault-results.json) | 19 项故障/对照检查，包含变更前后 SHA256 |
| [probe-results.json](probe-results.json) | 16 个独立行为探针的名称、通过/失败、堆栈 |
| provenance.json (`provenance.json`; original source reference retained in the publication manifest) | 来源、所有 tracked Git blobs、最终产物、复用、断言及历史记录核对 |
| [final-preservation.json](final-preservation.json) | 报告保存后的正式文件与临时副本保全核对 |

环境准备曾遇到 Windows MSYS、TAR symlink 和 sandbox junction 限制；最终副本准备成功后才开始测试。准备失败单独记录在新证据目录的 setup-attempts.md、setup-clone.log、setup.log，不能算成 Mealie 实现检查失败。

## 2. 需要处理的发现

### F1 [P1] 规则测试没有核对固定样本的 expected 快照和完整身份

位置：test.mjs:33 (`test.mjs`; original source reference retained in the publication manifest)、run.mjs:17 (`run.mjs`; original source reference retained in the publication manifest)。前者只检查生成两次一致、长度为五、每项有 output 或 diagnostics；后者仅验证五个不同 id、路径安全和源文件存在。它们没有逐字节比较已审定的 pure 快照，也没有把五个 id/path/component 与固定清单逐项绑定。小 fixture 的 expected 只是输出子串断言（test.mjs:16–20）。

独立故障注入结果：

| 变更，仅在临时副本 | 应有结果 | 实际规则命令 |
| --- | --- | --- |
| 移走选定 pure/BaseButton.tsx | 缺失必需 expected，应失败 | exit 0，20 个规则测试仍通过 |
| 将该快照改成无关 export | expected 不匹配，应失败 | exit 0 |
| 把固定 page 的路径替换为 RecipeChips.vue，保留五个 id | 固定样本替换，应失败 | exit 0 |
| 令转换器只对真实 RecipeChips 把 urlPrefix payload 改成错误字符串 | 错误转换，应失败 | exit 0 |

最后一个注入另经新进程验证：实际输出包含 `__AUDIT_WRONG_PAYLOAD__` 且 diagnostics 为空，见 event-reference.json 及 faults/wrong-component-observed.log。因此不是“注入未生效”。归档哈希核对能发现篡改，但当前规则测试命令没有调用这个检查；两种证据必须分开。

影响：通过日志不能证明固定样本输出与审核快照一致，也不能防止替换困难样本。建议将固定清单和必需 expected 列表纳入独立的验收约束，逐项校验源身份、阻塞 verdict 和完整输出字节，确保缺失/篡改均失败。本次未修改工具。

### F2 [P1] 完整生成命令在后续失败时仍改写先前输出

位置：run.mjs:113 (`run.mjs`; original source reference retained in the publication manifest)、run.mjs:120 (`run.mjs`; original source reference retained in the publication manifest)、run.mjs:125 (`run.mjs`; original source reference retained in the publication manifest)。CLI 依次发布 pure、refined，直接改写 generated/ 和结果记录，最后执行 reuse()。只有单次 publishArtifacts() 的目录操作使用 staging；整个 CLI 没有事务或回滚。

独立复现：在临时副本的既有 generated/BaseButton.tsx 放入需在失败时保留的审查标记；把最后一个 reuse 目标 redirect.test.ts 换成空目录，触发 EISDIR。运行临时故障重放时 CLI exit 1，但 BaseButton.tsx SHA256 从 `8f71479571688dfbdbeab5056f3082c76dafa4e4ffcac9b0f0894b1dab0d6644` 变成 `3b551ab7ccb18dcc7e79e06de4c977c7eb6573dc67e9920a2e0866f30b1dbe71`，且新的 pure/refined 均已发布。

证据：fault-results.json 的 late-reuse-failure-cli、faults/late-reuse-failure-cli.log。临时重放使用 round-3/revision-9 路径隔离输出，仅用于失败测试，不是新增正式审核轮次；正式 round-3/revision-4 完全未动。注入后临时 tracked 文件也已恢复。

影响：失败命令会留下不完整的跨目录状态，违反后续操作失败时保留原输出的约束。建议先验证全部目标并在临时树完成所有步骤，再统一发布或提供可验证的回滚。单目录 publishArtifacts 的安全测试仍通过，不能推广成整个 CLI 的原子性保证。

### F3 [P2] R06 对三种事件处理形式返回成功，但事件行为错误

位置：convert.mjs:84 (`convert.mjs`; original source reference retained in the publication manifest)、convert.mjs:155 (`convert.mjs`; original source reference retained in the publication manifest)。代码只对 arrow 做无参数调用；方法引用只被求值，`$event` 未替换成目标事件参数。

| 原 Vue listener | 生成 listener 的核心行为 | 独立执行结果 |
| --- | --- | --- |
| @click="handle" | void(handle) | handle 没有被调用 |
| @click="(event) => handle(event)" | 无参数执行箭头函数 | handle 收到 undefined |
| @click="handle($event)" | 保留未定义的 $event | 抛 `$event is not defined` |

三种都返回空 diagnostics，rules 包含 R06。独立探针从实际生成 TSX 的 onClick AST 提取 listener、用 TypeScript 转译并传入 click 事件执行；输入/输出都保存于 faults/event-*.input.vue 与 *.output.tsx。event-reference.json 另记录本地 @vue/compiler-dom 3.5.35 对这三种原模板的事件编译参考，支持上述事件参数契约；没有声称重跑了源应用 Vue 3.5.43 的浏览器。

影响：这是转换规则的错误成功，不是明确 unsupported。已选两个组件用到的特定表达式能通过，不能据此扩展成方法引用/带参数 arrow/$event 都安全。建议实现这些表达式的事件调用和作用域规则，或在未支持时明确阻塞，并增加实际调用断言。

### F4 [P2] BaseButton 的 Vue 专属 block 属性被静默丢失

位置：ui.tsx:33 (`ui.tsx`; original source reference retained in the publication manifest) 至 42；生成 BaseButton.tsx:132 把 attrs 传入该适配器。真实源调用 InputLabelType.vue:27 (`InputLabelType.vue`; original source reference retained in the publication manifest) 和 RecipeIngredientEditor.vue:91 (`RecipeIngredientEditor.vue`; original source reference retained in the publication manifest) 使用 block。

独立 JSDOM 探针渲染 `<BaseButton block />`：没有显式 unsupported 错误，没有 MuiButton-fullWidth，React 还报告未知非布尔 DOM 属性 block。review-samples.test.tsx:29–37 失败。规则 conversion-rules.md:165,179 明确要求只转发支持的属性、审查未知 attrs，禁止把 Vue 专属属性直接 spread 到 DOM。

影响：真实调用者的宽度行为被静默改变。建议映射成 MUI fullWidth 或明确拒绝该属性；其余 Vue 专属 attrs 也需明确清单。本次没有据此断言所有 attrs 都错：id、aria、data、title、type、普通 click 的附加探针通过。

### F5 [P2] store 数据处理失败后 loading/error 状态无法清理

位置：store.ts:38 (`store.ts`; original source reference retained in the publication manifest) 至 42。Promise 使用 `.then(success, rejection)`；success 内 frozenCopy(data) 抛错，不会进入同一个 then 的 rejection callback。

独立复现：createSharedStore<unknown>(null) 的 loader 返回 Date。plain-data 校验按既定约束拒绝该值；捕获 Promise 拒绝后，snapshot 却仍 loading=true、error=null。review-infra.test.tsx:14 的 loading=false 断言失败。现有 store.test.tsx:40–49 只覆盖 loader 本身抛错，没有覆盖成功回调中的校验错误。

影响：已实现 primitive 的错误状态可持续显示加载。建议统一捕获 loader 和数据处理错误并清理状态。这不证明 food-store 已迁移；其租户、公私 scope 和 factory 仍明确阻塞。reset 后新旧 flight 两种完成顺序的独立探针都通过。

### F6 [P2] 三轮记录未提供要求的逐文件语义审核 verdict

要求：plan.md:74 (`WF4-R2-plan.md`; original source reference retained in the publication manifest) 每轮记录每样本的 unsupported、可复用修正、残余逐文件修补和 manual review verdict；plan.md:25 还要求完整文件和规则的审核结论。

观察：round-1/2/3-results.json 的全部 semantic 字段（各文件的行 25,54,82,103,129）仍为 pending review；revision-2/3/4 也如此。最终 pure/manifest.json:45,74,102,123,149 同样全部 pending。提交说明虽然叙述三轮内部审核，但没有分开记录内部审核 verdict 和待用户决定的 Gate 2。

结论：可以证明存在三个编号轮次和修正产物；不能据此证明逐轮语义审核表完整。本次没有推断“审核根本没做”，也不把用户审核 pending 本身当错误。建议补充实际审查人/方式、逐样本逐规则 verdict、证据和残余修补表，保持未验证状态与失败结果，不追认成功。

## 3. 五个固定样本的独立结论

| 样本 | 实际输出 | 本次结论与源码依据 |
| --- | --- | --- |
| index.vue | 不存在 | 阻塞正确。index.vue:6 的 use-default-activity 有 Vue/composable 依赖，首页 auth/公共组/异步导航链未闭合；最终首个诊断为 R35。R21/R28 等后续语义也未实现。 |
| RecipeChips.vue | 生成 | pure/refined/generated 字节一致；默认值、limit/truncate、原对象及 urlPrefix payload、preventDefault、title=true 和转义检查通过。真实视觉、重复 name key 的业务唯一性仍未验证。 |
| BaseButton.vue | 生成 | 局部优先级、非空 slots、SVG、链接、传入 download port 等通过；F4 表明全文件 attrs 契约尚未满足。真实 transport、完整 theme/tonal/legacy size/cancel 等仍未集成或明确拒绝。 |
| use-food-store.ts | 不存在 | 阻塞正确，R25。源文件:6–10,29–36 共享同一个 array，有公私两套 flags/API/factory；shared-store primitive 不能替代完整等价映射。 |
| layouts/default.vue | 不存在 | 阻塞正确，R22。源文件:6 引入未转换的完整 DefaultLayout，:7–9 还有全局 i18n 初始化；不能用薄 facade 当 shell 已转换。 |

三个未生成文件有诊断，未用空组件或假页面替代。规则状态清单为 20 个 partial subset/primitive、15 个未实现；不能说完成了 35 条规则。最终诊断的 dependency 行号落在第 5 行前导换行，而实际 import 是第 6 行；这是定位精度问题，不改变阻塞结论（convert.mjs:184,189 使用 statement.pos）。

## 4. 常规检查、故障注入和附加行为结果

| 独立常规检查 | 结果 | 退出码 |
| --- | --- | --- |
| node --test ../rewrite-tools/wf4-r2/test.mjs | 20 passed，0 failed | 0 |
| TypeScript --noEmit | strict=true，noUncheckedIndexedAccess=true，skipLibCheck=false；0 diagnostics | 0 |
| ESLint，--max-warnings=0 | 0 errors/warnings | 0 |
| Vitest 原样运行 | 36 passed，0 skipped | 0 |
| sample SPA production build | 通过 | 0 |
| component-library production build | 通过 | 0 |

六项在附加 probe 和故障注入之前对未改动副本运行。没有移除 strict、改锁、更新 expected、修复代码或忽略失败来获得通过。check-results.json 保存每个命令的 argv、cwd、UTC 起止、耗时、退出码；对应 *.log 和 unit-results.json 保留原始输出。

故障/对照检查共 19 项：11 项安全条件满足，8 项不满足，后者合并为 F1、F2、F3 三组问题。这里的 FAIL 是审查发现，并非审查脚本没有完成。

| 检查组 | 独立结果 |
| --- | --- |
| 必需 source 缺失、fixture source/expected 缺失、错误 fixture expected | 均 exit 1；没有静默跳过 |
| 选定 expected 缺失/损坏、替换固定 source 路径、真实组件错误 payload | 仍 exit 0；F1 |
| 同一五文件输入生成两次 | 完整结果一致；两个 emitted TSX 与选定 pure 字节相同 |
| 未知模板组件 | output=null，blocking diagnostic |
| refinement anchor 缺失/重复，以及第二个操作失败 | 抛错，传入 original map 的前后 hash 相同 |
| 单次 publishArtifacts 覆盖既有目录/后续非法文件路径 | 正确拒绝；既有输出不变/没有发布坏目录，失败 staging 保留 |
| 完整 CLI 的后续 reuse 写入失败 | exit 1，但先前输出已改写；F2 |
| 三种 R06 handler 形式 | 错误成功；F3 |
| 故障后临时 tracked 文件恢复 | 无差异 |

另执行 16 个新增行为探针，14 passed、2 failed，Vitest exit 1；失败分别为 F4 和 F5。通过项包括：普通 click 事件参数和属性、真实 query/hash href 与普通 Router 导航、caller preventDefault、Ctrl/Meta/Alt/Shift/中键不被 SPA 截获、downloadUrl 更新、RecipeChips prevent 但仍 bubbling、reset 两种新旧 flight 完成顺序、auth 编码 query/hash 保留、人工注入第二语言的英语 fallback/语言更新。

这些是独立新增探针，保存在 review-infra.test.tsx、review-samples.test.tsx；运行时只临时放入副本 tests/，运行后已移除。JSDOM 的修改键检查证明“不截获”，不证明真实浏览器开启新标签页。第二语言资源是审查注入，不能当真实多语言迁移结果。

## 5. 来源、产物和正式文件保全

独立核对通过：

- 最终五个 source hash、五个 converter/runner/fixture/tool hash、七个 infra hash、lock hash、两个 TSX 的 pure/refined/published 全部对应；共 24 项最终清单核对。refinement-manifest 的 operations 为空，未发现隐藏手工 refinement。
- 所有八组 reused 源/目标逐字节相同，共 16 个 SHA256 对照。生成 API 类型未手改；原 locale 未改。
- 正式 frontend/、mealie/ 对冻结 source SHA 无 diff；当前 1,805 个 HEAD Git blobs 与文件一致。evaluator 的 1,789 个 tracked Git blobs 也全部匹配其固定 HEAD。
- 六份历史 pure artifact 的两个输出各自匹配旧 manifest；早期轮次缺完整工具/infra 快照，提交说明已承认，不能当完全自包含的历史重放包。
- 旧 WSL checkpoint b574538 与当前 HEAD 的三个文件差异都是后续 Gate 2 verdict/review/state 记录，属于 8b0fae1 提交；转换代码没有漂移。
- 报告保存后，审核前记录的正式 1,805 文件和临时副本 tracked 字节保持不变；Git 只显示本报告新增。详见 final-preservation.json。

历史保全声明有一个范围缺口：save_checkpoint.py:22 (`save_checkpoint.py`; original source reference retained in the publication manifest) 只处理 TAR 普通文件，跳过 CLAUDE.md symlink；所以 1,804 是普通文件子集，不能称全部 1,805 tracked entries。archive 本身有 `CLAUDE.md -> AGENTS.md`；本次另按 Git blob/link-target 规则验证了其九字节目标，没有发现漂移。此项属于历史保证范围修正，不是观察到源文件被篡改。

## 6. 测试迁移归属、失败历史和停止条件

source-test-inventory 的 48 个文件哈希全部匹配；独立 TypeScript AST 统计 817 个直接 expect(...)，与每文件记录一致。这只能证明清单准确，不能证明这些断言已经迁移。

确实只有 truncateText 和 redirect validator 两个 helper suite、共十个 case 按字节迁移并在目标执行；其他 46 个源测试文件未迁移。两个新增 auth correspondence probe 使用不同 Router harness，不能说原 Vue auth suite 原封不动执行。全部 36 个 target 测试及本次 16 个新增探针也不能替代原 517 个 Vue 测试、66 routes、15 flows 和 82 个 Playwright 检查。

原失败记录仍存在：Windows lint 的 no-unused-expressions、MUI/exactOptionalPropertyTypes 声明冲突、旧 WSL Nuxt icon 依赖失败、python 命令不存在。历史日志已核对而未重新执行旧失败版本；最新独立六项通过来自本报告所列的当前 Windows 副本，不宣称本次重跑了 WSL。相关路径及行号保存在 provenance-notes.md。

批准方案要求最多三轮；五文件中至少两项仍需逐文件修补即超过 30%。当前至少三个 unsupported＝60%，另有 BaseButton 集成及新增语义失败。因此停止批量转换符合已批准条件，无需为了完成新功能再进行第四轮。逐轮记录缺口 F6 不给出继续实施授权，也不能把失败改写成通过。

mandatory risk probes 已逐组记录：RecipeCard、BaseDialog、DefaultLayout、login/auth/session、shopping-list mutation/timer/undo、SafeMarkdown、legacy i18n 等均未完整实现或未集成。低层 primitive 通过没有被本审查升格为这些流程通过。

旧 Phase B 导出的 6,227,467 tokens 是截至最后 counter 的 provisional 值；cached input 和 reasoning 均已在对应总量中，不能再加。窗口差额与原始 46 个事件一致；最终回复用量、费用、人工审核时间仍未提供。本次新增审查不并入或改写旧 Phase B 计数；本审查的 token 总量没有独立 finalized provider counter，因此不编造数值。

## 7. 仍未验证及后续决定

仍未验证：真实浏览器视觉和 desktop/mobile parity；实际下载 transport；完整 session 初始化/refresh/跨 tab/logout；food tenant、公私 scope 和 factory 等价性；真实全 locale/plural/linked/date/number；生产 basename；完整 shell、Markdown/受控表单/购物清单时序；全应用 frozen E2E 与新 coverage。

BaseButton 的 callback 合并顺序和空 slot fallback 有静态疑点，但本次没有取得原 Vue runtime 对照，故不列为已证回归。组件库 entry 未导入 utilities.css（只有 SPA main.tsx 导入），库 build 通过也不保证独立消费时的样式完整。

本报告建议记录“独立审核完成、Gate 2 不通过、原实验按停止条件结束”。若用户选择补充记录、修复工具、扩大范围或改变停止条件，应作为新的明确决定和后续工作；本次不实施、不追认原 Gate 2 成功。审查到此停止。
