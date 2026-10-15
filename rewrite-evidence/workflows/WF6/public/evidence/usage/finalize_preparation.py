"""Settle a separately authorized preparation turn without reopening a WF6 step."""
import argparse
import hashlib
import json
from pathlib import Path
from collect_usage import FIELDS, analyze, collect, payload, read_log, redact, sums, write_json, write_lines, manifest

def finalize(preparation_id):
    evidence=Path(__file__).resolve().parent.parent
    folder=evidence/"preparation"/preparation_id
    boundary=json.loads((folder/"boundary.json").read_text())
    config=json.loads((evidence/"usage/tracking-config.json").read_text())
    records,issues=read_log(Path(config["source_log"]))
    result=analyze(records,config,issues)
    turn=boundary["turn_id"];session=boundary["session_id"];unique={};notes=list(result["issues"])
    for row in records:
        pl=payload(row)
        if row["record"].get("type")!="token_usage_record" or pl.get("turn_id")!=turn:continue
        if pl.get("session_id")!=session or pl.get("thread_id")!=session:
            notes.append("Foreign session usage excluded.");continue
        key=pl.get("response_id")
        if key in unique:
            if payload(unique[key])!=pl:notes.append("Conflicting duplicate response.")
        else:unique[key]=row
    events=list(unique.values())
    before=[r for r in records if r["line"]<boundary["line"] and r["record"].get("type")=="token_usage_record" and payload(r).get("session_id")==session]
    baseline=before[-1] if before else None
    end=events[-1] if events else None
    total=sums(events) if events else {k:None for k in FIELDS}
    delta={k:payload(end).get("thread_token_usage",{}).get(k)-payload(baseline).get("thread_token_usage",{}).get(k)
        if baseline and end and isinstance(payload(end).get("thread_token_usage",{}).get(k),int) and isinstance(payload(baseline).get("thread_token_usage",{}).get(k),int) else None for k in FIELDS}
    if not baseline:notes.append("Actual pre-request counter boundary is missing.")
    if delta!=total:notes.append("Cumulative delta and unique responses disagree.")
    visible=[v for v in result["visible"] if v.get("turn_id")==turn]
    finals=[v for v in visible if v.get("kind")=="assistant" and v.get("phase") in ("final_answer","final")]
    final=finals[-1] if finals else None
    complete=[r for r in records if r["record"].get("type")=="event_msg" and payload(r).get("type")=="task_complete" and payload(r).get("turn_id")==turn]
    closed=bool(final and end and end["line"]>final["line"] and complete and complete[-1]["line"]>end["line"])
    status="not_provided" if not events else "partial" if notes else "exact_reported" if closed else "provisional"
    def loc(r):return None if r is None else {k:r[k] for k in ("line","byte_offset","source_log")}
    document=dict(preparation_id=preparation_id,category="extra_discussion/preparation",session_id=session,turn_id=turn,
        status=status,**(total if status in ("exact_reported","provisional") else {k:None for k in FIELDS}),known_partial_usage=total,
        actual_request_boundary=boundary,start_event=loc(baseline),end_event=loc(end),cumulative_difference=delta,
        response_ids=list(unique),final_reply_included=closed,final_event=loc(final),complete_event=loc(complete[-1]) if complete else None,
        coverage_notes=notes,cost=None,overlap_policy="This is a named subset of extra_discussion, not an additional amount. Excluded from S0/S1 and the S2-S6 execution budget.")
    previous=folder/"token-usage.json"
    if previous.exists():
        original=previous.read_bytes();exports=folder/"usage-exports";exports.mkdir(exist_ok=True)
        archive=exports/(hashlib.sha256(original).hexdigest()+".json")
        if not archive.exists():archive.write_bytes(original)
    write_json(previous,document)
    write_lines(folder/"visible-transcript.jsonl",redact(visible))
    write_json(folder/"transcript-coverage.json",dict(source=config["source_log"],turn_id=turn,entries=len(visible),
        note="Available original user, visible assistant and tool items only. No analysis/system/developer messages. Bootstrap exact tool events are retained; absent split stdout/stderr or UTC subprocess boundaries are not invented.",final_reply_included=closed))
    collect(evidence/"usage/tracking-config.json")
    manifest(evidence)
    print(json.dumps({k:document[k] for k in ("preparation_id","status",*FIELDS,"final_reply_included","coverage_notes")},indent=2))
    return document

if __name__=="__main__":
    parser=argparse.ArgumentParser();parser.add_argument("--preparation-id",default="P1-audit-dependencies");args=parser.parse_args()
    finalize(args.preparation_id)
