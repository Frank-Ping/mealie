"""Prepare an observed Nuxt-compatible checker outside frozen application manifests."""
import hashlib
import json
from pathlib import Path
from record_command import ROOT,EVIDENCE,run
from run_s1 import environment,SOURCE,STAGE,RUNTIME

def main():
    folder=RUNTIME/"typechecker";folder.mkdir(exist_ok=True)
    tracked=[SOURCE/"frontend/package.json",SOURCE/"frontend/pnpm-lock.yaml"]
    before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in tracked}
    package=folder/"package.json"
    expected=dict(name="wf6-s1-typechecker",private=True,packageManager="pnpm@11.23.0",devDependencies={"typescript":"5.9.3","vue-tsc":"3.1.5"})
    if package.exists():assert json.loads(package.read_text())==expected
    else:package.write_text(json.dumps(expected,indent=2)+"\n")
    entry=run(["pnpm","install","--ignore-scripts","--store-dir",str(ROOT/"runtime/cache/pnpm"),"--reporter","append-only"],
        folder,"S1-isolated-typechecker-tool-preparation",stage="S1",env=environment(),
        permission="Approved anonymous diagnostic-tool dependency preparation; no frozen application manifest changes.")
    assert entry["exit_code"]==0
    assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in tracked}
    assert json.loads((folder/"node_modules/typescript/package.json").read_text())["version"]=="5.9.3"
    assert json.loads((folder/"node_modules/vue-tsc/package.json").read_text())["version"]=="3.1.5"
    (STAGE/"typechecker-tool.json").write_text(json.dumps(dict(status="PASS",folder=str(folder),typescript="5.9.3",vue_tsc="3.1.5",
        application_manifests_unchanged=True,preparation_command_id=entry["command_id"],
        compatibility="Frozen Nuxt declares vue-tsc ~2.2.10 || ^3.0.0. Supplemental vue-tsc 3.1.5 satisfies that peer; TypeScript matches frozen resolved 5.9.3.",
        note="Diagnostic tooling outside the application lock; observed versions are recorded, not claimed as frozen application dependencies."),indent=2)+"\n")
    print("Isolated type checker prepared; frozen manifests and lockfile unchanged.")

if __name__=="__main__":main()
