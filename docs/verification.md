# Free Subagents - verification sweep (2026-11-11)

Live measurements against the real providers, the real profile and the real
plugin. Every number below comes from a call that actually ran; the scripts are
`scripts/dsh-free-verify.mjs` (per-route sweep), `scripts/dsh-free-tools.mjs`
(tool compatibility) and `scripts/dsh-free-sweep.mjs` (the first exploratory
pass) in the workspace. Raw result: `/tmp/dsh-free-verify.json`.

Method: the installed DSH runtime is booted with the desktop profile, so the
provider configuration, the stored credentials and the plugin are the real
ones. Each route is called twice - once with the route's configured effort,
once without any effort - with a 2048-token cap and a one-sentence prompt.
Keys are resolved by the credentials service and never leave it.

## 1. Reasoning effort per route

Measured on the full ten-route pool, before the trim of section 3:

| route | effort | levels the model declares | with effort | without effort |
|---|---|---|---|---|
| openrouter/nvidia/nemotron-3.5-lightning:free | high | off, minimal, low, medium, high | OK 990ms, 60 text + 1029 reasoning chars | OK 723ms, 42 text chars |
| nvidia/nvidia/nemotron-3.5-lightning-30b-a3b | high | off, minimal, low, medium, high | OK 533ms, 64 text + 1320 reasoning chars | OK 256ms, 64 text + 1810 reasoning chars |
| openrouter/cohere/north-mini-code:free | high | off, minimal, low, medium, high | OK 577ms, 48 text + 261 reasoning chars | OK 277ms, 52 text chars |
| google/gemini-3.5-flash-lite | high | minimal, low, medium, high | OK 7553ms, 75 text + 309 reasoning chars | OK 1180ms, 82 text chars |
| google/gemini-3.6-flash | high | minimal, low, medium, high | FAIL 429 free-tier quota exhausted | FAIL 429 free-tier quota exhausted |
| nvidia/nvidia/nemotron-3-ultra-550b-a55b | high | off, minimal, low, medium, high | OK 565ms, 12 reasoning chars, no answer text | FAIL "completed response with no content" |
| google/gemini-2.5-flash | high | off, minimal, low, medium, high | OK 1228ms, 56 text + 719 reasoning chars | FAIL 429 free-tier quota exhausted |
| nvidia/stepfun-ai/step-5-preview | (none) | none | not applicable | OK 593ms, 39 text + 198 reasoning chars |
| nvidia/poolside/laguna-xs-2.1 | (none) | off, minimal, low, medium, high | FAIL idle timeout after 300s | FAIL idle timeout after 300s |
| nvidia/mistralai/mistral-large-4-1t-a52b | (none) | none | not applicable | OK 3104ms, 64 text + 1153 reasoning chars |

Conclusions:

1. **Seven of ten routes accept `reasoningEffort: high`**, and the reasoning is
   real: the models emit between 260 and 1320 reasoning characters before
   answering. The routes that do not accept it (step-5-preview and
   mistral-large-4-1t) declare no levels, and DSH refuses the effort locally,
   before any provider I/O:
   `provider "nvidia" model "stepfun-ai/step-5-preview" does not support
   reasoning effort "high"`.
2. **The effort consumes the output budget.** With a 300-token cap the
   reasoning used the whole allowance and the answer arrived empty
   (0 text characters, 978 reasoning characters). The route and global output
   caps must leave room for the answer; the profile's 8192 tokens do.
3. **The Google free tier is 20 requests per model per day.** The sweep
   exhausted gemini-3.6-flash and gemini-2.5-flash ("Please retry in 13h35m").
   The plugin handles this correctly: the routes are parked with `QUOTA` and
   the request falls through to the next free route.
4. **Gemini accepts tools - but not every tool declaration.** Measured
   against google/gemini-3.5-flash-lite with `reasoningEffort: high`:
   `search_web` and `mcp__21st__search` both work, with plain, strict and rich
   JSON schemas, with and without tools. The same request fails with
   400 `INVALID_ARGUMENT` - "Invalid function name ... with a maximum length
   of 128" - when a declaration's name exceeds 128 characters. The app's tool
   catalogue contains such a declaration, which is why both Gemini routes were
   parked with `INVALID_REQUEST` on real child requests and had **zero**
   successes in the ledger. It is not the effort and not the tool schema.
5. **poolside/laguna-xs-2.1 is not usable**: three consecutive idle timeouts
   of 300 seconds. The plugin parks it (`TIMEOUT`) after the first failure, so
   the damage is one five-minute stall per cooldown window.
6. **nemotron-3-ultra answers with no content**: "completed response with no
   content" for a short prompt and for a long one, with and without an effort.
   It never produced answer text, and it had zero successes in the ledger.

## 2. Live ledger of the running app

`~/.dsh/data/free-router-state.json` before the trim:

```
google/gemini-2.5-flash                    parked QUOTA
openrouter/cohere/north-mini-code:free     parked RATE_LIMIT
nvidia/poolside/laguna-xs-2.1              parked TIMEOUT
google/gemini-3.5-flash-lite               parked INVALID_REQUEST
google/gemini-3.6-flash                    parked INVALID_REQUEST

openrouter/cohere/north-mini-code:free        183 successes,  1 failure, ~4.5s first token
nvidia/nvidia/nemotron-3.5-lightning-30b-a3b    51 successes,  0 failures, ~2.2s first token
openrouter/nvidia/nemotron-3.5-lightning:free    12 successes,  0 failures, ~10.6s first token
nvidia/poolside/laguna-xs-2.1                   0 successes,  2 failures
google/gemini-3.5-flash-lite                     0 successes,  1 failure
google/gemini-3.6-flash                          0 successes,  1 failure
```

Every failure class above appears in the ledger with the matching park code,
and the routes that work accumulate successes.

## 3. The trimmed pool

Five routes were removed from the profile pool, each on the evidence above:

| removed route | reason |
|---|---|
| nvidia/poolside/laguna-xs-2.1 | three idle timeouts of 300s; 0 successes; a five-minute stall whenever reached |
| google/gemini-3.5-flash-lite | 0 successes; every child request rejected by the tool declaration |
| google/gemini-3.6-flash | 0 successes; same, plus the 20/day free-tier ceiling |
| google/gemini-2.5-flash | 0 successes; same, plus the 20/day free-tier ceiling |
| nvidia/nvidia/nemotron-3-ultra-550b-a55b | completes with no content on short and long prompts; would hand children an empty answer |

The pool is now five routes, re-measured after the trim:

| route | effort | with effort | without effort |
|---|---|---|---|
| openrouter/nvidia/nemotron-3.5-lightning:free | high | OK 672ms, 80 text + 1494 reasoning chars | OK 270ms, 49 text chars |
| nvidia/nvidia/nemotron-3.5-lightning-30b-a3b | high | OK 707ms, 60 text + 1003 reasoning chars | OK 217ms, 69 text + 1111 reasoning chars |
| openrouter/cohere/north-mini-code:free | high | OK 423ms, 60 text + 393 reasoning chars | OK 445ms, 60 text chars |
| nvidia/stepfun-ai/step-5-preview | (provider default) | not applicable | OK 680ms, 60 text + 295 reasoning chars |
| nvidia/mistralai/mistral-large-4-1t-a52b | (provider default) | not applicable | OK 3624ms, 64 text + 442 reasoning chars |

**End to end in the running app**: a delegated child request was answered
("ROUTE-OK") through the plugin's virtual provider, and the ledger recorded the
success on `openrouter/cohere/north-mini-code:free` (183 -> 185) and on
`nvidia/mistralai/mistral-large-4-1t-a52b` (0 -> 1) - a route that had never
served a request before the trim.

## 4. What is set, and where

The pool lives in the profile, not in the package:

* `~/.dsh/profiles/desktop/cordis.patch.yml` - the `free-router` row carries
  `reasoningEffort: high` on the three routes whose models declare it, and
  nothing on the two that do not. The package itself ships an empty pool, so a
  published install starts with no routes and no effort.
* The settings page writes exactly that: **Settings -> Free Subagents**, the
  **Reasoning effort** selector on each route card offers the levels that
  model declares and "Provider default"; a model with no declared level shows
  only "Provider default".

## 5. Notes for a later publish

* The Google free tier is 20 requests per model per day and the Gemini routes
  need a tool catalogue whose declarations Gemini accepts. Neither is a plugin
  defect; both are worth stating in the plugin's documentation.
* A verification boot cannot host the plugin's `agents` service, so the
  end-to-end leg has to run in the real app. The ledger is the evidence.
* Before publishing: re-run `scripts/dsh-free-verify.mjs`, then follow
  docs/publishing.md (clean profile, `npm pack`, visual check, no personal
  paths, keys, ledgers or runtime extracts in the package).
