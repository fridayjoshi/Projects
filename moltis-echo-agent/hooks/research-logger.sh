#!/bin/bash
#
# ECHO Hook: Research Logger
# Logs all research queries and findings to a structured knowledge base
#

set -euo pipefail

# Research log location
RESEARCH_DIR="${HOME}/.config/moltis/research"
mkdir -p "${RESEARCH_DIR}"

# Read event payload
EVENT=$(cat)
EVENT_TYPE=$(echo "${EVENT}" | jq -r '.event')
TOOL_NAME=$(echo "${EVENT}" | jq -r '.tool.name // "unknown"')

# Only log research-related tools
case "${TOOL_NAME}" in
  web_search|web_fetch|memory_search)
    ;;
  *)
    # Not a research tool, skip
    exit 0
    ;;
esac

# Get current timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATE=$(date +"%Y-%m-%d")
LOG_FILE="${RESEARCH_DIR}/${DATE}.md"

case "${EVENT_TYPE}" in
  BeforeToolCall)
    # Log query
    QUERY=$(echo "${EVENT}" | jq -r '.tool.input.query // .tool.input.url // "unknown"')
    
    # Initialize log file if needed
    if [ ! -f "${LOG_FILE}" ]; then
      echo "# Research Log - ${DATE}" > "${LOG_FILE}"
      echo "" >> "${LOG_FILE}"
    fi
    
    # Append query
    echo "## ${TIMESTAMP} - ${TOOL_NAME}" >> "${LOG_FILE}"
    echo "" >> "${LOG_FILE}"
    echo "**Query:** ${QUERY}" >> "${LOG_FILE}"
    echo "" >> "${LOG_FILE}"
    ;;
    
  AfterToolCall)
    # Log findings summary
    OUTPUT=$(echo "${EVENT}" | jq -r '.output // {}')
    
    # Extract relevant info based on tool
    case "${TOOL_NAME}" in
      web_search)
        RESULTS=$(echo "${OUTPUT}" | jq -r '.results // [] | length')
        echo "**Results:** ${RESULTS} sources found" >> "${LOG_FILE}"
        ;;
      web_fetch)
        URL=$(echo "${OUTPUT}" | jq -r '.url // "unknown"')
        echo "**Fetched:** ${URL}" >> "${LOG_FILE}"
        ;;
      memory_search)
        HITS=$(echo "${OUTPUT}" | jq -r '.results // [] | length')
        echo "**Memory Hits:** ${HITS} relevant entries" >> "${LOG_FILE}"
        ;;
    esac
    
    echo "" >> "${LOG_FILE}"
    echo "---" >> "${LOG_FILE}"
    echo "" >> "${LOG_FILE}"
    ;;
esac

exit 0
