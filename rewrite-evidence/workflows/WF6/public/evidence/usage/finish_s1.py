"""Write bilingual S1 measurements from machine records; never infer unrun passes."""
import argparse
import datetime as dt
import hashlib
import json
import os
import subprocess
from pathlib import Path
from run_s1 import ROOT,EVIDENCE,SOURCE,EVALUATOR,STAGE,RUNTIME
from summarize_s1_browser import summarize

def write(path,data):
    path.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

def git(repo,*args):
    return subprocess.check_output(['git','--no-optional-locks','-C',str(repo),*args],text=True).strip()

def file_record(path,base):
    content=os.readlink(path).encode() if path.is_symlink() else path.read_bytes()
    return dict(path=str(path.relative_to(base)),bytes=len(content),sha256=hashlib.sha256(content).hexdigest(),symlink=path.is_symlink())

def source_snapshot():
    original=json.loads((EVIDENCE/'steps/S0/file-manifest.json').read_text())
    state=dict(snapshot_utc=dt.datetime.now(dt.timezone.utc).isoformat())
    manifest={}
    patches=[]
    for role,repo,pin in [('source',SOURCE,'4b9ca06b6581f7152e164ea0fd9d4da366975a79'),('evaluator',EVALUATOR,'758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d')]:
        mismatches=[]
        for item in original[role]:
            path=repo/item['path']
            content=os.readlink(path).encode() if path.is_symlink() else path.read_bytes() if path.is_file() else None
            if content is None or path.is_symlink()!=item.get('symlink',False) or hashlib.sha256(content).hexdigest()!=item['sha256']:
                mismatches.append(item['path'])
        assert not mismatches, 'Frozen tracked bytes changed: '+str(mismatches)
        untracked=git(repo,'ls-files','--others','--exclude-standard').splitlines()
        status=git(repo,'status','--porcelain=v1')
        state[role]=dict(path=str(repo),pinned_input_sha=pin,actual_head=git(repo,'rev-parse','HEAD'),dirty=bool(status),
            status_porcelain=status,untracked=untracked,remotes=git(repo,'remote','-v').splitlines(),
            frozen_manifest_verified=True,verified_original_file_count=len(original[role]),frozen_file_mismatches=mismatches,
            served_build=json.loads((STAGE/'build-artifact.json').read_text())['build_hash'])
        assert not state[role]['remotes']
        files=git(repo,'ls-files').splitlines()+untracked
        manifest[role]=[file_record(repo/name,repo) for name in sorted(set(files)) if (repo/name).is_file()]
        patches.append(f'# {role}: working diff against HEAD\n'+git(repo,'diff','--binary','HEAD'))
        patches.append(f'# {role}: tracked changes since frozen input\n'+git(repo,'diff','--binary',pin,'HEAD'))
    events=[json.loads(line) for line in (STAGE/'service-events.jsonl').read_text().splitlines()]
    started={e['command_id'] for e in events if e['event']=='owned_backend_started'}
    stopped={e['command_id'] for e in events if e['event']=='owned_backend_stopped'}
    assert started==stopped and started, 'Owned backend lifecycle is not closed.'
    auth=EVALUATOR/'frontend-e2e/.auth'
    state['runtime']=dict(auth_alias=str(auth),auth_real_path=str(auth.resolve()),
        auth_files=[file_record(p,auth.resolve()) for p in sorted(auth.resolve().rglob('*')) if p.is_file()],
        credential_contents_in_this_snapshot=False,services_stopped=True)
    state['runtime']['auth_attempts']=[dict(root=str(base),files=[file_record(p,base) for p in sorted(base.rglob('*')) if p.is_file()])
        for base in (RUNTIME/'auth',Path('/tmp/wf6-rerun-20261014-01-S1-native/auth'),Path('/tmp/wf6-rerun-20261014-01-S1-native2/auth')) if base.exists()]
    databases=[]
    for base in [RUNTIME/'disposable-data',Path('/tmp/wf6-rerun-20261014-01-S1-native/disposable-data'),Path('/tmp/wf6-rerun-20261014-01-S1-native2/disposable-data')]:
        if base.exists():
            databases.extend(dict(root=str(base),**file_record(p,base)) for p in sorted(base.rglob('*.db')) if p.is_file())
    state['runtime']['database_files']=databases
    write(STAGE/'source-state.json',state)
    write(STAGE/'file-manifest.json',dict(snapshot_utc=state['snapshot_utc'],**manifest))
    (STAGE/'diff.patch').write_text('\n\n'.join(patches)+'\n')
    return state

def results():
    attempts=[]
    for folder in ['browser','browser-native']:
        path=STAGE/folder/'results.json'
        assert path.exists(), 'Complete both browser measurements before declaring a gate.'
        item=summarize(path);item['attempt_id']=folder;attempts.append(item)
        write(STAGE/'machine'/(folder+'-summary.json'),item)
    latest=attempts[-1]
    build=json.loads((STAGE/'build-artifact.json').read_text())
    unit=json.loads((STAGE/'machine/unit-results.json').read_text())
    lint=json.loads((STAGE/'machine/lint-results.json').read_text())
    coverage=json.loads((STAGE/'coverage/coverage-summary.json').read_text())['total']
    types=json.loads((STAGE/'machine/type-diagnostics.json').read_text())
    gate='PASS' if all(latest['gate_checks'].values()) and unit['success'] and not any(x['errorCount'] or x['warningCount'] for x in lint) and build['exit_code']==0 else 'BLOCKED'
    metrics=dict(run_id=ROOT.name,stage_id='S1',gate=gate,source_pin='4b9ca06b6581f7152e164ea0fd9d4da366975a79',evaluator_pin='758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d',
        build_source_head=build['source_head'],build_hash=build['build_hash'],build_command_id=build['command_id'],
        unit=dict(total=unit['numTotalTests'],passed=unit['numPassedTests'],failed=unit['numFailedTests'],skipped=unit['numPendingTests'],
            files=len(unit['testResults']),distinct_measurements='Coverage reruns the same unit tests; do not count twice.'),
        lint=dict(files=len(lint),errors=sum(x['errorCount'] for x in lint),warnings=sum(x['warningCount'] for x in lint)),
        coverage=coverage,type_diagnostics=types,browser_attempts=attempts,
        accepted_browser_attempt='browser-native' if gate=='PASS' else None,
        cost=None,human_review_time=None,S2_S6_budget='not_started',
        evidence='../wf6-evidence/steps/S1',scope='Unmodified Vue baseline only; no React migration or coexistence tested.')
    write(STAGE/'baseline-measurements.json',metrics)
    first=attempts[0]['categories'];last=latest['categories']
    rows=[]
    for key in ['routes','flows','guard']:
        a=first[key];b=last[key]
        rows.append(f"| {key} | {a['passed']}/{a['total']} pass; {a['failed']} fail; {a['skipped']} skip | {b['passed']}/{b['total']} pass; {b['failed']} fail; {b['skipped']} skip |")
    text=f'''# S1 unchanged Vue baseline / 未修改 Vue 基线

Run: `{ROOT.name}`. Gate: **{gate}**. Only S1 executed; S2 remains unauthorized and unexecuted.
本次仅执行 S1；gate 为 **{gate}**，未进入 S2，S2–S6 三小时预算未启动。

P1 final reply is settled as exact_reported through provider source line 703; S1 begins at the actual natural-language request on line 709, with distinct turn identity. No fabricated START marker or overlapping preparation usage.
P1 最终回复已核实封账至源日志第 703 行；S1 从实际自然语言请求第 709 行起算，turn 独立，不与 preparation 重叠。

## Approach → What happened → Why → What we would change

Measure frozen Vue input `{metrics['source_pin']}` and evaluator `{metrics['evaluator_pin']}` with frozen installs, static generation, units, coverage, lint, actual type diagnostics and the complete real-browser yardstick. The build was produced from docs-only S0 HEAD `{build['source_head']}`; build manifest SHA256 is `{build['build_hash']}`. Backend code is served from the evaluator checkout, whose frozen backend tree was verified identical to the source input in S0.
从固定 Vue 与 evaluator 输入重新安装、构建并测量；实际 build 来自仅增加 S0 文档的 HEAD，后端使用已在 S0 核实相同的冻结后端树。

Frozen installs and accepted Vue generation passed. Units: {metrics['unit']['passed']}/{metrics['unit']['total']} passed, {metrics['unit']['failed']} failed, {metrics['unit']['skipped']} skipped across {metrics['unit']['files']} files. Lint: {len(lint)} files, {metrics['lint']['errors']} errors, {metrics['lint']['warnings']} warnings. Coverage reran the same tests and is not an additional test count.
冻结安装及验收构建通过。Unit 实际成绩如上；lint 无错误或警告；coverage 重跑相同测试，不重复计数。

| Frozen category / 类别 | Mounted first attempt / 首轮 | Linux native runtime / 原生目录重测 |
|---|---|---|
'''+ '\n'.join(rows)+f'''

Coverage / 覆盖率: statements {coverage['statements']['pct']}%, branches {coverage['branches']['pct']}%, functions {coverage['functions']['pct']}%, lines {coverage['lines']['pct']}%. This is the frozen configured include/exclude scope, not whole-system coverage.
覆盖率仅对应冻结 Vitest 配置的 include/exclude 范围，不代表全系统覆盖。

Actual Vue typecheck reports {types['error_count']} diagnostics, separately recorded as FAIL. The initial missing-checker failure is retained; diagnostic-only TypeScript 5.9.3 and vue-tsc 3.1.5 were installed outside the app manifests. No source errors were repaired; no historical diagnostic count is assumed.
实际 Vue typecheck 报出 {types['error_count']} 条诊断，单独记 FAIL。保留最初缺少工具的失败；辅助 checker 安装于运行目录，未修改应用 manifest 或源码。

First generation returned exit 0 but logged sandbox font-provider DNS failures; its original logs/build inventory remain. Reviewed public-font regeneration supplied the accepted artifact. A restricted socket preflight failed before server startup and is retained. The first full browser attempt used mounted output/data/static paths. Its first failure trace showed a blank document and unfinished module requests at the unchanged assertion deadline. An interrupted native attempt has incomplete passing logs and is not accepted; the final complete remeasurement used byte-verified identical static assets plus fresh SQLite/auth/profile/output paths under `/tmp/wf6-rerun-20261014-01-S1-native2`. Assertions, fixture seeds, strict/all selection, 10-second expectations, 45-second test limits and retries=0 were unchanged. The path change is an environment diagnosis; it does not isolate each contributing cause or prove a code fix.
保留字体网络及 socket 权限失败。首轮完整浏览器失败 trace 显示超时点仍有资源未完成；第二轮仅将相同 build 字节及独立运行数据/输出放到 Ubuntu 原生文件系统，源码、seed、断言、严格模式、超时及 retries=0 不变。目录调整不能单独证明每个因素的因果关系，也不是源码修复。

Future authorized stages should use verified Linux-native runtime paths and record every attempt. Existing Vue type errors stay separate. This baseline gives no React completion, route coexistence, boundary or fallback evidence. Costs and human review time are not provided. Complete ancestor Git history remains unavailable behind declared shallow boundaries; pinned tree/blob provenance and working bytes were verified.
后续获授权步骤应继续使用核实过的 Linux 原生运行目录并保留重测历史；类型错误单列。本步骤不构成 React、路由共存、边界或回退成绩。费用与人工 review 时间未提供；Git 完整祖先历史仍缺失，冻结 tree/blob 与工作文件已核实。

## Evidence / 证据

- [Actual request and boundary](request-boundary.json), [P1 settlement](P1-settlement.json)
- [Commands](commands.jsonl), [Failures/repairs](attempts.jsonl), [Original logs](logs/)
- [Build manifest](build-artifact.json), [Native runtime identity](native-runtime.json)
- [First full browser report](browser/results.json), [Native full browser report](browser-native/results.json)
- [First trace observations](machine/first-trace-observations.json), [Native output byte manifest](native-output-manifest.json)
- [Machine measurements](baseline-measurements.json), [Coverage](coverage/coverage-summary.json), [Types](machine/type-diagnostics.json)
- [Source state](source-state.json), [Diff](diff.patch), [File hashes](file-manifest.json)
- [Visible transcript](visible-transcript.jsonl), [Coverage statement](transcript-coverage.json), [Provider usage](token-usage.json)

Before the final response usage remains provisional with final_reply_included=false. Terminal collector settlement or the next authorized stage must verify the final response event. Old exports are preserved rather than added.
最终回复前用量保持 provisional，final_reply_included=false；需终端 collector 或下一授权步骤核实尾部，旧导出保留但不相加。
'''
    (STAGE/'result.md').write_text(text)
    if gate=='PASS':
        docs=SOURCE/'rewrite-evidence/workflows/WF6'
        (docs/'BASELINE.md').write_text('# Fresh WF6 Vue baseline / 新 Vue 基线\n\nGate: PASS. 原生目录完整重测通过，首轮失败保留。\n\n'+
            f"Vue `{metrics['source_pin']}`; evaluator `{metrics['evaluator_pin']}`; build `{build['build_hash']}`.\n\n"+
            f"Unit {metrics['unit']['passed']}/{metrics['unit']['total']}; lint {len(lint)} files clean; type diagnostics {types['error_count']} separately FAIL.\n\n"+
            '| Category / 类别 | Mounted first attempt / 首轮 | Native runtime / 重测 |\n|---|---|---|\n'+
            '\n'.join(rows)+'\n\nCoverage: statements '+str(coverage['statements']['pct'])+'%, branches '+str(coverage['branches']['pct'])+'%, functions '+str(coverage['functions']['pct'])+'%, lines '+str(coverage['lines']['pct'])+'%.\n\n'+
            '[Full bilingual result and raw evidence](../../../../wf6-evidence/steps/S1/result.md). Original logs, auth, databases and browser traces stay outside Git.\n'+
            '完整双语结果与失败历史见兄弟证据目录；无 React 成果，未启动 S2。\n')
        write(docs/'comparison-baseline.json',dict(run_id=ROOT.name,gate=gate,source_pin=metrics['source_pin'],evaluator_pin=metrics['evaluator_pin'],build_source_head=build['source_head'],build_hash=build['build_hash'],unit=metrics['unit'],lint=metrics['lint'],coverage=coverage,type_errors=types['error_count'],browser=last,first_attempt=first,evidence='../../../../wf6-evidence/steps/S1/result.md',cost=None,human_review_time=None))
    (EVIDENCE/'PROGRESS.md').write_text(f'''# WF6 progress / 进度

Run: {ROOT.name}. S0 PASS; final usage exact_reported. P1 preparation PASS; final usage exact_reported, separate from S1.
S0 与 P1 最终回复均已封账，preparation 与 S1 不重叠。

S1 gate: {gate}. Actual build/unit/lint/coverage/types/full frozen browser measurements retained; type diagnostics separate. See [S1 result](steps/S1/result.md).
S1 gate 为 {gate}；真实测量和失败重测历史已保留，类型诊断单列。

S2–S7 not executed. S2–S6 budget not started. Stop and await a separate authorized next-step prompt. Default sandbox unchanged; concrete runtime network/socket operations use reviewed approvals.
S2–S7 未执行；三小时预算未启动。停止等待单独下一步授权，默认 sandbox 不变。

[Live provider usage](usage/USAGE.md)
''')
    index=EVIDENCE/'EVIDENCE_INDEX.md'
    existing=index.read_text().split('\n## S1 fresh baseline')[0].rstrip()
    index.write_text(existing+'\n\n## S1 fresh baseline / 新基线\n\n'+
        '\n'.join(f'- [{name}](steps/S1/{path})' for name,path in [('Result','result.md'),('Actual prompt','[REDACTED]'),('Boundary','request-boundary.json'),('P1 final settlement','P1-settlement.json'),('Commands','commands.jsonl'),('Failures and repairs','attempts.jsonl'),('Measurements','baseline-measurements.json'),('Build','build-artifact.json'),('First browser attempt','browser/results.json'),('Native browser attempt','browser-native/results.json'),('Source state','source-state.json'),('File manifest','file-manifest.json'),('Visible transcript','visible-transcript.jsonl'),('Original provider commands','provider-command-events.jsonl'),('Transcript coverage','transcript-coverage.json'),('Usage','token-usage.json')])+'\n')
    print(json.dumps(dict(gate=gate,build_hash=build['build_hash'],unit=metrics['unit'],browser=last)))
    return metrics

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('action',choices=['results','snapshot']);args=parser.parse_args()
    if args.action=='results':results()
    else:source_snapshot();print('Frozen bytes and final source/evaluator states captured.')
