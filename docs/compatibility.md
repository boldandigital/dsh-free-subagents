# Compatibility

Target DSH 0.2.2-rc.1 only. Host APIs: adapter registration, agent/created, agent.model.select, scoped agent/request, config-editor/Settings. Client uses the host React/module loader and settings.section slot, Settings/LLM/Credentials/Session remotes. No shared service/runtime packages are bundled. Schemastery is a small validation dependency, not a replacement DSH runtime.

Run offline unit tests and the portable integration runner with DSH_RUNTIME pointing at an unpacked runtime directory containing package.json and node_modules. The runner uses temporary profiles and simulated adapters, never live inference. A successful simulation does not establish external model availability or free billing. Visually verify the installed Plugins page after restarting DSH.
