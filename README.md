# Free Subagents for DeepSeek Harness

Choose connected free-tier models for ordinary subagents and Agent Teams. The main agent keeps its selected model. Task preferences, observed response time and reliability choose a route; quota failures move to another approved route before output begins.

## Model Display

The **Free Subagents Router (automatic for subagents)** model appears in the model picker with a clarified label. Its purpose is automatic routing for subagents and Agent Teams — you do not need to select it to activate the plugin. Your normal main chat model selection is preserved for direct interactions.

## Installation

```sh
dsh plugin --profile web add dsh-free-subagents
```

The plugin is a normal bundle, so any profile works — `desktop`, `web` or `headless`. Restart the app, then open **Settings → Free Subagents** or **Plugins → Free Subagents**. Connect providers in DSH's normal Models settings first. Select a provider and model, confirm its free allocation, add it, then save.

This release supports OpenRouter (`:free` models only), Google and NVIDIA. Credentials, advertised models, quota and billing eligibility are separate facts. Google/NVIDIA accounts must actually use their intended free allocation; the plugin cannot inspect or change billing plans. No keys are stored by this plugin.

A fresh distribution starts with an empty pool. Empty or disabled pools block child requests. Exhausted routes remain parked across restarts. No unapproved or paid fallback is substituted.

## Controls

Enable/remove routes, set General/Coding/Research/Reasoning/Quick preference strength, set route output/tool limits, and change global output/attempt/cooldown limits. Preferences are chosen as **Low**, **Medium** or **High**, which stand for the 0–10 scores the router ranks on; the current bucket is shown pressed. Preferences are heuristics, not model benchmarks. Zero maximum attempts means all eligible routes at most once.

Rating several routes the same for a task puts them in the same rotation tier, so their free allocation is shared instead of one model serving every child. Rate a route lower and it drops out of that tier and becomes a fallback only.

**Local models are first-class free routes.** Add any connected provider to the pool — Google, NVIDIA, OpenRouter (`:free`), or a local model such as OMLX, Ollama, or any OpenAI-compatible server registered in DSH (e.g. `omlx-local` → `mlx-community/Qwen3.8-27B-4bit`). OpenRouter is the only provider that additionally requires the model id to end in `:free`. Everything else is accepted once you explicitly confirm a **free allocation**; the router treats local routes like any other route (rotation, cooldowns, ledger, fail-over).

**Child concurrency.** To protect free allocations, the bundle sets Harness's
`maxActiveSubagents` to `3` on the host `subagent` entry: at most three
simultaneous child activations per root conversation, shared by ordinary
subagents, Agent Teams and nested children. The root agent does not consume a
slot. This is an overrideable default. A lower limit saved in **Plugins →
Subagent** is preserved; if you previously saved a limit above three, lower it
to three there for this bundle's behaviour. At capacity, a new child is refused
with `ACTIVATION_LIMIT_REACHED` until an existing child is disposed.

**Reasoning effort** is per route. The selector lists exactly the levels the model declares in DSH's registry, and **Provider default** sends none. A route whose model does not declare the chosen level is skipped rather than called, so an unsupported level can never break a child request. The main agent's own effort never leaks into a route that has none.

The page follows the host theme: route cards, a segmented control per task, toggle switches, status pills and one primary Save action. Save applies to subsequent calls; active calls use their starting settings. Drafts are page-local: save before leaving. Catalog refresh retains drafts. Conflicting edits are rejected; reload saved settings before trying again. User choices are saved by DSH in the profile, independently of package defaults.

## Paid fallback (opt-in, off by default)

By default the router **fails closed**: when every approved free route is cooling down or unfit for a request, the child request fails with `QUOTA` / `NO_SUITABLE_FREE_ROUTE` rather than spending money. That remains true unless a human arms the **Paid fallback** in the settings page.

When armed, the router runs **one** attempt on a chosen paid model after the entire free pool has been tried and produced nothing — it is a last resort, never a routine route. The paid model can come from **any installed provider** (MiniMax, OpenRouter paid models, Groq, Google, NVIDIA, …) and is selected from the same live catalog. It is marked **PAID** in the UI, requires a one-time "this may incur cost" confirmation, and its output is capped so a burst of exhausted free routes cannot run the paid model unbounded. Like a free route, the fallback can pin its own **reasoning level** from the levels that model reports; a level the model cannot serve fails the request instead of silently changing the model. Fallback attempts are recorded in the ledger under their own `fallback/<provider>/<model>` namespace, so they never collide with a free route's cooldowns. Un-arming it at any time restores the fail-closed default.

The paid fallback is not used to continue a partially produced answer: if a free route already emitted content, the request fails with that route's error instead of stitching two models together.

## Verified behaviour

Every route in a reference pool was measured against the real providers, with the real profile and the real plugin - latency, reasoning characters, the exact error strings and the ledger parks that follow. The findings, including the three that surprised us (reasoning consumes the output budget, Google's free tier is 20 requests per model per day, and Gemini rejects tool declarations whose name exceeds 128 characters) are in [docs/verification.md](docs/verification.md).

## What this plugin talks to

- **Providers**: any provider the App can reach — OpenRouter (`:free` models only), Google, NVIDIA, and **local models** (OMLX, Ollama, any OpenAI-compatible server registered in DSH) can all sit in the **free pool**, each confirmed explicitly as free-tier. The optional **paid fallback** may also target any installed provider. This plugin stores no keys and reads no account data.
- **Files**: one local ledger, `~/.dsh/data/free-router-state.json`, holding model identities, cooldowns, approximate counters and timings - no prompts, no answers.
- **Network**: nothing beyond the model providers the pool names.
- **Compatibility**: DSH 0.2.2-rc.3 and later (verified on 0.2.2-rc.3), macOS / Linux / Windows, Node 22+. Preview plugin APIs may change.

## Behavior and privacy

Children select `free-auto/auto` through public agent APIs. Input is never silently truncated. Partial answers are never continued by another model. The routing ledger contains model identities, cooldowns, approximate counters and timings, without prompts or keys. Its default path is `~/.dsh/data/free-router-state.json`. Separate processes share cooldowns; concurrent statistics are approximate.

`npm test` runs offline behavior tests. `npm run status` inspects the local ledger. Integration testing requires a separately supplied DSH runtime; see docs/compatibility.md.

## Compatibility and removal

Test target: DSH 0.2.2-rc.3 and later, verified on 0.2.2-rc.3. Preview plugin APIs may change. This bundle edits no application files or built-in presets. Headless routing has no browser dependency. Some RC Team labels show inherited constructor options; actual child request headers identify the selected virtual model.

Disabling/uninstalling this plugin removes its enforcement and restores DSH's default child model inheritance. Finish active tasks first. Keep user settings and the ledger private. See docs/migration.md and docs/publishing.md.

## Where this plugin is published

- **npm** - [`dsh-free-subagents`](https://www.npmjs.com/package/dsh-free-subagents), the install path above.
- **Plugin market index** - [boldandigital/dsh-plugin-index](https://github.com/boldandigital/dsh-plugin-index), published with GitHub Pages and listed in the harness under **Plugins → Discover → Manage index sources**.
- **dsh-plugin.org** - the community hub finds plugins by the GitHub topic `dsh-plugin`, which this repository carries.
