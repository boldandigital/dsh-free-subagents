# Upgrade and rollback

Before upgrading, back up the plugin and affected profile patches privately. Preserve each profile's effective chain, task scores, limits and statePath through DSH's configuration editor. Explicit enabled=true preserves old enabled behavior. Verify all linked profiles before replacing personal bundle defaults with an empty distribution default.

Do not copy presets, rewrite user YAML from plugin code, restore duplicate shared DSH packages, or reset the routing ledger. Restart after replacing package code. Rollback restores the immediate prior plugin/profile snapshots while retaining the ledger and independent application startup repair. Check hashes before restoring to avoid overwriting later edits.
