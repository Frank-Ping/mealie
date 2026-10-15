# Collector operation / Collector 使用

From this run root after a reply:
```bash
python3 -B wf6-evidence/usage/collect_usage.py finalize --stage S0 --wait-seconds 30
```
After S7:
```bash
python3 -B wf6-evidence/usage/collect_usage.py finalize --all --wait-seconds 30
```
Run-root PowerShell alternative (WSL's Linux collector, not desktop Python):
```powershell
wsl.exe -d Ubuntu --cd '<WORKSPACE>/wf6-rerun-20261014-01' -- /usr/bin/python3 -B wf6-evidence/usage/collect_usage.py finalize --stage S0 --wait-seconds 30
```
The Linux interface was actually executed. The PowerShell wrapper is supplied
for convenience and was not executed in this Ubuntu session.
Linux 接口已实际执行；PowerShell 包装命令本会话未执行。

No model calls. Preserve prior exports by content hash; replace current totals.
Both interfaces update all stage rows, source locators, transcripts, usage and
non-self-including manifest; --stage controls the waiting/reporting target.
不调用模型；保留旧导出版本，替换当前合计；--stage 选择等待与展示对象。

Identity and schema are session-specific. An explicit new session needs a new
verified configuration and an audited disjoint merge, not silent concatenation.
Missing logs, boundary, fields, resets, compaction gaps, forks and unresolved
repeated START remain partial/not_provided. Legacy counters are retained but not
added. preparation known sums are separate, with missing initial boundary disclosed.
跨会话需显式绑定与审计；缺口不得补零；初始化已知量与边界缺失单列。

Raw command streams are unchanged; shareable transcript is redacted. Analysis and
system/developer instructions are excluded. Bootstrap merged output cannot become
invented separate stdout/stderr. Model/permissions come from actual turn_context.
原始输出不改写；可分享 transcript 去敏；隐藏推理与系统指令不导出。
