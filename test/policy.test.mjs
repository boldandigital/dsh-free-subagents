import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { apply, normalizeConfig } from '../lib/index.js';
import { makeRouter, retryDelay, taskOf } from '../lib/router.js';

const route = (provider, model, extra = {}) => ({ provider, model, freeTier: true, ...extra });
const config = chain => normalizeConfig({ chain, statePath: join(mkdtempSync(join(tmpdir(), 'free-subagents-')), 'state.json') });
const collect = async x => { const out = []; for await (const v of x) out.push(v); return out; };
function engine(chain, behavior = {}, metadata = {}) {
  const cfg = config(chain), calls = [];
  const ctx = { logger: { warn() {} }, llm: {
    resolveModelInfo: async (provider, model) => ({ provider, id: model, inputModalities: ['text'], context: { contextWindow: 200000 }, ...metadata[model] }),
    async *stream(options) {
      calls.push(options);
      const f = behavior[options.model];
      if (f) yield* f(options);
      else { yield { type: 'text-delta', index: 0, text: options.model }; yield { type: 'finish', reason: { kind: 'stop' } }; }
    },
  } };
  return { ...makeRouter(ctx, cfg), cfg, calls };
}
const prompt = text => ({ messages: [{ role: 'user', content: [{ type: 'text', text }] }] });

test('task preferences outrank rotation, without reading the system prompt as a task', async () => {
  const x = engine([route('google', 'research', { tasks: { coding: 1, research: 9 } }), route('nvidia', 'coder', { tasks: { coding: 9, research: 1 } })]);
  await collect(x.adapter.stream(prompt('Debug this Python function')));
  assert.equal(x.calls[0].model, 'coder');
  assert.equal(taskOf({ messages: [{ role: 'system', content: [{ type: 'text', text: 'You are a coding agent' }] }, ...prompt('Research sources for a comparison').messages] }), 'research');
});

test('image and context limits exclude unsuitable routes before a provider call', async () => {
  const x = engine([route('google', 'text'), route('nvidia', 'small'), route('google', 'vision')], {}, { small: { inputModalities: ['text', 'image'], context: { contextWindow: 100 } }, vision: { inputModalities: ['text', 'image'] } });
  await collect(x.adapter.stream({ messages: [{ role: 'user', content: [{ type: 'image', data: 'hidden' }] }] }));
  assert.deepEqual(x.calls.map(c => c.model), ['vision']);
});

test('tool limits, output caps and provider reasoning remain route-specific', async () => {
  const x = engine([route('google', 'limited', { maxTools: 1 }), route('nvidia', 'fit', { maxOutputTokens: 2048 })]);
  await collect(x.adapter.stream({ messages: [], tools: [{ name: 'a' }, { name: 'b' }], maxTokens: 500000, reasoningEffort: 'max' }));
  assert.equal(x.calls[0].model, 'fit'); assert.equal(x.calls[0].maxTokens, 2048); assert.equal(x.calls[0].reasoningEffort, undefined);
});

test('measured first-token performance influences equally suitable quick routes', () => {
  const x = engine([route('google', 'slow'), route('nvidia', 'fast')]);
  x.ledger.stats['google/slow'] = { successes: 4, failures: 0, firstTokenMs: 15000 };
  x.ledger.stats['nvidia/fast'] = { successes: 4, failures: 0, firstTokenMs: 100 };
  assert.equal(x.ranked('quick')[0].model, 'fast');
});

test('exhaustion fails closed and stays exhausted after recreating the router', async () => {
  const chain = [route('google', 'a'), route('nvidia', 'b')];
  const fail = async function* () { yield { type: 'finish', reason: { kind: 'error', failure: { code: 'QUOTA', message: 'exhausted' } } }; };
  const x = engine(chain, { a: fail, b: fail });
  await collect(x.adapter.stream({ messages: [] }));
  const count = x.calls.length;
  const result = await collect(x.adapter.stream({ messages: [] }));
  assert.equal(x.calls.length, count); assert.equal(result.at(-1).reason.failure.code, 'QUOTA');
  const y = engine(chain); Object.assign(y.ledger, { path: x.cfg.statePath }); y.ledger.load();
  await collect(y.adapter.stream({ messages: [] })); assert.equal(y.calls.length, 0);
});

test('an incomplete stream fails over instead of crashing or reporting success', async () => {
  const x = engine([route('google', 'a'), route('nvidia', 'b')], { a: async function* () {} });
  const out = await collect(x.adapter.stream({ messages: [] }));
  assert.deepEqual(x.calls.map(c => c.model), ['a', 'b']); assert.equal(out.at(-1).reason.kind, 'stop');
});

test('metadata-only prefixes from a failed route do not leak into another answer', async () => {
  const x = engine([route('google', 'a'), route('nvidia', 'b')], { a: async function* () { yield { type: 'block-start', index: 9, block: { type: 'text', text: '' } }; yield { type: 'finish', reason: { kind: 'error', failure: { code: 'RATE_LIMIT', message: 'retry' } } }; } });
  const out = await collect(x.adapter.stream({ messages: [] }));
  assert.equal(out.some(c => c.index === 9), false);
});

test('cancellation makes no provider calls and short reset hints are respected', async () => {
  const x = engine([route('google', 'a')]);
  const out = await collect(x.adapter.stream({ messages: [], signal: AbortSignal.abort() }));
  assert.equal(x.calls.length, 0); assert.equal(out.at(-1).reason.failure.code, 'ABORTED');
  assert.equal(retryDelay('Please retry in 51.2s.'), 51200);
  x.ledger.park(x.cfg.chain[0], { code: 'RATE_LIMIT', message: 'Please retry in 2s' }, x.cfg);
  assert.ok(x.ledger.entries['google/a'].until <= Date.now() + 2100);
});

test('paid, recursive and duplicate routes are rejected at plugin startup', () => {
  assert.throws(() => config([route('minimax', 'paid')]), /unsupported/);
  assert.throws(() => config([route('openrouter', 'paid-model')]), /:free/);
  assert.throws(() => config([{ provider: 'google', model: 'a' }]), /approved/);
  assert.throws(() => config([route('google', 'a'), route('google', 'a')]), /duplicate/);
});

test('creation policy handles ordinary, resumed and Team children, leaves the parent alone and blocks later paid selection', async () => {
  const listeners = new Map(), selections = [], guards = new Map(), disposed = [];
  const agent = (id, child) => ({ id, session: { header: { origin: child ? 'subagent' : 'web', ...(child ? { parentSession: 'lead' } : {}) } }, model: { select: r => selections.push([id, r]) }, ctx: { on: (event, fn) => { guards.set(id, fn); return () => disposed.push(id); } } });
  const parent = agent('lead'), resumed = agent('resumed', true);
  const ctx = { llm: { registerAdapter() {} }, agents: { list: () => [parent, resumed] }, logger: { info() {}, warn() {} }, on: (event, fn) => listeners.set(event, fn), get() {}, effect: fn => { const d = fn(); assert.equal(typeof d, 'function'); } };
  apply(ctx, { chain: [route('google', 'a')], statePath: config([route('google', 'a')]).statePath });
  const ordinary = agent('ordinary', true), team = agent('team', true);
  listeners.get('agent/created')({ agent: ordinary }); listeners.get('agent/created')({ agent: team }); listeners.get('agent/created')({ agent: ordinary });
  assert.deepEqual(selections.map(s => s[0]), ['resumed', 'ordinary', 'team']);
  assert.ok(selections.every(([, s]) => s.provider === 'free-auto' && s.model === 'auto'));
  await assert.rejects(() => guards.get('team')({}, async () => ({ provider: 'minimax', model: 'paid' })), /blocked/);
  const proposal = Object.freeze({ provider: 'free-auto', model: 'auto', maxTokens: 512000 });
  const selected = await guards.get('ordinary')({}, async () => proposal);
  assert.equal(selected.maxTokens, 8192); assert.equal(proposal.maxTokens, 512000);
  assert.equal(guards.has('lead'), false);
});

test('shared profiles merge persistent cooldowns without overwriting another provider', async () => {
  const x = engine([route('google', 'a'), route('nvidia', 'b')]);
  writeFileSync(x.cfg.statePath, JSON.stringify({ entries: { 'nvidia/b': { until: Date.now() + 60000, code: 'QUOTA' } } }));
  x.ledger.park(x.cfg.chain[0], { code: 'QUOTA', message: 'quota' }, x.cfg);
  const entries = JSON.parse(readFileSync(x.cfg.statePath)).entries;
  assert.ok(entries['google/a']); assert.ok(entries['nvidia/b']);
});

test('a route may set its own reasoning effort, and an unsupported one skips the route', async () => {
  const thinking = { reasoning: { efforts: [{ id: 'low' }, { id: 'high' }] } };
  const x = engine(
    [route('google', 'thinker', { reasoningEffort: 'high' }), route('nvidia', 'plain', { reasoningEffort: 'high' })],
    {},
    { thinker: thinking },
  );
  await collect(x.adapter.stream(prompt('Reason about this trade-off')));
  assert.equal(x.calls[0].model, 'thinker');
  assert.equal(x.calls[0].reasoningEffort, 'high');
  assert.equal(x.calls.length, 1, 'the model without that level is skipped, not called');
});

test('the parent reasoning effort never leaks into a route without one', async () => {
  const x = engine([route('google', 'plain')]);
  await collect(x.adapter.stream({ ...prompt('Summarize this'), reasoningEffort: 'max' }));
  assert.equal(x.calls[0].reasoningEffort, undefined);
});
