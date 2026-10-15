"""Run the frozen suite against one fresh owned backend, preserving both server streams."""
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import signal
import socket
import shutil
import subprocess
import time
import urllib.request
import uuid
from record_command import ROOT,EVIDENCE,run
from run_s1 import environment,SOURCE,EVALUATOR,STAGE,RUNTIME

def main(approved=False,native=False):
    build=json.loads((STAGE/"build-artifact.json").read_text())
    assert build["exit_code"]==0 and build["browser_acceptance_allowed"]
    for record in build["files"]:
        file=SOURCE/"frontend/dist"/record["path"]
        assert file.is_file() and hashlib.sha256(file.read_bytes()).hexdigest()==record["sha256"],"Accepted build file changed before browser acceptance: "+record["path"]
    isolation=json.loads((STAGE/"runtime-isolation.json").read_text())
    data=Path(isolation["destructive_target"])
    assert os.path.samefile(data,RUNTIME/"disposable-data") and not data.is_symlink()
    assert os.path.samefile(data.parent,RUNTIME)
    with socket.socket() as check:check.bind(("127.0.0.1",9006))
    permission="Approved bounded local S1 backend/browser suite; default sandbox unchanged." if approved else "workspace-write; restricted network/socket; no escalation"
    env=environment();env["E2E_REUSE_SERVER"]="1"
    assert os.path.samefile(env["E2E_DATA_DIR"],data)
    browser_evidence=STAGE/'browser'
    native_root=None
    if native:
        identity=json.loads((STAGE/'native-runtime.json').read_text())
        native_root=Path(identity['native_root'])
        assert native_root==Path('/tmp/wf6-rerun-20261014-01-S1-native2') and not native_root.is_symlink()
        assert json.loads((native_root/'identity.json').read_text())==identity
        assert not (native_root/'disposable-data').exists(), 'Refuse to reset populated native data.'
        for item in build['files']:
            assert hashlib.sha256((native_root/'static'/item['path']).read_bytes()).hexdigest()==item['sha256']
        auth=EVALUATOR/'frontend-e2e/.auth'
        assert auth.is_symlink() and auth.resolve()==Path('/tmp/wf6-rerun-20261014-01-S1-native/auth')
        assert not any((native_root/'auth').iterdir())
        auth.unlink();auth.symlink_to(native_root/'auth',target_is_directory=True)
        data=native_root/'disposable-data'
        env.update(E2E_DATA_DIR=str(data),E2E_STATIC_DIR=str(native_root/'static'),TMPDIR=str(native_root/'tmp'),
            PLAYWRIGHT_JSON_OUTPUT_NAME=str(native_root/'browser/results.json'),PLAYWRIGHT_HTML_OUTPUT_DIR=str(native_root/'browser/playwright-report'))
        browser_evidence=STAGE/'browser-native'
        assert not browser_evidence.exists(), 'Preserve every prior browser attempt.'
        browser_evidence.mkdir()
    output_dir=(native_root/'browser/test-results') if native else (STAGE/'browser/test-results')
    launcher=EVALUATOR/"frontend-e2e/scripts/start-backend.sh"
    assert hashlib.sha256(launcher.read_bytes()).hexdigest()==isolation["launcher_sha256"]
    cid=dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%S")+"-"+uuid.uuid4().hex[:8]
    stdout=STAGE/"logs"/(cid+".backend.stdout.log");stderr=STAGE/"logs"/(cid+".backend.stderr.log")
    start=dt.datetime.now(dt.timezone.utc).isoformat();timer=time.monotonic();process=None;exit_code=None
    events=STAGE/"service-events.jsonl"
    result=None
    with stdout.open("wb") as out,stderr.open("wb") as err:
        try:
            process=subprocess.Popen([str(launcher)],cwd=EVALUATOR/"frontend-e2e",env={**os.environ,**env},stdout=out,stderr=err,start_new_session=True)
            with events.open("a") as file:file.write(json.dumps(dict(event="owned_backend_started",timestamp=start,pid=process.pid,process_group=process.pid,command_id=cid,data_dir=str(data)))+"\n")
            deadline=time.monotonic()+180
            base="http://127.0.0.1:9006"
            while time.monotonic()<deadline:
                if process.poll() is not None:raise RuntimeError("Fresh owned backend exited before readiness; inspect original backend streams.")
                try:
                    with urllib.request.urlopen(base+"/api/app/about",timeout=2) as response:
                        about=response.read();assert response.status==200
                    break
                except OSError:time.sleep(1)
            else:raise RuntimeError("Fresh owned backend readiness timed out.")
            with urllib.request.urlopen(base+"/login",timeout=10) as response:
                served=response.read();assert response.status==200
            index=SOURCE/"frontend/dist/index.html"
            assert hashlib.sha256(served).hexdigest()==hashlib.sha256(index.read_bytes()).hexdigest(),"Served document differs from accepted Vue build."
            (browser_evidence/"served-build.json").write_text(json.dumps(dict(checked_utc=dt.datetime.now(dt.timezone.utc).isoformat(),
                base_url=base,served_index_sha256=hashlib.sha256(served).hexdigest(),build_hash=build["build_hash"],build_command_id=build["command_id"],
                about_status=200,about_response_sha256=hashlib.sha256(about).hexdigest(),backend_pid=process.pid,
                source_frontend_path=build["real_path"],actual_static_path=env['E2E_STATIC_DIR'],backend_checkout=str(EVALUATOR),
                orchestration="Frozen launcher starts a fresh isolated backend; original Playwright reuse option avoids a second launch. Assertions, seeded globalSetup, projects, retries=0 and strict/all modes unchanged."),indent=2)+"\n")
            result=run(["pnpm","exec","playwright","test","--workers=1","--reporter=list,json,html","--output="+str(output_dir)],
                EVALUATOR/"frontend-e2e","S1-frozen-all-routes-flows-guard-strict"+('-native-runtime' if native else ''),stage="S1",env=env,permission=permission)
        finally:
            if process is not None:
                if process.poll() is None:
                    os.killpg(process.pid,signal.SIGTERM)
                    try:process.wait(timeout=15)
                    except subprocess.TimeoutExpired:os.killpg(process.pid,signal.SIGKILL);process.wait(timeout=5)
                exit_code=process.returncode
                with events.open("a") as file:file.write(json.dumps(dict(event="owned_backend_stopped",timestamp=dt.datetime.now(dt.timezone.utc).isoformat(),pid=process.pid,exit_code=exit_code,command_id=cid,planned_shutdown=True))+"\n")
            entry=dict(stage_id="S1",label="S1-owned-frozen-backend-lifecycle",command_id=cid,argv=[str(launcher)],cwd=str(EVALUATOR/"frontend-e2e"),
                start_utc=start,end_utc=dt.datetime.now(dt.timezone.utc).isoformat(),duration_seconds=time.monotonic()-timer,exit_code=exit_code,
                stdout=str(stdout.relative_to(EVIDENCE)),stderr=str(stderr.relative_to(EVIDENCE)),environment_overrides=env,permission=permission,
                planned_shutdown=True,aggregation="Backend lifecycle overlaps the browser suite; do not sum these durations.")
            with (STAGE/"commands.jsonl").open("a") as file:file.write(json.dumps(entry)+"\n")
            if native:
                for item in (native_root/'browser').iterdir():
                    if item.is_dir():shutil.copytree(item,browser_evidence/item.name)
                    else:shutil.copy2(item,browser_evidence/item.name)
                copied=[]
                for item in sorted(browser_evidence.rglob('*')):
                    if item.is_file():copied.append(dict(path=str(item.relative_to(browser_evidence)),sha256=hashlib.sha256(item.read_bytes()).hexdigest(),bytes=item.stat().st_size))
                (STAGE/'native-output-manifest.json').write_text(json.dumps(dict(original_runtime=str(native_root/'browser'),evidence_copy=str(browser_evidence),files=copied),indent=2)+'\n')
    if result is None or result["exit_code"]!=0:raise SystemExit(result["exit_code"] if result else 1)

if __name__=="__main__":
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument("--approved",action="store_true");parser.add_argument("--native",action="store_true");args=parser.parse_args();main(args.approved,args.native)
