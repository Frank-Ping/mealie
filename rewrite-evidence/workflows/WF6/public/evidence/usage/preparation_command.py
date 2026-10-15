"""Record post-S0 preparation without modifying S0 commands or budget."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import subprocess
import time
import uuid

ROOT=Path(__file__).resolve().parents[2]
FOLDER=ROOT/"wf6-evidence/preparation/P1-audit-dependencies"

def run(argv,cwd,label,env=None,permission="workspace-write; restricted network; no escalation"):
    logs=FOLDER/"logs";logs.mkdir(parents=True,exist_ok=True)
    cid=dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%S")+"-"+uuid.uuid4().hex[:8]
    out=logs/(cid+".stdout.log");err=logs/(cid+".stderr.log")
    start=dt.datetime.now(dt.timezone.utc).isoformat();timer=time.monotonic();failure=None
    with out.open("wb") as stdout,err.open("wb") as stderr:
        try:
            code=subprocess.run(argv,cwd=cwd,env={**os.environ,**(env or {})},stdout=stdout,stderr=stderr).returncode
        except OSError as exc:
            failure=str(exc);stderr.write((failure+"\n").encode());code=None
    entry=dict(category="extra_discussion/preparation",preparation_id="P1-audit-dependencies",command_id=cid,label=label,argv=argv,cwd=str(cwd),
        start_utc=start,end_utc=dt.datetime.now(dt.timezone.utc).isoformat(),duration_seconds=time.monotonic()-timer,exit_code=code,
        stdout=str(out.relative_to(FOLDER)),stderr=str(err.relative_to(FOLDER)),environment_overrides=env or {},permission=permission,launch_error=failure)
    with (FOLDER/"commands.jsonl").open("a") as file:file.write(json.dumps(entry)+"\n")
    if code!=0:
        with (FOLDER/"attempts.jsonl").open("a") as file:file.write(json.dumps(dict(kind="command_failure",**entry))+"\n")
    print(json.dumps(entry));return entry

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--cwd",default=str(ROOT));p.add_argument("--label",required=True)
    p.add_argument("--permission",default="workspace-write; restricted network; no escalation")
    p.add_argument("command",nargs=argparse.REMAINDER);a=p.parse_args()
    cmd=a.command[1:] if a.command[:1]==["--"] else a.command
    result=run(cmd,a.cwd,a.label,permission=a.permission)
    raise SystemExit(result["exit_code"] if result["exit_code"] is not None else 127)
