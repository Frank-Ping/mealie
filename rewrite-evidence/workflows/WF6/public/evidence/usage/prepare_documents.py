"""Persist run decisions, frozen contracts, environment and isolated runtime paths."""
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import socket
from record_command import ROOT,EVIDENCE,run

WORKSPACE=ROOT.parent
S0=EVIDENCE/"steps/S0"

def write(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n")

def prepare():
    config_path=EVIDENCE/"usage/tracking-config.json"
    config=json.loads(config_path.read_text());config["actual_prompt"]=(S0/"[REDACTED]").read_text().rstrip("\n")
    write(config_path,config)
    # Save original user handoff verbatim; do not replace original logs with translations.
    for line in Path(config["source_log"]).read_text().splitlines():
        d=json.loads(line);pl=d.get("payload",{})
        if d.get("type")=="response_item" and pl.get("role")=="user":
            text="".join(c.get("text","") for c in pl.get("content",[]))
            if text.startswith("这是 WF6 从桌面应用迁移"):
                (S0/"handoff-user-[REDACTED]").write_text(text+"\n")
                write(S0/"handoff-source.json",dict(source=config["source_log"],message_id=pl.get("id"),
                    note="Original current-session handoff prompt; embedded desktop history is a user-supplied summary, not an original desktop transcript."))
    prompts=(WORKSPACE/"WF6-step-prompts-bilingual.md").read_text()
    common=prompts.split("## 全程共同要求 Common contract requirements",1)[1].split("## S0 建立隔离",1)[0]
    contract="# WF6-CONTRACT — wf6-rerun-20261014-01\n\nS0–S7 numbering is authoritative. One implementation agent, serial work.\n\n## Common contract / 共同契约\n"+common
    contract+="\n## Persistent workspace requirements / 工作区要求\n\n"+(WORKSPACE/"AGENTS.md").read_text()
    contract+="""
## Approved rerun and CLI handoff / 已批准的新 run 与 CLI 交接

Run ID: wf6-rerun-20261014-01. Use this run's nested mealie-wf6-coexist,
mealie-wf6-evaluator and wf6-evidence directories. The user approved restarting
S0; this supersedes earlier instructions not to repeat S0. Old records remain
historical and unchanged. This run's actual START request is in external
wf6-evidence/steps/S0/[REDACTED], with the original provider locator in tracking-config.
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
"""
    target=ROOT/"mealie-wf6-coexist";docs=target/"rewrite-evidence/workflows/WF6";docs.mkdir(parents=True,exist_ok=True)
    (docs/"WF6-CONTRACT.md").write_text(contract)
    original=(target/"AGENTS.md").read_bytes()
    overlay=b"\n\n# WF6 rerun experimental overlay\n\nFor WF6 only, read rewrite-evidence/workflows/WF6/WF6-CONTRACT.md and the parent workspace AGENTS.md. One implementation agent, S0-S7 serial steps, explicit authorization and isolated runtime/evidence. Preserve the original conventions above.\n"
    (target/"AGENTS.md").write_bytes(original+overlay)
    write(S0/"agents-preservation.json",dict(original_sha256=hashlib.sha256(original).hexdigest(),
        original_bytes=len(original),original_prefix_preserved=(target/"AGENTS.md").read_bytes().startswith(original)))
    for name in ("WF6-plan.md","WF6-step-prompts-bilingual.md","AGENTS.md"):
        (S0/("input-"+name)).write_bytes((WORKSPACE/name).read_bytes())
    runtime=ROOT/"runtime"
    directories={k:str(runtime/k) for k in ("data","auth","browser","output","test-fixtures")}
    for directory in directories.values():Path(directory).mkdir(parents=True,exist_ok=True)
    probes=[]
    for port in (9006,9106,9107,9108):
        record=dict(host="127.0.0.1",port=port,checked_utc=dt.datetime.now(dt.timezone.utc).isoformat(),reserved=False)
        try:
            with socket.socket() as sock:sock.bind(("127.0.0.1",port));record["bindable"]=True
        except OSError as exc:record.update(bindable=None if isinstance(exc,PermissionError) else False,error=str(exc))
        probes.append(record)
    write(S0/"port-probe.json",dict(probes=probes,note="Momentary sandbox bind-and-close probes; no service was started and no port is reserved."))
    versions={}
    for tool,args in (("git",["--version"]),("python3",["--version"]),("node",["--version"]),("npm",["--version"]),("uv",["--version"]),("task",["--version"]),("codex",["--version"])):
        executable=shutil.which(tool);versions[tool]=dict(executable=executable,available=bool(executable))
        if executable:
            entry=run([executable,*args],ROOT,"runtime-version-"+tool)
            versions[tool].update(exit_code=entry["exit_code"],command_id=entry["command_id"],stdout=(EVIDENCE/entry["stdout"]).read_text(),stderr=(EVIDENCE/entry["stderr"]).read_text())
    write(S0/"environment.json",dict(run_id=ROOT.name,cwd=str(ROOT),shell=os.environ.get("SHELL"),os_release=Path("/etc/os-release").read_text(),
        kernel=platform.uname()._asdict(),wsl_distribution=os.environ.get("WSL_DISTRO_NAME"),codex_home_environment=os.environ.get("CODEX_HOME"),
        observed_codex_home="<WSL_HOME>/.codex",source_log=config["source_log"],session_id=config["session_id"],turn_id=config["initial_turn_id"],
        sandbox="workspace-write; restricted network",permission_escalations=[],versions=versions,isolated_directories=directories,
        auth_database_browser_state="No credentials, SQLite database or browser context/profile initialized.",dependency_preparation="No dependencies installed in S0. Node/npm/uv availability is explicitly recorded; S1 must prepare dependencies separately."))
    write(EVIDENCE/"budget-state.json",dict(experiment_seconds_limit=10800,experiment_seconds_used=0,experiment_budget_started=False,
        repair_rounds=dict(S2=0,S3_S4=0,S5=0,S6=0),note="S2-S6 not executed; zero denotes an unstarted budget, not missing token/cost telemetry."))
    summary="""# WF6 S0 / 隔离与计量准备

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

- [S0 result](../../../../wf6-evidence/steps/S0/result.md)
- [Evidence index](../../../../wf6-evidence/EVIDENCE_INDEX.md)
- [Source provenance](../../../../wf6-evidence/steps/S0/input-provenance.json)
- [Collector acceptance](../../../../wf6-evidence/steps/S0/collector-acceptance.json)
- [Usage](../../../../wf6-evidence/usage/USAGE.md)

Next: await a separately authorized S1 / 等待单独授权 S1。
"""
    # Resolve links from the document directory, four components below the run root.
    (docs/"S0-summary.md").write_text(summary)
    print("Contracts, isolated runtime paths, environment and ports saved; no application services started.")

if __name__=="__main__":prepare()
