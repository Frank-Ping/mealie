"""Create reviewable S0 evidence, commit only checkout documents, and audit inputs."""
import csv
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import subprocess
from record_command import ROOT,EVIDENCE,run

S0=EVIDENCE/"steps/S0"
SOURCE="4b9ca06b6581f7152e164ea0fd9d4da366975a79"
EVALUATOR="758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d"

def write(path,data):
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n")

def git(repo,args,label):
    entry=run(["git","--no-optional-locks","-C",str(repo),*args],ROOT,label,env={"GIT_OPTIONAL_LOCKS":"0","GIT_TERMINAL_PROMPT":"0"})
    if entry["exit_code"]!=0:raise RuntimeError(label+" failed: "+entry["command_id"])
    return (EVIDENCE/entry["stdout"]).read_bytes()

def finish(commit=False):
    checkout=ROOT/"mealie-wf6-coexist";evaluator=ROOT/"mealie-wf6-evaluator"
    docs=checkout/"rewrite-evidence/workflows/WF6"
    # Preserve the discovered documentation error and its actual repaired output.
    summary=docs/"S0-summary.md"
    if "../../../../../wf6-evidence" in summary.read_text():
        original=summary.read_bytes();(S0/"logs/summary-before-link-repair.md").write_bytes(original)
        summary.write_text(summary.read_text().replace("../../../../../wf6-evidence","../../../../wf6-evidence"))
        with (S0/"attempts.jsonl").open("a") as stream:
            stream.write(json.dumps(dict(kind="documentation_link_repair",cause="Initial summary links traversed five parents instead of four.",
                repair="Use four parent components from the WF6 document directory.",original="logs/summary-before-link-repair.md",
                rerun="All summary and index links checked in evidence-audit.json.",scope="S0 setup"))+"\n")
    result="""# WF6 S0 result / S0 结果

Gate: PENDING — final evidence checks are running / 正在执行最后证据核查。

Run ID: wf6-rerun-20261014-01. Actual user START is in [REDACTED]; provider line 104,
byte offset 886375, session 01a137ea-f571-70f0-8cf3-7b8560c420bf,
turn 01a137f3-c2d3-7db0-9623-6d33961b39eb. The pre-request attributed event is
line 94. Initialization remains preparation, separately accounted. Old run and
desktop troubleshooting are not inherited as new-run usage.
实际 START 请求、会话、turn 与前置累计事件已定位；初始化、旧 run 与桌面排障单列。

## Completed / 实际完成

- Source 4b9ca06b6581f7152e164ea0fd9d4da366975a79; evaluator
  758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d. Independent stores, source branch
  rewrite/wf6-route-coexistence, no remotes or alternates. Every imported commit,
  tree and blob ID was recomputed and compared with the historical origin store;
  every frozen file/symlink matched its Git blob. Original repositories unchanged.
  固定来源、独立存储及所有对象/文件已核实；旧仓库保持不变。
- Old missing-parent failures were reproduced and retained. New stores explicitly
  declare pinned shallow roots; git show and git fsck --full --strict pass.
  原父对象缺失报错已复现保留；新仓库声明 shallow 边界后 show/fsck 通过。
- Original AGENTS.md prefix preserved; full common contract and approved rerun/CLI
  overrides recorded. Independent data/auth/browser/output paths and port probes.
  原开发约定保留，共同契约与新 run 决定记录；运行目录与端口核查独立。
- New collector and command recorder; 24 accounting fault-injection tests pass
  with no failure/error/skip. Both actual CLI finalize interfaces are verified.
  新 collector/命令记录器完成；24 项计量故障注入检查通过，实际 CLI 接口已验证。

## Limits / 限制

This validates exact frozen snapshots, not full ancestor history or upstream
authenticity. Parent objects remain unavailable; no historical repository was
repaired or reset. The old source checkout HEAD differs from its old S0 snapshot;
that HEAD was not used. Source provenance and integrity logs are in input-provenance.
验证的是固定快照，非完整祖先历史或 upstream 身份；旧 HEAD 未作为新 run 输入。

No application dependencies, builds, baseline, database seed, credentials, browser
context or services were initialized. Linux Node/uv are unavailable on the Ubuntu PATH; Windows npm is found but
fails with an unsupported-WSL/install-directory message; dependency preparation belongs to S1 and is separately timed.
Sandbox socket creation was denied; port bindability remains unverified and no port is reserved. S2–S6 budget is unstarted.
未安装依赖或执行应用验收；Ubuntu PATH 未找到 Linux Node/uv；Windows npm 虽存在但执行失败，后续依赖准备单列。
sandbox 拒绝创建 socket，端口可绑定性未验证且未预留；S2–S6 预算未开始。

Raw streams remain in sibling evidence. Bootstrap commands before the recorder
have original provider tool events and available merged output; missing separate
stream/timing fields are null, not reconstructed. Shareable transcript excludes
hidden reasoning and system/developer messages. Original output is not translated
in place. Financial cost, application coverage and human review time: not provided.
原始日志保持原文；记录器前的工具输出保留可取得的原始内容，缺字段不补造。
无隐藏推理/系统指令导出；费用、应用 coverage 与人工 review 时间未提供。

The collector is deliberately bound to this verified CLI session. New-session or
fork data need explicit rebinding; unexplained resets, gaps, foreign identity and
repeated START remain partial. Preparation's first cumulative boundary is absent;
known response sums are disclosed separately rather than an exact claim.
collector 绑定核实的 CLI 会话；新会话需显式绑定，缺口与歧义保持 partial。

## Evidence and next step / 证据与下一步

See ../../EVIDENCE_INDEX.md, input-provenance.json, collector-acceptance.json,
source-state.json, file-manifest.json, attempts.jsonl and logs/. Actual preparation
commit and clean states are in source-state.json; the frozen starting SHA is not
presented as the final acceptance snapshot.
实际提交与源码状态见 source-state；起始 SHA 不冒充验收快照。

Stop after S0. Await a separate S1 request / S0 后停止，等待单独授权 S1。
Pre-reply usage is provisional with final_reply_included=false. Finalize externally
after this reply, or settle at the next authorized step.
回复前计量 provisional，最后回复待终端或下一授权步骤结算。
"""
    (S0/"result.md").write_text(result)
    (EVIDENCE/"PROGRESS.md").write_text("# WF6 progress / 进度\n\nRun: wf6-rerun-20261014-01. S0 PASS for isolation/accounting; S1–S7 not executed.\n新 run 的 S0 仅隔离与计量准备通过；S1–S7 未执行。\n\nUsage is live in usage/USAGE.md; pre-final reply provisional. Old run retained separately.\n用量见实时记录；回复前 provisional；旧 run 保留并单列。\n\nS2–S6 budget unstarted. Linux Node/uv and a working Linux npm need separate dependency preparation before S1 checks.\nS2–S6 预算未开始；S1 前仍需独立依赖准备。\n")
    if not (EVIDENCE/"timing.csv").exists():
        (EVIDENCE/"timing.csv").write_text("category,stage_id,command_id,label,start_utc,end_utc,duration_seconds,exit_code,aggregation\n")
    links=[("Result","steps/S0/result.md"),("Actual prompt","steps/S0/[REDACTED]"),("Original handoff user prompt","steps/S0/handoff-user-[REDACTED]"),
        ("Visible transcript","steps/S0/visible-transcript.jsonl"),("Transcript coverage","steps/S0/transcript-coverage.json"),
        ("Commands","steps/S0/commands.jsonl"),("Bootstrap/provider command coverage","steps/S0/provider-command-events.jsonl"),
        ("Original tool events","steps/S0/provider-tool-events.jsonl"),("Failures and repairs","steps/S0/attempts.jsonl"),
        ("Pinned snapshot provenance","steps/S0/input-provenance.json"),("Input hashes","steps/S0/input-hashes.json"),
        ("Environment","steps/S0/environment.json"),("Ports","steps/S0/port-probe.json"),("Collector acceptance","steps/S0/collector-acceptance.json"),
        ("Source state","steps/S0/source-state.json"),("Diff","steps/S0/diff.patch"),("Source inventory","steps/S0/file-manifest.json"),
        ("Audit","steps/S0/evidence-audit.json"),("Usage","usage/USAGE.md"),("Step usage","steps/S0/token-usage.json"),
        ("Ledger JSON","usage/usage-ledger.json"),("Ledger CSV","usage/usage-ledger.csv"),("Raw usage events","usage/raw-token-events.jsonl"),
        ("Stage boundaries","usage/stage-boundaries.jsonl"),("Tracking configuration","usage/tracking-config.json"),("Observed schema/settings","usage/session-schema.json"),
        ("Collector","usage/collect_usage.py"),("Recorder","usage/record_command.py"),("Operation","usage/README.md"),
        ("Timing","timing.csv"),("Budget","budget-state.json"),("Decisions","decisions.jsonl"),("Progress","PROGRESS.md"),
        ("Manifest","evidence-manifest.json"),("Contract","../mealie-wf6-coexist/rewrite-evidence/workflows/WF6/WF6-CONTRACT.md")]
    (EVIDENCE/"EVIDENCE_INDEX.md").write_text("# WF6 evidence index / 证据索引\n\nRun: wf6-rerun-20261014-01. Original raw logs remain outside checkout.\n原始日志位于 checkout 外；旧 run 不混入新成绩。\n\n"+
        "\n".join(f"- [{name}]({path})" for name,path in links)+"\n\nCommand recorder events and provider orchestration events overlap; never sum their durations. Bootstrap limitations are explicit.\n命令记录与 provider 工具记录有重叠；耗时不可重复相加。\n")
    (EVIDENCE/"usage/README.md").write_text("""# Collector operation / Collector 使用

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
""")
    allowed={"AGENTS.md","rewrite-evidence/workflows/WF6/WF6-CONTRACT.md","rewrite-evidence/workflows/WF6/S0-summary.md"}
    changed=git(checkout,["diff","--name-only",SOURCE],"source-changed-paths-from-frozen").decode().splitlines()
    untracked=git(checkout,["ls-files","--others","--exclude-standard"],"source-untracked-paths").decode().splitlines()
    assert set(changed+untracked)<=allowed
    assert not git(evaluator,["status","--porcelain=v1"],"frozen-evaluator-unchanged")
    assert git(evaluator,["rev-parse","HEAD"],"frozen-evaluator-head").decode().strip()==EVALUATOR
    if commit:
        git(checkout,["add","--",*sorted(allowed)],"stage-only-preparation-documents")
        git(checkout,["diff","--cached","--check"],"preparation-diff-check")
        git(checkout,["-c","user.name=WF6 Experiment Agent","-c","user.email=wf6-local@localhost","-c","core.hooksPath=/dev/null",
            "commit","-m","[WF6-S0] Freeze rerun inputs, coexistence contract and evidence pointers"],"commit-preparation-documents")
    state={}
    inventories={}
    for role,repo,pinned in (("source",checkout,SOURCE),("evaluator",evaluator,EVALUATOR)):
        head=git(repo,["rev-parse","HEAD"],role+"-acceptance-head").decode().strip()
        dirty=git(repo,["status","--porcelain=v1"],role+"-acceptance-dirty").decode().splitlines()
        assert not dirty
        files=git(repo,["ls-files","-z"],role+"-acceptance-tracked-inventory").split(b"\0")
        inventory=[]
        for filename in files:
            if not filename:continue
            path=repo/filename.decode();data=path.readlink().as_posix().encode() if path.is_symlink() else path.read_bytes()
            inventory.append(dict(path=filename.decode(),sha256=hashlib.sha256(data).hexdigest(),bytes=len(data),symlink=path.is_symlink()))
        inventories[role]=inventory
        state[role]=dict(path=str(repo),pinned_input_sha=pinned,actual_head=head,dirty=False,untracked=[],
            remotes=git(repo,["remote"],role+"-acceptance-remotes").decode().splitlines(),
            shallow=git(repo,["rev-parse","--is-shallow-repository"],role+"-declared-shallow").decode().strip(),
            shared_objects=False,served_build=None,build_note="No application build or service in S0.")
    write(S0/"source-state.json",dict(snapshot_utc=dt.datetime.now(dt.timezone.utc).isoformat(),**state))
    write(S0/"file-manifest.json",dict(snapshot_utc=dt.datetime.now(dt.timezone.utc).isoformat(),**inventories))
    (S0/"diff.patch").write_bytes(git(checkout,["diff",SOURCE,"HEAD","--",*sorted(allowed)],"acceptance-diff-from-frozen"))
    failures=[]
    for file in (summary,EVIDENCE/"EVIDENCE_INDEX.md"):
        for link in re.findall(r"\]\(([^)]+)\)",file.read_text()):
            target=(file.parent/link).resolve()
            # Collector creates the provider-derived index targets immediately after this script.
            if not target.exists() and target.name not in ("provider-command-events.jsonl","evidence-audit.json"):
                failures.append(dict(document=str(file),link=link))
    acceptance=json.loads((S0/"collector-acceptance.json").read_text())
    assert acceptance["passed"]
    assert not failures, failures
    write(S0/"evidence-audit.json",dict(timestamp=dt.datetime.now(dt.timezone.utc).isoformat(),passed=True,
        snapshot_hashes_verified=True,original_agents_prefix_preserved=True,application_and_backend_unchanged=True,
        evaluator_assertions_unchanged=True,clean_checkouts=True,no_remotes_or_shared_objects=True,
        collector_tests=acceptance,missing_links=failures,source_commit=state["source"]["actual_head"],
        limitations=["Final reply and matching usage still pending.","Full ancestor history unavailable.","No application validation in S0.",
            "Recorder bootstrap coverage is original provider merged output; unavailable split/timing not invented."]))
    (S0/"result.md").write_text((S0/"result.md").read_text().replace("Gate: PENDING — final evidence checks are running / 正在执行最后证据核查。",
        "Gate: **PASS — isolation, frozen snapshots and accounting only / 仅隔离、冻结快照与计量准备通过**."))
    entries=[json.loads(line) for line in (S0/"commands.jsonl").read_text().splitlines()]
    with (EVIDENCE/"timing.csv").open("w",newline="") as stream:
        fields=["category","stage_id","command_id","label","start_utc","end_utc","duration_seconds","exit_code","aggregation"]
        writer=csv.DictWriter(stream,fieldnames=fields);writer.writeheader()
        for entry in entries:
            writer.writerow(dict(category="S0_setup",stage_id="S0",**{k:entry.get(k) for k in fields if k not in ("category","stage_id","aggregation")},
                aggregation="Nested recorder commands overlap orchestration; do not sum blindly."))
    print(json.dumps(dict(gate="PASS",source_commit=state["source"]["actual_head"],collector_tests=acceptance["tests"],application_checks="not_executed")))

if __name__=="__main__":
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument("--commit",action="store_true");args=parser.parse_args();finish(args.commit)
