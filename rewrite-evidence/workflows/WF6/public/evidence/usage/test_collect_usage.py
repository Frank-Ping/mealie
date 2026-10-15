"""Fault injection for independent accounting; no application success claims."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from collect_usage import analyze, read_log, redact, collect, original_shell_commands

SESSION="session-test"
SOURCE="fixture.jsonl"

def fields(n):
    return dict(input_tokens=n,cached_input_tokens=0,cache_write_input_tokens=0,output_tokens=0,reasoning_output_tokens=0,total_tokens=n)

def event(kind,pl):
    return dict(type=kind,payload=pl,timestamp="2026-10-14T00:00:00Z")

def usage(turn,rid,n,thread,turn_total=None,session=SESSION):
    return event("token_usage_record",dict(session_id=session,thread_id=session,turn_id=turn,response_id=rid,
        usage=fields(n),thread_token_usage=fields(thread),turn_token_usage=fields(n if turn_total is None else turn_total)))

def user(turn,text,identity):
    return event("response_item",dict(type="message",role="user",id=identity,content=[dict(type="input_text",text=text)],
        internal_chat_message_metadata_passthrough=dict(turn_id=turn)))

def final(turn,stage="S0"):
    return event("response_item",dict(type="message",role="assistant",phase="final_answer",turn_id=turn,
        content=[dict(type="output_text",text="Done. [[WF6:"+stage+":END]]")]))

def rows(data):
    return [dict(line=i,byte_offset=i*100,source_log=SOURCE,record=d) for i,d in enumerate(data,1)]

def fixture():
    return [event("session_meta",dict(id=SESSION)),usage("prep","p",100,100),user("a","[[WF6:S0:START]]\nRun S0.","u"),
        usage("a","r1",10,110),final("a"),usage("a","r2",3,113,13),event("event_msg",dict(type="task_complete",turn_id="a"))]

def config():
    return dict(session_id=SESSION,source_log=SOURCE,start_line=3,start_byte_offset=300,initial_turn_id="a",user_message_id="u",run_id="fixture",workspace_root="/fixture")

class AccountingTests(unittest.TestCase):
    def measure(self,data=None,cfg=None,issues=None):
        return analyze(rows(fixture() if data is None else data),config() if cfg is None else cfg,issues)

    def s0(self,result):return result["stages"][0]

    def test_exact_identity_boundary_final_and_consistency(self):
        s=self.s0(self.measure());self.assertEqual(s["status"],"exact_reported");self.assertEqual(s["total_tokens"],13)

    def test_preparation_excluded(self):
        r=self.measure();self.assertEqual(r["preparation"]["known_usage"]["total_tokens"],100);self.assertEqual(self.s0(r)["total_tokens"],13)

    def test_duplicate_response_not_added(self):
        data=fixture();data.insert(4,copy.deepcopy(data[3]));self.assertEqual(self.s0(self.measure(data))["total_tokens"],13)

    def test_conflicting_duplicate_is_partial(self):
        data=fixture();x=copy.deepcopy(data[3]);x["payload"]["usage"]=fields(11);data.insert(4,x)
        self.assertEqual(self.s0(self.measure(data))["status"],"partial")

    def test_legacy_counters_never_added(self):
        data=fixture();data.insert(4,event("event_msg",dict(type="token_count",info=dict(total_token_usage=fields(999999)))))
        self.assertEqual(self.s0(self.measure(data))["total_tokens"],13)

    def test_missing_field_remains_null(self):
        data=fixture();del data[3]["payload"]["usage"]["reasoning_output_tokens"]
        s=self.s0(self.measure(data));self.assertEqual(s["status"],"partial");self.assertIsNone(s["reasoning_output_tokens"])

    def test_counter_reset_not_clamped(self):
        data=fixture();data[3]["payload"]["thread_token_usage"]=fields(1)
        s=self.s0(self.measure(data));self.assertEqual(s["status"],"partial");self.assertTrue(any("reset" in n for n in s["coverage_notes"]))

    def test_missing_boundary_not_zero(self):
        data=fixture();data.pop(1);cfg=config();cfg["start_line"]=2
        self.assertEqual(self.s0(self.measure(data,cfg))["status"],"partial")

    def test_incomplete_tail_is_excluded(self):
        with tempfile.TemporaryDirectory() as folder:
            p=Path(folder)/"log";p.write_bytes(b'{"type":"session_meta","payload":{"id":"session-test"}}\n{"type":')
            r,notes=read_log(p);self.assertEqual(len(r),1);self.assertTrue(notes)

    def test_delayed_final_usage_is_provisional(self):
        self.assertEqual(self.s0(self.measure(fixture()[:5]))["status"],"provisional")

    def test_missing_task_complete_is_provisional(self):
        self.assertEqual(self.s0(self.measure(fixture()[:-1]))["status"],"provisional")

    def test_continue_uses_disjoint_segments(self):
        data=fixture()+[usage("discussion","d",7,120),user("b","[[WF6:S0:CONTINUE]]\nContinue.","u2"),
            usage("b","r3",5,125),final("b"),usage("b","r4",2,127,7),event("event_msg",dict(type="task_complete",turn_id="b"))]
        r=self.measure(data);s=self.s0(r);self.assertEqual(s["total_tokens"],20);self.assertEqual(len(s["segments"]),2)
        self.assertEqual(r["extra_discussion"]["known_usage"]["total_tokens"],7)

    def test_repeated_start_is_partial_and_preserved(self):
        data=fixture()+[user("b","[[WF6:S0:START]]\nAgain.","u2"),usage("b","r3",2,115)]
        s=self.s0(self.measure(data));self.assertEqual(s["status"],"partial");self.assertEqual(len(s["segments"]),2)

    def test_embedded_marker_is_not_a_request(self):
        data=fixture();data.insert(2,user("prep","Instructions include [[WF6:S0:START]] but do not start.","context"))
        cfg=config();cfg["start_line"]=4;self.assertEqual(len(self.measure(data,cfg)["boundaries"]),1)

    def test_duplicate_user_identity_deduplicated(self):
        data=fixture();data.insert(3,copy.deepcopy(data[2]));self.assertEqual(len(self.measure(data)["boundaries"]),1)

    def test_foreign_session_excluded_and_partial(self):
        data=fixture();data.insert(4,usage("fork","foreign",900,900,session="foreign"))
        s=self.s0(self.measure(data));self.assertEqual(s["status"],"partial");self.assertEqual(s["known_partial_usage"]["total_tokens"],13)

    def test_cross_turn_late_events_not_swallowed(self):
        data=fixture();data.insert(4,usage("prep","late",2,112,102));data[6]["payload"]["thread_token_usage"]=fields(115)
        s=self.s0(self.measure(data));self.assertEqual(s["status"],"partial");self.assertEqual(s["known_partial_usage"]["total_tokens"],13)

    def test_compaction_inherited_counter_gap_is_partial(self):
        data=fixture();data[3]["payload"]["thread_token_usage"]=fields(10010)
        self.assertEqual(self.s0(self.measure(data))["status"],"partial")

    def test_hidden_content_not_exported(self):
        data=fixture()+[event("response_item",dict(type="reasoning",summary=[dict(text="hidden")])),
            event("response_item",dict(type="message",role="developer",content=[dict(type="input_text",text="hidden instruction")])),
            event("response_item",dict(type="message",role="assistant",phase="analysis",content=[dict(type="output_text",text="hidden thought")]))]
        self.assertNotIn("hidden",json.dumps(self.measure(data)["visible"]))

    def test_missing_source_preserves_authorized_stage(self):
        s=self.s0(self.measure([],issues=["Provider source unavailable."]));self.assertEqual(s["status"],"not_provided")

    def test_unexecuted_is_not_zero(self):
        s=self.measure()["stages"][1];self.assertEqual(s["status"],"not_executed");self.assertIsNone(s["total_tokens"])

    def test_bearer_and_named_credentials_redacted(self):
        self.assertNotIn("[REDACTED]",str(redact({"authorization":"[REDACTED]","password":"[REDACTED]"})))

    def test_provider_original_shell_commands_recovered_without_execution(self):
        raw='text(await tools.exec_command({cmd:"pwd\\ncat AGENTS.md"}));'
        self.assertEqual(original_shell_commands(raw),['pwd\ncat AGENTS.md'])
        escaped=raw.replace('"','\\"').replace('\\n','\\\\n')
        self.assertEqual(original_shell_commands(escaped),['pwd\ncat AGENTS.md'])

    def test_export_replaces_current_total_and_preserves_history(self):
        with tempfile.TemporaryDirectory() as folder:
            ev=Path(folder)/"wf6-evidence";u=ev/"usage";u.mkdir(parents=True)
            p=Path(folder)/"fixture.jsonl";p.write_text("".join(json.dumps(d)+"\n" for d in fixture()))
            cfg=config();cfg.update(source_log=str(p),run_root=folder)
            cp=u/"tracking-config.json";cp.write_text(json.dumps(cfg));(ev/"EVIDENCE_INDEX.md").write_text("[Usage](usage/USAGE.md)\n")
            collect(cp);collect(cp)
            d=json.loads((u/"usage-ledger.json").read_text());self.assertEqual(d["stages"][0]["total_tokens"],13)
            self.assertTrue(list((u/"exports").glob("*.json")))
            manifest=json.loads((ev/"evidence-manifest.json").read_text());self.assertFalse(manifest["self_included"])
            self.assertNotIn("evidence-manifest.json",[f["path"] for f in manifest["files"]])

if __name__=="__main__":
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(AccountingTests)
    result=unittest.TextTestRunner(verbosity=2).run(suite)
    report=dict(scope="S0 accounting fault injection only",tests=result.testsRun,pass_count=result.testsRun-len(result.failures)-len(result.errors)-len(result.skipped),
        fail_count=len(result.failures),error_count=len(result.errors),skip_count=len(result.skipped),passed=result.wasSuccessful(),
        failures=[dict(test=str(t),trace=trace) for t,trace in result.failures+result.errors])
    if Path(__file__).with_name("tracking-config.json").exists():
        root=Path(__file__).resolve().parents[1]
        path=root/"steps/S0/collector-acceptance.json"
        if path.exists():
            previous=json.loads(path.read_text())
            if "cli_interfaces" in previous:report["cli_interfaces"]=previous["cli_interfaces"]
        path.write_text(json.dumps(report,indent=2)+"\n")
    raise SystemExit(0 if result.wasSuccessful() else 1)
