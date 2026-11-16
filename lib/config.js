import { homedir } from 'node:os';
import { join } from 'node:path';
export function normalizeConfig(raw = {}) {
  const providerId = raw.providerId ?? 'free-auto', modelId = raw.modelId ?? 'auto';
  const seen = new Set();
  const chain = (raw.chain ?? []).map(r => {
    if (r.freeTier !== true) throw new Error(`free-router: ${r.provider}/${r.model} must be explicitly approved as a free-tier route`);
    if (typeof r.provider !== 'string' || !r.provider || typeof r.model !== 'string' || !r.model) throw new Error('free-router: unsupported free provider/model');
    // OpenRouter models are only ever free when they carry the :free suffix; a
    // typo'd paid OpenRouter model must not be silently confirmed as free. For
    // any other provider (cloud free tiers, local models such as OMLX/Ollama,
    // MiniMax and friends) the explicit `freeTier: true` flag is the approval.
    if (r.provider === 'openrouter' && !r.model.endsWith(':free')) throw new Error('free-router: OpenRouter routes must end in :free');
    if (r.provider === providerId) throw new Error('free-router: recursive routes are forbidden');
    const k = `${r.provider}/${r.model}`;
    if (seen.has(k)) throw new Error(`free-router: duplicate route ${k}`);
    seen.add(k);
    for (const [k, v] of Object.entries(r.tasks ?? {})) if (!['general','coding','research','reasoning','quick'].includes(k) || !Number.isInteger(v) || v < 0 || v > 10) throw new Error('Invalid task score');
    for (const k of ['maxTools','maxOutputTokens']) if (r[k] !== undefined && (!Number.isInteger(r[k]) || r[k] < (k === 'maxTools' ? 0 : 1))) throw new Error('Invalid route limit');
    if (r.enabled !== undefined && typeof r.enabled !== 'boolean') throw new Error('Invalid enabled flag');
    if (r.reasoningEffort !== undefined && (typeof r.reasoningEffort !== 'string' || !r.reasoningEffort)) throw new Error('Invalid reasoning effort');
    return { ...r, tasks: { ...r.tasks } };
  });
  const number = (k, fallback) => { if (raw[k] === undefined) return fallback; if (!Number.isSafeInteger(raw[k]) || raw[k] <= 0) throw new Error('Invalid ' + k); return raw[k]; };
  if (raw.maxAttempts !== undefined && (!Number.isSafeInteger(raw.maxAttempts) || raw.maxAttempts < 0)) throw new Error('Invalid maxAttempts');
  // Optional paid fallback. Defaults to disabled so current fail-closed behaviour is unchanged.
  const f = raw.fallback ?? {};
  const fbToken = f.maxOutputTokens;
  if (fbToken !== undefined && (!Number.isSafeInteger(fbToken) || fbToken <= 0)) throw new Error('Invalid fallback.maxOutputTokens');
  const fallbackCfg = {
    enabled: f.enabled === true,
    provider: typeof f.provider === 'string' && f.provider ? f.provider : undefined,
    model: typeof f.model === 'string' && f.model ? f.model : undefined,
    label: typeof f.label === 'string' ? f.label : undefined,
    maxOutputTokens: fbToken !== undefined ? fbToken : undefined,
    reasoningEffort: typeof f.reasoningEffort === 'string' && f.reasoningEffort ? f.reasoningEffort : undefined,
  };
  if (fallbackCfg.enabled && !fallbackCfg.provider) throw new Error('free-router: a paid fallback requires a provider');
  if (fallbackCfg.enabled && !fallbackCfg.model) throw new Error('free-router: a paid fallback requires a model');
  if (fallbackCfg.provider === providerId) throw new Error('free-router: the paid fallback cannot route through the router itself');
  const statePath = raw.statePath ?? join(homedir(), '.dsh/data/free-router-state.json');
  return { providerId, modelId, chain, fallback: fallbackCfg, statePath: statePath.startsWith('~/') ? join(homedir(), statePath.slice(2)) : statePath,
    maxOutputTokens: number('maxOutputTokens', 8192), maxAttempts: Number.isInteger(raw.maxAttempts) && raw.maxAttempts >= 0 ? raw.maxAttempts : 0,
    quotaCooldownMs: number('quotaCooldownMs', 3600000), rateLimitCooldownMs: number('rateLimitCooldownMs', 600000), authCooldownMs: number('authCooldownMs', 3600000), errorCooldownMs: number('errorCooldownMs', 120000), maxCooldownMs: number('maxCooldownMs', 86400000) };
}


export function readConfig(raw = {}) { return normalizeConfig(Object.fromEntries(Object.entries(raw).map(([k,v]) => [k, v && typeof v.get === 'function' ? v.get() : v]))); }
