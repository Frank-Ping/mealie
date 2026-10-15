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
from record_command import ROOT,EVIDENCE,run
from run_s1 import SOURCE,EVALUATOR,environment

STAGE=EVIDENCE/'steps/S6/continuation-02';RUNTIME=Path('/tmp/wf6-rerun-20261014-01-S6-C2')

def main():
    artifacts=json.loads((STAGE/'build-artifacts.json').read_text());build=artifacts['vue'];react=artifacts['react'];assert build['exit_code']==0 and react['exit_code']==0 and build['browser_acceptance_allowed'] and react['browser_acceptance_allowed']
    identity=json.loads((RUNTIME/'identity.json').read_text());assert identity['stage_id']=='S6' and identity['run_id']==ROOT.name
    assert not (RUNTIME/'disposable-data').exists(), 'No preexisting data may be erased.'
    for item in react['files']:assert hashlib.sha256((RUNTIME/'react'/item['path']).read_bytes()).hexdigest()==item['sha256']
    for item in build['files']:assert hashlib.sha256((RUNTIME/'vue'/item['path']).read_bytes()).hexdigest()==item['sha256']
    for port in [9006,9106]:
        with socket.socket() as probe:probe.bind(('127.0.0.1',port))
    auth=EVALUATOR/'frontend-e2e/.auth';assert auth.is_symlink() and auth.resolve()==Path('/tmp/wf6-rerun-20261014-01-S6-C1/auth')
    auth.unlink();auth.symlink_to(RUNTIME/'auth',target_is_directory=True)
    env=environment();env.update(TMPDIR=str(RUNTIME/'tmp'),E2E_PORT='9006',E2E_DATA_DIR=str(RUNTIME/'disposable-data'),E2E_STATIC_DIR=str(RUNTIME/'vue'),
        WF6_VUE_DIR=str(RUNTIME/'vue'),WF6_BACKEND_ORIGIN='http://127.0.0.1:9006',WF6_PORT='9106',WF6_BUILD_HASH=build['build_hash'],
        WF6_REACT_DIR=str(RUNTIME/'react'),WF6_REACT_BUILD_HASH=react['build_hash'],WF6_REACT_SOURCE_HASH=react['source_hash'],WF6_PLAYWRIGHT_MODULE=str(EVALUATOR/'frontend-e2e/node_modules/@playwright/test'),WF6_AUTH_DIR=str(RUNTIME/'auth'),WF6_GATEWAY_ORIGIN='http://127.0.0.1:9106',
        WF6_BROWSER_EVIDENCE=str(RUNTIME/'browser/requests-redacted.jsonl'),PLAYWRIGHT_JSON_OUTPUT_NAME=str(RUNTIME/'browser/results.json'),PLAYWRIGHT_HTML_OUTPUT_DIR=str(RUNTIME/'browser/html'))
    env['WF6_ROUTE_MAP']=str(STAGE/'route-map-rollback.json')
    assert Path(env['E2E_DATA_DIR']).parent==RUNTIME and not Path(env['E2E_DATA_DIR']).is_symlink()
    env.update(WF6_FROZEN_ROUTES=str(EVALUATOR/'frontend-e2e/lib/routes.ts'),WF6_ROUTE_POLICY=str(SOURCE/'wf6/route-policy.mjs'),WF6_ROUTE_OWNERSHIP=str(RUNTIME/'browser/route-ownership.json'),WF6_SHOTS=str(RUNTIME/'browser'))
    def configuration(name, matches):
        config=RUNTIME/'tests'/(name+'.config.cjs')
        config.write_text("const {defineConfig}=require(process.env.WF6_PLAYWRIGHT_MODULE);module.exports=defineConfig({testDir:__dirname,testMatch:"+json.dumps(matches)+",workers:1,retries:0,forbidOnly:true,timeout:45000,expect:{timeout:10000},globalSetup:"+json.dumps(str(EVALUATOR/'frontend-e2e/global-setup.ts'))+",reporter:[['list'],['json'],['html',{open:'never'}]],use:{baseURL:process.env.WF6_GATEWAY_ORIGIN,locale:'en-US',timezoneId:'UTC',viewport:{width:1440,height:900},trace:'on',screenshot:'on'}});\n")
        return config
    rollback_config=configuration('rollback',['s6-rollback-tests.cjs'])
    restored_config=configuration('restored',['s6-restored-tests.cjs','s6-ownership-tests.cjs','s6-c2-boundary-tests.cjs'])
    for name,original in [('s6-rollback-tests.cjs','s6-rollback-tests.cjs'),('s6-restored-tests.cjs','s4-browser-tests.cjs'),('s6-ownership-tests.cjs','s6-ownership-tests.cjs'),('s6-c2-boundary-tests.cjs','s6-c2-boundary-tests.cjs')]:shutil.copy2(EVIDENCE/'usage'/original,RUNTIME/'tests'/name)
    processes=[];streams=[];permission='Approved bounded S6 loopback backend/gateway/Chromium; default sandbox unchanged'
    try:
        for label,argv in [('backend',[str(EVALUATOR/'frontend-e2e/scripts/start-backend.sh')]),('gateway',['node',str(SOURCE/'wf6/gateway.mjs')])]:
            cid=dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S')+'-S6-'+label
            out=STAGE/'logs'/(cid+'.stdout.log');err=STAGE/'logs'/(cid+'.stderr.log');streams.extend([out.open('wb'),err.open('wb')])
            start=dt.datetime.now(dt.timezone.utc).isoformat();timer=time.monotonic()
            p=subprocess.Popen(argv,cwd=EVALUATOR/'frontend-e2e',env={**os.environ,**env},stdout=streams[-2],stderr=streams[-1],start_new_session=True)
            processes.append((p,dict(command_id=cid,stage_id='S6',label='S6-C2-owned-'+label,argv=argv,cwd=str(EVALUATOR/'frontend-e2e'),start_utc=start,environment_overrides=dict(env),permission=permission,stdout=str(out.relative_to(EVIDENCE)),stderr=str(err.relative_to(EVIDENCE)),aggregation='Service lifetime overlaps acceptance; do not sum durations'),timer))
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
        selection=r"\[route\] g/\[groupSlug\]/(?:index\.vue|r/\[slug\]/index\.vue)$|\[flow\] (?:open a recipe from the recipe list|search narrows the recipe list)$"
        states=[]
        for phase,config,mapfile in [('rollback',rollback_config,STAGE/'route-map-rollback.json'),('restored',restored_config,STAGE/'route-map-restored.json')]:
            # The gateway reads its explicit route map at startup; switch by restarting only this owned gateway.
            p,entry,timer=processes.pop();assert entry['label']=='S6-C2-owned-gateway'
            os.killpg(p.pid,signal.SIGTERM);p.wait(timeout=15);entry.update(end_utc=dt.datetime.now(dt.timezone.utc).isoformat(),duration_seconds=time.monotonic()-timer,exit_code=p.returncode,planned_shutdown=True)
            with (STAGE/'commands.jsonl').open('a') as f:f.write(json.dumps(entry)+'\n')
            env['WF6_ROUTE_MAP']=str(mapfile)
            cid=dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S')+'-S6-'+phase+'-gateway';out=STAGE/'logs'/(cid+'.stdout.log');err=STAGE/'logs'/(cid+'.stderr.log');streams.extend([out.open('wb'),err.open('wb')]);start=dt.datetime.now(dt.timezone.utc).isoformat();timer=time.monotonic();argv=['node',str(SOURCE/'wf6/gateway.mjs')]
            p=subprocess.Popen(argv,cwd=SOURCE,env={**os.environ,**env},stdout=streams[-2],stderr=streams[-1],start_new_session=True)
            processes.append((p,dict(command_id=cid,stage_id='S6',label='S6-C2-owned-gateway',phase=phase,argv=argv,cwd=str(SOURCE),start_utc=start,environment_overrides=dict(env),permission=permission,stdout=str(out.relative_to(EVIDENCE)),stderr=str(err.relative_to(EVIDENCE)),aggregation='Service lifetime overlaps tests'),timer))
            deadline=time.monotonic()+30
            while time.monotonic()<deadline:
                assert p.poll() is None
                try:
                    with urllib.request.urlopen(base+'/_wf6/route-map.json') as reply:mapdata=json.load(reply)
                    assert mapdata['takeoverEnabled']==(phase=='restored');break
                except OSError:time.sleep(.2)
            else:raise RuntimeError('Switched gateway did not become ready')
            state=dict(phase=phase,map_path=str(mapfile),map_sha256=hashlib.sha256(mapfile.read_bytes()).hexdigest(),map=mapdata,source_commit=subprocess.check_output(['git','-C',str(SOURCE),'rev-parse','HEAD'],text=True).strip(),gateway_sha256=hashlib.sha256((SOURCE/'wf6/gateway.mjs').read_bytes()).hexdigest(),react_build_hash=react['build_hash'],vue_build_hash=build['build_hash'],react_source_hash=react['source_hash'],backend_data_dir=env['E2E_DATA_DIR'],backend_pid=processes[0][0].pid,service_command=cid,checked_utc=dt.datetime.now(dt.timezone.utc).isoformat());states.append(state)
            (STAGE/'switch-states.json').write_text(json.dumps(states,indent=2)+'\n')
            if phase=='restored':
                four=r"\[flow\] (?:log out ends the session|a regular member is not offered admin pages|an admin is offered admin pages|comment on a recipe and see it after reload)$"
                tenv={**env,'E2E_PORT':'9106','E2E_REUSE_SERVER':'1','E2E_ROUTE_SCOPE':'all','E2E_ROUTE_CHECK':'strict','PLAYWRIGHT_JSON_OUTPUT_NAME':str(RUNTIME/'browser/four-original-results.json'),'PLAYWRIGHT_HTML_OUTPUT_DIR':str(RUNTIME/'browser/four-original-html')}
                target=run(['node',str(EVALUATOR/'frontend-e2e/node_modules/@playwright/test/cli.js'),'test']+['--grep',four,'--workers=1','--reporter=list,json,html','--output='+str(RUNTIME/'browser/four-original-test-results')],EVALUATOR/'frontend-e2e','S6-C2-four-original-frozen-FAIL-flows',stage='S6',env=tenv,permission=permission)
                if target['exit_code']!=0:raise SystemExit(target['exit_code'])
            penv={**env,'PLAYWRIGHT_JSON_OUTPUT_NAME':str(RUNTIME/'browser'/(phase+'-supplemental.json')),'PLAYWRIGHT_HTML_OUTPUT_DIR':str(RUNTIME/'browser'/(phase+'-html')),'WF6_BROWSER_EVIDENCE':str(RUNTIME/'browser'/(phase+'-requests-redacted.'+('json' if phase=='rollback' else 'jsonl')))}
            result=run(['node',str(EVALUATOR/'frontend-e2e/node_modules/@playwright/test/cli.js'),'test','--config='+str(config),'--output='+str(RUNTIME/'browser'/(phase+'-test-results'))],EVALUATOR/'frontend-e2e','S6-C2-'+phase+'-real-browser-and-ownership',stage='S6',env=penv,permission=permission)
            if result['exit_code']!=0:raise SystemExit(result['exit_code'])
            fixtures=json.loads((RUNTIME/'auth/fixtures.json').read_text());(STAGE/(phase+'-seeded-identities.json')).write_text(json.dumps(fixtures,indent=2)+'\n')
            if phase=='restored':assert fixtures==json.loads((STAGE/'rollback-seeded-identities.json').read_text()),'Comparable seed identities changed across switch'
            frozen_env={**env,'E2E_PORT':'9106','E2E_REUSE_SERVER':'1','E2E_ROUTE_SCOPE':'all','E2E_ROUTE_CHECK':'strict','PLAYWRIGHT_JSON_OUTPUT_NAME':str(RUNTIME/'browser'/(phase+'-frozen-inventory.json'))}
            args=['node',str(EVALUATOR/'frontend-e2e/node_modules/@playwright/test/cli.js'),'test'];select=['--grep',selection] if phase=='rollback' else []
            listed=run(args+['--list',*select,'--reporter=json'],EVALUATOR/'frontend-e2e','S6-C2-'+phase+'-frozen-inventory',stage='S6',env=frozen_env,permission=permission);assert listed['exit_code']==0
            inventory=json.loads(Path(frozen_env['PLAYWRIGHT_JSON_OUTPUT_NAME']).read_text());specs=[]
            def visit(suite):
                specs.extend(suite.get('specs',[]))
                for child in suite.get('suites',[]):visit(child)
            for suite in inventory['suites']:visit(suite)
            assert len(specs)==(4 if phase=='rollback' else 82)
            if phase=='restored':assert sum(x['title'].startswith('[route]') for x in specs)==66 and sum(x['title'].startswith('[flow]') for x in specs)==15 and sum(x['title']=='route table has unique entries' for x in specs)==1
            frozen_env.update(PLAYWRIGHT_JSON_OUTPUT_NAME=str(RUNTIME/'browser'/(phase+'-frozen-results.json')),PLAYWRIGHT_HTML_OUTPUT_DIR=str(RUNTIME/'browser'/(phase+'-frozen-html')))
            measured=run(args+[*select,'--workers=1','--reporter=list,json,html','--output='+str(RUNTIME/'browser'/(phase+'-frozen-test-results'))],EVALUATOR/'frontend-e2e','S6-C2-'+phase+'-frozen-'+('selected-four' if phase=='rollback' else 'all66routes15flowsguard-strict'),stage='S6',env=frozen_env,permission=permission)
            (STAGE/(phase+'-frozen-outcome.json')).write_text(json.dumps(dict(command_id=measured['command_id'],exit_code=measured['exit_code'],inventory_count=len(specs),assertions_unchanged=True,scope='Selected four rollback' if phase=='rollback' else 'Full strict all 66 routes,15 flows,guard'),indent=2)+'\n')
            if phase=='rollback' and measured['exit_code']!=0:raise SystemExit(measured['exit_code'])
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
        destination=STAGE/'browser';destination.mkdir(exist_ok=True)
        for item in (RUNTIME/'browser').iterdir():
            if item.is_dir():shutil.copytree(item,destination/item.name)
            else:shutil.copy2(item,destination/item.name)
        shutil.copytree(RUNTIME/'tests',STAGE/'supplemental-tests')
        (STAGE/'runtime-isolation.json').write_text(json.dumps(dict(identity=identity,auth_real_target=str(auth.resolve()),backend_launcher_sha256=hashlib.sha256((EVALUATOR/'frontend-e2e/scripts/start-backend.sh').read_bytes()).hexdigest(),default_sandbox_unchanged=True,credentials_exported_in_summary=False,service_lifecycles_closed=True),indent=2)+'\n')

if __name__=='__main__':main()
