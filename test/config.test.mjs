import test from 'node:test';import assert from 'node:assert/strict';import {normalizeConfig,readConfig} from '../lib/config.js';import {makeRouter} from '../lib/router.js';import {mkdtempSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
const route=model=>({provider:'nvidia',model,freeTier:true});
test('invalid limits and preferences are rejected',()=>{for(const raw of [{maxOutputTokens:NaN},{maxAttempts:-1},{chain:[{...route('a'),tasks:{coding:11}}]}])assert.throws(()=>normalizeConfig(raw));});
test('volatile config is read afresh without retaining reference objects',()=>{let chain=[route('a')];const raw={chain:{get:()=>chain}};assert.equal(readConfig(raw).chain[0].model,'a');chain=[route('b')];assert.equal(readConfig(raw).chain[0].model,'b');});
test('empty and disabled pools fail closed; subsequent calls use live pool',async()=>{let chain=[];const cfg=()=>normalizeConfig({chain,statePath:join(mkdtempSync(join(tmpdir(),'router-test-')),'ledger')});let calls=[];const router=makeRouter({logger:{warn(){}},llm:{resolveModelInfo:async()=>({inputModalities:['text']}),async *stream(o){calls.push(o.model);yield {type:'finish',reason:{kind:'stop'}}}}},cfg);const run=async()=>{const out=[];for await(const c of router.adapter.stream({messages:[]}))out.push(c);return out};assert.equal((await run())[0].reason.failure.code,'NO_FREE_ROUTES_CONFIGURED');chain=[{...route('a'),enabled:false}];await run();assert.deepEqual(calls,[]);chain=[route('b')];await run();assert.deepEqual(calls,['b']);});
test('the paid fallback is off by default and armable only with a provider, model and cap',()=>{
  assert.equal(normalizeConfig({}).fallback.enabled,false);
  assert.equal(normalizeConfig({chain:[route('a')]}).fallback.enabled,false);
  // Must name a provider and model before arming.
  assert.throws(()=>normalizeConfig({fallback:{enabled:true,model:'m'}}),/provider/);
  assert.throws(()=>normalizeConfig({fallback:{enabled:true,provider:'minimax'}}),/model/);
  // Cannot route the fallback through the router itself.
  assert.throws(()=>normalizeConfig({fallback:{enabled:true,provider:'free-auto',model:'m'}}),/router itself/);
  const ok=normalizeConfig({fallback:{enabled:true,provider:'minimax',model:'MiniMax-Text-01',maxOutputTokens:4096}});
  assert.equal(ok.fallback.enabled,true);assert.equal(ok.fallback.provider,'minimax');assert.equal(ok.fallback.model,'MiniMax-Text-01');assert.equal(ok.fallback.maxOutputTokens,4096);
  assert.throws(()=>normalizeConfig({fallback:{enabled:true,provider:'minimax',model:'m',maxOutputTokens:0}}),/fallback\.maxOutputTokens/);
  // A disabled fallback does not throw even if it has a provider/model, and
  // keeps the pre-filled values so the GUI picker stays populated before arming.
  const parked=normalizeConfig({fallback:{enabled:false,provider:'minimax',model:'m'}});
  assert.equal(parked.fallback.enabled,false);assert.equal(parked.fallback.provider,'minimax');assert.equal(parked.fallback.model,'m');
});
