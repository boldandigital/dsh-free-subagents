#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
if ((process.argv[2] ?? 'status') !== 'status') throw new Error('Usage: node cli.mjs status [ledger path]');
const file = process.argv[3] ? resolve(process.argv[3]) : join(homedir(), '.dsh/data/free-router-state.json');
try {
  const x = JSON.parse(readFileSync(file, 'utf8'));
  console.log(JSON.stringify({ lastServed: x.lastServed ?? null, coolingDown: Object.entries(x.entries ?? {}).filter(([, s]) => s.until > Date.now()).map(([route, s]) => ({ route, code: s.code, availableAfter: new Date(s.until).toISOString() })), performance: x.stats ?? {} }, null, 2));
} catch (e) {
  if (e.code === 'ENOENT') console.log('No routed requests recorded yet.');
  else throw e;
}
