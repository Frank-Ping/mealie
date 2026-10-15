"""Measure unchanged frozen Vue inputs; never repair source or evaluator assertions."""
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
from record_command import ROOT,EVIDENCE,run

STAGE=EVIDENCE/"steps/S1"
SOURCE=ROOT/"mealie-wf6-coexist"
EVALUATOR=ROOT/"mealie-wf6-evaluator"
RUNTIME=ROOT/"runtime/S1"

def environment():
    env=json.loads((EVIDENCE/"preparation/P1-audit-dependencies/dependency-environment.json").read_text())
    env.update(CI="1",NUXT_TELEMETRY_DISABLED="1",DO_NOT_TRACK="1",UV_FROZEN="1",UV_HTTP_RETRIES="0",
        PYTHONDONTWRITEBYTECODE="1",TMPDIR=str(RUNTIME/"tmp"),E2E_PORT="9006",E2E_WORKERS="1",
        E2E_ROUTE_SCOPE="all",E2E_ROUTE_CHECK="strict",E2E_REUSE_SERVER="0",E2E_DATA_DIR=str(RUNTIME/"disposable-data"),
        E2E_STATIC_DIR=str(SOURCE/"frontend/dist"),PLAYWRIGHT_JSON_OUTPUT_NAME=str(STAGE/"browser/results.json"),
        PLAYWRIGHT_HTML_OUTPUT_DIR=str(STAGE/"browser/playwright-report"))
    if (STAGE/"typechecker-tool.json").exists():
        env["NODE_PATH"]=os.pathsep.join([str(RUNTIME/"typechecker"),str(RUNTIME/"typechecker/node_modules")])
    return env

def command(argv,cwd,label,approved=False,allow_failure=False,extra_env=None):
    permission="Approved bounded S1 runtime/network/browser action; default sandbox unchanged." if approved else "workspace-write; restricted network/socket; no escalation"
    entry=run(argv,cwd,label,stage="S1",env={**environment(),**(extra_env or {})},permission=permission)
    if entry["exit_code"]!=0 and not allow_failure:raise RuntimeError(label+" failed; see "+entry["stderr"])
    return entry

def write(path,data):
    path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(data,indent=2)+"\n")

def setup():
    for folder in (RUNTIME/"tmp",RUNTIME/"auth",STAGE/"browser",STAGE/"coverage",STAGE/"machine"):folder.mkdir(parents=True,exist_ok=True)
    disposable=RUNTIME/"disposable-data"
    if disposable.exists():
        assert not any(disposable.iterdir()),"Refuse to erase preexisting populated S1 data during setup."
    else:disposable.mkdir()
    auth=EVALUATOR/"frontend-e2e/.auth"
    if auth.exists() or auth.is_symlink():
        assert auth.is_symlink() and auth.resolve()==(RUNTIME/"auth").resolve() and not any(auth.iterdir()),"Refuse to reuse foreign/populated auth state."
    else:auth.symlink_to(RUNTIME/"auth",target_is_directory=True)
    # A directory-only upstream ignore does not ignore a symlink. Keep runtime
    # aliases out of source status through local Git metadata, not tracked files.
    exclude=EVALUATOR/".git/info/exclude"
    existing=exclude.read_text() if exclude.exists() else ""
    if "frontend-e2e/.auth\n" not in existing:
        with exclude.open("a") as stream:stream.write("\n# WF6 S1 isolated runtime authentication alias\nfrontend-e2e/.auth\n")
    source_state=json.loads((EVIDENCE/"steps/S0/source-state.json").read_text())
    preserved=[]
    for role,repo in (("source",SOURCE),("evaluator",EVALUATOR)):
        head=command(["git","--no-optional-locks","-C",str(repo),"rev-parse","HEAD"],ROOT,role+"-S1-start-head")
        actual=(EVIDENCE/head["stdout"]).read_text().strip();assert actual==source_state[role]["actual_head"]
        dirty=command(["git","--no-optional-locks","-C",str(repo),"status","--porcelain=v1"],ROOT,role+"-S1-start-dirty")
        assert not (EVIDENCE/dirty["stdout"]).read_text().strip()
        preserved.append(dict(role=role,head=actual,clean=True))
    script=EVALUATOR/"frontend-e2e/scripts/start-backend.sh"
    data=script.read_text();assert 'rm -rf "$DATA_DIR"' in data and 'DATA_DIR="${E2E_DATA_DIR:-' in data
    target=disposable.resolve();assert target.is_relative_to(RUNTIME.resolve()) and target!=RUNTIME.resolve()
    assert not disposable.is_symlink()
    write(STAGE/"runtime-isolation.json",dict(run_id=ROOT.name,stage_id="S1",validated_utc=dt.datetime.now(dt.timezone.utc).isoformat(),
        frozen_launcher=str(script),launcher_sha256=hashlib.sha256(script.read_bytes()).hexdigest(),
        destructive_target=str(target),destructive_scope="Frozen launcher removes only this explicitly selected S1 disposable directory.",
        auth_alias=str(auth),auth_real_target=str(auth.resolve()),temporary_profiles=str(RUNTIME/"tmp"),browser_outputs=str(STAGE/"browser"),
        port=9006,source_states=preserved,environment=environment(),
        account_policy="Frozen fixture constants unchanged; accounts are newly seeded into this independent SQLite database.",
        preexisting_build=(SOURCE/"frontend/dist").exists()))
    print("S1 runtime/cleanup/auth isolation verified; no app source/evaluator assertions modified.")

def capture_build(entry):
    folder=SOURCE/"frontend/dist"
    prior=STAGE/"build-artifact.json"
    if prior.exists():
        old=json.loads(prior.read_text())
        (STAGE/("build-artifact-"+old["command_id"]+".json")).write_bytes(prior.read_bytes())
    if entry["exit_code"]!=0:
        failure=dict(command_id=entry["command_id"],exit_code=entry["exit_code"],browser_acceptance_allowed=False,
            note="Any dist left by this failed build is not an accepted artifact.")
        write(STAGE/"build-failed.json",failure)
        write(STAGE/"build-artifact.json",failure)
        return
    assert (folder/"index.html").is_file()
    files=[]
    for file in sorted(folder.rglob("*")):
        if file.is_file():files.append(dict(path=str(file.relative_to(folder)),bytes=file.stat().st_size,sha256=hashlib.sha256(file.read_bytes()).hexdigest()))
    digest=hashlib.sha256(json.dumps(files,sort_keys=True).encode()).hexdigest()
    write(STAGE/"build-artifact.json",dict(command_id=entry["command_id"],build_utc=entry["end_utc"],exit_code=0,build_hash=digest,
        served_path=str(folder),real_path=str(folder.resolve()),source_head=json.loads((STAGE/"runtime-isolation.json").read_text())["source_states"][0]["head"],
        files=files,frontend="Vue/Nuxt frozen baseline",browser_acceptance_allowed=True))

def main():
    parser=argparse.ArgumentParser();parser.add_argument("action",choices=["setup","install","build","unit","coverage","lint","types","browser","inventory"])
    parser.add_argument("--approved",action="store_true");args=parser.parse_args();approved=args.approved
    if args.action=="setup":setup();return
    if args.action=="install":
        command(["pnpm","install","--frozen-lockfile","--offline","--store-dir",str(ROOT/"runtime/cache/pnpm"),"--reporter","append-only"],SOURCE/"frontend","S1-frozen-Vue-install",approved)
        command(["pnpm","install","--frozen-lockfile","--offline","--store-dir",str(ROOT/"runtime/cache/pnpm"),"--reporter","append-only"],EVALUATOR/"frontend-e2e","S1-frozen-evaluator-install",approved)
        command(["uv","sync","--frozen","--offline","--extra","pgsql","--group","dev","--python","/usr/bin/python3"],SOURCE,"S1-frozen-backend-install",approved)
    elif args.action=="build":
        entry=command(["pnpm","generate"],SOURCE/"frontend","S1-Vue-generate",approved,allow_failure=True)
        capture_build(entry)
        if entry["exit_code"]!=0:raise SystemExit(entry["exit_code"])
    elif args.action=="unit":
        command(["pnpm","exec","vitest","run","--maxWorkers=1","--reporter=default","--reporter=json","--outputFile="+str(STAGE/"machine/unit-results.json")],SOURCE/"frontend","S1-Vue-unit",approved)
    elif args.action=="coverage":
        command(["pnpm","exec","vitest","run","--maxWorkers=1","--coverage","--coverage.reportsDirectory="+str(STAGE/"coverage"),"--coverage.reporter=text-summary","--coverage.reporter=json-summary","--reporter=default","--reporter=json","--outputFile="+str(STAGE/"machine/coverage-unit-results.json")],SOURCE/"frontend","S1-Vue-coverage",approved)
    elif args.action=="lint":
        command(["pnpm","lint","--max-warnings=0","--format=json","--output-file="+str(STAGE/"machine/lint-results.json")],SOURCE/"frontend","S1-Vue-lint",approved)
    elif args.action=="types":
        command(["pnpm","exec","nuxt","typecheck"],SOURCE/"frontend","S1-Vue-type-diagnostics",approved)
    elif args.action=="inventory":
        command(["pnpm","exec","playwright","test","--list","--reporter=json"],EVALUATOR/"frontend-e2e","S1-frozen-test-inventory",approved,
            extra_env={"PLAYWRIGHT_JSON_OUTPUT_NAME":str(STAGE/"machine/test-inventory.json")})
    elif args.action=="browser":
        artifact=json.loads((STAGE/"build-artifact.json").read_text());assert artifact["exit_code"]==0 and artifact["browser_acceptance_allowed"]
        # Reporter paths are overridden by CLI, preserving the frozen assertions/config.
        command(["pnpm","exec","playwright","test","--workers=1","--reporter=list,json,html","--output="+str(STAGE/"browser/test-results")],EVALUATOR/"frontend-e2e","S1-frozen-all-routes-flows-guard-strict",approved)

if __name__=="__main__":main()
