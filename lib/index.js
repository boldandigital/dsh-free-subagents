import { makeRouter } from './router.js';
import { readConfig } from './config.js';
export { normalizeConfig } from './config.js';
export const name = 'free-router';
export const inject = ['llm', 'agents', 'systemPrompt'];

/**
 * A delegated child is exactly a session whose header origin is 'subagent'.
 *
 * `parentSession` is deliberately NOT required: the runtime always sets it
 * (and the session header validator rejects a non-string value), so today the
 * check would be redundant - but if a future runtime ever produced a child
 * without it, requiring it would silently leave that child on the parent's
 * paid model. This plugin promises never to substitute a paid child, so the
 * identifier that means "delegated" is the only condition worth gating on.
 */
export function delegated(agent) {
  return agent?.session?.header?.origin === 'subagent';
}

/** Only public plugin APIs: adapter registration, agent creation, model selection, scoped request events. */
export function apply(ctx, raw) {
  const cfg = readConfig(raw), router = makeRouter(ctx, () => readConfig(raw));
  ctx.llm.registerAdapter([cfg.providerId], router.adapter);
  const route = Object.freeze({ provider: cfg.providerId, model: cfg.modelId });
  const attached = new WeakSet();
  function attach(agent) {
    if (!delegated(agent) || attached.has(agent)) return;
    attached.add(agent);
    if (!agent.model || typeof agent.model.select !== 'function' || !agent.ctx?.on) throw new Error('free-router: unsupported agent API; refusing to let a child use the parent model');
    // This is a durable, supported selection before the child's first model step.
    agent.model.select(route);
    const dispose = agent.ctx.on('agent/request', async (_payload, next) => {
      const proposal = await next();
      if (proposal.provider !== route.provider || proposal.model !== route.model) throw new Error('free-router: a delegated agent attempted to leave the approved free pool; request blocked');
      // Parent-specific caps and reasoning controls must not leak to another provider.
      return { ...proposal, maxTokens: Math.min(proposal.maxTokens ?? readConfig(raw).maxOutputTokens, readConfig(raw).maxOutputTokens) };
    });
    ctx.effect(() => dispose, 'free-router child guard');
  }
  ctx.on('agent/created', ({ agent }) => attach(agent));
  for (const agent of ctx.agents.list()) attach(agent);
  if (ctx.get('systemPrompt')) ctx.systemPrompt.section({
    name: 'free-router:delegation', order: 2850,
    text: 'Delegated agents automatically use the local Free Subagents plugin. It chooses among the configured free-tier models by task, supported inputs, observed response speed, and available quota. When delegating, omit provider, model, and reasoning_effort: the plugin owns child routing, including Agent Teams. Your own model selection is unchanged. If the free pool is exhausted, report that; do not substitute a paid child model.',
  });
  ctx.logger.info('Free Subagents enabled: %d approved routes; parent model unchanged', cfg.chain.length);
}
