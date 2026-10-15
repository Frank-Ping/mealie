"""Audit existing WF6 evidence and create bilingual report material; no experiments."""
import csv, datetime as dt, hashlib, json, os, re, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]; E=ROOT/'wf6-evidence'; S=ROOT/'mealie-wf6-coexist'; V=ROOT/'mealie-wf6-evaluator'; D=S/'rewrite-evidence/workflows/WF6'; T=E/'steps/S7'
def now(): return dt.datetime.now(dt.timezone.utc).isoformat()
def read(p): return json.loads(p.read_text())
def write(p,x): p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def sha(p): return hashlib.sha256(os.readlink(p).encode() if p.is_symlink() else p.read_bytes()).hexdigest()
def git(repo,*args): return subprocess.check_output(['git','--no-optional-locks','-C',str(repo),*args],text=True).strip()
FIELDS=['input_tokens','cached_input_tokens','output_tokens','reasoning_output_tokens','total_tokens']
def usage_summary():
 l=read(E/'usage/usage-ledger.json'); rows=[]
 for label,key in [('Initialization / 初始化','preparation'),('Extra discussion + dependency preparation / 额外讨论及依赖准备','extra_discussion')]:
  r=l[key]; rows.append(dict(category=label,status=r['status'],known_usage=r['known_usage'],missing='Unknown first cumulative boundary' if key=='preparation' else 'Generic discussion export remains provisional; independently settled P1 is exact_reported. Same events, counted once.'))
 for key,r in l['categories'].items(): rows.append(dict(category=key,status=r['status'],known_usage=r['known_usage'],missing_coverage=r['missing_coverage']))
 p=read(E/'preparation/P1-audit-dependencies/token-usage.json')
 assert p['known_partial_usage']==l['extra_discussion']['known_usage']
 return dict(updated_utc=now(),rows=rows,preparation_P1_status=p['status'],P1_already_in_extra_discussion=True,monetary_cost=None,human_review_time=None,React_or_mixed_application_coverage=None,rule='Total=input+output; cached/reasoning are subsets. Known partial amounts are not exact totals. Old run and desktop troubleshooting are excluded; no aggregate claiming complete cost.')
def sync_usage():
 if not T.exists(): return
 summary=usage_summary();write(T/'usage-category-summary.json',summary)
 ledger=read(E/'usage/usage-ledger.json'); config=read(E/'usage/tracking-config.json')
 records=[json.loads(line) for line in Path(config['source_log']).read_text().splitlines()]
 completed={r.get('payload',{}).get('turn_id'):r['timestamp'] for r in records if r.get('type')=='event_msg' and r.get('payload',{}).get('type')=='task_complete'}
 timing=[]
 for stage in ledger['stages']:
  for seg in stage['segments']:
   start=seg['boundary']['timestamp'];end=completed.get(seg['turn_id'])
   elapsed=(dt.datetime.fromisoformat(end.replace('Z','+00:00'))-dt.datetime.fromisoformat(start.replace('Z','+00:00'))).total_seconds() if end else None
   timing.append(dict(category='S0_setup' if stage['stage_id']=='S0' else 'S1_baseline' if stage['stage_id']=='S1' else 'S7_reporting' if stage['stage_id']=='S7' else 'S2_S6_experiment',stage=stage['stage_id'],turn_id=seg['turn_id'],start_utc=start,end_utc=end,elapsed_seconds=elapsed,status='closed' if end else 'partial_interrupted' if stage['stage_id']=='S1' else 'provisional',note='Missing task completion stays null; current S7 final tail pending terminal.'))
 write(T/'stage-execution-timing.json',dict(updated_utc=now(),segments=timing,policy='Disjoint authorized request to task_complete intervals. Nested command timing not summed. S1 unknown interruption gap stays unknown. Preparation/extra discussion remain separately recorded in their own command/window records; no inferred human review time.',human_review_time=None))
 table=['| Category / 类别 | Status | Input | Cached | Output | Reasoning | Total known / 已知 |','|---|---|---:|---:|---:|---:|---:|']
 for r in summary['rows']: table.append('| '+r['category']+' | '+r['status']+' | '+' | '.join(str(r['known_usage'][k]) for k in FIELDS)+' |')
 text='\n'.join(table)+'\n\nS1 total remains unknown; 30,308,626 is known usage only. Initialization has an unknown first boundary. P1 12,126,907 is already included in extra discussion and must not be added twice. S7 is provisional until its final reply is provider-covered.\nS1 总量未知，已知量不是完整总量；初始化首边界缺失；P1 已含于额外讨论，不另加；S7 最终回复需终端结算。\n'
 (T/'USAGE-SUMMARY.md').write_text(text)
 for name in ['WF6-RESULTS.md','WF6-REPORT-MATERIAL.md']:
  p=E/name
  if p.exists(): p.write_text(p.read_text().split('<!-- S7-LIVE-USAGE -->')[0].rstrip()+'\n\n<!-- S7-LIVE-USAGE -->\n## Usage snapshot / 用量快照\n\n'+text)
 return text

def audit():
 T.mkdir(exist_ok=True)
 ledger=read(E/'usage/usage-ledger.json'); s6=ledger['stages'][6];assert s6['status']=='exact_reported' and s6['final_reply_included'] and len(s6['segments'])==4
 budget=read(E/'experiment-budget.json');assert all(x['status']=='closed' for x in budget['segments']);assert budget['remaining_seconds']>=0
 write(T/'S6-final-settlement.json',dict(timestamp=now(),S6=s6,budget=budget,scope='Four disjoint segments, final replies and task completion verified by collector; no overlap with S7.'))
 stages=[];required=['[REDACTED]','visible-transcript.jsonl','commands.jsonl','logs','source-state.json','diff.patch','file-manifest.json','attempts.jsonl','result.md','token-usage.json']
 for n in range(7):
  f=E/'steps'/f'S{n}';missing=[k for k in required if not (f/k).exists()];state=read(f/'source-state.json');result=(f/'result.md').read_text();shas=re.findall(r'`([0-9a-f]{40})`',result)
  for h in shas: git(V if h=='758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d' else S,'cat-file','-e',h+'^{commit}')
  cmds=[json.loads(line) for line in (f/'commands.jsonl').read_text().splitlines()];paths=[str((E/c[k]).relative_to(E)) for c in cmds for k in ['stdout','stderr'] if c.get(k)]
  assert all((E/p).exists() for p in paths)
  stages.append(dict(stage=f'S{n}',missing_required=missing,result_sha256=sha(f/'result.md'),commits_verified=shas,command_count=len(cmds),raw_command_streams_verified=len(paths),source_state=state,usage_status=ledger['stages'][n]['status'],transcript_coverage=read(f/'transcript-coverage.json')))
 assert not any(x['missing_required'] for x in stages)
 original=read(E/'steps/S0/file-manifest.json');frozen={}
 contract='rewrite-evidence/workflows/WF6/WF6-CONTRACT.md'
 for role,repo in [('source',S),('evaluator',V)]:
  rows=[r for r in original[role] if not(role=='source' and r['path']==contract)];bad=[r['path'] for r in rows if sha(repo/r['path'])!=r['sha256']];assert not bad
  frozen[role]=dict(verified=len(rows),mismatches=bad,head=git(repo,'rev-parse','HEAD'),status=git(repo,'status','--porcelain=v1'),remotes=git(repo,'remote','-v'))
 assert not frozen['evaluator']['status'] and not frozen['source']['status'];assert not frozen['source']['remotes'] and not frozen['evaluator']['remotes']
 assert (S/contract).read_bytes().startswith(subprocess.check_output(['git','-C',str(S),'show','1d4f20c48d630474906b822c08fc713ec0234de2:'+contract]))
 c3=E/'steps/S6/continuation-03';build=read(c3/'build-artifacts.json');verified_builds={}
 for role in ['react','vue']:
  b=build[role];bad=[r['path'] for r in b['files'] if sha(Path(b['served_path'])/r['path'])!=r['sha256']];assert not bad;verified_builds[role]=dict(hash=b['build_hash'],files=len(b['files']),mismatches=bad,command_id=b['command_id'],policy='Fresh React; successful prior Vue reused with exact byte verification')
 for r in build['react_source_files']:assert sha(S/r['path'])==r['sha256']
 served=read(c3/'served-build.json')
 for path,key in [('wf6/gateway.mjs','gateway_sha256'),('wf6/route-map.json','route_map_sha256'),('wf6/route-policy.mjs','route_policy_sha256')]:assert sha(S/path)==served[key]
 proof=[json.loads(x) for x in (c3/'browser/persistence-redacted.jsonl').read_text().splitlines()];receipt=[r for r in proof if r.get('test')=='real_comment_persistence'][0];assert receipt['actualPOST']==201 and receipt['actualGET']==200 and receipt['sameServerRecordAfterRefresh'] and receipt['successfulWriteCount']==1
 full=read(c3/'full-regression-summary.json');assert all(full['gate_checks'].values()) and not full['runner_errors']
 c2=read(E/'steps/S6/continuation-02/repair-budget.json');c3cap=read(c3/'repair-budget.json');assert c2['used']==2 and c2['limit']==2 and c3cap['used']==3 and c3cap['limit']==3
 old=read(E/'steps/S6/full-regression-summary.json');old2=read(E/'steps/S6/continuation-02/remaining-failure-audit.json')
 # Check every archived evidence byte in the current manifest. Dynamic accounting/result footers are explicit updates.
 manifest=read(E/'evidence-manifest.json');mismatch=[]
 for r in manifest['files']:
  p=E/r['path']
  if not p.exists() or sha(p)!=r['sha256']:mismatch.append(r['path'])
 write(T/'audit.json',dict(timestamp=now(),stages=stages,frozen=frozen,contract_append_authorized=True,builds=verified_builds,served=served,live_persistence=receipt,full_regression_gate=full['gate_checks'],old_S6_gate=old.get('gate_checks'),old_C2_failure_audit=old2,repair_limits=dict(prior=c2,current=c3cap),manifest_pre_audit_mismatches=mismatch,manifest_note='Recorder writes its stdout and command after collector manifest: expected dynamic entries must be checked in final regenerated manifest. No old raw failure evidence is overwritten.',limitations=['S1 interrupted segment has unknown usage gap','Initialization first cumulative boundary unavailable','Full ancestor history unavailable behind declared shallow roots','Bootstrap separate streams/UTC may be unavailable','Only available visible transcript, no hidden instructions/reasoning','Production, React/mixed coverage and review duration not provided']))
 print(json.dumps(dict(stage_audits=7,frozen=frozen,builds=verified_builds,manifest_pre_audit_mismatches=mismatch,live_persistence=receipt,full_gate=full['gate_checks']),ensure_ascii=False))
 return stages,budget,served

if __name__=='__main__':
 stages,budget,served=audit()
 # Preserve the actual user message from the provider-backed visible transcript, without reconstruction.
 visible=[json.loads(x) for x in (T/'visible-transcript.jsonl').read_text().splitlines()]
 users=[x for x in visible if x['kind']=='user'];write(T/'request-boundary.json',users)
 (T/'[REDACTED]').write_text('\n'.join(x['text'] for x in users)+'\n')
 summary=sync_usage()
 results='''# WF6 Results / WF6 结果

Run: wf6-rerun-20261014-01. Latest experiment gate **S6 PASS after explicitly authorized repair 3/3**. S7 audits existing evidence; no new application features, builds, browser experiments or evaluator changes.
本 run 最新实验 gate 为 **S6 PASS，来自明确授权的第三轮修复**；S7 仅审计整理，未增加功能或实验。旧 FAIL 及用尽 2/2 记录保持有效历史。

## Approach / 方法

One serial implementation agent implemented route-level coexistence at one same-origin gateway. Only authenticated configured-group list/detail templates are React-owned; shared route policy, full-document cross-framework navigation and an explicit all-Vue switch preserve retained Vue behavior. Vite/React19/strict TypeScript/Router/MUI/react-i18next were used. No other workflow implementation was copied. Frozen original Vue `4b9ca06b6581f7152e164ea0fd9d4da366975a79` and evaluator `758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d` were independently imported and object/tree/blob/file-verified. Missing Git parents were retained as failures, resolved only by declaring shallow snapshot boundaries, not by restoring ancestry or claiming upstream authenticity.
单代理串行、同源入口按路由共存，共用边界规则、整页跨框架导航、显式开关全 Vue；未复制其他 workflow 实现。冻结快照验证不等于完整祖先历史或 upstream 真实性。[Source provenance](steps/S0/input-provenance.json), [contract](../mealie-wf6-coexist/rewrite-evidence/workflows/WF6/WF6-CONTRACT.md).

## What happened / 实际发生

| Step | Actual measured result / 实测 | Evidence / 证据 |
|---|---|---|
| S0 | Snapshot/isolation/accounting gate PASS; unavailable Node/uv/socket originally recorded / 准备通过但缺依赖与 socket 权限原记录保留 | [S0](steps/S0/result.md) |
| P1 preparation | Native Linux dependencies and bounded socket/browser permissions prepared; separate accounting / 独立依赖准备 | [P1](preparation/P1-audit-dependencies/result.md) |
| S1 | Fresh frozen Vue build; 517/517 units, lint521 files clean; accepted66/66 routes15/15 flows1/1guard. Mounted first run66route+14flow failures and interrupted72-entry attempt retained. Types318 FAIL; usagepartial / 原生重测通过，类型失败和中断保留 | [S1](steps/S1/result.md), [types difference](steps/S1/type-history-comparison.md) |
| S2 | All-Vue same-origin gateway real browser PASS, transport fixtures separate / 全 Vue 网关通过 | [S2](steps/S2/result.md) |
| S3 | Minimal skeleton4/4 real-browser bidirectional/session/boundary checks; policy34/34 / 最小共存通过 | [S3](steps/S3/result.md) |
| S4 | Real list/search/details; frozen4/4, supplement3/3, business units8/8; shared source repairs0/2 / 真实切片通过 | [S4](steps/S4/result.md) |
| S5 | Frozen4/4, supplement8/8; expected negative detected then restored. Two harness repair rounds consumed, all original failures retained / 用户路径与负例通过，两轮 harness 修复保留 | [S5](steps/S5/result.md), [negative](steps/S5/detection-negative.json) |
| S6 original | Rollback PASS; restored full66/66 routes11/15 flows1/1guard, four FAIL / 原四项失败 | [original](steps/S6/result.md), [raw full](steps/S6/browser/restored-frozen-results.json) |
| S6 C1 | Existing explicit Vue recovery4/4; does not replace original frozen FAIL / 显式 Vue 功能恢复不替代原失败 | [C1](steps/S6/continuation-01/result.md) |
| S6 C2 | Explicit limited scope extension; round1 GET UUID/slug500; round2 refreshFAIL with no actualPOST; cap2/2 exhausted / 范围授权后两轮用尽仍失败 | [C2](steps/S6/continuation-02/result.md), [trace audit](steps/S6/continuation-02/remaining-failure-audit.json) |
| S6 C3 | User authorizes exactly third round; freshReactbuild/static then originalcomment1/1, live persistence1/1, four original4/4, restored supplement4/4, full82/82; explicit rollback supplement1/1 and original4/4 / 第三轮真实持久化及完整回归通过 | [C3](steps/S6/continuation-03/result.md), [full raw](steps/S6/continuation-03/browser/restored-frozen-results.json) |

### Final ownership / 最终归属

React: configured-group list/search/links and read-only recipe name/ingredients/steps/tools/categories/tags, loading/empty/error; user-authorized real Logout, self-role Settings navigation, and comments read/create/persistence. Anonymous/verified401 deliberately enter Vue login; resource/network/5xx failures remain visible. Real comments retain identity/group/household and disabled-comment checks. Draft/pending/server-published states are separate.
React 实际实现以上食谱切片、真实退出、基于 self 的设置菜单导航和评论读写持久化；认证交接明确，资源错误不静默回退。

Vue: login/register/password recovery, recipe creation/edit/delete/parse/cook, shopping lists, meal plans, data management, household and admin settings pages, public/shared/other-group pages and remaining advanced functions. React Settings links are real links into Vue; **settings pages are not React migrations**. Comments edit/delete, full Markdown/unit-conversion/localization parity and multi-page pagination acceptance remain unverified/unmigrated.
Vue 保留上述功能；React 设置菜单不等于 React 设置页，评论编辑删除及完整等价仍未验证。[Feature inventory](steps/S6/continuation-03/feature-inventory.csv), [route ownership](steps/S6/continuation-03/route-ownership.csv).

Full mixed-app result is **66/66 routes,15/15 flows,1/1guard**, retries0,skip/flaky0. Requested-document ownership is64Vue/2React, with root Vue→React transition. Repeated targeted tests are not added coverage or 66 migrated React pages. React/Vue/mixed/boundary/fallback/detection evidence has separate attribution in S5 and S6.
完整成绩是混合应用，非 66 个 React 页面；重复选择不增加 coverage。[Full inventory](steps/S6/continuation-03/browser/restored-frozen-inventory.json), [full summary](steps/S6/continuation-03/full-regression-summary.json).

### Durable comment / 评论持久化

Independent browser observed actual POST201 and refresh GET200 containing the exact same server comment ID `6f8d35ec-decc-4970-ba9d-63939357d526`, recipe/user/text, with successfulWriteCount1. Published region contains server-saved records only. Separately labelled injectedPOST500 proves draft restoration and error handling; it is not a synthetic successful persistence result. Unit receipts and draft text never count as backend durability.
真实 POST201 与刷新 GET200 是同一记录；注入 500 单列失败状态，草稿与单测不算持久化。[Credential-free proof](steps/S6/continuation-03/browser/persistence-redacted.jsonl), [original browser report](steps/S6/continuation-03/browser/persistence-results.json), [trace inventory](steps/S6/continuation-03/browser-manifest.json).

### Commits and builds / 提交与构建

Scope amendment `8cbba16f7b4d54e1d1c476814583197a3a40e253`; round1 `ab032949b1375e01037842331894f72309dd80f0`; round2 `c5f765adea3c1967d3e6326f9f328360831ab0c8`; exhaustedFAIL record `61d16716ac2699e68af20e9854aba9ca8daa00e6`; authorizedround3 implementation `6931fbd4c50cd17b0475424e01059ced5b183cfe`; accepted evidence `06569c09ec71e75d4ecf066f0b3b5aada4da1728`. [Verified commit ledger](steps/S7/commits.json), [source audit](steps/S7/audit.json).
范围、失败修复和验收分别保留提交；最新报告提交仅文档，不改变验收应用字节。

Final React source/build and Vue build SHA256 are in [served provenance](steps/S6/continuation-03/served-build.json). React freshbuild `dc187e2077b85fabe9738cc4b275ec6e19ba28d668c7c2393db095c7425d4b49`; Vue `d5c6a8cc2db26452bcfb5d563b8a6a105303cffbf0c234a2ff846350c03d8d6c` is explicitly reused from successful C2-R2 generation with all bytes reverified; not a new Vue generation. Frozen evaluator1789 and source1710 historical files still match, with only explicitly authorized append-only contract exception. [Build manifests](steps/S6/continuation-03/build-artifacts.json).
新 React 与复用成功 Vue build 归属明确；后端/evaluator/原 Vue/类型/locale 未改，契约追加为已授权文档例外。

## Why / 原因

Coexistence preserves existing Vue user paths while introducing a small actual React slice, but boundary/auth/asset ownership need independent checks. Original full suite exposed direct Logout/Settings/comment expectations absent from the read-only pilot. Existing Vue links restored the user operations but could not satisfy original direct-control assertions. Human authorization then changed the functional contract; PASS belongs to the amended scope and third-round limit, not the original read-only/two-round plan.
共存保留旧路径，但边界会话需要额外验收；四项原失败揭示只读范围与冻结直接控件流程不一致。用户明确扩展才实现，最终 PASS 不能改写原范围及两轮失败。

The first comment repair used recipe UUID where frozen GET expects slug, causing actual500. Round2 corrected the endpoint but text visibility matched the draft; reload cancelled validation before POST. Round3 separated transient drafts from successful server records, making published visibility correspond to actual saved data. Trace/network evidence supports this sequence; S1 mounted/native difference diagnoses environment without establishing every filesystem/font contributor's causality. [C2 network audit](steps/S6/continuation-02/repair2-comment-network-audit.json), [C3 trace review](steps/S6/continuation-03/trace-review.json).
评论失败是 endpoint 语义和 UI 状态混淆；第三轮以服务端回执修正。S1 环境差异不能推断全部因果。

## What we would change / 下次调整

Specify pilot acceptance and retained Vue operations before implementation; keep evaluator expectations visible without weakening them. Model draft/pending/published state explicitly and verify real POST→refreshGET identity early. Parameterize browser origin/auth consistently, use native Linux runtime from baseline, and preserve direct negative/build provenance guards. Plan validation and reporting overhead within a realistic budget; use a separately verified collector/session boundary after interruption instead of guessing missing usage. Extend business domains only through separate authorization and evidence.
提前明确切片验收与 Vue 保留职责；尽早验证真实持久化；统一 origin/auth 与 Linux 原生目录；保留负例和 build 来源；为验证成本留预算，中断后验证计量来源而非补零。

### Time, cost and limitations / 时间成本与限制

S2–S6 closed model/tool execution: **10,646.301 seconds (177m26.301s)** of10800; remaining153.699s. S6 C3 ended09:40:04.473Z, including its final reply; between-turn intervals are excluded and not inferred human review time. S0/preparation/S1/S7 are separate. Nested command durations overlap and cannot be summed as execution cost. [Closed budget](experiment-budget.json), [command timing](timing.csv), [S6 settlement](steps/S7/S6-final-settlement.json).
实验预算未重置，最终尾部已计入；人工等待排除，不推测 review 时间，命令嵌套不盲目相加。

S1 usage remains **partial**, unknown interrupted gap; known30,308,626 total is not full total. Types **318 FAIL** vs historical315(+3), current-only10/history-only7 diagnostic lines, cause unestablished; history315 is not a new-run result. Initialization first cumulative boundary is missing. Old run and desktop migration troubleshooting are separate unavailable accounting, not imported. Only available visible transcript is exported; missing bootstrap separate streams/UTC remain null.
S1 与初始化缺口保留，不补零、不改 exact；旧 run 不并入新 run，逐字可见覆盖有明确限制。

Monetary cost, React/mixed-application coverage and human review duration: **not provided / 未提供**. S1 frozen Vitest coverage was actually provided: lines15.09%,statements15.1%,functions7.9%,branches12.89%, limited to frozen include/exclude scope; not React/mixed/whole-system coverage. No production deployment, long-lived OIDC parity or complete system rewrite is established. Contribution summary excludes this agentic rewrite.
已有 Vue baseline coverage 仅对应原配置，不推广；生产、全系统重写或长期认证等价未验证，Contribution summary 不含本实验。

WF6 differs structurally from WF3 staged full-target rewrite, WF4 parallel implementation and WF5 conversion automation through retained executable Vue and explicit route ownership/rollback. This is a mechanism comparison from the WF6 plan, not new measurements of those workflows; no other workflow implementation was inspected and no speed/cost superiority is claimed. [Plan](../../WF6-plan.md).
仅比较机制：复用可运行 Vue 与路由回退，不以小切片耗时证明优于整站/并行/自动转换。
'''
 (E/'WF6-RESULTS.md').write_text(results)
 material=results.replace('# WF6 Results / WF6 结果','# WF6 Report Material / WF6 报告素材',1)
 material+='\n\nReport integration: use Approach → What happened → Why → What we would change above, preserve both originalFAIL and amendedPASS, and cite raw traces/commits. Original Word reports were not edited.\n报告整合时保留原失败与范围变化，不修改原 Word，引用可定位证据。\n'
 (E/'WF6-REPORT-MATERIAL.md').write_text(material)
 sync_usage()
 write(T/'commits.json',[dict(sha=line.split(' ',1)[0],subject=line.split(' ',1)[1]) for line in git(S,'log','--format=%H %s').splitlines()])
 with (T/'attempts.jsonl').open('a') as stream:stream.write(json.dumps(dict(timestamp=now(),kind='evidence_audit',status='PASS',scope='Existing evidence only; initial audit-helper commit ownership error retained and corrected; no application change. Known accounting/source-history/coverage limits remain disclosed.'))+'\n')
 (T/'result.md').write_text('# S7 audit / S7 审计\n\nGate **PASS for evidence/report audit**, with disclosed partial accounting. No application experiment or feature added. S1 partial/unknown gap/318typeFAIL retained. S6 final covered exact, budget tail closed. S7 provisional, final_reply_included=false.\n审计与报告 gate 通过，计量缺口继续保留；S7 最终回复待终端结算。\n\n[Audit](audit.json), [S6 settlement](S6-final-settlement.json), [Results](../../WF6-RESULTS.md), [Report](../../WF6-REPORT-MATERIAL.md), [Usage](USAGE-SUMMARY.md).\n')
 index=E/'EVIDENCE_INDEX.md';existing=index.read_text();addition='\n## S7 audit and reports / S7 审计与报告\n\n- [Results](WF6-RESULTS.md)\n- [Report material](WF6-REPORT-MATERIAL.md)\n- [Audit](steps/S7/audit.json)\n- [S6 final settlement](steps/S7/S6-final-settlement.json)\n- [Usage category summary](steps/S7/USAGE-SUMMARY.md)\n- [S7 result](steps/S7/result.md)\n'
 if '## S7 audit and reports' not in existing:index.write_text(existing+addition)
 (E/'PROGRESS.md').write_text('# Latest: S7 evidence/report audit PASS / 最新 S7 审计通过\n\nS6 final PASS after explicit third-round authorization; S7 final usage pending external collector. S1 partial/318FAIL preserved. No new experiments.\nS6 最终通过，S7 用量待终端；旧失败及缺口保留。\n\n'+(E/'PROGRESS.md').read_text())
 for name in ['WF6-RESULTS.md','WF6-REPORT-MATERIAL.md']:
  # Checkout snapshot links point to external originals; terminal updates external summaries only.
  text=(E/name).read_text();text=re.sub(r'\]\(([^)]+)\)',lambda m: ']('+os.path.relpath((E/m.group(1)).resolve(),D)+')',text)
  (D/name).write_text(text+'\n\nCommitted report is a pre-final snapshot. Terminal collector updates external summaries/USAGE/manifests; no automatic Git commit.\n提交为回复前快照，终端更新外部用量摘要与 manifest，不自动提交。\n')
 (D/'EVIDENCE_INDEX.md').write_text('# WF6 evidence index / 证据索引\n\n[External complete index](../../../../wf6-evidence/EVIDENCE_INDEX.md)\n\n[Results](WF6-RESULTS.md) · [Report material](WF6-REPORT-MATERIAL.md) · [Audit](../../../../wf6-evidence/steps/S7/audit.json) · [Manifest](../../../../wf6-evidence/evidence-manifest.json) · [Usage](../../../../wf6-evidence/usage/USAGE.md)\n\nRaw logs/trace/usage remain outside checkout. Available transcript excludes hidden reasoning and system/developer instructions.\n原始证据在兄弟目录，不从 checkout 提交；缺失覆盖保留。\n')
 print('Bilingual report material and index created; no experiments executed.')
