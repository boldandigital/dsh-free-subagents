/**
 * Router behaviour tests, run with `node --test`.
 *
 * The plugin only depends on node builtins, so the failover logic can be
 * exercised with a fake `ctx.llm` that fails the way a quota rejection does:
 * a terminal `finish` chunk carrying an error reason.
 */

import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { apply } from '../lib/index.js';

/**
 * Build a fake host context whose routes fail or succeed as instructed.
 * @param {object} plan - Route id to behaviour: `{ fail: {code, message} }` or `{ ok: true }`.
 */
function fakeHost(plan, calls) {
	const adapters = new Map();
	const host = {
		logger: { info() {}, warn() {}, error() {} },
        agents: { list: () => [] }, on() {}, effect() {}, get() {},
		llm: {
			registerAdapter(providers, adapter) {
				for (const provider of providers) adapters.set(provider, adapter);
				return () => {};
			},
			async resolveModelInfo(provider, model) {
				return {
					provider,
					id: model,
					name: `${provider}/${model}`,
					inputModalities: ['text'],
					context: { contextWindow: 131072 },
				};
			},
			/**
			 * Mimic the harness service: pick the adapter that owns the route
			 * and let it prepare the call before streaming.
			 * @param {object} options - The request.
			 * @returns {AsyncGenerator<object>} the stream chunks.
			 */
			async *stream(options) {
				const adapter = adapters.get(options.provider);
				if (adapter === undefined) {
					for await (const chunk of host.realStream(options)) yield chunk;
					return;
				}
				const prepared = await adapter.prepareCall(options.provider, options.model, options.signal);
				const stream = prepared.stream(options);
				for await (const chunk of stream) yield chunk;
			},
		},
		/**
		 * The behaviour of one route, without the adapter indirection.
		 * @param {object} options - The request for a real route.
		 * @returns {AsyncGenerator<object>} the stream chunks.
		 */
		async *realStream(options) {
			const id = `${options.provider}/${options.model}`;
			calls.push(id);
			const behaviour = plan[id];
			if (behaviour === undefined) {
				yield { type: 'finish', reason: { kind: 'error', failure: { message: `no route ${id}`, code: 'NO_ADAPTER' } } };
				return;
			}
			if (behaviour.fail !== undefined) {
				yield { type: 'finish', reason: { kind: 'error', failure: { message: behaviour.fail.message ?? 'quota', code: behaviour.fail.code } } };
				return;
			}
			yield { type: 'text-delta', text: `hello from ${id}` };
			yield { type: 'finish', reason: { kind: 'stop' } };
		},
	};
	return host;
}

/**
 * Collect the chunks of one router stream.
 * @param {AsyncIterable<object>} stream - The router stream.
 * @returns {Promise<object[]>} the chunks.
 */
async function collect(stream) {
	const chunks = [];
	for await (const chunk of stream) chunks.push(chunk);
	return chunks;
}

test('fails over to the next route when the first one has no quota', async () => {
	const statePath = join(mkdtempSync(join(tmpdir(), 'free-router-')), 'state.json');
	const calls = [];
	const ctx = fakeHost({
		'google/a': { fail: { code: 'QUOTA', message: 'quota exceeded' } },
		'nvidia/b': { ok: true },
	}, calls);
	apply(ctx, {
		providerId: 'free-auto',
		modelId: 'auto',
		chain: [
			{ provider: 'google', model: 'a', freeTier: true },
			{ provider: 'nvidia', model: 'b', freeTier: true },
		],
		statePath,
		quotaCooldownMs: 60000,
	});
	const chunks = await collect(ctx.llm.stream({ provider: 'free-auto', model: 'auto', messages: [] }));
	assert.deepEqual(calls, ['google/a', 'nvidia/b']);
	assert.equal(chunks.filter(chunk => chunk.type === 'text-delta').length, 1);
	assert.equal(chunks.at(-1).reason.kind, 'stop');
});

test('a route whose quota is exhausted is skipped on the next request', async () => {
	const statePath = join(mkdtempSync(join(tmpdir(), 'free-router-')), 'state.json');
	const calls = [];
	const ctx = fakeHost({
		'google/a': { fail: { code: 'QUOTA', message: 'quota exceeded' } },
		'nvidia/b': { ok: true },
	}, calls);
	apply(ctx, {
		providerId: 'free-auto',
		modelId: 'auto',
		chain: [
			{ provider: 'google', model: 'a', freeTier: true },
			{ provider: 'nvidia', model: 'b', freeTier: true },
		],
		statePath,
		quotaCooldownMs: 60000,
	});
	await collect(ctx.llm.stream({ provider: 'free-auto', model: 'auto', messages: [] }));
	calls.length = 0;
	await collect(ctx.llm.stream({ provider: 'free-auto', model: 'auto', messages: [] }));
	assert.deepEqual(calls, ['nvidia/b']);
});

test('the exhausted route is remembered on disk', async () => {
	const statePath = join(mkdtempSync(join(tmpdir(), 'free-router-')), 'state.json');
	const calls = [];
	const ctx = fakeHost({
		'google/a': { fail: { code: 'QUOTA', message: 'quota exceeded' } },
		'nvidia/b': { ok: true },
	}, calls);
	apply(ctx, {
		providerId: 'free-auto',
		modelId: 'auto',
		chain: [
			{ provider: 'google', model: 'a', freeTier: true },
			{ provider: 'nvidia', model: 'b', freeTier: true },
		],
		statePath,
		quotaCooldownMs: 60000,
	});
	await collect(ctx.llm.stream({ provider: 'free-auto', model: 'auto', messages: [] }));
	const ledger = JSON.parse(readFileSync(statePath, 'utf8'));
	assert.ok(ledger.entries['google/a'], 'the exhausted route is in the ledger');
	assert.equal(ledger.entries['google/a'].code, 'QUOTA');
});

test('output that already reached the caller is never continued on another route', async () => {
	const statePath = join(mkdtempSync(join(tmpdir(), 'free-router-')), 'state.json');
	const calls = [];
	const ctx = fakeHost({}, calls);
	ctx.realStream = async function* (options) {
		const id = `${options.provider}/${options.model}`;
		calls.push(id);
		if (id === 'google/a') {
			yield { type: 'text-delta', text: 'partial' };
			yield { type: 'finish', reason: { kind: 'error', failure: { message: 'quota exceeded', code: 'QUOTA' } } };
			return;
		}
		yield { type: 'text-delta', text: 'other provider' };
		yield { type: 'finish', reason: { kind: 'stop' } };
	};
	apply(ctx, {
		providerId: 'free-auto',
		modelId: 'auto',
		chain: [
			{ provider: 'google', model: 'a', freeTier: true },
			{ provider: 'nvidia', model: 'b', freeTier: true },
		],
		statePath,
	});
	const chunks = await collect(ctx.llm.stream({ provider: 'free-auto', model: 'auto', messages: [] }));
	assert.deepEqual(calls, ['google/a']);
	assert.equal(chunks.at(-1).reason.kind, 'error');
});

test('a failure the other route cannot fix is surfaced', async () => {
	const statePath = join(mkdtempSync(join(tmpdir(), 'free-router-')), 'state.json');
	const calls = [];
	const ctx = fakeHost({
		'google/a': { fail: { code: 'EMPTY_RESPONSE', message: 'no content' } },
		'nvidia/b': { ok: true },
	}, calls);
	apply(ctx, {
		providerId: 'free-auto',
		modelId: 'auto',
		chain: [
			{ provider: 'google', model: 'a', freeTier: true },
			{ provider: 'nvidia', model: 'b', freeTier: true },
		],
		statePath,
	});
	const chunks = await collect(ctx.llm.stream({ provider: 'free-auto', model: 'auto', messages: [] }));
	assert.deepEqual(calls, ['google/a']);
	assert.equal(chunks.at(-1).reason.failure.code, 'EMPTY_RESPONSE');
});

test('a provider retry hint decides how long the route is parked', async () => {
	const statePath = join(mkdtempSync(join(tmpdir(), 'free-router-')), 'state.json');
	const calls = [];
	const ctx = fakeHost({
		'google/a': { fail: { code: 'QUOTA', message: 'Quota exceeded. Please retry in 20h8m25.403738432s.' } },
		'nvidia/b': { ok: true },
	}, calls);
	apply(ctx, {
		providerId: 'free-auto',
		modelId: 'auto',
		chain: [
			{ provider: 'google', model: 'a', freeTier: true },
			{ provider: 'nvidia', model: 'b', freeTier: true },
		],
		statePath,
		quotaCooldownMs: 60000,
		maxCooldownMs: 24 * 60 * 60 * 1000,
	});
	await collect(ctx.llm.stream({ provider: 'free-auto', model: 'auto', messages: [] }));
	const ledger = JSON.parse(readFileSync(statePath, 'utf8'));
	const parked = ledger.entries['google/a'];
	assert.ok(parked, 'the exhausted route is parked');
	// 20h 8m 25s, not the one-minute default cooldown.
	assert.ok(parked.until > Date.now() + 19 * 60 * 60 * 1000, `expected a ~20 hour park, got ${parked.until - Date.now()}ms`);
});
