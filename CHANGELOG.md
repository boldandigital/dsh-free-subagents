# Changelog

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
