# Vue type diagnostics / Vue 类型诊断

Current S1: 318 diagnostics, FAIL. Historical group baseline: 315; raw saved first-line count: 315. Count difference: +3.
本次 S1 为 318 条，单列 FAIL；历史记录 315，数值差 +3。

The exact causal explanation is not established. Current frozen Vue bytes match the input, so these are not introduced by S2 gateway source changes. Nuxt 4.5.2 / TypeScript 5.9.3 / vue-tsc 3.1.5 were observed in S1. Do not infer three new source defects from the count alone. Separate WF4-R2 baseline reports 314 and explicitly leaves its difference from 315 unresolved.
准确因果尚未建立；冻结 Vue 文件未变，不得把数量差直接解释为三个新源码缺陷或网关回归。另一次历史 baseline 为 314，也保留了差异未查明的限制。

See type-history-comparison.json for original log paths, hashes and exact line-set comparison. Original logs remain untouched.
原始日志未改动，路径、哈希与逐行比较见同名 JSON。

Exact saved-line multiset comparison: 10 current-only occurrences, 7 historical-only occurrences; 4 current duplicate occurrences vs 2 historical. A differing line can reflect message/type expansion or location, not an independent source bug.
逐行按出现次数比较保留重复行，不能将日志行差直接等同独立源码缺陷。
