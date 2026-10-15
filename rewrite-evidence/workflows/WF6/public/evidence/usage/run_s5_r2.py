"""Own the isolated real backend/gateway and preserve raw outputs and browser artifacts."""
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import shutil
import signal
import socket
import subprocess
import time
import urllib.request
import urllib.error
from record_command import ROOT,EVIDENCE,run
from run_s1 import SOURCE,EVALUATOR,environment

STAGE=EVIDENCE/'steps/S5';RUNTIME=Path('/tmp/wf6-rerun-20261014-01-S5-R2')

def main():
    artifacts=json.loads((STAGE/'build-artifacts.json').read_text());build=artifacts['vue'];react=artifacts['react'];assert build['exit_code']==0 and react['exit_code']==0 and build['browser_acceptance_allowed'] and react['browser_acceptance_allowed']
    identity=json.loads((RUNTIME/'identity.json').read_text());assert identity['stage_id']=='S5' and identity['run_id']==ROOT.name
    assert not (RUNTIME/'disposable-data').exists(), 'No preexisting data may be erased.'
    for item in react['files']:assert hashlib.sha256((RUNTIME/'react'/item['path']).read_bytes()).hexdigest()==item['sha256']
    for item in build['files']:assert hashlib.sha256((RUNTIME/'vue'/item['path']).read_bytes()).hexdigest()==item['sha256']
    for port in [9006,9106]:
        with socket.socket() as probe:probe.bind(('127.0.0.1',port))
    auth=EVALUATOR/'frontend-e2e/.auth';assert auth.is_symlink() and auth.resolve()==Path('/tmp/wf6-rerun-20261014-01-S5-R1/auth')
    auth.unlink();auth.symlink_to(RUNTIME/'auth',target_is_directory=True)
    env=environment();env.update(TMPDIR=str(RUNTIME/'tmp'),E2E_PORT='9006',E2E_DATA_DIR=str(RUNTIME/'disposable-data'),E2E_STATIC_DIR=str(RUNTIME/'vue'),
        WF6_VUE_DIR=str(RUNTIME/'vue'),WF6_BACKEND_ORIGIN='http://127.0.0.1:9006',WF6_PORT='9106',WF6_BUILD_HASH=build['build_hash'],
        WF6_REACT_DIR=str(RUNTIME/'react'),WF6_REACT_BUILD_HASH=react['build_hash'],WF6_REACT_SOURCE_HASH=react['source_hash'],WF6_PLAYWRIGHT_MODULE=str(EVALUATOR/'frontend-e2e/node_modules/@playwright/test'),WF6_AUTH_DIR=str(RUNTIME/'auth'),WF6_GATEWAY_ORIGIN='http://127.0.0.1:9106',
        WF6_SHOTS=str(RUNTIME/'browser'),WF6_BROWSER_EVIDENCE=str(RUNTIME/'browser/requests-redacted.jsonl'),PLAYWRIGHT_JSON_OUTPUT_NAME=str(RUNTIME/'browser/results.json'),PLAYWRIGHT_HTML_OUTPUT_DIR=str(RUNTIME/'browser/html'))
    assert Path(env['E2E_DATA_DIR']).parent==RUNTIME and not Path(env['E2E_DATA_DIR']).is_symlink()
    config=RUNTIME/'tests/playwright.config.cjs'
    config.write_text("const {defineConfig}=require(process.env.WF6_PLAYWRIGHT_MODULE); module.exports=defineConfig({testDir:__dirname, testMatch:['s5-browser-tests.cjs','s5-extra-tests.cjs'], workers:1,retries:0,forbidOnly:true,timeout:45000,expect:{timeout:10000},globalSetup:"+json.dumps(str(EVALUATOR/'frontend-e2e/global-setup.ts'))+",reporter:[['list'],['json'],['html',{open:'never'}]],use:{baseURL:process.env.WF6_GATEWAY_ORIGIN,locale:'en-US',timezoneId:'UTC',viewport:{width:1440,height:900},trace:'on',screenshot:'on'}});\n")
    shutil.copy2(EVIDENCE/'usage/s4-browser-tests.cjs',RUNTIME/'tests/s5-browser-tests.cjs')
    shutil.copy2(EVIDENCE/'usage/s5-extra-tests.cjs',RUNTIME/'tests/s5-extra-tests.cjs')
    shutil.copy2(EVIDENCE/'usage/s5-detection-probe.cjs',RUNTIME/'tests/s5-detection-probe.cjs')
    processes=[];streams=[];permission='Approved bounded S5 loopback backend/gateway/Chromium; default sandbox unchanged'
    try:
        for label,argv in [('backend',[str(EVALUATOR/'frontend-e2e/scripts/start-backend.sh')]),('gateway',['node',str(SOURCE/'wf6/gateway.mjs')])]:
            cid=dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S')+'-S5-'+label
            out=STAGE/'logs'/(cid+'.stdout.log');err=STAGE/'logs'/(cid+'.stderr.log');streams.extend([out.open('wb'),err.open('wb')])
            start=dt.datetime.now(dt.timezone.utc).isoformat();timer=time.monotonic()
            p=subprocess.Popen(argv,cwd=EVALUATOR/'frontend-e2e',env={**os.environ,**env},stdout=streams[-2],stderr=streams[-1],start_new_session=True)
            processes.append((p,dict(command_id=cid,stage_id='S5',label='S5-owned-'+label,argv=argv,cwd=str(EVALUATOR/'frontend-e2e'),start_utc=start,environment_overrides=env,permission=permission,stdout=str(out.relative_to(EVIDENCE)),stderr=str(err.relative_to(EVIDENCE)),aggregation='Service lifetime overlaps acceptance; do not sum durations'),timer))
            with (STAGE/'service-events.jsonl').open('a') as f:f.write(json.dumps(dict(event='owned_service_started',service=label,pid=p.pid,group=p.pid,start_utc=start,command_id=cid))+'\n')
        base=env['WF6_GATEWAY_ORIGIN'];deadline=time.monotonic()+180
        while time.monotonic()<deadline:
            assert all(p.poll() is None for p,_,_ in processes), 'Owned service exited before readiness'
            try:
                with urllib.request.urlopen(base+'/api/app/about',timeout=2) as r:assert r.status==200
                break
            except OSError:time.sleep(1)
        else:raise RuntimeError('Gateway/backend readiness timed out')
        with urllib.request.urlopen(urllib.request.Request(base+'/login',headers={'Accept':'text/html'})) as r:
            data=r.read();assert r.headers['x-wf6-build']==build['build_hash'];assert hashlib.sha256(data).hexdigest()==hashlib.sha256((RUNTIME/'vue/login/index.html').read_bytes()).hexdigest()
        (STAGE/'served-build.json').write_text(json.dumps(dict(build_hash=build['build_hash'],served_index_sha256=hashlib.sha256(data).hexdigest(),actual_static_dir=str(RUNTIME/'vue'),vue_boundary_source_hash=build['source_hash'],react_source_hash=react['source_hash'],react_build_hash=react['build_hash'],route_policy_sha256=hashlib.sha256((SOURCE/'wf6/route-policy.mjs').read_bytes()).hexdigest(),gateway_sha256=hashlib.sha256((SOURCE/'wf6/gateway.mjs').read_bytes()).hexdigest(),route_map_sha256=hashlib.sha256((SOURCE/'wf6/route-map.json').read_bytes()).hexdigest(),evaluator_sha='758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d'),indent=2)+'\n')
        wire=run(['node','--test',str(SOURCE/'wf6/gateway.test.mjs')],SOURCE,'S5-gateway-protocol-fixture',stage='S5',env=env,permission=permission)
        if wire['exit_code']!=0:raise SystemExit(wire['exit_code'])
        selection=r"\[route\] g/\[groupSlug\]/(?:index\.vue|r/\[slug\]/index\.vue)$|\[flow\] (?:open a recipe from the recipe list|search narrows the recipe list)$"
        frozen_env={**env,'E2E_PORT':'9106','E2E_REUSE_SERVER':'1','E2E_ROUTE_SCOPE':'all','E2E_ROUTE_CHECK':'strict',
            'PLAYWRIGHT_JSON_OUTPUT_NAME':str(RUNTIME/'browser/frozen-inventory.json')}
        listing=run(['node',str(EVALUATOR/'frontend-e2e/node_modules/@playwright/test/cli.js'),'test','--list','--grep',selection,'--reporter=json'],EVALUATOR/'frontend-e2e','S5-frozen-exact-selection-inventory',stage='S5',env=frozen_env,permission=permission)
        assert listing['exit_code']==0
        report=json.loads((RUNTIME/'browser/frozen-inventory.json').read_text());specs=[]
        def visit(suite):
            specs.extend(suite.get('specs',[]))
            for child in suite.get('suites',[]):visit(child)
        for suite in report['suites']:visit(suite)
        assert len(specs)==4 and sum(x['title'].startswith('[route]') for x in specs)==2 and sum(x['title'].startswith('[flow]') for x in specs)==2
        (STAGE/'frozen-selection.json').write_text(json.dumps(dict(grep=selection,specs=specs,scope='Two frozen route checks and open/search flows only; assertions/config unchanged'),indent=2)+'\n')
        frozen_env.update(PLAYWRIGHT_JSON_OUTPUT_NAME=str(RUNTIME/'browser/frozen-results.json'),PLAYWRIGHT_HTML_OUTPUT_DIR=str(RUNTIME/'browser/frozen-html'))
        frozen=run(['node',str(EVALUATOR/'frontend-e2e/node_modules/@playwright/test/cli.js'),'test','--grep',selection,'--workers=1','--reporter=list,json,html','--output='+str(RUNTIME/'browser/frozen-test-results')],EVALUATOR/'frontend-e2e','S5-frozen-list-detail-routes-open-search-flows',stage='S5',env=frozen_env,permission=permission)
        if frozen['exit_code']!=0:raise SystemExit(frozen['exit_code'])
        result=run(['node',str(EVALUATOR/'frontend-e2e/node_modules/@playwright/test/cli.js'),'test','--config='+str(config),'--output='+str(RUNTIME/'browser/test-results')],EVALUATOR/'frontend-e2e','S5-real-business-states-keyboard-boundary-browser',stage='S5',env=env,permission=permission)
        if result['exit_code']!=0:raise SystemExit(result['exit_code'])
        probe=RUNTIME/'tests/probe.config.cjs'
        probe.write_text("const {defineConfig}=require(process.env.WF6_PLAYWRIGHT_MODULE);module.exports=defineConfig({testDir:__dirname,testMatch:'s5-detection-probe.cjs',workers:1,retries:0,timeout:15000,reporter:[['list'],['json']],use:{trace:'on',screenshot:'on'}});")
        assets=RUNTIME/'react/assets';hidden=RUNTIME/'react/expected-failure-assets';assert assets.is_dir() and not hidden.exists()
        outcomes=[]
        for phase in ['control','expected_failure','restored']:
            if phase=='expected_failure':assets.rename(hidden)
            penv={**env,'PLAYWRIGHT_JSON_OUTPUT_NAME':str(RUNTIME/'browser'/('probe-'+phase+'.json'))}
            try:
                check=run(['node',str(EVALUATOR/'frontend-e2e/node_modules/@playwright/test/cli.js'),'test','--config='+str(probe),'--output='+str(RUNTIME/'browser'/('probe-'+phase))],EVALUATOR/'frontend-e2e','S5-detection-'+phase,stage='S5',env=penv,permission=permission)
                machine=json.loads(Path(penv['PLAYWRIGHT_JSON_OUTPUT_NAME']).read_text());outcomes.append(dict(phase=phase,command_id=check['command_id'],exit_code=check['exit_code'],stats=machine['stats']))
                assert check['exit_code']==(1 if phase=='expected_failure' else 0)
                assert machine['stats']['unexpected']==(1 if phase=='expected_failure' else 0)
                if phase=='expected_failure':
                    with urllib.request.urlopen(base+'/_wf6/route-map.json') as r:assert json.load(r)['takeoverEnabled'] is True
                    try:urllib.request.urlopen(urllib.request.Request(base+'/_wf6/assets/'+next(hidden.glob('*.js')).name,headers={'Accept':'text/html'}))
                    except urllib.error.HTTPError as error:assert error.code==404;assert 'text/html' not in error.headers['content-type']
                    else:raise AssertionError('Missing React asset was hidden')
            finally:
                if hidden.exists():hidden.rename(assets)
        for item in react['files']:assert hashlib.sha256((RUNTIME/'react'/item['path']).read_bytes()).hexdigest()==item['sha256']
        (STAGE/'detection-negative.json').write_text(json.dumps(dict(status='PASS',classification='expected_failure',takeoverEnabled=True,source_unchanged=True,mutation='Atomic rename of this S5 runtime copy assets only; restored byte hashes verified',outcomes=outcomes),indent=2)+'\n')
    finally:
        for p,entry,timer in reversed(processes):
            if p.poll() is None:
                os.killpg(p.pid,signal.SIGTERM)
                try:p.wait(timeout=15)
                except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);p.wait(timeout=5)
            entry.update(end_utc=dt.datetime.now(dt.timezone.utc).isoformat(),duration_seconds=time.monotonic()-timer,exit_code=p.returncode,planned_shutdown=True)
            with (STAGE/'commands.jsonl').open('a') as f:f.write(json.dumps(entry)+'\n')
            with (STAGE/'service-events.jsonl').open('a') as f:f.write(json.dumps(dict(event='owned_service_stopped',pid=p.pid,command_id=entry['command_id'],end_utc=entry['end_utc'],exit_code=p.returncode))+'\n')
        for stream in streams:stream.close()
        destination=STAGE/'browser-r2';destination.mkdir(exist_ok=True)
        for item in (RUNTIME/'browser').iterdir():
            if item.is_dir():shutil.copytree(item,destination/item.name)
            else:shutil.copy2(item,destination/item.name)
        shutil.copytree(RUNTIME/'tests',STAGE/'supplemental-tests-r2')
        (STAGE/'runtime-isolation.json').write_text(json.dumps(dict(identity=identity,auth_real_target=str(auth.resolve()),backend_launcher_sha256=hashlib.sha256((EVALUATOR/'frontend-e2e/scripts/start-backend.sh').read_bytes()).hexdigest(),default_sandbox_unchanged=True,credentials_exported_in_summary=False,service_lifecycles_closed=True),indent=2)+'\n')

if __name__=='__main__':main()
