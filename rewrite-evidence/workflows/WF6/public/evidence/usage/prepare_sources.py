"""Import only pinned snapshots; declare honest shallow boundaries in new stores."""
from pathlib import Path
import hashlib
import json
import subprocess
from record_command import run, ROOT, EVIDENCE

WORKSPACE = ROOT.parent
STAGE = EVIDENCE / "steps/S0"

def command(argv, label, cwd=ROOT, allow_failure=False, stdin_path=None):
    entry = run(argv, cwd, label, env={"GIT_OPTIONAL_LOCKS":"0", "GIT_TERMINAL_PROMPT":"0"}, stdin_path=stdin_path)
    data = (EVIDENCE / entry["stdout"]).read_bytes()
    if not allow_failure and entry["exit_code"] != 0:
        raise RuntimeError(f"{label} failed: {entry['command_id']}")
    return data, entry

def git(repo, args, label, **kwargs):
    return command(["git", "--no-optional-locks", "-C", str(repo), *args], label, **kwargs)

def verify_objects(repo, ids, label):
    request = STAGE / (label + "-object-ids.txt")
    request.write_text("\n".join(ids)+"\n")
    raw, entry = git(repo, ["cat-file", "--batch"], label+"-object-bytes", stdin_path=request)
    cursor = 0
    for expected in ids:
        end = raw.index(b"\n", cursor)
        sha, kind, size = raw[cursor:end].split()
        length = int(size)
        body = raw[end+1:end+1+length]
        actual = hashlib.sha1(kind+b" "+size+b"\0"+body).hexdigest()
        assert sha.decode() == expected == actual, (expected, actual)
        cursor = end+length+2
    assert cursor == len(raw)
    return request, dict(object_count=len(ids), all_object_ids_recomputed=True,
                        raw_bytes_sha256=hashlib.sha256(raw).hexdigest(), command_id=entry["command_id"])

def prepare():
    provenance=[]
    items=[("source", "mealie-wf6-coexist", "mealie-wf4-rerun", "4b9ca06b6581f7152e164ea0fd9d4da366975a79"),
           ("evaluator", "mealie-wf6-evaluator", "mealie-wf4-evaluator", "758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d")]
    for role, folder, origin_folder, sha in items:
        old=WORKSPACE/folder;origin=WORKSPACE/origin_folder;target=ROOT/folder
        assert not target.exists(), f"Refuse to overwrite {target}"
        _,failure=git(old,["show","-s","--format=fuller",sha],role+"-reproduce-undeclared-boundary-error",allow_failure=True)
        assert failure["exit_code"] != 0, "Expected original incomplete-history failure was not reproduced"
        raw,_=git(old,["cat-file","-p",sha],role+"-pinned-commit")
        original,_=git(origin,["cat-file","-p",sha],role+"-origin-pinned-commit-only")
        assert raw==original, "Pinned object differs from historical origin store"
        tree=raw.splitlines()[0].split()[1].decode()
        listed,_=git(old,["ls-tree","-r","-t","-z",sha],role+"-pinned-tree")
        ids=sorted({sha,tree,*[e.split(b"\t",1)[0].split()[2].decode() for e in listed.split(b"\0") if e]})
        request,old_verify=verify_objects(old,ids,role+"-old")
        _,origin_verify=verify_objects(origin,ids,role+"-origin")
        assert old_verify["raw_bytes_sha256"]==origin_verify["raw_bytes_sha256"]
        git(ROOT,["init",str(target)],role+"-init-new-independent-store")
        packed,entry=git(old,["pack-objects","--stdout"],role+"-export-pinned-objects-no-history",stdin_path=request)
        pack_path=EVIDENCE/entry["stdout"]
        git(target,["index-pack","--stdin"],role+"-import-pinned-objects",stdin_path=pack_path)
        (target/".git/shallow").write_text(sha+"\n")
        git(target,["config","core.autocrlf","false"],role+"-preserve-frozen-bytes")
        if role=="source":
            git(target,["checkout","-b","rewrite/wf6-route-coexistence",sha],role+"-checkout-pinned-input")
        else:
            git(target,["checkout","--detach",sha],role+"-checkout-pinned-input")
        git(target,["show","-s","--format=fuller",sha],role+"-retest-show-with-declared-boundary")
        git(target,["fsck","--full","--strict"],role+"-all-imported-object-integrity")
        dirty,_=git(target,["status","--porcelain=v1"],role+"-initial-clean")
        assert not dirty
        remotes,_=git(target,["remote"],role+"-no-remotes")
        assert not remotes
        assert not (target/".git/objects/info/alternates").exists()
        _,new_verify=verify_objects(target,ids,role+"-new")
        assert new_verify["raw_bytes_sha256"]==old_verify["raw_bytes_sha256"]
        # Check every frozen worktree file against its exact Git blob, including symlinks.
        inventory=[]
        for item in listed.split(b"\0"):
            if not item:continue
            header,name=item.split(b"\t",1);mode,kind,oid=header.split()
            if kind!=b"blob":continue
            path=target/name.decode()
            data=path.readlink().as_posix().encode() if path.is_symlink() else path.read_bytes()
            actual=hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()
            assert actual==oid.decode(), str(path)
            inventory.append(dict(path=name.decode(),mode=mode.decode(),git_blob=actual,sha256=hashlib.sha256(data).hexdigest()))
        (STAGE/(role+"-frozen-files.json")).write_text(json.dumps(inventory,indent=2)+"\n")
        provenance.append(dict(role=role,pinned_sha=sha,tree_sha=tree,historical_origin_store=str(origin),
            immediate_read_only_store=str(old),target=str(target),old_verification=old_verify,origin_verification=origin_verify,
            new_verification=new_verify,initial_dirty=False,remotes=[],shared_objects=False,
            history_policy="Pinned snapshot is an explicit shallow root. Full ancestor history is unavailable and is not claimed.",
            access_scope="Only specified pinned commit/tree/blob objects; no other workflow worktree implementation read."))
    (STAGE/"input-provenance.json").write_text(json.dumps(provenance,indent=2)+"\n")
    with (STAGE/"attempts.jsonl").open("a") as out:
        out.write(json.dumps(dict(kind="missing_parent_history",cause="Historical stores contain snapshot objects but lack parent objects and do not declare shallow roots.",
            repair="New stores import hash-verified pinned objects and explicitly declare pinned commits as shallow boundaries. Original stores are unchanged.",
            rerun="New git show and git fsck --full --strict succeeded; all object and worktree bytes verified.",scope="Snapshot source validity; complete ancestry remains unavailable."))+"\n")
    print("Pinned source/evaluator snapshots verified; explicit new shallow boundaries accepted.")

if __name__=="__main__":prepare()
