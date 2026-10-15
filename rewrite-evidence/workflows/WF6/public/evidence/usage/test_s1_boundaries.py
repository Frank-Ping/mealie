"""Verify natural S1 authorization and disjoint preparation accounting."""
import unittest
from collect_usage import analyze
from test_collect_usage import config,event,fixture,final,rows,usage,user

class S1BoundaryTests(unittest.TestCase):
    def test_interrupted_segment_does_not_hide_latest_reply_or_certify_exact(self):
        data=fixture()+[user('b','[[WF6:S1:START]]','b'),usage('b','br',2,115),
            event('event_msg',dict(type='turn_aborted',turn_id='b')),user('c','[[WF6:S1:CONTINUE]]','c'),
            usage('c','cr1',3,118),final('c','S1'),usage('c','cr2',4,122,7),event('event_msg',dict(type='task_complete',turn_id='c'))]
        result=analyze(rows(data),config())['stages'][1]
        self.assertEqual(result['status'],'partial')
        self.assertTrue(result['final_reply_included'])
        self.assertFalse(result['segments'][0]['final_reply_included'])
        self.assertEqual(result['known_partial_usage']['total_tokens'],9)

    def test_verified_natural_request_excludes_preparation(self):
        text="Measure only the unchanged S1 baseline."
        data=fixture()+[usage("P1","prep-only",19,132),user("b",text,"natural-s1"),usage("b","s1-r1",2,134),
            final("b","S1"),usage("b","s1-r2",3,137,5),event("event_msg",dict(type="task_complete",turn_id="b"))]
        cfg=config();cfg["natural_requests"]=[dict(stage_id="S1",user_message_id="natural-s1",actual_prompt=text,turn_id="b",line=9)]
        result=analyze(rows(data),cfg)
        self.assertEqual(result["stages"][0]["total_tokens"],13)
        self.assertEqual(result["stages"][1]["total_tokens"],5)
        self.assertEqual(result["stages"][1]["status"],"exact_reported")
        self.assertEqual(result["extra_discussion"]["known_usage"]["total_tokens"],19)
        self.assertEqual(result["stages"][1]["segments"][0]["boundary"]["action"],"NATURAL_START")

    def test_unregistered_natural_text_is_not_fabricated_marker(self):
        result=analyze(rows(fixture()+[user("b","Discuss a future S1 baseline.","discussion")]),config())
        self.assertEqual(result["stages"][1]["status"],"not_executed")
        self.assertEqual(len(result["boundaries"]),1)

if __name__=="__main__":unittest.main(verbosity=2)
