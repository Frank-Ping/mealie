"""Audit original provider S0 records independently of the collector implementation."""
import collections
import hashlib
import json
from pathlib import Path

FOLDER=Path(__file__).resolve().parent
EVIDENCE=FOLDER.parents[1]
FIELDS=("input_tokens","cached_input_tokens","cache_write_input_tokens","output_tokens","reasoning_output_tokens","total_tokens")

def main():
    config=json.loads((EVIDENCE/"usage/tracking-config.json").read_text())
    source=Path(config["source_log"])
    data=source.read_bytes();rows=[];offset=0
    for number,line in enumerate(data.splitlines(keepends=True),1):
        if not line.endswith(b"\n"):raise RuntimeError("Incomplete source tail; do not claim exact audit.")
        record=json.loads(line);rows.append(dict(line=number,byte_offset=offset,record=record));offset+=len(line)
    session=config["session_id"];turn=config["initial_turn_id"];start=config["start_line"]
    metadata=rows[0]["record"]["payload"];assert metadata["id"]==session
    request=rows[start-1]["record"]["payload"]
    assert request["id"]==config["user_message_id"]
    assert request["internal_chat_message_metadata_passthrough"]["turn_id"]==turn
    assert request["content"][0]["text"].splitlines()[0]=="[[WF6:S0:START]]"
    attributed=[r for r in rows if r["record"]["type"]=="token_usage_record"]
    before=[r for r in attributed if r["line"]<start and r["record"]["payload"]["session_id"]==session]
    assert before,"Missing actual pre-request counter boundary"
    baseline=before[-1]
    final=next(r for r in rows if r["line"]>start and r["record"]["type"]=="response_item" and
        r["record"]["payload"].get("role")=="assistant" and r["record"]["payload"].get("phase")=="final_answer" and
        "".join(c.get("text","") for c in r["record"]["payload"].get("content",[])).rstrip().endswith("[[WF6:S0:END]]"))
    assert final["record"]["payload"]["internal_chat_message_metadata_passthrough"]["turn_id"]==turn
    complete=next(r for r in rows if r["line"]>final["line"] and r["record"]["type"]=="event_msg" and
        r["record"]["payload"].get("type")=="task_complete" and r["record"]["payload"].get("turn_id")==turn)
    events=[r for r in attributed if r["record"]["payload"].get("turn_id")==turn]
    assert all(start<r["line"]<complete["line"] for r in events),"Late/out-of-window S0 event needs review"
    unique={};duplicates=[]
    for r in events:
        pl=r["record"]["payload"];assert pl["session_id"]==pl["thread_id"]==session
        key=(session,turn,pl["response_id"])
        if key in unique:
            assert unique[key]["record"]["payload"]==pl,"Conflicting duplicate"
            duplicates.append(r["line"])
        else:unique[key]=r
        assert pl["usage"]["total_tokens"]==pl["usage"]["input_tokens"]+pl["usage"]["output_tokens"]
        assert pl["usage"]["cached_input_tokens"]<=pl["usage"]["input_tokens"]
        assert pl["usage"]["reasoning_output_tokens"]<=pl["usage"]["output_tokens"]
    measured=list(unique.values());end=measured[-1];assert end["line"]>final["line"]
    sums={k:sum(r["record"]["payload"]["usage"][k] for r in measured) for k in FIELDS}
    delta={k:end["record"]["payload"]["thread_token_usage"][k]-baseline["record"]["payload"]["thread_token_usage"][k] for k in FIELDS}
    turn_counter=end["record"]["payload"]["turn_token_usage"]
    assert sums==delta==turn_counter
    prev=baseline
    for r in measured:
        pl=r["record"]["payload"]
        assert all(pl["thread_token_usage"][k]-prev["record"]["payload"]["thread_token_usage"][k]==pl["usage"][k] for k in FIELDS)
        prev=r
    foreign=[r for r in attributed if start<r["line"]<=end["line"] and r["record"]["payload"].get("turn_id")!=turn]
    assert not foreign
    legacy=[r for r in rows if start<r["line"]<complete["line"] and r["record"]["type"]=="event_msg" and r["record"]["payload"].get("type")=="token_count"]
    original=json.loads((FOLDER/"pre-audit-S0/steps/S0/token-usage.json").read_text())
    preline=original["segments"][0]["end_event"]["line"]
    presums={k:sum(r["record"]["payload"]["usage"][k] for r in measured if r["line"]<=preline) for k in FIELDS}
    assert presums=={k:original[k] for k in FIELDS}
    assert original["input_tokens"]==2921248 and original["total_tokens"]==2958649
    def loc(r):return dict(line=r["line"],byte_offset=r["byte_offset"],timestamp=r["record"].get("timestamp"))
    report=dict(status="exact_reported",final_reply_included=True,session_id=session,turn_id=turn,
        source_log=str(source),source_prefix_bytes=offset,source_prefix_sha256=hashlib.sha256(data).hexdigest(),
        start_request=loc(rows[start-1]),baseline_event={**loc(baseline),"thread_token_usage":baseline["record"]["payload"]["thread_token_usage"]},
        final_message=loc(final),final_usage={**loc(end),"thread_token_usage":end["record"]["payload"]["thread_token_usage"]},task_complete=loc(complete),
        unique_response_count=len(measured),duplicates=duplicates,excluded_legacy_events=len(legacy),foreign_turn_events=foreign,
        unique_response_sum=sums,cumulative_difference=delta,provider_turn_counter=turn_counter,
        original_pre_reply_snapshot=presums,final_reply_addition={k:sums[k]-presums[k] for k in FIELDS},
        input_per_response=dict(minimum=min(r["record"]["payload"]["usage"]["input_tokens"] for r in measured),
            maximum=max(r["record"]["payload"]["usage"]["input_tokens"] for r in measured),mean=sums["input_tokens"]/len(measured)),
        noncached_input_tokens=sums["input_tokens"]-sums["cached_input_tokens"],cached_input_fraction=sums["cached_input_tokens"]/sums["input_tokens"],
        explanation="Provider input counts repeated model context per response. Cached input is already included in input. These are not unique prompt/document tokens. Preparation counters are subtracted, legacy counters are excluded, and only unique attributed responses from the actual S0 turn are summed.",
        limitations="Provider telemetry is audited, not independently measured billing. Costs are unavailable. This post-S0 audit turn is separately extra_discussion/preparation.")
    (FOLDER/"s0-independent-audit.json").write_text(json.dumps(report,indent=2)+"\n")
    (FOLDER/"s0-unique-response-events.jsonl").write_text("".join(json.dumps(dict(**loc(r),payload=r["record"]["payload"]))+"\n" for r in measured))
    print(json.dumps(report,indent=2))

if __name__=="__main__":main()
