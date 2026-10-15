# WF6 S0 / 隔离与计量准备

Run: wf6-rerun-20261014-01. Pinned source/evaluator snapshots are imported into
independent Git stores with no remotes or alternates. All object IDs and frozen
worktree bytes were verified against the historical origin stores. Explicit shallow
roots resolve the old undeclared missing-parent errors; full ancestry is unavailable.
新 run 独立 Git 存储无 remote 或 alternates；固定快照对象与文件逐一核实。
显式 shallow 边界解决旧父对象缺失报错，但不宣称完整祖先历史已恢复。

The actual request, handoff, failed commands, repairs, collector source/tests,
environment, ports and provider boundaries live outside this checkout.
实际请求、交接、失败及修复、collector、环境与计量边界保存于外部证据目录。

This is preparation only. Application builds, dependencies, baseline, login, seeded
database and browser acceptance were not run. No prior results count toward this run.
仅完成准备；未构建应用、安装依赖、测 baseline、登录、建数据库或浏览器验收。

Usage remains provisional before the final reply. See live external records;
the committed summary does not embed a provisional number that changes afterward.
回复前用量 provisional；提交小结链接外部实时记录，不固化尚未封账的数值。

- [S0 result](../../../../../wf6-evidence/steps/S0/result.md)
- [Evidence index](../../../../../wf6-evidence/EVIDENCE_INDEX.md)
- [Source provenance](../../../../../wf6-evidence/steps/S0/input-provenance.json)
- [Collector acceptance](../../../../../wf6-evidence/steps/S0/collector-acceptance.json)
- [Usage](../../../../../wf6-evidence/usage/USAGE.md)

Next: await a separately authorized S1 / 等待单独授权 S1。
