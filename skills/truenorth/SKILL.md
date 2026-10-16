---
name: truenorth
description: "Discover and call TrueNorth agent tools dynamically through the tn CLI."
homepage: https://truenorth.xyz/
metadata:
  { "openclaw": { "always": false, "emoji": "📈", "homepage": "https://truenorth.xyz/", "requires": { "bins": ["tn"] }, "install": [{ "id": "node", "kind": "node", "package": "@truenorth-ai/cli@latest", "global": true, "bins": ["tn"], "label": "Install TrueNorth CLI (npm)" }] } }
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

## API key

Every `tn` command needs a TrueNorth API key, from `TN_API_KEY` or the key that
`tn login` saved. If a command fails with `No TrueNorth API key` or says
TrueNorth refused the key, ask the user to run `tn login` in their own terminal
(or to set `TN_API_KEY`), then retry. Never ask the user to paste the key into
the conversation.

See `examples.md` for invocation syntax.
