import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';

process.env.DSH_HOME = fs.mkdtempSync(path.join(tmpdir(), 'free-subagents-integration-'));
const timeout = setTimeout(() => { console.error('Integration timed out'); process.exit(1); }, 30000);
const root = path.resolve(process.env.DSH_RUNTIME, 'node_modules/@deepseek-ai');
const { loadOverlayPatches, composeEntries, createRuntimeResolution, PluginPackages, boot } = await import(`${root}/dsh-app-boot/lib/index.js`);
const dir = process.env.DSH_HOME; fs.mkdirSync(dir, { recursive: true });
const base = loadOverlayPatches('check', `${root}/dsh-base/cordis.patch.yml`);
// Server-side web rows only; the client UI is not exercised by this runner.
const web = loadOverlayPatches('check', `${root}/dsh-web-app/cordis.patch.yml`).flatMap(r => r.disabled === true ? [r] : r.insert ? [{ insert: r.insert.filter(x => ['agent-preset-registry', 'cordis-host-runner', 'cordis-inspect-providers'].includes(x.id)) }] : []);
const presets = ['standard', 'ptc', 'minimal', 'cordis'].flatMap(n => loadOverlayPatches('check', `${root}/dsh-web-app/presets/${n}.patch.yml`));
// Harness-native child admission: at most three simultaneous child activations per
// root conversation, shared by ordinary subagents, Agent Teams and nested children.
// The root agent does not consume a slot.
const admission = [{ id: 'subagent', config: { maxActiveSubagents: 3 } }];
const plugin = [{ insert: [{ id: 'free-router', name: new URL('../../lib/host.js', import.meta.url).href, config: { chain: [{ provider: 'nvidia', model: 'fake-free', freeTier: true }], statePath: path.join(process.env.DSH_HOME, 'ledger.json') } }] }];
const overrides = ['hmr', 'plugin-manager', 'session-telemetry-otel'].map(id => ({ id, disabled: true }));
const rows = composeEntries([base, web, presets, admission, plugin, overrides]);
const bundle = path.join(dir, 'node_modules/@fixture/bundle'); fs.mkdirSync(bundle, { recursive: true });
fs.writeFileSync(path.join(bundle, 'package.json'), JSON.stringify({ name: '@fixture/bundle', version: '1.0.0', dsh: { bundle: { patch: 'cordis.patch.yml' } } }));
fs.writeFileSync(path.join(bundle, 'cordis.patch.yml'), JSON.stringify([{ insert: rows }]));
fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'fixture', private: true, dsh: { profile: { bundles: ['@fixture/bundle'] } } }));
const profileContext = { dir, patchPath: path.join(dir, 'cordis.patch.yml'), home: dir, installAnchor: path.resolve(process.env.DSH_RUNTIME, 'package.json'), overlays: [] };
fs.writeFileSync(profileContext.patchPath, '[]');
const cfg = path.join(dir, '.verify-integration-root.yml'); fs.writeFileSync(cfg, '[]\n');
const resolution = await createRuntimeResolution({ installAnchor: path.resolve(process.env.DSH_RUNTIME, 'package.json'), profile: { dir, layers: [], skippedBundles: [] } });
let ctx; const calls = [], children = [];
// A fake provider that answers with one token and then stays open until the child
// activation is disposed (the request signal aborts), so capacity slots stay occupied.
const fake = provider => ({
  providerInfo: p => ({ id: p, name: p }),
  providerRetryPolicy: () => ({ mode: 'normal', maxRetries: 0 }),
  async listModels() { return []; },
  async resolveModel(p, id) { return { provider: p, id, name: id, inputModalities: ['text'], context: { contextWindow: 1000000 }, defaultMaxTokens: 8192 }; },
  async prepareCall(p, id) { return { model: await this.resolveModel(p, id), stream: options => this.stream(options) }; },
  async *stream(options) {
    calls.push({ provider, model: options.model });
    yield { type: 'text-delta', index: 0, text: 'held' };
    await new Promise(resolve => options.signal?.addEventListener?.('abort', resolve, { once: true }));
    yield { type: 'finish', reason: { kind: 'stop' } };
  },
});
try {
  ctx = await boot('check', cfg, [{ insert: rows }], async c => { c.provide('profileContext', profileContext); new PluginPackages(c, { resolution }); });
  const form = ctx.settings.describe().find(x => x.ns === 'free-router'); assert.ok(form);
  await ctx.settings.mutate('free-router', [{ op: 'set', path: ['maxOutputTokens'], value: 4096 }], form.revision);
  assert.equal(ctx.settings.describe().find(x => x.ns === 'free-router').value.maxOutputTokens, 4096);
  await assert.rejects(() => ctx.settings.mutate('free-router', [{ op: 'set', path: ['maxOutputTokens'], value: 1024 }], form.revision));
  console.log('PASS real Settings persisted live edit and rejected stale revision');
  ctx.llm.registerAdapter(['nvidia'], fake('nvidia')); ctx.llm.registerAdapter(['minimax'], fake('minimax'));
  const errors = []; ctx.on('agent/error', x => errors.push(x.error));
  ctx.on('agent/created', ({ agent }) => { if (agent.session.header.origin === 'subagent') children.push(agent); });

  const lead = await ctx.agents.create({ sessionId: randomUUID(), agentOptions: { provider: 'minimax', model: 'paid-main' }, meta: { cwd: process.env.DSH_HOME, agentPreset: 'standard' } });
  assert.equal(lead.agent.model.current().provider, 'minimax');

  const hold = async (kind) => {
    const activation = await ctx.subagents.startActivation({
      provider: kind === 'fork' ? 'fork' : 'spawn',
      label: 'hold-' + kind,
      parent: lead.agent,
      prompt: [{ type: 'text', text: kind === 'fork' ? 'Fork this and debug the code' : 'Summarize this short task' }],
      signal: new AbortController().signal,
    });
    const child = ctx.agents.get(activation.childId);
    assert.ok(child, 'startActivation should return a live child agent');
    // The plugin must route the child before its first model step.
    assert.deepEqual(child.model.current(), { provider: 'free-auto', model: 'auto' });
    return { activation, child };
  };
  const expectLimited = async () => {
    await assert.rejects(() => hold('fresh'), (e) => /ACTIVATION_LIMIT_REACHED/.test(`${e?.code ?? ''} ${e?.message ?? String(e)}`));
  };
  const disposeAll = async (list) => { for (const k of list) try { await k.activation.dispose(); } catch {} };

  async function section(expectedKinds) {
    const held = [];
    for (const kind of expectedKinds) held.push(await hold(kind));
    await expectLimited();                                   // fourth is refused
    assert.ok(held.length === 3);
    await held[1].activation.dispose();                      // replacement after disposal
    const replacement = await hold(expectedKinds[1] === 'fork' ? 'fork' : 'fresh');
    assert.ok(replacement.child);
    await replacement.activation.dispose();
    return held;
  }

  // Team OFF: ordinary fresh and forked children share the three-slot pool.
  await ctx.agentTeams.setEnabled(lead.agent, false);
  const offHeld = await section(['fresh', 'fork', 'fresh']);
  console.log('PASS Team OFF: three held, fourth ACTIVATION_LIMIT_REACHED, replacement started after disposal');
  await disposeAll(offHeld);

  // Team ON: the same three-slot pool serves fresh and forked Team members.
  await ctx.agentTeams.setEnabled(lead.agent, true);
  const onHeld = await section(['fresh', 'fork', 'fork']);
  console.log('PASS Team ON: three held, fourth ACTIVATION_LIMIT_REACHED, replacement started after disposal');

  // The parent keeps its selected model regardless of Team mode and routed children.
  assert.equal(lead.agent.model.current().provider, 'minimax');
  assert.equal(ctx.agentTeams.isEnabled(lead.agent), true);

  await disposeAll(onHeld);
  await new Promise(r => setTimeout(r, 250)); // allow teardown to flush
  assert.ok(children.length >= 8, `expected at least 8 routed children, saw ${children.length}`);
  assert.equal(lead.agent.model.current().provider, 'minimax');
  assert.equal(errors.length, 0, errors.map(e => e.stack).join('\n'));
  console.log('PASS: real runtime ordinary (fresh/fork) and Team (fresh/fork) share the three-slot admission; parent remains minimax; all presets healthy.');
  console.log('MODEL CALLS (all fake, no external requests):', JSON.stringify(calls.map(c => ({ provider: c.provider, model: c.model }))));
  await lead.dispose();
} catch (e) { console.error(e.stack); process.exitCode = 1; } finally { await ctx?.fiber?.dispose(); fs.unlinkSync(cfg); clearTimeout(timeout); }
