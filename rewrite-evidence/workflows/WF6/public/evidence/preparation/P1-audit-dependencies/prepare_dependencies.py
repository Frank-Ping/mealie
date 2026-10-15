"""Install frozen dependencies and inspect runtime capability, never run baseline tests."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

FOLDER=Path(__file__).resolve().parent
ROOT=FOLDER.parents[2]
sys.path.insert(0,str(ROOT/"wf6-evidence/usage"))
from preparation_command import run

def main():
    parser=argparse.ArgumentParser();parser.add_argument("action",choices=["tools","vue","backend","evaluator","browser","browser-probe","inspect"])
    parser.add_argument("--approved-network",action="store_true");args=parser.parse_args()
    env=json.loads((FOLDER/"dependency-environment.json").read_text());env.update(CI="1",UV_DEFAULT_INDEX="https://pypi.org/simple",npm_config_fetch_retries="0",npm_config_fetch_timeout="15000",UV_HTTP_RETRIES="0")
    permission="Approved anonymous package downloads/lifecycle setup; sandbox remains default for other actions." if args.approved_network else "workspace-write; restricted network; no escalation"
    def command(argv,cwd,label):
        result=run(argv,cwd,label,env=env,permission=permission)
        if result["exit_code"]!=0:raise RuntimeError(label+" failed; original log "+result["stderr"])
        return result
    source=ROOT/"mealie-wf6-coexist";evaluator=ROOT/"mealie-wf6-evaluator"
    frozen=[source/"uv.lock",source/"pyproject.toml",source/"frontend/package.json",source/"frontend/pnpm-lock.yaml",source/"frontend/pnpm-workspace.yaml",
            evaluator/"frontend-e2e/package.json",evaluator/"frontend-e2e/pnpm-lock.yaml"]
    before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in frozen}
    if args.action=="tools":
        results={}
        for name in ("node","npm","pnpm","uv","task"):
            executable=shutil.which(name,path=env["PATH"]);assert executable and str(ROOT/"runtime/tools") in executable
            entry=command([executable,"--version"],ROOT,"native-tool-version-"+name)
            results[name]=dict(executable=executable,resolved_path=str(Path(executable).resolve()),
                version=(FOLDER/entry["stdout"]).read_text().strip(),command_id=entry["command_id"])
        entry=command(["node","-e","console.log(JSON.stringify({platform:process.platform,arch:process.arch,execPath:process.execPath,version:process.version}))"],ROOT,"Node-native-platform")
        native=json.loads((FOLDER/entry["stdout"]).read_text());assert native["platform"]=="linux" and native["arch"]=="x64"
        results["node"]["native_platform"]=native
        results["python"]=dict(executable="/usr/bin/python3",version=subprocess.run(["/usr/bin/python3","--version"],capture_output=True,text=True,check=True).stdout.strip())
        (FOLDER/"native-tool-versions.json").write_text(json.dumps(results,indent=2)+"\n")
    elif args.action=="vue":
        command(["pnpm","install","--frozen-lockfile","--store-dir",str(ROOT/"runtime/cache/pnpm"),"--reporter","append-only"],source/"frontend","frozen-Vue-dependency-install")
    elif args.action=="backend":
        command(["uv","sync","--frozen","--extra","pgsql","--group","dev","--python","/usr/bin/python3"],source,"frozen-backend-dev-dependency-install")
    elif args.action=="evaluator":
        command(["pnpm","install","--frozen-lockfile","--store-dir",str(ROOT/"runtime/cache/pnpm"),"--reporter","append-only"],evaluator/"frontend-e2e","frozen-evaluator-dependency-install")
    elif args.action=="browser":
        command(["pnpm","exec","playwright","install","chromium"],evaluator/"frontend-e2e","frozen-Playwright-Chromium-download")
    elif args.action=="browser-probe":
        command(["node",str(FOLDER/"browser_probe.mjs")],ROOT,"Linux-Chromium-blank-page-capability-only")
    elif args.action=="inspect":
        command(["pnpm","exec","nuxt","--version"],source/"frontend","Nuxt-installed-version-only")
        command(["pnpm","exec","playwright","--version"],evaluator/"frontend-e2e","Playwright-installed-version-only")
        command(["uv","run","--frozen","--no-sync","python","-c",
            "import importlib.metadata as m,json,sys; print(json.dumps({'python':sys.version,'executable':sys.executable,'packages':{n:m.version(n) for n in ['mealie','fastapi','uvicorn','pytest','python-ldap','psycopg2-binary']}}))"],source,"backend-installed-package-versions-only")
    after={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in frozen};assert before==after,"Frozen manifests/locks changed during preparation"
    checks=FOLDER/(args.action+"-dependency-result.json")
    checks.write_text(json.dumps(dict(action=args.action,status="PASS",frozen_input_sha256=after,
        scope="Dependency preparation/version inspection only; no baseline, build, unit/lint/type checks, database, login or evaluator suite executed."),indent=2)+"\n")
    print(args.action+" dependency preparation PASS; frozen manifests and locks unchanged.")

if __name__=="__main__":main()
