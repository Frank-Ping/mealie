"""Read-only verification of public WF5 evidence; no application commands run."""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
from prepare_public_evidence import DROP_KEYS, SECRET_PATTERN


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, required=True)
    args = parser.parse_args()
    root = args.root.resolve()
    manifest = json.loads((root / "PUBLIC_MANIFEST.json").read_text(encoding="utf-8"))
    issues = []
    for item in manifest["files"]:
        path = root / item["public_path"]
        if not path.is_file() or sha(path.read_bytes()) != item["public_sha256"]:
            issues.append(f"Manifest hash mismatch: {item['public_path']}")

    private_path = re.compile(r"C:(?:\\+|/)+Users(?:\\+|/)+[^\s\"'<>]+|/mnt/[a-z]/Users/|/home/[^/\s]+", re.I)
    structured_count = 0
    for path in sorted(root.rglob("*")):
        if not path.is_file() or "__pycache__" in path.parts:
            continue
        relative = path.relative_to(root).as_posix()
        if any(part == ".git" or part.endswith(".git") for part in path.parts) or path.suffix in {".zip", ".tar", ".pack", ".idx", ".rev", ".pyc"}:
            issues.append(f"Excluded container/cache present: {relative}")
            continue
        raw = path.read_bytes()
        text = gzip.decompress(raw).decode("utf-8-sig") if path.suffix == ".gz" else raw.decode("utf-8-sig")
        if SECRET_PATTERN.search(text):
            issues.append(f"Credential-pattern review required: {relative}")
        if path.suffix != ".py" and private_path.search(text):
            issues.append(f"Private absolute path present: {relative}")
        if path.name in {"PUBLIC_MANIFEST.json", "PUBLIC_VERIFICATION.json"}:
            continue  # These identify the removed field names and preparation checks.
        objects = []
        if path.suffix == ".json":
            objects = [json.loads(text)]
        elif path.suffix == ".jsonl":
            objects = [json.loads(line) for line in text.splitlines() if line.strip()]
        elif path.suffix == ".gz":
            objects = [json.loads(text)]
        structured_count += len(objects)

        def inspect(value):
            if isinstance(value, dict):
                if set(value).intersection(DROP_KEYS):
                    issues.append(f"Removed metadata field present: {relative}")
                for item in value.values():
                    inspect(item)
            elif isinstance(value, list):
                for item in value:
                    inspect(item)
            elif isinstance(value, str) and value.strip().startswith(("{", "[")):
                try:
                    parsed = json.loads(value)
                except ValueError:
                    pass
                else:
                    inspect(parsed)
        for obj in objects:
            inspect(obj)

    def load(path):
        return json.loads((root / path).read_text(encoding="utf-8"))
    completed = load("accounting/main-completed-usage-summary.json")
    sealed = load("accounting/Sealed_R2_Accounting_Extract.json")
    audit = load("accounting/audit-usage-summary.json")
    faults = load("post-stop-audit/fault-results.json")["results"]
    probes = load("post-stop-audit/probe-results.json")
    final = load("implementation-checks/final-wsl/check-results.json")["results"]
    units = load("implementation-checks/final-wsl/unit-results.json")
    audit_final = load("post-stop-audit/check-results.json")
    phase_count = {}
    for phase, expected in (("A", 42), ("B", 101)):
        path = root / f"transcripts/Phase_{phase}_Visible_Through_Final.jsonl"
        rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
        phase_count[phase] = len(rows)
        if len(rows) != expected or rows[-1].get("role") != "assistant" or rows[-1].get("channel") not in {"final", "final_answer"}:
            issues.append(f"Visible phase {phase} final/count mismatch")
        if not all(isinstance(row.get("source_row_1_based"), int) and row["source_row_1_based"] > 0 for row in rows):
            issues.append(f"Invalid original source rows in phase {phase}")
        for row in rows:
            if row["record_type"] == "message":
                if row.get("role") not in {"user", "assistant"} or row.get("role") == "assistant" and row.get("channel") not in {"commentary", "final", "final_answer"}:
                    issues.append(f"Non-visible message in phase {phase}")
            elif row["record_type"] not in {"function_call", "function_call_output", "custom_tool_call", "custom_tool_call_output"}:
                issues.append(f"Disallowed record type in phase {phase}")
    checks = {
        "formal_phase_sum": completed["phases"]["Phase-A"]["total_tokens"] + completed["phases"]["Phase-B"]["total_tokens"] == 8992891,
        "formal_sealed_total": sealed["R2FormalThroughFinalReply"]["total_tokens"] == 8992891,
        "tracked_setup_plus_formal": completed["total_usage"]["total_tokens"] == 11264841,
        "audit_total": audit["taskAgentUsage"]["total_tokens"] + audit["automaticApprovalReviewUsage"]["total_tokens"] == audit["allObservedUsage"]["total_tokens"] == 13086633,
        "audit_bookkeeping_separate": audit["accountingFollowup"]["usage"]["total_tokens"] == 1906736,
        "original_chat_post_stop_separate": sealed["lastAvailablePreExtensionCumulativeCounter"]["total_tokens"] - sealed["R2FinalReplyCumulativeCounter"]["total_tokens"] == sealed["originalConversationPostStopPreExtensionUsage"]["total_tokens"] == 686591,
        "six_final_commands_pass": len(final) == 6 and all(item["exit_code"] == 0 for item in final),
        "target_36_units_pass": units["numTotalTests"] == units["numPassedTests"] == 36 and units["numFailedTests"] == units["numPendingTests"] == 0,
        "target_20_rule_checks": bool(re.search(r"tests\s+20", (root / "implementation-checks/final-wsl/rules.log").read_text(encoding="utf-8"))),
        "audit_19_fault_controls": len(faults) == 19 and sum(item["safetyPassed"] for item in faults) == 11,
        "audit_16_probes_14_pass_2_fail": probes["numTotalTests"] == 16 and probes["numPassedTests"] == 14 and probes["numFailedTests"] == 2,
    }
    for name, passed in checks.items():
        if not passed:
            issues.append(f"Saved-evidence invariant failed: {name}")
    checksums = root / "SHA256SUMS.txt"
    checksums_verified = None
    if checksums.exists():
        checksum_issues = []
        for line in checksums.read_text(encoding="utf-8").splitlines():
            expected, relative = line.split("  ", 1)
            path = root / relative
            if not path.is_file() or sha(path.read_bytes()) != expected:
                checksum_issues.append(relative)
        checksums_verified = not checksum_issues
        issues.extend(f"Distributed checksum mismatch: {relative}" for relative in checksum_issues)
    print(json.dumps({
        "scope": "Publication preparation verification; historical tests not rerun",
        "status": "pass" if not issues else "fail",
        "manifest_files_verified": len(manifest["files"]),
        "structured_records_checked": structured_count,
        "visible_records": phase_count,
        "saved_evidence_invariants": checks,
        "distributed_checksums_verified": checksums_verified,
        "issues": sorted(set(issues)),
    }, ensure_ascii=False, indent=2))
    raise SystemExit(1 if issues else 0)


if __name__ == "__main__":
    main()
