"""Verify published checksums and install native tools only inside this run."""
import base64
import hashlib
import json
from pathlib import Path
import shlex
import tarfile
import zipfile

FOLDER=Path(__file__).resolve().parent
ROOT=FOLDER.parents[2]

def main():
    downloads=ROOT/"runtime/downloads";tools=ROOT/"runtime/tools";bin_dir=tools/"bin";bin_dir.mkdir(exist_ok=True)
    manifest=[]
    def check(path,expected,algorithm="sha256"):
        measured=hashlib.new(algorithm,path.read_bytes()).hexdigest()
        assert measured==expected,(str(path),measured,expected)
        manifest.append(dict(path=str(path),algorithm=algorithm,digest=measured,verified=True))
    node=downloads/"node-v24.21.0-linux-x64.tar.xz"
    expected=next(line.split()[0] for line in (downloads/"node-v24.21.0-SHASUMS256.txt").read_text().splitlines() if line.split()[-1]==node.name)
    check(node,expected)
    destination=tools/"node-v24.21.0-linux-x64"
    assert not destination.exists(),"Refuse to overwrite an existing Node tool directory."
    with tarfile.open(node) as archive:archive.extractall(tools,filter="data")
    for name in ("node","npm","npx"):(bin_dir/name).symlink_to(destination/"bin"/name)
    uv=json.loads((downloads/"uv-selected.json").read_text());wheel=downloads/"uv-0.13.0-linux-x64.whl"
    check(wheel,uv["file"]["digests"]["sha256"])
    with zipfile.ZipFile(wheel) as archive:
        for name in ("uv","uvx"):
            path=next(p for p in archive.namelist() if p.endswith(".data/scripts/"+name))
            target=bin_dir/name;target.write_bytes(archive.read(path));target.chmod(0o755)
    pnpm=json.loads((downloads/"pnpm-11.23.0-metadata.json").read_text());package=downloads/"pnpm-11.23.0.tgz"
    check(package,pnpm["dist"]["shasum"],"sha1")
    integrity=pnpm["dist"]["integrity"];algorithm,b64=integrity.split("-",1)
    assert base64.b64encode(hashlib.new(algorithm,package.read_bytes()).digest()).decode()==b64
    manifest.append(dict(path=str(package),algorithm=algorithm,integrity=integrity,verified=True))
    pnpm_dir=tools/"pnpm-11.23.0";pnpm_dir.mkdir()
    with tarfile.open(package) as archive:archive.extractall(pnpm_dir,filter="data")
    metadata=json.loads((pnpm_dir/"package/package.json").read_text());assert metadata["version"]=="11.23.0"
    for name in ("pnpm","pnpx"):
        script=pnpm_dir/"package"/metadata["bin"][name]
        wrapper=bin_dir/name
        wrapper.write_text("#!/bin/sh\nexec "+shlex.quote(str(bin_dir/"node"))+" "+shlex.quote(str(script))+" \"$@\"\n");wrapper.chmod(0o755)
    task=downloads/"task-linux-amd64.tar.gz"
    expected=next(line.split()[0] for line in (downloads/"task-checksums.txt").read_text().splitlines() if line.split()[-1]=="task_linux_amd64.tar.gz")
    check(task,expected)
    with tarfile.open(task) as archive:
        member=next(m for m in archive.getmembers() if m.name=="task")
        target=bin_dir/"task";target.write_bytes(archive.extractfile(member).read());target.chmod(0o755)
    env=dict(PATH=str(bin_dir)+":/usr/local/bin:/usr/bin:/bin",UV_PYTHON="/usr/bin/python3",UV_FROZEN="1",UV_NO_CONFIG="1",
        UV_CACHE_DIR=str(ROOT/"runtime/cache/uv"),UV_PROJECT_ENVIRONMENT=str(ROOT/"runtime/env/backend"),UV_PYTHON_INSTALL_DIR=str(ROOT/"runtime/tools/python"),
        UV_SYSTEM_CERTS="1",PYTHONDONTWRITEBYTECODE="1",NPM_CONFIG_USERCONFIG=str(ROOT/"runtime/npm-userconfig"),
        NPM_CONFIG_GLOBALCONFIG=str(ROOT/"runtime/npm-globalconfig"),NPM_CONFIG_CACHE=str(ROOT/"runtime/cache/npm"),
        PNPM_HOME=str(bin_dir),npm_config_store_dir=str(ROOT/"runtime/cache/pnpm"),npm_config_registry="https://registry.npmjs.org/",
        PLAYWRIGHT_BROWSERS_PATH=str(ROOT/"runtime/browser-binaries"))
    for name in ("npm-userconfig","npm-globalconfig"):(ROOT/"runtime"/name).write_text("")
    (ROOT/"runtime/linux-env.sh").write_text("# Native Linux environment for this isolated WF6 run.\n"+"\n".join("export "+key+"="+shlex.quote(value) for key,value in env.items())+"\n")
    (FOLDER/"dependency-environment.json").write_text(json.dumps(env,indent=2)+"\n")
    (FOLDER/"download-integrity.json").write_text(json.dumps(manifest,indent=2)+"\n")
    print(json.dumps(dict(installed_bin=str(bin_dir),tools=["Node 24.21.0","pnpm 11.23.0","uv "+uv["version"],"Task 3.54.0"],all_download_checksums_verified=True),indent=2))

if __name__=="__main__":main()
