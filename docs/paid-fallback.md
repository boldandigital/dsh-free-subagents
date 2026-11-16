# Paid fallback

The free-subagents router optimizes for one thing: **never spend money on a
delegated child.** Its default is to fail closed. The paid fallback is the
single, deliberate, human-armed exception.

## Default behaviour (unchanged)

With no fallback configured, an exhausted or unfit free pool produces a terminal
error for the child:

| code | meaning |
|---|---|
| `QUOTA` | every approved free route is cooling down (parked) |
| `NO_SUITABLE_FREE_ROUTE` | free routes exist but none fit the request/modality/limits |

No paid model is ever substituted. The plugin's child guard in `lib/index.js`
rejects any top-level attempt to select a model outside the approved pool.

Local models belong in the **free pool**, not just the fallback: any connected
provider (OMLX, Ollama, an OpenAI-compatible server) can be added as an
ordinary free route the same way a cloud free model is, which keeps spending at
zero even more easily. See the README.

## Arm it in Plugins → Free Subagents

The **Paid fallback** panel:

1. Pick a provider from **any installed provider** (the picker is not restricted
   to OpenRouter/Google/NVIDIA).
2. Pick a model from that provider's live catalog.
3. Optionally pin a **reasoning level** for the fallback. The options are the
   levels that the chosen model actually reports; "Provider default" leaves the
   level unset. A level the model cannot serve fails the request rather than
   being ignored, so changing the model clears a stale level.
4. Set an optional **max output tokens** cap for the fallback.
5. Tick **"I confirm this uses a paid / token-plan allocation"**.
6. Flip the toggle on.

The toggle is disabled until the confirm box is ticked, so arming always passes
an explicit human consent step. Un-toggling at any time restores fail-closed.

## Runtime semantics

- The fallback runs **once, after every free route has been tried and produced
  no output**.
- It is **not** used to continue a partially produced stream. If a free route
  already emitted content, the request fails with that route's error.
- The output cap is `min(fallback.maxOutputTokens, config.maxOutputTokens,
  model.defaultMaxTokens, request maxTokens)` — the same clamping the free
  routes get — so a burst of exhausted free routes cannot run the paid model
  beyond the cap.
- Fallback attempts are recorded in the ledger under a separate
  `fallback/<provider>/<model>` namespace (stats and cooldown parks), so they
  never collide with a free route's cooldowns and never show up as a free route.

## Config reference

```yaml
free-router:
  fallback:
    enabled: true            # off by default
    provider: minimax        # any installed provider
    model: MiniMax-Text-01
    label: MiniMax Text 01   # optional display name
    maxOutputTokens: 8192    # optional cap
    reasoningEffort: ''      # optional, like a free route
```

Validation rules (`lib/config.js` / `lib/config-schema.js`):

- A disabled fallback needs nothing and preserves any pre-filled provider/model
  so the GUI picker stays populated.
- An enabled fallback requires both a `provider` and a `model`, throws
  otherwise.
- The fallback cannot route through the router's own `free-auto` provider.
- An invalid `maxOutputTokens` (< 1) is rejected.
- A `reasoningEffort` the paid model does not report is not downgraded: the
  fallback attempt fails with `NO_SUITABLE_FREE_ROUTE` and no paid call is
  made.

## Privacy

The fallback routes through DSH's normal provider dispatch; the plugin still
stores no keys and reads no account data. The provider sees whatever a normal
call to it would see.