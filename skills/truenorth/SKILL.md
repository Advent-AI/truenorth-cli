---
name: truenorth
description: "Discover and call TrueNorth agent tools dynamically through the tn CLI."
homepage: https://app.true-north.xyz
metadata:
  { "openclaw": { "always": false, "emoji": "📈", "homepage": "https://app.true-north.xyz", "requires": { "bins": ["tn"] }, "install": [{ "id": "node", "kind": "node", "package": "@truenorth-ai/cli@latest", "global": true, "bins": ["tn"], "label": "Install TrueNorth CLI (npm)" }] } }
---

# TrueNorth agent tools

Use the CLI's runtime discovery instead of assuming that a tool name or schema
is still current.

## Workflow

1. Run `tn tools --json --schema` to discover tools and their current schemas.
2. Select a tool from that response.
3. Run `tn call <tool> ... --json` for one call, or `tn batch ... --json` for
   independent calls that can run together.
4. Summarize the returned `result` values for the user.

The CLI is a thin wrapper around the agent-tools API. Never invent tool names or
arguments. Refresh discovery when a call reports an unknown tool or input
validation error.

See `examples.md` for invocation syntax.
