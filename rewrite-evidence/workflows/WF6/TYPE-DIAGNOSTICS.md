# Vue diagnostic difference / Vue 类型诊断差异

S1 remains FAIL with 318 diagnostics. Historical original Vue log has 315: net count +3. Exact first-line multiset comparison gives 10 current-only and 7 historical-only occurrences; duplicate occurrences are preserved (current 4, historical 2). This is not evidence of three new source bugs.
S1 仍为 318 条、单列 FAIL；历史原始日志 315，净差 +3；逐行出现次数比较及重复行均保留，不表示三个新源码缺陷。

The historical log reports Vue plugin load/create failures; the current checker uses Nuxt 4.5.2, TypeScript 5.9.3, vue-tsc 3.1.5. Tool/plugin/generated-environment differences are plausible factors; precise causality is not established. Frozen Vue/backend files were hash-verified unchanged before and after S2.
历史日志记录 Vue 插件加载/创建失败；工具、插件及生成环境差异可能相关，但准确因果未建立。冻结源码未修改，不将差异归因于 S2 网关。

[Raw log provenance, hashes, exact line comparisons](../../../../wf6-evidence/steps/S1/type-history-comparison.json) · [Bilingual explanation](../../../../wf6-evidence/steps/S1/type-history-comparison.md)
