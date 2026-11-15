import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeRouter } from '../lib/router.js';

test('concurrent requests reserve different starting routes before any provider work finishes', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'free-router-rotation-'));
  const statePath = join(dir, 'ledger.json');
  const cfg = {
    statePath,
    chain: [
      { provider: 'nvidia', model: 'nv-a', freeTier: true, enabled: true, tasks: { general: 5 }, maxOutputTokens: 256 },
      { provider: 'google', model: 'gl-b', freeTier: true, enabled: true, tasks: { general: 5 }, maxOutputTokens: 256 },
      { provider: 'openrouter', model: 'or-c:free', freeTier: true, enabled: true, tasks: { general: 5 }, maxOutputTokens: 256 },
    ],
    maxOutputTokens: 256,
    maxAttempts: 0,
    quotaCooldownMs: 1e9, rateLimitCooldownMs: 1e9, authCooldownMs: 1e9, errorCooldownMs: 1e9, maxCooldownMs: 1e9,
  };
  const reached = [];
  const ctx = {
    logger: { warn() {} },
    llm: {
      resolveModelInfo: async (p, m) => ({ provider: p, id: m, name: m, inputModalities: ['text'], context: { contextWindow: 1000000 }, defaultMaxTokens: 256, reasoning: { efforts: [] } }),
      // A fake provider that records the selected route and blocks (never finishes)
      stream: async function* (options) { reached.push(`${options.provider}/${options.model}`); await new Promise(() => {}); },
    },
  };
  const router = makeRouter(ctx, cfg);
  const makeOptions = () => ({ messages: [{ role: 'user', content: [{ type: 'text', text: 'Summarize this task' }] }], signal: new AbortController().signal });
  const streams = [0, 1, 2].map(() => router.adapter.stream(makeOptions()));
  // Start all three generator bodies synchronously. Each reserves a rotation
  // slot before it reaches the (blocked) provider, so no finish can advance the
  // rotation and yet the three must land on three different starting routes.
  const pending = streams.map((s) => s.next());
  await new Promise((resolve) => setImmediate(resolve));
  assert.strictEqual(reached.length, 3, 'every blocked request should have reached its provider');
  const distinct = new Set(reached);
  assert.strictEqual(distinct.size, 3, `expected 3 distinct starting routes, got ${[...distinct].join(', ')}`);
  assert.deepEqual([...distinct].sort(), ['google/gl-b', 'nvidia/nv-a', 'openrouter/or-c:free'].sort());
  rmSync(dir, { recursive: true, force: true });
});
