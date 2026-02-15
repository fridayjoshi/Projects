#!/bin/bash
#
# ECHO Hook: Code Complexity Analyzer
# Analyzes code complexity when files are written
#

set -euo pipefail

# Read event payload
EVENT=$(cat)
EVENT_TYPE=$(echo "${EVENT}" | jq -r '.event')
TOOL_NAME=$(echo "${EVENT}" | jq -r '.tool.name // "unknown"')

# Only run on AfterToolCall for write_file or exec (with file output)
if [ "${EVENT_TYPE}" != "AfterToolCall" ]; then
  exit 0
fi

if [ "${TOOL_NAME}" != "write_file" ]; then
  exit 0
fi

# Extract file path
FILE_PATH=$(echo "${EVENT}" | jq -r '.tool.input.path // ""')

if [ -z "${FILE_PATH}" ] || [ ! -f "${FILE_PATH}" ]; then
  exit 0
fi

# Determine file type
EXT="${FILE_PATH##*.}"

# Create complexity report directory
REPORT_DIR="${HOME}/.config/moltis/complexity"
mkdir -p "${REPORT_DIR}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="${REPORT_DIR}/complexity_${TIMESTAMP}.md"

echo "# Code Complexity Analysis" > "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"
echo "**File:** ${FILE_PATH}" >> "${REPORT_FILE}"
echo "**Analyzed:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"

# Run appropriate analyzer based on file type
case "${EXT}" in
  py)
    # Python complexity analysis
    if command -v radon &> /dev/null; then
      echo "## Cyclomatic Complexity" >> "${REPORT_FILE}"
      radon cc "${FILE_PATH}" -s >> "${REPORT_FILE}" 2>&1 || echo "Analysis failed" >> "${REPORT_FILE}"
      echo "" >> "${REPORT_FILE}"
      
      echo "## Maintainability Index" >> "${REPORT_FILE}"
      radon mi "${FILE_PATH}" -s >> "${REPORT_FILE}" 2>&1 || echo "Analysis failed" >> "${REPORT_FILE}"
      echo "" >> "${REPORT_FILE}"
    fi
    ;;
    
  js|ts|jsx|tsx)
    # JavaScript/TypeScript complexity
    if command -v eslint &> /dev/null; then
      echo "## ESLint Analysis" >> "${REPORT_FILE}"
      eslint "${FILE_PATH}" >> "${REPORT_FILE}" 2>&1 || echo "No issues found or analysis failed" >> "${REPORT_FILE}"
      echo "" >> "${REPORT_FILE}"
    fi
    ;;
    
  sh)
    # Shell script analysis
    if command -v shellcheck &> /dev/null; then
      echo "## ShellCheck Analysis" >> "${REPORT_FILE}"
      shellcheck "${FILE_PATH}" >> "${REPORT_FILE}" 2>&1 || echo "No issues found" >> "${REPORT_FILE}"
      echo "" >> "${REPORT_FILE}"
    fi
    ;;
esac

# General stats (lines of code, comments, etc.)
echo "## File Statistics" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"
echo "- **Total Lines:** $(wc -l < "${FILE_PATH}")" >> "${REPORT_FILE}"

if command -v cloc &> /dev/null; then
  echo "" >> "${REPORT_FILE}"
  echo "### Detailed Breakdown" >> "${REPORT_FILE}"
  echo '```' >> "${REPORT_FILE}"
  cloc --quiet "${FILE_PATH}" >> "${REPORT_FILE}" 2>&1 || echo "cloc analysis failed" >> "${REPORT_FILE}"
  echo '```' >> "${REPORT_FILE}"
fi

exit 0
