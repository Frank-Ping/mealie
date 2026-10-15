"""Audit frozen files and publish bilingual preparation results, without starting S1."""
import datetime as dt
import hashlib
import json
from pathlib import Path
import sys

FOLDER=Path(__file__).resolve().parent
ROOT=FOLDER.parents[2]
EVIDENCE=ROOT/"wf6-evidence"
sys.path.insert(0,str(EVIDENCE/"usage"))
from preparation_command import run

def main():
    dependency_results={}
    for action in ("tools","vue","backend","evaluator","browser","inspect","browser-probe"):
        data=json.loads((FOLDER/(action+"-dependency-result.json")).read_text())
        assert data["status"]=="PASS";dependency_results[action]=data
    original=json.loads((EVIDENCE/"steps/S0/source-state.json").read_text())
    inventory=json.loads((EVIDENCE/"steps/S0/file-manifest.json").read_text())
    states={}
    for role,folder in (("source","mealie-wf6-coexist"),("evaluator","mealie-wf6-evaluator")):
        repo=ROOT/folder
        statuses={}
        for label,args in (("head",["rev-parse","HEAD"]),("dirty",["status","--porcelain=v1"]),("remotes",["remote"])):
            entry=run(["git","--no-optional-locks","-C",str(repo),*args],ROOT,"preparation-final-"+role+"-"+label)
            assert entry["exit_code"]==0
            statuses[label]=(FOLDER/entry["stdout"]).read_text().strip()
        assert statuses["head"]==original[role]["actual_head"]
        assert not statuses["dirty"] and not statuses["remotes"]
        for record in inventory[role]:
            file=repo/record["path"]
            content=file.readlink().as_posix().encode() if file.is_symlink() else file.read_bytes()
            assert hashlib.sha256(content).hexdigest()==record["sha256"],record["path"]
        states[role]=dict(**statuses,tracked_file_count=len(inventory[role]),all_S0_snapshot_hashes_unchanged=True)
    commands=[json.loads(line) for line in (FOLDER/"commands.jsonl").read_text().splitlines()]
    socket_entry=next(d for d in commands if d["label"]=="required-local-socket-capability-approved-retry")
    socket_result=json.loads((FOLDER/socket_entry["stdout"]).read_text())
    assert socket_result["loopback_roundtrip"] and all(p["bindable"] for p in socket_result["probes"])
    browser_entry=next(d for d in commands if d["label"]=="Linux-Chromium-blank-page-capability-only" and d["exit_code"]==0)
    browser_result=json.loads((FOLDER/browser_entry["stdout"]).read_text())
    assert browser_result["platform"]=="linux" and browser_result["fixtureUrl"]=="about:blank"
    audit=json.loads((FOLDER/"s0-independent-audit.json").read_text())
    current=json.loads((EVIDENCE/"steps/S0/token-usage.json").read_text())
    assert current["status"]=="exact_reported" and current["final_reply_included"]
    assert audit["unique_response_sum"]=={k:current[k] for k in audit["unique_response_sum"]}
    budget=json.loads((EVIDENCE/"budget-state.json").read_text())
    assert not budget["experiment_budget_started"] and budget["experiment_seconds_used"]==0
    report=dict(timestamp=dt.datetime.now(dt.timezone.utc).isoformat(),preparation_id="P1-audit-dependencies",status="PASS",
        native_tools=json.loads((FOLDER/"native-tool-versions.json").read_text()),dependency_actions=dependency_results,
        source_states=states,socket_capability=socket_result,chromium_capability=browser_result,
        s0_accounting=dict(status=current["status"],final_reply_included=True,usage=audit["unique_response_sum"],unique_response_count=audit["unique_response_count"]),
        default_sandbox="workspace-write; restricted network/socket capability; configuration unchanged",
        approved_permissions=[dict(command_id=c["command_id"],label=c["label"],permission=c["permission"]) for c in commands if "approved" in c["permission"].lower()],
        no_application_baseline=True,no_application_services_started=True,no_database_or_auth_state_initialized=True,
        system_package_installation="None; existing Linux development/browser libraries were sufficient.",remaining_dependency_blockers=[],
        limitations=["Default sandbox still denies network/socket creation; specific approvals are required for future runtime actions.",
            "Chromium only exercised about:blank; this is not application or evaluator acceptance.",
            "Python editable-package/native-extension builds were installation steps, not application baseline checks.",
            "S1 and S2-S6 remain not executed; this preparation final reply is still pending in provider usage."])
    (FOLDER/"dependency-audit.json").write_text(json.dumps(report,indent=2)+"\n")
    md="""# Post-S0 audit and dependency preparation / S0 后审计与依赖准备

Status: **PASS for dependency preparation / 依赖准备通过**.
No S1 baseline or application gate was executed / 未执行 S1 baseline 或应用 gate。

## S0 accounting / S0 计量

S0 is exact_reported, final_reply_included=true. Final input=3,083,201,
cached_input=3,014,528, output=37,993, reasoning_output=8,014, total=3,121,194.
S0 身份、区间及最终回复覆盖已核实；cached/reasoning 为已包含子集，不额外相加。

The original pre-reply input=2,921,248 / total=2,958,649 was correct at its event
boundary. The final reply adds input=161,953 / output=592. Unique-response sum,
cumulative difference and provider turn counter agree: 23 unique attributed
responses, zero duplicates, 23 excluded legacy snapshots. No preparation or this
post-S0 turn is included. Cached input is 97.77% of input; repeated context across
actual S0 responses remains genuine provider input, while inherited historical
counters are excluded. Cost is not provided.
原回复前快照正确；最终回复新增 input 161,953 与 output 592。三种计数一致；
23 次唯一响应、无重复，23 个 legacy 快照排除。上下文反复输入属于真实调用成本，
并非继承历史累计重算；本次审计/依赖准备另列，费用未提供。

[Independent audit](S0-AUDIT.md) · [Original numeric events](s0-unique-response-events.jsonl)
· [Preserved earlier exports](pre-audit-S0/) · [Current S0 usage](../../steps/S0/token-usage.json)

## Native dependencies / Linux 原生依赖

- Node 24.21.0, bundled npm 11.19.0, frozen pnpm 11.23.0, uv 0.13.0, Task 3.54.0
  are under this run's runtime/tools/bin. System Python /usr/bin/python3 is 3.14.4.
  All downloaded archives/wheel checksums were verified before installation.
  工具均为 Linux 原生，独立目录安装并验证校验值；Python 3.14.4 满足冻结要求。
- Vue and evaluator installs used --frozen-lockfile; backend/dev/pgsql used
  uv sync --frozen. Locks/manifests and every tracked S0 snapshot file hash remain
  unchanged; both checkout HEADs and clean status are preserved.
  Vue/evaluator/backend 依赖按冻结 lock 安装；所有原 tracked 文件哈希、HEAD 与
  clean 状态保持不变，evaluator 断言未修改。
- Matching Playwright 1.63.0 Chromium was downloaded to runtime/browser-binaries;
  a Linux ELF browser launched an isolated about:blank page and closed.
  匹配 Chromium 的隔离空白页探针通过；不是应用或冻结 suite 验收。
- Candidate ports 9006/9106/9107/9108 bound-and-closed, and localhost roundtrip
  passed under specific approved execution. No port is reserved. Default sandbox
  still denies socket/network operations; configuration was not changed.
  经具体审批端口绑定与回环收发通过；未预留端口。默认 sandbox 限制保持不变。

[Machine dependency audit](dependency-audit.json) · [Versions and executable paths](native-tool-versions.json)
· [Download integrity](download-integrity.json) · [Exact commands](commands.jsonl)
· [Failures and repairs](attempts.jsonl)

## Scope, limits and next step / 范围、限制与下一步

No Vue build/generate, types/lint/unit/coverage, API login, SQLite seed, application
service or frozen route/flow suite was run. Python package/native extension builds
occurred only as dependency installation steps. Existing system libraries were
sufficient; no apt/system package changes were made. All original failures and
outputs are retained in their original languages.
未执行 Vue build/generate、类型/lint/unit/coverage、API 登录、seed、应用服务或
冻结 route/flow suite。Python 包及原生扩展构建仅属于安装；未改系统包，原始失败
与输出保持原文。

This entire turn is extra_discussion/preparation, excluded from closed S0, S1
baseline and S2–S6's three-hour budget. The S2–S6 budget remains unstarted. This
turn's pre-reply usage stays provisional; its final reply is not yet included.
本条全部归额外讨论/preparation，不混入 S0、S1 或三小时预算；预算未启动。
本条最终回复尚未计入，保持 provisional。

From the new run root, activate native paths before the separately authorized S1:
```bash
source runtime/linux-env.sh
```
After this reply, optionally settle this preparation without a model call:
```bash
python3 -B wf6-evidence/usage/finalize_preparation.py --preparation-id P1-audit-dependencies
```
Stop and await the full Chinese S1 prompt / 停止，等待用户单独发送 S1 完整中文 prompt。
"""
    (FOLDER/"result.md").write_text(md)
    (EVIDENCE/"PROGRESS.md").write_text("# WF6 progress / 进度\n\nRun: wf6-rerun-20261014-01. S0 PASS; usage exact_reported with final reply included.\nS0 准备通过且最终回复用量已核实封账。\n\nP1 post-S0 audit/dependency preparation PASS; separate extra_discussion/preparation.\nP1 审计与 Linux 依赖准备通过，单列额外讨论/preparation；最后回复计量待收尾。\n\nS1–S7 not executed. S2–S6 budget unstarted. Default sandbox unchanged; network/socket runtime actions require concrete approvals.\nS1–S7 未执行；三小时预算未启动；默认 sandbox 不变，网络/socket 操作须具体审批。\n\n[Preparation result](preparation/P1-audit-dependencies/result.md) · [Live usage](usage/USAGE.md)\n")
    index=EVIDENCE/"EVIDENCE_INDEX.md"
    append="\n## Post-S0 preparation / S0 后准备\n\n- [P1 result](preparation/P1-audit-dependencies/result.md)\n- [Independent S0 audit](preparation/P1-audit-dependencies/S0-AUDIT.md)\n- [Dependency audit](preparation/P1-audit-dependencies/dependency-audit.json)\n- [P1 accounting](preparation/P1-audit-dependencies/token-usage.json)\n- [P1 visible transcript](preparation/P1-audit-dependencies/visible-transcript.jsonl)\n"
    if "## Post-S0 preparation" not in index.read_text():
        with index.open("a") as file:file.write(append)
    with (FOLDER/"attempts.jsonl").open("a") as file:
        file.write(json.dumps(dict(kind="sandbox_network_socket_retries",cause="Default sandbox denies DNS/socket creation and Chromium IPC operations.",
            repair="Used specific reviewed anonymous dependency download/install and bounded localhost/browser capability approvals. Default sandbox configuration unchanged.",
            rerun="Dependency installs, localhost bind/roundtrip and Linux Chromium about:blank capability all passed. No application acceptance claimed."))+"\n")
    print(json.dumps(dict(status="PASS",source_states=states,s0_usage=audit["unique_response_sum"],remaining_dependency_blockers=[]),indent=2))

if __name__=="__main__":main()
