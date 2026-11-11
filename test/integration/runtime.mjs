import path from 'node:path';import fs from 'node:fs';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {tmpdir} from 'node:os';import {fileURLToPath} from 'node:url';
process.env.DSH_HOME=fs.mkdtempSync(path.join(tmpdir(),'free-subagents-integration-'));
const timeout=setTimeout(()=>{console.error('Integration timed out');process.exit(1)},15000);
const root=path.resolve(process.env.DSH_RUNTIME,'node_modules/@deepseek-ai');
const {loadOverlayPatches,composeEntries,createRuntimeResolution,PluginPackages,boot}=await import(`${root}/dsh-app-boot/lib/index.js`);
const dir=process.env.DSH_HOME;fs.mkdirSync(dir,{recursive:true});
const base=loadOverlayPatches('check',`${root}/dsh-base/cordis.patch.yml`);
const web=loadOverlayPatches('check',`${root}/dsh-web-app/cordis.patch.yml`).flatMap(r=>r.disabled===true?[r]:r.insert?[{insert:r.insert.filter(x=>['agent-preset-registry','cordis-host-runner','cordis-inspect-providers'].includes(x.id))}]:[]);
const presets=['standard','ptc','minimal','cordis'].flatMap(n=>loadOverlayPatches('check',`${root}/dsh-web-app/presets/${n}.patch.yml`));
const team=loadOverlayPatches('check',`${root}/dsh-experimental-agent-team-profile/cordis.patch.yml`);
const plugin=[{insert:[{id:'free-router',name:new URL('../../lib/host.js',import.meta.url).href,config:{chain:[{provider:'nvidia',model:'fake-free',freeTier:true}],statePath:path.join(process.env.DSH_HOME,'ledger.json')}}]}];
const overrides=['hmr','plugin-manager','session-telemetry-otel'].map(id=>({id,disabled:true}));
const rows=composeEntries([base,web,presets,team,plugin,overrides]);
const bundle=path.join(dir,'node_modules/@fixture/bundle');fs.mkdirSync(bundle,{recursive:true});fs.writeFileSync(path.join(bundle,'package.json'),JSON.stringify({name:'@fixture/bundle',version:'1.0.0',dsh:{bundle:{patch:'cordis.patch.yml'}}}));fs.writeFileSync(path.join(bundle,'cordis.patch.yml'),JSON.stringify([{insert:rows}]));fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name:'fixture',private:true,dsh:{profile:{bundles:['@fixture/bundle']}}}));
const profileContext={dir,patchPath:path.join(dir,'cordis.patch.yml'),home:dir,installAnchor:path.resolve(process.env.DSH_RUNTIME,'package.json'),overlays:[]};fs.writeFileSync(profileContext.patchPath,'[]');
const cfg=path.join(dir,'.verify-integration-root.yml');fs.writeFileSync(cfg,'[]\n');
const resolution=await createRuntimeResolution({installAnchor:path.resolve(process.env.DSH_RUNTIME,'package.json'),profile:{dir,layers:[],skippedBundles:[]}});
let ctx;const calls=[],children=[];
const fake=provider=>({providerInfo:p=>({id:p,name:p}),providerRetryPolicy:()=>({mode:'normal',maxRetries:0}),
 async listModels(){return[]}, async resolveModel(p,id){return{provider:p,id,name:id,inputModalities:['text'],context:{contextWindow:1000000},defaultMaxTokens:8192}},
 async prepareCall(p,id){return{model:await this.resolveModel(p,id),stream:options=>this.stream(options)}},
 async *stream(options){calls.push({provider,model:options.model});yield{type:'text-delta',index:0,text:'ok'};yield{type:'finish',reason:{kind:'stop'}}}
});
try{
 ctx=await boot('check',cfg,[{insert:rows}],async c=>{c.provide('profileContext',profileContext);new PluginPackages(c,{resolution})});
 const form=ctx.settings.describe().find(x=>x.ns==='free-router');assert.ok(form);await ctx.settings.mutate('free-router',[{op:'set',path:['maxOutputTokens'],value:4096}],form.revision);assert.equal(ctx.settings.describe().find(x=>x.ns==='free-router').value.maxOutputTokens,4096);await assert.rejects(()=>ctx.settings.mutate('free-router',[{op:'set',path:['maxOutputTokens'],value:1024}],form.revision));console.log('PASS real Settings persisted live edit and rejected stale revision');
 ctx.llm.registerAdapter(['nvidia'],fake('nvidia'));ctx.llm.registerAdapter(['minimax'],fake('minimax'));
 const errors=[];ctx.on('agent/error',x=>errors.push(x.error));
 ctx.on('agent/created',({agent})=>{if(agent.session.header.origin==='subagent')children.push(agent)});
 const lead=await ctx.agents.create({sessionId:randomUUID(),agentOptions:{provider:'minimax',model:'paid-main'},meta:{cwd:process.env.DSH_HOME,agentPreset:'standard'}});
 assert.equal(lead.agent.model.current().provider,'minimax');
 for(const provider of ['spawn','fork']){
   const started=await ctx.subagents.startActivation({provider,label:'test '+provider,delivery:'caller',request:{parent:lead.agent,prompt:[{type:'text',text:'Summarize this short task'}]},signal:new AbortController().signal});
   const result=await started.result;console.log('NORMAL',provider,JSON.stringify(result));
 }
 for(const context of ['fresh','fork']){
   const result=await ctx.agentTeams.spawnTeammate(lead.agent,{name:'test-'+context,description:'integration '+context,context,provider:context==='fork'?'fork':'spawn',prompt:[{type:'text',text:'Debug this code'}],signal:new AbortController().signal});
   const a=ctx.agents.get(result.member.id);await a?.whenIdle();console.log('TEAM',context,a?.model.current());
 }
 await lead.agent.whenIdle();
 for(const child of children){assert.deepEqual(child.model.current(),{provider:'free-auto',model:'auto'});assert.equal(child.session.requestHeader()?.config.provider,'free-auto');}
 assert.ok(children.length>=4);assert.equal(lead.agent.model.current().provider,'minimax');
 assert.equal(errors.length,0,errors.map(e=>e.stack).join('\n'));
 console.log('PASS: real runtime ordinary, fork, Team fresh and Team fork use free routing; parent remains minimax; all presets healthy.');
 console.log('MODEL CALLS (all fake, no external requests):',calls);
 await lead.dispose();
} catch(e){console.error(e.stack);process.exitCode=1}finally{await ctx?.fiber.dispose();fs.unlinkSync(cfg);clearTimeout(timeout)}
