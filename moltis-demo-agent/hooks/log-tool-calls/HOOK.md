+++
name = "log-tool-calls"
description = "Log all tool executions to a JSONL file for auditing"
events = ["BeforeToolCall", "AfterToolCall"]
command = "./handler.sh"
timeout = 5
+++

# Tool Call Logger Hook

This hook logs every tool execution to a JSONL file for auditing and debugging.

## Events

- **BeforeToolCall**: Logs tool name and arguments before execution
- **AfterToolCall**: Logs tool result and execution time

## Output

Logs are written to `~/.config/moltis/logs/tool-calls.jsonl`

Each line is a JSON object with:
- `timestamp`: ISO 8601 timestamp
- `event`: "before" or "after"
- `tool`: Tool name
- `input`: Tool arguments (before only)
- `output`: Tool result (after only)
- `duration_ms`: Execution time in milliseconds (after only)

## Usage

Enable this hook in `moltis.toml`:

```toml
[[hooks]]
name = "log-tool-calls"
command = "./hooks/log-tool-calls/handler.sh"
events = ["BeforeToolCall", "AfterToolCall"]
enabled = true
```

## Example Log

```json
{"timestamp":"2026-02-14T12:00:00Z","event":"before","tool":"exec","input":{"command":"ls -la"}}
{"timestamp":"2026-02-14T12:00:01Z","event":"after","tool":"exec","output":{"status":"success","stdout":"..."},"duration_ms":234}
```
