#!/bin/bash
#
# Moltis Hook: Log Tool Calls
# Logs all tool executions to a JSONL file for auditing
#

set -euo pipefail

# Log file location
LOG_DIR="${HOME}/.config/moltis/logs"
LOG_FILE="${LOG_DIR}/tool-calls.jsonl"

# Create log directory if it doesn't exist
mkdir -p "${LOG_DIR}"

# Read event payload from stdin
EVENT=$(cat)

# Extract event type and tool name
EVENT_TYPE=$(echo "${EVENT}" | jq -r '.event')
TOOL_NAME=$(echo "${EVENT}" | jq -r '.tool.name // "unknown"')

# Get current timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Log based on event type
case "${EVENT_TYPE}" in
  BeforeToolCall)
    # Log tool name and input
    LOG_ENTRY=$(jq -n \
      --arg ts "${TIMESTAMP}" \
      --arg event "before" \
      --arg tool "${TOOL_NAME}" \
      --argjson input "$(echo "${EVENT}" | jq '.tool.input // {}')" \
      '{timestamp: $ts, event: $event, tool: $tool, input: $input}')
    ;;
    
  AfterToolCall)
    # Log tool result and duration
    DURATION=$(echo "${EVENT}" | jq -r '.duration_ms // 0')
    LOG_ENTRY=$(jq -n \
      --arg ts "${TIMESTAMP}" \
      --arg event "after" \
      --arg tool "${TOOL_NAME}" \
      --argjson output "$(echo "${EVENT}" | jq '.output // {}')" \
      --arg duration "${DURATION}" \
      '{timestamp: $ts, event: $event, tool: $tool, output: $output, duration_ms: ($duration | tonumber)}')
    ;;
    
  *)
    # Unknown event type - log as-is
    LOG_ENTRY=$(jq -n \
      --arg ts "${TIMESTAMP}" \
      --arg event "unknown" \
      --argjson data "${EVENT}" \
      '{timestamp: $ts, event: $event, data: $data}')
    ;;
esac

# Append to log file
echo "${LOG_ENTRY}" >> "${LOG_FILE}"

# Exit 0 to continue (don't block execution)
exit 0
