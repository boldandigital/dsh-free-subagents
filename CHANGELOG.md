# Changelog

## 0.1.9

**Opt-in paid fallback.** A new **Paid fallback** panel in Plugins → Free
Subagents lets a human arm a single paid model from any installed provider.
After the entire free pool has been tried and produced nothing, the router
runs one attempt on that model instead of failing closed. Off by default,
so an operator who touches nothing keeps the previous fail-closed behaviour.
Arming requires an explicit cost confirmation; the fallback output is capped
and its attempts are recorded under a `fallback/<provider>/<model>` ledger
namespace so they never collide with free-route cooldowns. A partial answer
is never continued by the paid model.

**Local models as free routes.** The free pool is no longer limited to
OpenRouter/Google/NVIDIA: any connected provider — including local models like
OMLX, Ollama, or any OpenAI-compatible server registered in DSH — can be added
as an ordinary free route once confirmed as free-tier. OpenRouter remains the
only provider whose free routes must additionally end in `:free`. Local routes
get full rotation, cooldowns, ledger and fail-over treatment.

## 0.1.8

**Three-slot child admission (Harness-native).** The bundle now sets
`maxActiveSubagents: 3` on the host `subagent` entry, capping simultaneous
child activations per root conversation and sharing that cap across ordinary
subagents, Agent Teams and nested children. The root agent does not consume a
slot. A saved user value in **Plugins → Subagent** overrides this default; a
limit saved above three must be lowered to three to get the intended
behaviour.

**Concurrent route rotation.** Concurrent requests now reserve their starting
rotation position before awaiting any provider work, so three simultaneous
requests with three equally ranked eligible routes start on three different
routes even before one finishes. Task ranking, per-route settings and quota
fallback before output are unchanged.

**Integration runner ported to DSH 0.2.2-rc.3.** `test/integration/runtime.mjs`
uses `agentTeams.setEnabled` and `subagents.startActivation` with a top-level
`parent`/`prompt`, holds three children, asserts the fourth gets
`ACTIVATION_LIMIT_REACHED`, confirms a replacement starts after disposal, and
covers fresh and forked routing with Team mode on and off while the parent
keeps its model. A new offline `test/rotation.test.mjs` proves the concurrent
starting-position distribution. README and docs/compatibility.md are aligned
with `engines.dsh` (`>=0.2.2-rc.3`).

## 0.1.7

The Settings page now shows the plugin's own artwork in the navigation, the
same mark the Plugin Manager shows for the plugin row. The plugin registered a
`settings.section` but no `settings.section.icon`, so the shell kept its
default glyph and every plugin looked the same in the Settings list.

## 0.1.6

Declared compatibility with DSH 0.2.2-rc.3 and later
(`engines.dsh: ">=0.2.2-rc.3"`). The previous range admitted rc.1, whose
`dsh-lsp-stdio` dependency resolves differently on a rc.3 host; the plugin now
states the release it is verified against. No routing behaviour changed.

## 0.1.5

Added the DSH Plugin Hub listing badge to the README. The plugin is listed at
https://dsh-plugin.org/plugins/boldandigital/dsh-free-subagents, so the badge
is now true. No code changed.

## 0.1.2

Declared compatibility with DSH 0.2.2-rc.2 and later (`engines.dsh: ">=0.2.2-rc.1"`). The previous exact pin, `0.2.2-rc.1`, made the plugin manager refuse to load the bundle on a rc.2 host, so delegated children silently fell back to the parent's own model instead of the free pool. No routing behaviour changed; the plugin is verified against rc.2 with a delegated child request answered through the router in the running app.

## 0.1.1

Fixed how a delegated task is classified. The router read the last two user
messages of a request, which in a child session are the injected skill
catalogue and the time context - both host boilerplate, and the catalogue
mentions code, coding, sources and formats. Every child was therefore
classified as a coding task, so the configured Research, Reasoning and Quick
preferences never took effect and all children shared one route. The task is
now read from the instruction itself, excluding the injected context and the
delivery note the host appends to it.

Fixed the rotation that spreads child requests across the free pool. The
router rotated the chain and then sorted it by score, and because the sort is
stable the rotation was undone - so the cursor had no effect and the
best-scoring route served every child. Routes now rank within a one-point band
of each other are treated as interchangeable and rotate from one request to
the next, while a route the user rates clearly higher still wins the first
attempt and every route can still serve as a fallback.

The delegation check no longer requires a parent session id, so a child can
never silently fall back to the parent's paid model.

## 0.3.0

Added Plugin Manager settings, connected-provider/model discovery, task preferences, live limits and per-route switches. Empty setups fail closed. Distribution defaults contain no personal selections.

## 0.3.2

Fixed the settings page rendering blank: the client module did not declare the `remote` service, so the slot error boundary replaced the page with an empty element. The page now also appears in Plugins → Free Subagents. Task preferences use Low/Medium/High buttons, and each route can set its own reasoning effort from the levels its model declares.

## 0.3.3

Refreshed the settings interface: route cards with a title, provider id, toggle and danger action, segmented Low/Medium/High task preferences, right-aligned numeric limits, a status pill, and a primary Save action. Styling uses the host design tokens, so it follows the app theme. No behaviour or stored data changed.

## 0.3.4

Per-route reasoning effort verified against the live providers. Seven of the ten
pooled models accept `high` and produce visible reasoning; the rest declare no
level and DSH refuses the effort before any provider call. The pool in the
profile carries the effort, never the package. See docs/verification.md.

## 0.1.0 (first public release)

The same work as 0.3.5 below, published for the first time as `dsh-free-subagents`.

## 0.3.5

Pool trimmed on measured evidence: poolside/laguna-xs-2.1 (300s idle timeouts),
the three Gemini routes (the app's tool catalogue is rejected by Gemini, and the
free tier allows 20 requests per model per day) and nemotron-3-ultra (completes
with no content) are out of the profile pool. The remaining five routes are
re-measured with their reasoning effort, and a delegated child request was
answered through the plugin in the running app. See docs/verification.md.
