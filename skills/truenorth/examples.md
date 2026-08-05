# TrueNorth CLI execution reference

## Discover tools

```bash
tn tools --json --schema
tn tools --filter <keyword> --json --schema
tn tools --names <tool_one>,<tool_two> --json --schema
```

The discovery response is `{ "tools": [...] }`. With `--schema`, each entry
contains `name`, `description`, `input_schema`, and `output_schema`.

## Call one tool

```bash
tn call <tool_name> --argument value --json
tn call <tool_name> --argument value --result
tn call <tool_name> -f arguments.json --json
```

Dynamic inputs accept all of these forms:

```bash
tn call <tool_name> --token-address bitcoin --json
tn call <tool_name> --token-address=bitcoin --json
tn call <tool_name> token_address=bitcoin --json
```

Objects, arrays, numbers, booleans, and null values are decoded as JSON:

```bash
tn call <tool_name> --payload '{"token":"SOL"}' --limit 10 --json
```

## Call several tools

```bash
tn batch \
  '[{"tool":"<tool_one>","args":{"key":"value"}},{"tool":"<tool_two>","args":{}}]' \
  --json

tn batch -f calls.json --json
```

Use only tool names and arguments returned by `tn tools --json --schema`.
