import z from '@deepseek-ai/schemastery';
import { normalizeConfig } from './config.js';
const positive = () => z.number().step(1).min(1);
const route = z.object({
 provider: z.string().min(1).required(), model: z.string().min(1).required(),
 freeTier: z.const(true).required(), enabled: z.boolean().default(true), label: z.string(),
 tasks: z.object(Object.fromEntries(['general','coding','research','reasoning','quick'].map(k=>[k,z.number().step(1).min(0).max(10)]))),
 maxTools: z.number().step(1).min(0), maxOutputTokens: positive(),
 reasoningEffort: z.string().min(1),
});
const fallback = z.object({
 enabled: z.boolean().default(false),
 provider: z.string().min(1),
 model: z.string().min(1),
 label: z.string(),
 maxOutputTokens: positive(),
 reasoningEffort: z.string().min(1),
});
export const Config = z.object({
 providerId: z.string().min(1).default('free-auto'), modelId: z.string().min(1).default('auto'), statePath: z.string().default('~/.dsh/data/free-router-state.json'),
 chain: z.transform(z.array(route), value => { normalizeConfig({chain:value}); return value; }).default([]).volatile(), maxOutputTokens: positive().default(8192).volatile(), maxAttempts: z.number().step(1).min(0).default(0).volatile(),
 fallback: z.transform(fallback, value => { normalizeConfig({ fallback: value }); return value; }).default({ enabled: false }).volatile(),
 ...Object.fromEntries(Object.entries({quotaCooldownMs:3600000,rateLimitCooldownMs:600000,authCooldownMs:3600000,errorCooldownMs:120000,maxCooldownMs:86400000}).map(([k,v])=>[k,positive().default(v).volatile()])),
});
