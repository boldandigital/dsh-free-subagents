import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

const RETRY = new Set(['QUOTA', 'ACCOUNT_QUOTA', 'RATE_LIMIT', 'AUTH', 'MISSING_CREDENTIAL', 'INVALID_CREDENTIAL', 'INVALID_REQUEST', 'CONTEXT_WINDOW_EXCEEDED', 'SERVER', 'TRANSPORT', 'TIMEOUT', 'PI_AI_ERROR', 'NO_ADAPTER', 'UNKNOWN_MODEL']);
/**
 * How far a route may trail the best route before it stops sharing the
 * rotation. One point on the 0-10 scale the router ranks on: close enough that
 * either route is an acceptable choice, far enough that a clearly weaker route
 * is never rotated in just to spread load.
 */
const TIER_DELTA = 1;
const key = r => `${r.provider}/${r.model}`;
const error = (code, message) => ({ type: 'finish', reason: { kind: 'error', failure: { code, message } } });
const failureOf = e => ({ code: e?.failure?.code ?? e?.code ?? 'TRANSPORT', message: e?.failure?.message ?? e?.message ?? String(e), providerRetryAfterMs: e?.failure?.providerRetryAfterMs ?? e?.providerRetryAfterMs });

export function retryDelay(message) {
  const text = String(message ?? '');
  const marker = text.toLowerCase().indexOf('retry in');
  if (marker < 0) return 0;
  const units = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return [...text.slice(marker, marker + 90).matchAll(/(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)(?![a-z])/gi)].reduce((sum, m) => sum + Number(m[1]) * units[m[2].toLowerCase()], 0);
}

/**
 * Context the host injects into every request. It is boilerplate, identical
 * for every child, and full of words that look like task hints - the skill
 * catalogue alone mentions code, reasoning and research - so reading it would
 * classify every child the same way and ignore what the child was asked.
 */
const BOILERPLATE = new Set(['runtime-context', 'model-selection', 'agent-instructions', 'skill-catalog', 'time-context']);
/**
 * The host appends its own delivery instruction to a delegated task, as a
 * second text block of the same message. It talks about transcripts, tool
 * output and reasoning, so reading it misreads the task.
 */
const HOST_APPENDED = /^\s*Your parent agent id is/i;

/** A lightweight heuristic, not a quality benchmark or another paid LLM call. */
export function taskOf(options) {
  const messages = (options.messages ?? []).filter(m => m.role === 'user' && !BOILERPLATE.has(m.source?.kind));
  const blocks = messages.flatMap(m => (m.content ?? []).filter(b => b.type === 'text').filter(b => !HOST_APPENDED.test(b.text)));
  const text = blocks.slice(-2).map(b => b.text).join(' ').toLowerCase();
  if (/\b(prove|proof|reasoning|mathematical|theorem|complex analysis|architecture|trade.?offs)\b/.test(text)) return 'reasoning';
  if (/\b(code|coding|debug|bug|refactor|implement|function|typescript|python|javascript|unit test|repository|pull request)\b/.test(text)) return 'coding';
  if (/\b(research|sources|citations|investigate|compare|literature|survey|browse)\b/.test(text)) return 'research';
  if (/\b(quick|brief|extract|classify|format|short|simple|summarize|summarise)\b/.test(text)) return 'quick';
  return 'general';
}

function inputFacts(options) {
  let chars = JSON.stringify(options.tools ?? []).length;
  let images = 0;
  for (const m of options.messages ?? []) for (const b of m.content ?? []) {
    if (b.type === 'image') images++;
    else chars += JSON.stringify(b).length;
  }
  // Conservative estimate only; providers remain authoritative about token limits.
  return { images, tokens: Math.ceil(chars / 3) + images * 4096, tools: options.tools?.length ?? 0 };
}

export class Ledger {
  constructor(path) { this.path = path; this.entries = {}; this.stats = {}; this.cursor = 0; this.load(); }
  load() {
    try {
      const x = JSON.parse(readFileSync(this.path, 'utf8'));
      this.entries = x.entries ?? {}; this.stats = x.stats ?? {};
      this.cursor = Number.isFinite(x.cursor) ? x.cursor : 0; this.lastServed = x.lastServed;
    } catch { /* Missing or invalid cache is recoverable. */ }
  }
  save() {
    let temporary;
    try {
      // Preserve a cooldown written by another local profile using the same ledger.
      const remote = (() => { try { return JSON.parse(readFileSync(this.path, 'utf8')); } catch { return {}; } })();
      for (const [k, v] of Object.entries(remote.entries ?? {})) if (v.until > (this.entries[k]?.until ?? 0)) this.entries[k] = v;
      for (const [k, v] of Object.entries(remote.stats ?? {})) if (v.at > (this.stats[k]?.at ?? 0)) this.stats[k] = v;
      mkdirSync(dirname(this.path), { recursive: true });
      temporary = `${this.path}.${process.pid}.${randomUUID()}.tmp`;
      writeFileSync(temporary, JSON.stringify({ version: 2, entries: this.entries, stats: this.stats, cursor: this.cursor, lastServed: this.lastServed }, null, 2) + '\n', { mode: 0o600 });
      renameSync(temporary, this.path);
    } catch { /* Persistence is a cache; routing must still function. */ }
  }
  parked(r) { return (this.entries[key(r)]?.until ?? 0) > Date.now(); }
  park(r, failure, cfg) {
    const base = failure.code === 'RATE_LIMIT' ? cfg.rateLimitCooldownMs : ['QUOTA', 'ACCOUNT_QUOTA'].includes(failure.code) ? cfg.quotaCooldownMs : ['AUTH', 'MISSING_CREDENTIAL', 'INVALID_CREDENTIAL'].includes(failure.code) ? cfg.authCooldownMs : cfg.errorCooldownMs;
    // A provider's explicit reset hint can be shorter than our default cooldown.
    const duration = Math.min(failure.providerRetryAfterMs || retryDelay(failure.message) || base, cfg.maxCooldownMs);
    if (duration > 0) this.entries[key(r)] = { until: Date.now() + duration, code: failure.code };
    this.save();
  }
  observed(r, ok, firstTokenMs, task) {
    const old = this.stats[key(r)] ?? { successes: 0, failures: 0 };
    const stats = { ...old, successes: old.successes + Number(ok), failures: old.failures + Number(!ok), at: Date.now() };
    if (ok && Number.isFinite(firstTokenMs)) stats.firstTokenMs = old.firstTokenMs === undefined ? firstTokenMs : old.firstTokenMs * 0.7 + firstTokenMs * 0.3;
    this.stats[key(r)] = stats;
    if (ok) { this.lastServed = { provider: r.provider, model: r.model, label: r.label, task, at: new Date().toISOString() }; this.cursor = (this.cursor + 1) % 100000; }
    this.save();
  }
}

export function makeRouter(ctx, config) {
  const read = typeof config === 'function' ? config : () => config;
  const cfg = read();
  const ledger = new Ledger(cfg.statePath);
  const metadata = new Map();
  async function info(r, signal) {
    const cached = metadata.get(key(r));
    if (cached && cached.expires > Date.now()) return cached.value;
    const value = await ctx.llm.resolveModelInfo(r.provider, r.model, signal);
    metadata.set(key(r), { value, expires: Date.now() + 60000 });
    return value;
  }
  function ranked(task, cfg = read()) {
    // Freshly read shared cooldowns so another profile's exhausted route is skipped.
    try { const disk = JSON.parse(readFileSync(cfg.statePath, 'utf8')); for (const [k, v] of Object.entries(disk.entries ?? {})) if (v.until > (ledger.entries[k]?.until ?? 0)) ledger.entries[k] = v; } catch {}
    const active = cfg.chain.filter(r => r.enabled !== false);
    if (!active.length) return [];
    const suitability = r => r.tasks?.[task] ?? r.tasks?.general ?? 5;
    const score = r => {
      const s = ledger.stats[key(r)];
      const measuredSpeed = s?.firstTokenMs === undefined ? 0 : Math.max(-1, Math.min(1, (4000 - s.firstTokenMs) / 4000));
      const reliability = s ? (s.successes + 1) / (s.successes + s.failures + 2) - 0.5 : 0;
      return suitability(r) + measuredSpeed * (task === 'quick' ? 1.5 : 0.25) + reliability * 0.5;
    };
    const eligible = active.filter(r => !ledger.parked(r));
    if (!eligible.length) return [];
    const ordered = eligible.map(r => ({ r, s: score(r) })).sort((a, b) => b.s - a.s);
    // Routes whose standing is within one point of the best are close enough to
    // be interchangeable, so the cursor rotates through them instead of always
    // naming the same one. A clearly better route still wins the first attempt
    // and stays ahead as the fallback order - only comparable routes share the
    // rotation. The band is measured on the same 0-10 scale the router ranks
    // on, so it also excludes a route that is merely fast rather than good.
    const tier = ordered.filter(x => ordered[0].s - x.s <= TIER_DELTA);
    const offset = ledger.cursor % tier.length;
    return [...tier.slice(offset), ...tier.slice(0, offset), ...ordered.filter(x => !tier.includes(x))].map(x => x.r);
  }
  async function* stream(options) {
    if (options.signal?.aborted) { yield error('ABORTED', 'Request aborted'); return; }
    const cfg = read();
    if (!cfg.chain.some(r => r.enabled !== false)) { yield error('NO_FREE_ROUTES_CONFIGURED', 'Select and enable approved models in Plugins → Free Subagents.'); return; }
    const task = taskOf(options), facts = inputFacts(options), candidates = ranked(task, cfg);
    if (candidates.length === 0) { yield error('QUOTA', 'All configured free routes are cooling down. No paid fallback was used.'); return; }
    let last, attempted = 0;
    for (const route of candidates) {
      if (options.signal?.aborted) { yield error('ABORTED', 'Request aborted'); return; }
      if (cfg.maxAttempts && attempted >= cfg.maxAttempts) break;
      if (route.maxTools !== undefined && facts.tools > route.maxTools) continue;
      let model;
      try { model = await info(route, options.signal); } catch (e) {
        if (options.signal?.aborted) { yield error('ABORTED', 'Request aborted'); return; }
        last = failureOf(e); ledger.park(route, last, cfg); continue;
      }
      if (facts.images && !model.inputModalities?.includes('image')) continue;
      // A route's own effort wins; a model that cannot do it is skipped, never parked.
      if (route.reasoningEffort && !(model.reasoning?.efforts ?? []).some(e => e.id === route.reasoningEffort)) continue;
      const window = model.context?.contextWindow;
      const outputCap = Math.min(cfg.maxOutputTokens, route.maxOutputTokens ?? cfg.maxOutputTokens, model.defaultMaxTokens ?? cfg.maxOutputTokens, options.maxTokens ?? cfg.maxOutputTokens);
      if (window && facts.tokens + outputCap > window) continue;
      attempted++;
      const next = { ...options, provider: route.provider, model: route.model, maxTokens: outputCap };
      // The parent's provider-specific effort never leaks; a route may set its own.
      if (route.reasoningEffort) next.reasoningEffort = route.reasoningEffort;
      else delete next.reasoningEffort;
      let failure, finished = false, produced = false, firstTokenMs;
      const prefix = [], start = Date.now();
      try {
        for await (const chunk of ctx.llm.stream(next)) {
          if (chunk.type === 'finish') {
            finished = true;
            if (['error', 'aborted'].includes(chunk.reason?.kind)) { failure = chunk.reason.failure ?? { code: chunk.reason.kind === 'aborted' ? 'ABORTED' : 'TRANSPORT', message: 'Provider aborted' }; break; }
            for (const p of prefix.splice(0)) yield p;
            yield chunk;
            ledger.observed(route, true, firstTokenMs, task); return;
          }
          if (!produced && ['block-start', 'usage'].includes(chunk.type)) { prefix.push(chunk); continue; }
          if (!produced) { produced = true; firstTokenMs = Date.now() - start; for (const p of prefix.splice(0)) yield p; }
          yield chunk;
        }
        if (!finished) failure = { code: 'TRANSPORT', message: 'Provider stream ended without a terminal result' };
      } catch (e) { failure = failureOf(e); }
      failure ??= { code: 'TRANSPORT', message: 'Provider returned an invalid result' };
      ledger.observed(route, false, undefined, task);
      if (options.signal?.aborted || failure.code === 'ABORTED') { yield error('ABORTED', failure.message); return; }
      // Context mismatch is request-specific, not evidence of exhausted quota.
      if (RETRY.has(failure.code) && failure.code !== 'CONTEXT_WINDOW_EXCEEDED') ledger.park(route, failure, cfg);
      if (produced || !RETRY.has(failure.code)) { yield error(failure.code, failure.message); return; }
      ctx.logger.warn('free-router: %s rejected the %s request (%s); trying the next free route', key(route), task, failure.code);
      last = failure;
    }
    yield error(last?.code ?? 'NO_SUITABLE_FREE_ROUTE', last?.message ?? 'No available free route supports this request and its input limits. No paid fallback was used.');
  }
  async function model(provider, id, signal) {
    const cfg = read();
    // The virtual envelope advertises the union; each attempt filters exact capabilities.
    const all = [];
    for (const r of ranked('general')) try { all.push(await info(r, signal)); } catch { if (signal?.aborted) throw signal.reason; }
    const maxContext = Math.max(0, ...all.map(x => x.context?.contextWindow ?? 0));
    return { provider, id, name: 'Free Subagents (task-aware)', inputModalities: [...new Set(['text', ...all.flatMap(x => x.inputModalities ?? [])])], defaultMaxTokens: cfg.maxOutputTokens, ...(maxContext ? { context: { contextWindow: maxContext } } : {}) };
  }
  return { ledger, ranked, adapter: {
    providerInfo: provider => ({ id: provider, name: 'Free Subagents' }),
    providerRetryPolicy: () => ({ mode: 'normal', maxRetries: 0 }),
    imageRequestPricing: () => undefined,
    imageRequestTarget: (_p, _m, image) => ({ width: image.width, height: image.height, maxBytes: image.bytes }),
    listModels: async provider => [{ provider, id: cfg.modelId, name: 'Free Subagents (task-aware, quota fallback)', inputModalities: ['text', 'image'] }],
    resolveModel: model,
    prepareCall: async (provider, id, signal) => { if (id !== cfg.modelId) throw Object.assign(new Error('Unknown free-subagent route'), { code: 'UNKNOWN_MODEL' }); return { model: await model(provider, id, signal), stream }; },
    stream,
  } };
}
