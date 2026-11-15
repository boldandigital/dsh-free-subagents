# Compatibility

Target DSH 0.2.2-rc.3 and later (matches `package.json` `engines.dsh`), verified on 0.2.2-rc.3. Host APIs: adapter registration, agent/created, agent.model.select, scoped agent/request, config-editor/Settings, the subagent service (`subagents.startActivation` with a top-level `parent` and `prompt`), and Agent Teams (`agentTeams.setEnabled`). The bundle patches the host `subagent` row to default `maxActiveSubagents: 3`; a saved user value overrides it, and values above three must be lowered in **Plugins → Subagent** to get the intended three-slot behaviour.

Client uses the host React/module loader and settings.section slot, Settings/LLM/Credentials/Session remotes. No shared service/runtime packages are bundled. Schemastery is a small validation dependency, not a replacement DSH runtime.

Run offline unit tests (`npm test`) and the portable integration runner with `DSH_RUNTIME` pointing at an unpacked runtime directory containing package.json and node_modules:

```sh
DSH_RUNTIME=/path/to/unpacked-dsh node test/integration/runtime.mjs
```

The runner uses temporary profiles and simulated adapters, never live inference. It boots the real 0.2.2-rc.3 composition, verifies Settings, holds three subagent children (fresh and forked, Agent Teams on and off), confirms the fourth gets `ACTIVATION_LIMIT_REACHED`, confirms a replacement starts after disposal, and checks the parent keeps its selected model while every child routes to `free-auto/auto`. A successful simulation does not establish external model availability or free billing. Visually verify the installed Plugins page after restarting DSH.
