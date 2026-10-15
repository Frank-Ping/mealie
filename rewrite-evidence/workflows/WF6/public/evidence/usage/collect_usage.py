"""Independent WF6 collector for observed Codex JSONL events.

Only attributed response usage is authoritative. Legacy cumulative events are
preserved but never added. Missing identity, boundaries, fields, or reconciliation
produce partial/not_provided rather than guessed values.
"""
import argparse
import copy
import csv
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import time

FIELDS = ("input_tokens", "cached_input_tokens", "cache_write_input_tokens", "output_tokens", "reasoning_output_tokens", "total_tokens")
MARKER = re.compile(r"^\[\[WF6:(S[0-7]):(START|CONTINUE)\]\]$")
END = re.compile(r"\[\[WF6:(S[0-7]):END\]\]\s*$")

def now():
    return dt.datetime.now(dt.timezone.utc).isoformat()

def read_log(path):
    records, issues, offset = [], [], 0
    if not path.exists():
        return [], ["Provider source is unavailable."]
    lines = path.read_bytes().splitlines(keepends=True)
    for number, line in enumerate(lines, 1):
        try:
            if not line.endswith(b"\n"):
                issues.append(f"Incomplete tail at line {number}; excluded.")
                break
            data = json.loads(line)
            records.append(dict(line=number, byte_offset=offset, record=data, source_log=str(path)))
        except (json.JSONDecodeError, UnicodeDecodeError):
            issues.append(f"Invalid JSON at line {number}; excluded.")
        offset += len(line)
    return records, issues

def payload(row):
    return row["record"].get("payload", {})

def text_of(pl):
    return "".join(c.get("text", "") for c in pl.get("content", []) if isinstance(c, dict) and c.get("type") in ("input_text", "output_text", "text"))

def locator(row):
    return {k:row[k] for k in ("source_log", "line", "byte_offset")}

def original_shell_commands(original_input):
    if not isinstance(original_input,str):return []
    candidates=[original_input]
    try:candidates.append(json.loads('"'+original_input.replace('\n','\\n').replace('\r','\\r')+'"'))
    except json.JSONDecodeError:pass
    for code in candidates:
        found=[]
        for match in re.finditer(r'\bcmd\s*:\s*("(?:\\.|[^"\\])*")',code):
            try:found.append(json.loads(match.group(1)))
            except json.JSONDecodeError:pass
        if found:return found
    return []

def turn_of(pl, fallback=None):
    return pl.get("turn_id") or pl.get("internal_chat_message_metadata_passthrough", {}).get("turn_id") or fallback

def valid_usage(data):
    return isinstance(data, dict) and all(isinstance(data.get(k), int) and not isinstance(data.get(k), bool) and data[k] >= 0 for k in FIELDS)

def sums(events):
    return {k:sum(payload(e).get("usage", {}).get(k, 0) for e in events)
            if all(isinstance(payload(e).get("usage", {}).get(k), int) for e in events) else None for k in FIELDS}

def redact(value):
    # Shareable copies are redacted; raw command streams remain outside Git.
    if isinstance(value, dict):
        return {k:("<redacted>" if re.search(r"^(password|passwd|authorization|cookie|set-cookie|access_token|refresh_token|api_key)$", k, re.I) else redact(v)) for k,v in value.items()}
    if isinstance(value, list):
        return [redact(v) for v in value]
    if isinstance(value, str):
        value = re.sub(r"(?i)\bBearer\s+[A-Za-z0-9._~+/=-]+", "Bearer <redacted>", value)
        value = re.sub(r"(?i)((?:password|passwd|access_token|refresh_token|api_key)\s*[=:]\s*)[^\s,;]+", r"\1<redacted>", value)
    return value

def analyze(records, config, read_issues=None):
    session = config["session_id"]
    issues = list(read_issues or [])
    metadata = [payload(r) for r in records if r["record"].get("type")=="session_meta"]
    if not metadata or metadata[0].get("id")!=session:
        issues.append("Session metadata missing or mismatched.")
    raw, unique, seen, users, finals, completions, visible, contexts = [], [], {}, [], [], [], [], []
    current_turn = None
    message_ids = {}
    for row in records:
        pl=payload(row); typ=row["record"].get("type")
        if typ=="event_msg" and pl.get("type")=="task_started":
            current_turn=turn_of(pl)
        if typ=="turn_context":
            current_turn=turn_of(pl, current_turn)
            contexts.append({**locator(row), **{k:pl.get(k) for k in ("turn_id","model","effort","approval_policy","sandbox_policy","cwd")}})
        if typ=="token_usage_record" or (typ=="event_msg" and pl.get("type")=="token_count"):
            raw.append({**locator(row),"timestamp":row["record"].get("timestamp"),"schema":typ if typ=="token_usage_record" else "legacy_token_count","payload":pl})
        if typ=="token_usage_record":
            if pl.get("session_id")!=session or pl.get("thread_id")!=session or not pl.get("turn_id") or not pl.get("response_id"):
                issues.append(f"Foreign or unattributed usage at line {row['line']}; excluded.")
                continue
            key=(session,pl["response_id"])
            if key in seen:
                if seen[key]!=pl:issues.append(f"Conflicting response duplicate at line {row['line']}.")
                continue
            seen[key]=copy.deepcopy(pl);unique.append(row)
        if typ=="response_item":
            role=pl.get("role");item_type=pl.get("type")
            if item_type=="message" and role=="user":
                text=text_of(pl)
                if text.lstrip().startswith("<environment_context>"):
                    continue
                turn=turn_of(pl,current_turn)
                identity=pl.get("id")
                if identity in message_ids and identity is not None:
                    if message_ids[identity]!=text:issues.append("Conflicting duplicate user identity.")
                    continue
                if identity:message_ids[identity]=text
                users.append(dict(row=row,text=text,turn_id=turn,message_id=identity))
                visible.append({**locator(row),"turn_id":turn,"kind":"user","message_id":identity,"text":text})
            elif item_type=="message" and role=="assistant" and pl.get("phase") in ("commentary","final_answer","final"):
                turn=turn_of(pl,current_turn)
                visible.append({**locator(row),"turn_id":turn,"kind":"assistant","phase":pl.get("phase"),"text":text_of(pl)})
                if pl.get("phase") in ("final_answer","final"):
                    finals.append(dict(row=row,text=text_of(pl),turn_id=turn))
            elif item_type in ("function_call","function_call_output","custom_tool_call","custom_tool_call_output","web_search_call"):
                visible.append({**locator(row),"timestamp":row["record"].get("timestamp"),"turn_id":current_turn,"kind":"tool","payload":pl})
        if typ=="event_msg" and pl.get("type")=="task_complete":
            completions.append(dict(row=row,turn_id=turn_of(pl,current_turn)))
    # Reconcile cumulative counters with unique per-response values in event order.
    previous=None;turn_totals={}
    for event in unique:
        pl=payload(event);u=pl.get("usage",{});turn=pl["turn_id"]
        if not valid_usage(u):issues.append(f"Missing/invalid usage fields at line {event['line']}.")
        if valid_usage(u):
            if u["total_tokens"]!=u["input_tokens"]+u["output_tokens"] or u["cached_input_tokens"]>u["input_tokens"] or u["reasoning_output_tokens"]>u["output_tokens"]:
                issues.append(f"Usage subset/total inconsistency at line {event['line']}.")
        cumulative=pl.get("thread_token_usage",{})
        if previous is not None:
            before=payload(previous).get("thread_token_usage",{})
            for k in FIELDS:
                if all(isinstance(d.get(k),int) for d in (before,cumulative,u)) and cumulative[k]-before[k]!=u[k]:
                    issues.append(f"Counter reset/gap/inconsistency at line {event['line']}, field {k}; negative deltas are not clamped.")
        previous=event
        turn_totals.setdefault(turn,[]).append(event)
        provided=pl.get("turn_token_usage",{})
        calculated=sums(turn_totals[turn])
        if not valid_usage(provided) or any(calculated[k]!=provided.get(k) for k in FIELDS):
            issues.append(f"Turn counter reconciliation failed at line {event['line']}.")
    boundaries=[];stage_segments={f"S{i}":[] for i in range(8)};stage_issues={f"S{i}":[] for i in range(8)}
    for user in users:
        first=user["text"].splitlines()[0] if user["text"].splitlines() else ""
        match=MARKER.fullmatch(first)
        registered=[item for item in config.get("natural_requests",[]) if item.get("user_message_id")==user["message_id"]]
        if match:
            stage,action=match.groups()
        elif registered:
            item=registered[0]
            if item.get("actual_prompt")!=user["text"] or item.get("turn_id")!=user["turn_id"] or item.get("line")!=user["row"]["line"]:
                issues.append("Registered natural-language request identity/text/line mismatch.")
                continue
            stage=item["stage_id"];action=item.get("action","NATURAL_START")
        else:continue
        if user["row"]["line"]<config["start_line"]:continue
        if user["row"]["line"]==config["start_line"] and (user["turn_id"]!=config.get("initial_turn_id") or user["message_id"]!=config.get("user_message_id")):
            stage_issues[stage].append("Initial request identity disagrees with verified tracking configuration.")
        if not user["turn_id"]:
            stage_issues[stage].append("Missing request turn identity.")
        existing=stage_segments[stage]
        if action in ("START","NATURAL_START") and existing:
            stage_issues[stage].append("Repeated START requires explicit classification; earlier segments are preserved.")
        if action=="CONTINUE" and not existing:
            stage_issues[stage].append("CONTINUE has no initial START in this source.")
        if any(s["turn_id"]==user["turn_id"] for s in existing):
            stage_issues[stage].append("Multiple request boundaries in one turn are ambiguous; no overlapping sum.")
            continue
        boundary={**locator(user["row"]),"stage_id":stage,"action":action,"session_id":session,
                  "turn_id":user["turn_id"],"user_message_id":user["message_id"],"actual_prompt":user["text"],
                  "timestamp":user["row"]["record"].get("timestamp")}
        boundaries.append(boundary)
        existing.append({"boundary":boundary,"turn_id":user["turn_id"],"request_line":user["row"]["line"]})
    if not stage_segments["S0"]:
        issues.append("Authorized initial request is absent from the available source; retained from verified tracking configuration.")
        boundary=dict(stage_id="S0",action="START",session_id=session,turn_id=config.get("initial_turn_id"),
            source_log=config["source_log"],line=config["start_line"],byte_offset=config.get("start_byte_offset"),
            user_message_id=config.get("user_message_id"),actual_prompt=config.get("actual_prompt"),
            evidence_origin="Previously verified tracking configuration; not reconstructed as a new provider event.")
        boundaries.append(boundary)
        stage_segments["S0"].append(dict(boundary=boundary,turn_id=config.get("initial_turn_id"),request_line=config["start_line"]))
    claimed_turns={s["turn_id"] for segs in stage_segments.values() for s in segs}
    for turn in claimed_turns:
        owners=[stage for stage,segs in stage_segments.items() if any(s["turn_id"]==turn for s in segs)]
        if len(owners)>1:
            for stage in owners:stage_issues[stage].append("One turn is claimed by multiple stages; no exact aggregate is permitted.")
    stages=[]
    for stage,segs in stage_segments.items():
        notes=list(issues)+stage_issues[stage]
        exported=[];all_events=[];final_included=bool(segs)
        for seg in segs:
            turn=seg["turn_id"];start=seg["request_line"]
            events=[e for e in unique if payload(e)["turn_id"]==turn and e["line"]>start]
            before=[e for e in unique if e["line"]<start]
            start_event=before[-1] if before else None
            if start_event is None:notes.append("No verified pre-request cumulative boundary; zero is not assumed.")
            matching=[f for f in finals if f["turn_id"]==turn and END.search(f["text"]) and END.search(f["text"]).group(1)==stage]
            final=matching[-1] if matching else None
            after_final=[e for e in events if final and e["line"]>final["row"]["line"]]
            complete=[c for c in completions if c["turn_id"]==turn and final and c["row"]["line"]>final["row"]["line"]]
            closed=bool(final and after_final and complete)
            if closed:
                end_line=complete[-1]["row"]["line"]
                late=[e for e in events if e["line"]>end_line]
                if late:notes.append("Attributed late usage arrived after task completion; retained, closure requires reconciliation.")
            # Final-reply coverage refers to the latest segment, independently of
            # uncertain completeness in a preceding interrupted segment.
            if seg is segs[-1]:final_included=closed
            elif not closed:notes.append("Earlier interrupted segment has no final END/completion; provider completeness is not certified. Known attributed usage retained, missing amount unknown.")
            if start_event and events:
                a=payload(start_event).get("thread_token_usage",{});b=payload(events[-1]).get("thread_token_usage",{})
                delta={k:b[k]-a[k] if isinstance(a.get(k),int) and isinstance(b.get(k),int) else None for k in FIELDS}
                interleaved=[e for e in unique if start<e["line"]<=events[-1]["line"] and payload(e)["turn_id"]!=turn]
                if interleaved:
                    notes.append("Interleaved/late foreign-turn usage in segment; per-response attribution used, cumulative boundary is not an uncontaminated stage delta.")
                if not interleaved and any(delta[k]!=sums(events)[k] for k in FIELDS):notes.append("Segment cumulative difference disagrees with unique responses.")
            else:delta={k:None for k in FIELDS}
            def event_export(e):
                return None if e is None else {**locator(e),"timestamp":e["record"].get("timestamp"),"payload":payload(e)}
            exported.append(dict(session_id=session,turn_id=turn,boundary=seg["boundary"],start_event=event_export(start_event),
                end_event=event_export(events[-1]) if events else None,cumulative_delta=delta,usage=sums(events) if events else {k:None for k in FIELDS},
                response_ids=[payload(e)["response_id"] for e in events],final_reply_included=closed,
                final_event=locator(final["row"]) if final else None,complete_event=locator(complete[-1]["row"]) if complete else None))
            all_events.extend(events)
        known=sums(all_events) if all_events else {k:None for k in FIELDS}
        status="not_executed" if not segs else "not_provided" if not all_events else "partial" if notes else "exact_reported" if final_included else "provisional"
        stages.append(dict(stage_id=stage,status=status,session_id=session,turn_ids=[s["turn_id"] for s in segs],segments=exported,
            **(known if status in ("provisional","exact_reported") else {k:None for k in FIELDS}),known_partial_usage=known,
            final_reply_included=final_included,source_log=config["source_log"],coverage_notes=sorted(set(notes)) if segs else ["No actual execution request."],
            cost=None,cache_write_semantics="Observed separately; not added to total."))
    prep_events=[e for e in unique if e["line"]<config["start_line"]]
    extra_events=[e for e in unique if e["line"]>=config["start_line"] and payload(e)["turn_id"] not in claimed_turns]
    def external(events,label):
        return dict(category=label,status="partial" if issues or label=="preparation" else "provisional",known_usage=sums(events) if events else {k:None for k in FIELDS},
            turn_ids=sorted({payload(e)["turn_id"] for e in events}),response_ids=[payload(e)["response_id"] for e in events],
            coverage_notes=issues+(["First cumulative boundary is unavailable; measured response sums are known only. Final preparation reply is present in the source."] if label=="preparation" else []))
    return dict(stages=stages,boundaries=boundaries,raw=raw,visible=visible,contexts=contexts,
                preparation=external(prep_events,"preparation"),extra_discussion=external(extra_events,"extra_discussion"),issues=sorted(set(issues)))

def write_json(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n")

def write_lines(path,rows):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text("".join(json.dumps(row,ensure_ascii=False)+"\n" for row in rows))

def reconcile_index(evidence):
    index=evidence/"EVIDENCE_INDEX.md"
    failures=[]
    if not index.exists():return ["EVIDENCE_INDEX.md is missing."]
    for link in re.findall(r"\]\(([^)]+)\)",index.read_text()):
        if not re.match(r"https?://",link) and not (evidence/link.split("#")[0]).exists():failures.append(link)
    return failures

def manifest(evidence):
    rows=[]
    for file in sorted(evidence.rglob("*")):
        if file.is_file() and file.name!="evidence-manifest.json":
            data=file.read_bytes();rows.append(dict(path=str(file.relative_to(evidence)),bytes=len(data),sha256=hashlib.sha256(data).hexdigest()))
    write_json(evidence/"evidence-manifest.json",dict(updated_utc=now(),self_included=False,files=rows))

def collect(config_path):
    config=json.loads(config_path.read_text());evidence=config_path.parent.parent
    records,issues=read_log(Path(config["source_log"]))
    result=analyze(records,config,issues)
    archive=evidence/"usage/exports";archive.mkdir(exist_ok=True)
    previous=evidence/"usage/usage-ledger.json"
    if previous.exists():
        old=previous.read_bytes();digest=hashlib.sha256(old).hexdigest()
        path=archive/(digest+".json")
        if not path.exists():path.write_bytes(old)
    write_lines(evidence/"usage/raw-token-events.jsonl",result["raw"])
    write_lines(evidence/"usage/stage-boundaries.jsonl",result["boundaries"])
    write_json(evidence/"usage/session-schema.json",dict(source=config["source_log"],session_id=config["session_id"],contexts=result["contexts"],
        authoritative_schema="token_usage_record: session_id/thread_id/turn_id/response_id, usage, turn_token_usage, thread_token_usage",
        legacy_policy="Preserved token_count events never contribute to totals.",issues=result["issues"]))
    ledger=dict(run_id=config["run_id"],updated_utc=now(),stages=result["stages"],preparation=result["preparation"],extra_discussion=result["extra_discussion"],
        old_run=dict(path=str(Path(config["workspace_root"])/"wf6-evidence"),policy="Historical record only; untouched and excluded from new-run sums."),
        migration_troubleshooting=dict(status="not_provided",tokens=None,source="User handoff summary; no original desktop transcript imported."))
    categories={}
    for label,stage_ids in (("S0_setup",["S0"]),("S1_baseline",["S1"]),("S2_S6_experiment",[f"S{i}" for i in range(2,7)]),("S7_reporting",["S7"])):
        selected=[s for s in result["stages"] if s["stage_id"] in stage_ids and s["status"]!="not_executed"]
        known={k:sum(s["known_partial_usage"][k] for s in selected)
               if selected and all(s["known_partial_usage"].get(k) is not None for s in selected) else None for k in FIELDS}
        categories[label]=dict(stage_ids=stage_ids,status="not_executed" if not selected else "exact_reported" if all(s["status"]=="exact_reported" for s in selected) else "provisional" if all(s["status"] in ("exact_reported","provisional") for s in selected) else "partial",
            known_usage=known,missing_coverage=[s["stage_id"] for s in selected if s["status"] in ("partial","not_provided")],cost=None)
    ledger["categories"]=categories
    write_json(previous,ledger)
    names=["stage_id","status","session_id","turn_ids",*FIELDS,"final_reply_included","source_log","coverage_notes"]
    for target in (evidence/"usage/usage-ledger.csv",evidence/"usage-ledger.csv"):
        with target.open("w",newline="") as stream:
            writer=csv.DictWriter(stream,fieldnames=names);writer.writeheader()
            for row in result["stages"]:writer.writerow({k:json.dumps(row[k]) if isinstance(row[k],list) else row[k] for k in names})
    md=["# WF6 usage / 用量", "", "Total = input + output; cached and reasoning are subsets. Costs and human review time: not provided / 未提供.","",
        "| Step | Status | Input | Cached | Output | Reasoning | Total | Final reply |","|---|---|---:|---:|---:|---:|---:|---|"]
    for row in result["stages"]:
        folder=evidence/"steps"/row["stage_id"];folder.mkdir(parents=True,exist_ok=True)
        write_json(folder/"token-usage.json",row)
        selected=[v for v in result["visible"] if v.get("turn_id") in row["turn_ids"]]
        write_lines(folder/"visible-transcript.jsonl",redact(selected))
        if row["segments"]:
            write_json(folder/"transcript-coverage.json",dict(source=config["source_log"],turn_ids=row["turn_ids"],entry_count=len(selected),
                coverage="Available original user/visible assistant/tool items only. Analysis, system/developer instructions and environment injection are excluded. Tool source may contain supplied user instructions.",
                raw_stream_policy="Command stdout/stderr remain unchanged in logs; shareable transcript is redacted.",final_reply_included=row["final_reply_included"]))
        md.append("| {stage_id} | {status} | {input_tokens} | {cached_input_tokens} | {output_tokens} | {reasoning_output_tokens} | {total_tokens} | {final_reply_included} |".format(**row))
    write_lines(evidence/"usage/preparation-visible-transcript.jsonl",redact([v for v in result["visible"] if v["line"]<config["start_line"]]))
    claimed={turn for stage in result["stages"] for turn in stage["turn_ids"]}
    write_lines(evidence/"usage/extra-discussion-visible-transcript.jsonl",redact([v for v in result["visible"] if v["line"]>=config["start_line"] and v.get("turn_id") not in claimed]))
    md.extend(["","Preparation and extra discussion are separate in usage-ledger.json. Old run and desktop troubleshooting are not added to this run.",
        "初始化与额外讨论单列；旧 run 与桌面排障不并入本 run。","","Finalization requires END, matching subsequent attributed usage, task_complete, valid identities/boundaries and counter reconciliation. Stable file size is insufficient.",
        "最终封账需核实 END、后续对应 usage、task_complete、身份、边界与一致性；文件稳定不足以证明完整。"])
    (evidence/"usage/USAGE.md").write_text("\n".join(md)+"\n")
    # Export original visible tool events for every executed stage.
    for stage_row in result["stages"]:
        if not stage_row["segments"]:
            continue
        stage_folder=evidence/"steps"/stage_row["stage_id"]
        tools=[v for v in result["visible"] if v.get("turn_id") in stage_row["turn_ids"] and v["kind"]=="tool"]
        write_lines(stage_folder/"provider-tool-events.jsonl",redact(tools))
        # Preserve provider originals, including bootstrap orchestration and merged outputs.
        # Inner shell start/end times and separate streams are not fabricated.
        calls={}
        provider_commands=[]
        folder=stage_folder/"logs"
        folder.mkdir(exist_ok=True)
        for item in tools:
            pl=item["payload"];call_id=pl.get("call_id")
            if pl.get("type") in ("custom_tool_call","function_call"):
                calls[call_id]=item
            if pl.get("type") in ("custom_tool_call_output","function_call_output") and call_id in calls:
                call=calls[call_id];original=folder/("provider-"+re.sub(r"[^A-Za-z0-9_-]","_",str(call_id))+".json")
                write_json(original,dict(call=call,output=item))
                original_input=call["payload"].get("input",call["payload"].get("arguments"))
                shell_commands=original_shell_commands(original_input)
                inner_outputs=[]
                for block in pl.get("output",[]) if isinstance(pl.get("output"),list) else []:
                    try:
                        parsed=json.loads(block.get("text",""))
                        if isinstance(parsed,dict) and "output" in parsed:inner_outputs.append(parsed)
                    except json.JSONDecodeError:pass
                shells=[]
                for index,cmd in enumerate(shell_commands):
                    reported=inner_outputs[index] if len(inner_outputs)==len(shell_commands) else {}
                    merged=folder/("provider-"+re.sub(r"[^A-Za-z0-9_-]","_",str(call_id))+f"-shell-{index}.combined.log")
                    if reported:merged.write_text(reported["output"])
                    shells.append(dict(cmd=cmd,cwd=config["workspace_root"],exit_code=reported.get("exit_code"),
                        duration_seconds=reported.get("wall_time_seconds"),stdout=None,stderr=None,
                        combined_output=str(merged.relative_to(evidence)) if reported else None,
                        coverage="Original reported merged output only; UI truncation may be present. Exact shell UTC boundaries unavailable."))
                provider_commands.append(dict(kind="original_provider_orchestration",call_id=call_id,
                    tool_name=call["payload"].get("name"),original_input=original_input,shell_commands=shells,
                    source_call=locator(call),source_output=locator(item),cwd=config["workspace_root"],
                    raw_tool_record=str(original.relative_to(evidence)),stdout=None,stderr=None,start_utc=call.get("timestamp"),end_utc=item.get("timestamp"),
                    coverage="Exact provider tool input/output retained. Inner commands may have separate recorder events; nested timings and streams unavailable here remain null."))
        write_lines(stage_folder/"provider-command-events.jsonl",provider_commands)
    timing_fields=["category","stage_id","command_id","label","start_utc","end_utc","duration_seconds","exit_code","aggregation"]
    command_rows=[]
    for commands_path in sorted((evidence/"steps").glob("S[0-7]/commands.jsonl")):
        command_rows.extend(json.loads(line) for line in commands_path.read_text().splitlines())
    for preparation_commands in sorted((evidence/"preparation").glob("*/commands.jsonl")):
        command_rows.extend(json.loads(line) for line in preparation_commands.read_text().splitlines())
    with (evidence/"timing.csv").open("w",newline="") as stream:
        writer=csv.DictWriter(stream,fieldnames=timing_fields);writer.writeheader()
        for entry in command_rows:
            is_preparation=entry.get("category")=="extra_discussion/preparation"
            writer.writerow(dict(category=entry.get("category", "S1_baseline" if entry.get("stage_id")=="S1" else "S2_S6_experiment" if entry.get("stage_id") in [f'S{i}' for i in range(2,7)] else "S7_reporting" if entry.get("stage_id")=="S7" else "S0_setup"),stage_id=entry.get("preparation_id") if is_preparation else entry.get("stage_id","S0"),**{k:entry.get(k) for k in timing_fields if k not in ("category","stage_id","aggregation")},
                aggregation="Nested commands overlap orchestration; do not sum blindly."))
    write_json(evidence/"usage/index-validation.json",dict(timestamp=now(),missing_links=reconcile_index(evidence)))
    for row in result["stages"]:
        file=evidence/"steps"/row["stage_id"]/"result.md"
        if file.exists():
            original=file.read_text().split("<!-- WF6-USAGE -->")[0].rstrip()
            file.write_text(original+"\n\n<!-- WF6-USAGE -->\n## Provider usage / Provider 用量\n\n"+
                f"Status: {row['status']}; final_reply_included={row['final_reply_included']}\n\n"+
                " | ".join(f"{k}={row[k]}" for k in FIELDS)+"\n\nAuthoritative source: token-usage.json and ../../usage/usage-ledger.json. Values replace earlier exports, never add to them.\n")
    budget_path=evidence/'experiment-budget.json'
    if budget_path.exists():
        budget=json.loads(budget_path.read_text())
        for segment in budget['segments']:
            completed=[r for r in records if r['record'].get('type')=='event_msg' and payload(r).get('type')=='task_complete' and payload(r).get('turn_id')==segment['turn_id']]
            end=completed[-1]['record']['timestamp'] if completed else now()
            start_date=dt.datetime.fromisoformat(segment['start_utc'].replace('Z','+00:00'))
            end_date=dt.datetime.fromisoformat(end.replace('Z','+00:00'))
            segment.update(end_utc=end,elapsed_seconds=(end_date-start_date).total_seconds(),status='closed' if completed else 'provisional_active')
        budget['known_execution_seconds']=sum(s['elapsed_seconds'] for s in budget['segments'])
        budget['remaining_seconds']=budget['limit_seconds']-budget['known_execution_seconds']
        write_json(budget_path,budget)
    # S7 external report summaries follow verified accounting; committed snapshots stay unchanged.
    if (evidence/"steps/S7/audit.json").exists():
        from finish_s7 import sync_usage
        sync_usage()
        write_json(evidence/"usage/index-validation.json",dict(timestamp=now(),missing_links=reconcile_index(evidence)))
    manifest(evidence)
    return result

def main():
    parser=argparse.ArgumentParser();parser.add_argument("--config",type=Path,default=Path(__file__).with_name("tracking-config.json"))
    commands=parser.add_subparsers(dest="command",required=True)
    finalize=commands.add_parser("finalize");group=finalize.add_mutually_exclusive_group(required=True)
    group.add_argument("--stage",choices=[f"S{i}" for i in range(8)]);group.add_argument("--all",action="store_true")
    finalize.add_argument("--wait-seconds",type=float,default=0)
    args=parser.parse_args();deadline=time.monotonic()+min(max(args.wait_seconds,0),60)
    while True:
        result=collect(args.config)
        targets=[s for s in result["stages"] if (args.all and s["status"]!="not_executed") or s["stage_id"]==args.stage]
        if all(s["status"] in ("exact_reported","not_executed") for s in targets) or time.monotonic()>=deadline:break
        time.sleep(min(1,max(0,deadline-time.monotonic())))
    print(json.dumps({s["stage_id"]:{k:s[k] for k in ("status",*FIELDS,"final_reply_included","coverage_notes")} for s in targets},ensure_ascii=False,indent=2))

if __name__=="__main__":main()
