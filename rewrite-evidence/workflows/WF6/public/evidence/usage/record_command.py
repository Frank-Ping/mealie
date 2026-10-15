"""Run a command and preserve separate original streams and timing."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import subprocess
import time
import uuid

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "wf6-evidence"

def run(argv, cwd, label, stage="S0", env=None, stdin_path=None, permission="workspace-write; network restricted; no escalation"):
    folder = EVIDENCE / "steps" / stage
    logs = folder / "logs"
    logs.mkdir(parents=True, exist_ok=True)
    command_id = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%S") + "-" + uuid.uuid4().hex[:8]
    start = dt.datetime.now(dt.timezone.utc).isoformat()
    timer = time.monotonic()
    out = logs / (command_id + ".stdout.log")
    err = logs / (command_id + ".stderr.log")
    launch_error = None
    with out.open("wb") as stdout, err.open("wb") as stderr:
        try:
            with open(stdin_path or os.devnull, "rb") as stdin:
                result = subprocess.run(argv, cwd=cwd, env={**os.environ, **(env or {})}, stdin=stdin, stdout=stdout, stderr=stderr)
            code = result.returncode
        except OSError as exc:
            launch_error = str(exc)
            stderr.write((str(exc) + "\n").encode())
            code = None
    entry = dict(command_id=command_id, stage_id=stage, label=label, argv=argv, cwd=str(cwd),
                 start_utc=start, end_utc=dt.datetime.now(dt.timezone.utc).isoformat(),
                 duration_seconds=time.monotonic()-timer, exit_code=code,
                 stdout=str(out.relative_to(EVIDENCE)), stderr=str(err.relative_to(EVIDENCE)),
                 environment_overrides=env or {}, permission=permission,
                 environment_capture="Only explicit non-secret overrides; inherited secrets are not exported.",
                 launch_error=launch_error)
    entry["stdin_path"] = str(stdin_path) if stdin_path else None
    with (folder / "commands.jsonl").open("a") as stream:
        stream.write(json.dumps(entry) + "\n")
    if code != 0:
        with (folder / "attempts.jsonl").open("a") as stream:
            stream.write(json.dumps(dict(timestamp=entry["end_utc"], kind="command_failure", command_id=command_id,
                label=label, exit_code=code, stdout=entry["stdout"], stderr=entry["stderr"], repair_scope=stage+" execution; classify in the stage result")) + "\n")
    print(json.dumps(entry))
    return entry

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--cwd", required=True)
    parser.add_argument("--label", required=True)
    parser.add_argument("--stage", default="S0")
    parser.add_argument("--permission", default="workspace-write; network restricted; no escalation")
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    argv = args.command[1:] if args.command[:1] == ["--"] else args.command
    entry = run(argv, args.cwd, args.label, args.stage, permission=args.permission)
    raise SystemExit(entry["exit_code"] if entry["exit_code"] is not None else 127)
