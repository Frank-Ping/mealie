"""Create public WF5 projections from the private retrospective evidence package.

Standard library only. This prepares documentation; it never executes the historical
commands, installs dependencies, or changes the original package or source history.
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import re
from pathlib import Path

DROP_KEYS = {
    "rate_limits", "credits", "balance", "has_credits", "unlimited", "plan_type",
    "resets_at", "used_percent", "rate_limit_reached_type", "individual_limit",
    "spend_control_reached", "mcp_attribution", "connector_id", "plugin_id",
    "internal_chat_message_metadata_passthrough", "metadata", "retained_source",
    "client_authored", "user_input_order", "annotations", "_meta",
}
ACCOUNT_KEYS = {"rate_limits", "credits", "balance", "has_credits", "plan_type"}
SECRET_PATTERN = re.compile(
    r"gh[pousr]_[A-Za-z0-9]{15,}|github_pat_[A-Za-z0-9_]{15,}|"
    r"sk-[A-Za-z0-9_-]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|"
    r"Bearer\s+[A-Za-z0-9_.-]{25,}|"
    r"eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}|"
    r"https?://[^\s/:]+:[^\s/@]+@|\bAKIA[A-Z0-9]{16}\b"
)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def clean_text(value: str) -> str:
    """Normalize private paths without changing historical workflow identifiers."""
    stripped = value.strip()
    if stripped.startswith(("{", "[")):
        try:
            parsed = json.loads(stripped)
        except (ValueError, TypeError):
            pass
        else:
            return json.dumps(clean(parsed), ensure_ascii=False)
    # Handle native paths and escaped paths embedded in JSON/tool strings alike.
    sep = r"(?:\\+|/)+"
    user = r"C:" + sep + r"Users" + sep + r"[^\\/\s\"']+"
    session = user + sep + r"\.codex" + sep + r"sessions" + sep + r"[^\s\"'`<>]+"
    value = re.sub(session, "<PRIVATE_SESSION_LOG>", value, flags=re.I)
    workspace = user + sep + r"OneDrive" + sep + r"Desktop" + sep + r"574-agentic development" + sep + r"574-week12"
    value = re.sub(workspace, "<WORKSPACE>", value, flags=re.I)
    value = re.sub(r"/mnt/[a-z]/Users/[^/\s\"'`]+/OneDrive/Desktop/574-agentic development/574-week12", "<WORKSPACE>", value, flags=re.I)
    value = re.sub(r"/mnt/[a-z]/Users/[^/\s\"'`]+", "<PRIVATE_HOME>", value, flags=re.I)
    temporary = user + sep + r"AppData" + sep + r"Local" + sep + r"Temp" + sep + r"wf4g2-[^\\/\s\"']+(?:" + sep + r"repo)?"
    value = re.sub(temporary, "<EXECUTION_COPY>", value, flags=re.I)
    runtime = user + sep + r"\.cache" + sep + r"codex-runtimes" + sep + r"codex-primary-runtime" + sep + r"dependencies"
    value = re.sub(runtime, "<RUNTIME>", value, flags=re.I)
    value = re.sub(r"/var/tmp/wf4-r2-[^/\s\"'`]+", "<EXECUTION_COPY>", value)
    value = re.sub(r"/tmp/wf4-r2-[^/\s\"'`]+", "<EXECUTION_COPY>", value)
    value = re.sub(r"/home/[^/\s\"'`]+", "<PRIVATE_HOME>", value)
    value = re.sub(user, "<PRIVATE_HOME>", value, flags=re.I)
    # Quoted source paths should remain readable as portable forward-slash paths.
    value = re.sub(r"(<(?:WORKSPACE|EXECUTION_COPY|PRIVATE_HOME|RUNTIME)>)(?:\\+)", r"\1/", value)
    return value


def clean(value):
    if isinstance(value, dict):
        return {key: clean(item) for key, item in value.items() if key not in DROP_KEYS}
    if isinstance(value, list):
        return [clean(item) for item in value]
    if isinstance(value, str):
        return clean_text(value)
    return value


def public_links(text: str, destination: str) -> str:
    """Replace workstation links with copied local evidence or a portable label."""
    targets = {
        "WF4-R2-Gate-2-independent-review.md": "post-stop-audit/Original_Report_ZH.md",
        "WF4-R2-Gate-2-review.md": "implementation-checks/Review_Historical_EN.md",
        "provenance-notes.md": "post-stop-audit/Provenance_Notes_Historical.md",
        "fault-results.json": "post-stop-audit/fault-results.json",
        "probe-results.json": "post-stop-audit/probe-results.json",
        "probe-command.json": "post-stop-audit/probe-command.json",
        "final-preservation.json": "post-stop-audit/final-preservation.json",
        "review-usage-summary.json": "accounting/audit-usage-summary.json",
        "Sealed_R2_Accounting_Extract.json": "accounting/Sealed_R2_Accounting_Extract.json",
        "R2-boundary-at-R3-start.json": "accounting/Sealed_R2_Accounting_Extract.json",
        "finalized-usage.json": "accounting/phase-a-finalized-usage.json",
        "usage-windows.json": "accounting/preparation-and-phase-a-snapshots.json",
        "usage-boundaries.json": "accounting/phase-b-provisional-boundaries.json",
        "usage-summary.json": "accounting/main-completed-usage-summary.json",
        "phase-record.json": "accounting/phase-a-record.json",
        "visible-transcript-finalized.jsonl": "transcripts/Phase_A_Visible_Through_Final.jsonl",
        "Accounting_EN.md": "accounting/Accounting_EN.md",
    }
    parent = Path(destination).parent

    def relative(path: str) -> str:
        import os
        return os.path.relpath(path, parent.as_posix()).replace("\\", "/")

    def replace(match):
        label, url = match.group(1), match.group(2)
        normalized = url.replace("\\", "/")
        filename = re.sub(r":\d+$", "", normalized).rsplit("/", 1)[-1]
        target = targets.get(filename)
        if filename == "check-results.json":
            target = "post-stop-audit/check-results.json" if "gate2-independent-review" in normalized else "implementation-checks/final-wsl/check-results.json"
        elif filename == "USAGE.md":
            target = "accounting/Audit_Usage_Historical.md" if "gate2-independent-review" in normalized else "accounting/Main_Usage_Historical.md"
        elif filename == "README.md" and "phase-a" in normalized:
            target = "accounting/Phase_A_Snapshot_Historical.md"
        elif filename == "README.md" and "phase-b" in normalized:
            target = "accounting/Phase_B_Snapshot_Historical.md"
        if target:
            return f"[{label}]({relative(target)})"
        return f"{label} (`{filename}`; original source reference retained in the publication manifest)"

    text = re.sub(r"\[([^\]]+)\]\(<((?:C:|<WORKSPACE>)[^\n]+?)>\)", replace, text)
    return clean_text(text)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", required=True, type=Path)
    parser.add_argument("--canonical-root", required=True, type=Path)
    parser.add_argument("--target-root", required=True, type=Path)
    args = parser.parse_args()
    src, canonical, target = args.source_root.resolve(), args.canonical_root.resolve(), args.target_root.resolve()
    target.mkdir(parents=True, exist_ok=True)
    manifest = []

    def write(source: Path, source_id: str, destination: str, mode: str = "auto"):
        original = source.read_bytes()
        if mode == "visible":
            rows = [json.loads(line) for line in original.decode("utf-8-sig").splitlines() if line.strip()]
            projected = []
            for row in rows:
                payload = row.get("payload", {})
                kind, role = payload.get("type"), payload.get("role")
                permitted_message = kind == "message" and (role == "user" or role == "assistant" and (payload.get("channel") in {"commentary", "final"} or payload.get("phase") in {"commentary", "final_answer"}))
                permitted_tool = kind in {"function_call", "function_call_output", "custom_tool_call", "custom_tool_call_output"}
                if not (permitted_message or permitted_tool):
                    continue
                item = {
                    "source_row_1_based": row.get("source_row_1_based", row.get("ordinal", -1) + 1),
                    "timestamp_utc": row.get("timestamp"),
                    "record_type": kind,
                }
                if permitted_message:
                    item["role"] = role
                    item["channel"] = payload.get("channel", payload.get("phase"))
                    item["content"] = [clean({key: block[key] for key in ("type", "text") if key in block}) for block in payload.get("content", []) if isinstance(block, dict) and "text" in block]
                else:
                    for key in ("name", "call_id", "arguments", "input", "output", "status"):
                        if key in payload:
                            item[key] = clean(payload[key])
                projected.append(item)
            public = ("\n".join(json.dumps(row, ensure_ascii=False) for row in projected) + "\n").encode("utf-8")
            transformations = ["Visible-record allowlist; text/content/tool payload projection; timestamps and original one-based source rows retained", "All internal/connector/account metadata removed recursively; private paths normalized"]
            extra = {"original_records": len(rows), "public_records": len(projected)}
        elif source.suffix == ".gz":
            raw = gzip.decompress(original)
            decoded = raw.decode("utf-8-sig")
            try:
                changed = (json.dumps(clean(json.loads(decoded)), ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8")
            except ValueError:
                changed = clean_text(decoded).encode("utf-8")
            public = original if changed.rstrip() == raw.rstrip() else gzip.compress(changed, mtime=0)
            transformations = ["Compressed report parsed and scanned; structured metadata/private-path sanitization when present", "Historical assertions, counts and results retained; no rerun"]
            extra = {"original_uncompressed_sha256": digest(raw), "public_uncompressed_sha256": digest(gzip.decompress(public))}
        elif source.suffix in {".json", ".jsonl"}:
            if source.suffix == ".json":
                value = clean(json.loads(original.decode("utf-8-sig")))
                public = (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
            else:
                rows = [clean(json.loads(line)) for line in original.decode("utf-8-sig").splitlines() if line.strip()]
                public = ("\n".join(json.dumps(row, ensure_ascii=False) for row in rows) + "\n").encode("utf-8")
            transformations = ["Structured projection removes account/connector/internal metadata recursively", "Private workstation, execution-copy and raw-session paths normalized; counters/results retained"]
            extra = {}
        else:
            value = original.decode("utf-8-sig")
            if destination == "Appendix_EN.md":
                value = value.replace("Original Chinese messages, original log bytes, timestamps and commit identities are retained.", "Original-language wording, timestamps and commit identities are retained in public projections; private paths and internal/account metadata are redacted. Original source hashes remain in PUBLIC_MANIFEST.json.")
                value = re.sub(r"Current HEAD `[^`]+` includes later R3 work;.*?portable local Git evidence instead\.", "The original four commits are preserved directly in the publication repository. Subsequent rewrite implementation is excluded. The publication rename and evidence preparation are separate later commits and do not change the historical R2 outcome.", value)
                start = value.index("| ID | Claim supported | Location within this package |")
                end = value.index("## Report-ready evaluation paragraph", start)
                value = value[:start] + """| ID | Claim supported | Public evidence |
| --- | --- | --- |
| E1 | Frozen source and baseline | [baseline](baseline/BASELINE.md), [numeric results](baseline/baseline.json), [raw reports](baseline/raw-reports/) |
| E2 | Original-language prompts and visible sessions | [translations](prompts/Retrospective_Translations_EN.md), [original prompts](prompts/), [visible projections](transcripts/) |
| E3 | Plan, rules and decisions | Original endpoint commit and the published WF5 workflow documents; historical source labels remain inside records |
| E4 | Four original commits and exact changes | Git history from frozen source `4b9ca06` through endpoint `8b0fae1`; public preparation commits follow separately |
| E5 | Fixed samples and artifact identity | Historical artifact bytes preserved in the publication repository; [audit provenance](post-stop-audit/provenance.json) |
| E6 | Successful and failed implementation checks | [final WSL results](implementation-checks/final-wsl/check-results.json), [selected failure history](implementation-checks/failure-history/) |
| E7 | Independent audit after the stop | [English summary](post-stop-audit/Summary_EN.md), [faults](post-stop-audit/fault-results.json), [probes](post-stop-audit/probe-results.json) |
| E8 | Completed usage and boundaries | [accounting](accounting/Accounting_EN.md), [sealed R2 extract](accounting/Sealed_R2_Accounting_Extract.json) |

This public subset contains explicitly modified historical projections and retrospective English explanations. Internal originals remain private; the manifest records original and public hashes plus transformations. Selected failures and final passes retain their separate checkpoints. Hidden reasoning, system/developer instructions, account state and connector metadata are excluded. Complete unfiltered transcripts, complete per-round semantic verdict tables and fully self-contained early-round replay environments remain unavailable.

## Inspecting the published history

The publication repository exposes the actual frozen source and original four experiment commits directly. Inspect them without a nested Git archive:

```sh
git log --reverse --format=fuller 4b9ca06..8b0fae1
git show 2176881
git diff 4b9ca06 8b0fae1 -- frontend mealie
```

The later WF5 rename and sanitized evidence commit are publication preparation, not further experiment success. [PUBLIC_MANIFEST.json](PUBLIC_MANIFEST.json) records original/public SHA256 correspondence; [SHA256SUMS.txt](SHA256SUMS.txt) covers the files in this evidence directory.

""" + value[end:]
            if destination == "prompts/Retrospective_Translations_EN.md":
                value = value.replace("retained unchanged at the source locations below", "retained in the private original evidence and published here with explicit path/metadata redactions")
                value = value.replace("Historical identifiers, paths, commit hashes, numbers and commands are preserved.", "Historical identifiers, commit hashes, numbers and commands are preserved; private workstation paths use documented placeholders.")
                value = "Public preparation note: this is a retrospective translation of the original prompts. Public projections modify private paths and metadata; original hashes and transformations are listed in [PUBLIC_MANIFEST.json](../PUBLIC_MANIFEST.json).\n\n" + value
            value = public_links(value, destination) if source.suffix == ".md" else clean_text(value)
            public = value.encode("utf-8")
            transformations = ["Private paths normalized; local Markdown evidence links made relative where a copied target exists", "Historical content/identifiers retained; translated summaries explicitly retrospective"]
            extra = {}
        text = gzip.decompress(public).decode("utf-8") if source.suffix == ".gz" else public.decode("utf-8")
        if SECRET_PATTERN.search(text):
            raise ValueError(f"Credential-pattern review required: {source_id}")
        out = target / destination
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(public)
        manifest.append({"original_source_id": source_id, "original_sha256": digest(original), "public_path": destination, "public_sha256": digest(public), "transforms": transformations, **extra})

    raw = src / "03-original-evidence/wf4-r2-evidence"
    def rawfile(rel: str, destination: str, mode: str = "auto"):
        write(raw / rel, f"private-evidence-package/03-original-evidence/wf4-r2-evidence/{rel}", destination, mode)
    def package(rel: str, destination: str, mode: str = "auto"):
        write(src / rel, f"private-evidence-package/{rel}", destination, mode)
    def canonicalfile(rel: str, destination: str):
        write(canonical / rel, f"historical-canonical-repository/{rel}", destination)

    for name in ("BASELINE.md", "SETUP.md", "baseline.json", "environment.json", "metrics.csv", "measurement.log", "input-verification.log", "coverage.log", "run-baseline.sh", "run-coverage.sh", "verify-frozen-inputs.sh"):
        rawfile(name, f"baseline/{name}")
    run = "runs/20261013T085845Z-source_frontend-WF4-R2-Vue-baseline"
    for file in sorted((raw / run).iterdir()):
        if file.is_file() and file.suffix in {".log", ".gz"}:
            rawfile(f"{run}/{file.name}", f"baseline/raw-reports/{file.name}")

    b = "workflow-sessions/phase-b"
    rawfile(f"{b}/wsl-check-results.json", "implementation-checks/final-wsl/check-results.json")
    for name in ("rules", "types", "lint", "unit", "build", "build-components", "install", "environment"):
        extension = "txt" if name == "environment" else "log"
        rawfile(f"{b}/wsl-{name}.{extension}", f"implementation-checks/final-wsl/{name}.{extension}")
    rawfile(f"{b}/wsl-unit-results.json", "implementation-checks/final-wsl/unit-results.json")
    for name in ("wsl-lock-before.txt", "wsl-lock-after.txt", "final-validation.json"):
        rawfile(f"{b}/{name}", f"implementation-checks/final-wsl/{name}")
    win = f"{b}/checks/20261013T103538001026Z"
    for name in ("check-results.json", "lint.log"):
        rawfile(f"{win}/{name}", f"implementation-checks/failure-history/windows-lint/{name}")
    for name in ("wsl-check-results.json", "wsl-types.log", "wsl-unit.log", "wsl-build-components.log", "wsl-environment.txt"):
        rawfile(f"{b}/wsl-attempt-2/{name}", f"implementation-checks/failure-history/wsl-attempt-2/{name}")
    canonicalfile("rewrite-evidence/workflows/WF4-R2-Gate-2-review.md", "implementation-checks/Review_Historical_EN.md")

    for source, dest in (
        ("workflow-sessions/USAGE.md", "Main_Usage_Historical.md"),
        ("workflow-sessions/usage-summary.json", "main-completed-usage-summary.json"),
        ("workflow-sessions/token-events.jsonl", "main-token-events.jsonl"),
        ("workflow-sessions/usage-events.csv", "main-usage-events.csv"),
        ("workflow-sessions/phase-a/finalized-usage.json", "phase-a-finalized-usage.json"),
        ("workflow-sessions/phase-a/usage-windows.json", "preparation-and-phase-a-snapshots.json"),
        ("workflow-sessions/phase-a/phase-record.json", "phase-a-record.json"),
        ("workflow-sessions/phase-a/README.md", "Phase_A_Snapshot_Historical.md"),
        ("workflow-sessions/phase-b/usage-boundaries.json", "phase-b-provisional-boundaries.json"),
        ("workflow-sessions/phase-b/raw-token-events.jsonl", "phase-b-token-count-projection.jsonl"),
        ("workflow-sessions/phase-b/README.md", "Phase_B_Snapshot_Historical.md"),
    ):
        rawfile(source, f"accounting/{dest}")
    package("04-accounting/Accounting_EN.md", "accounting/Accounting_EN.md")
    package("04-accounting/Sealed_R2_Accounting_Extract.json", "accounting/Sealed_R2_Accounting_Extract.json")

    rawfile("workflow-sessions/phase-a/prompt-1.txt", "prompts/Phase_A_Original_ZH.txt")
    rawfile(f"{b}/gate-1-prompt.txt", "prompts/Phase_B_Original_ZH.txt")
    rawfile(f"{b}/token-policy-confirmation.txt", "prompts/Token_Policy_Original_ZH.txt")
    package("01-prompts/Audit_Prompt_Original_ZH.txt", "prompts/Audit_Original_ZH.txt")
    package("01-prompts/Prompts_EN.md", "prompts/Retrospective_Translations_EN.md")
    rawfile("workflow-sessions/phase-a/visible-transcript-finalized.jsonl", "transcripts/Phase_A_Visible_Through_Final.jsonl", "visible")
    package("01-prompts/Phase_B_Visible_Through_Final.jsonl", "transcripts/Phase_B_Visible_Through_Final.jsonl", "visible")
    package("01-prompts/Phase_B_Projection_Source.json", "transcripts/Phase_B_Projection_Provenance.json")
    package("01-prompts/Audit_Prompt_Source.json", "prompts/Audit_Prompt_Provenance.json")

    audit = "gate2-independent-review/20261013T111104Z"
    for name in ("check-results.json", "fault-results.json", "probe-results.json", "probe-command.json", "unit-results.json", "final-preservation.json", "provenance.json", "event-reference.json", "review-infra.test.tsx", "review-samples.test.tsx"):
        rawfile(f"{audit}/{name}", f"post-stop-audit/{name}")
    for name in ("rules", "types", "lint", "unit", "build", "build-components", "probes"):
        rawfile(f"{audit}/{name}.log", f"post-stop-audit/logs/{name}.log")
    for file in sorted((raw / audit / "faults").iterdir()):
        if file.is_file() and file.suffix in {".log", ".vue", ".tsx"}:
            rawfile(f"{audit}/faults/{file.name}", f"post-stop-audit/faults/{file.name}")
    rawfile(f"{audit}/provenance-notes.md", "post-stop-audit/Provenance_Notes_Historical.md")
    rawfile(f"{audit}/USAGE.md", "accounting/Audit_Usage_Historical.md")
    rawfile(f"{audit}/review-usage-summary.json", "accounting/audit-usage-summary.json")
    rawfile(f"{audit}/review-token-events.jsonl", "accounting/audit-token-events.jsonl")
    canonicalfile("rewrite-evidence/workflows/WF4-R2-Gate-2-independent-review.md", "post-stop-audit/Original_Report_ZH.md")
    package("05-post-stop-audit/Post_Stop_Audit_Summary_EN.md", "post-stop-audit/Summary_EN.md")
    package("WF5_R2_Evidence_Appendix_EN.md", "Appendix_EN.md")

    record = {
        "publication_label": "WF5", "historical_label": "WF4-R2",
        "historical_endpoint": "8b0fae128ea823ebee4a6507d274df1f8987e8d1",
        "scope": "Retrospective public projections of historical results; no experiments rerun; subsequent rewrite results excluded",
        "original_source_ids_are_private_package_relative": True,
        "source_metadata_removed": sorted(DROP_KEYS),
        "path_placeholders": ["<WORKSPACE>", "<EXECUTION_COPY>", "<PRIVATE_SESSION_LOG>", "<PRIVATE_HOME>", "<RUNTIME>"],
        "files": manifest,
    }
    (target / "PUBLIC_MANIFEST.json").write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"public_files": len(manifest), "visible_records": {item["public_path"]: item.get("public_records") for item in manifest if "public_records" in item}}, ensure_ascii=False))


if __name__ == "__main__":
    main()
