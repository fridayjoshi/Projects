#!/bin/bash
#
# ECHO Hook: Weekly Synthesis
# Generates a weekly knowledge synthesis report every Sunday
#

set -euo pipefail

SYNTHESIS_DIR="${HOME}/.config/moltis/synthesis"
mkdir -p "${SYNTHESIS_DIR}"

# Get date range (last 7 days)
START_DATE=$(date -d '7 days ago' +"%Y-%m-%d")
END_DATE=$(date +"%Y-%m-%d")
REPORT_FILE="${SYNTHESIS_DIR}/synthesis_${END_DATE}.md"

echo "# Weekly Knowledge Synthesis" > "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"
echo "**Period:** ${START_DATE} to ${END_DATE}" >> "${REPORT_FILE}"
echo "**Generated:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"

# Research Activity
echo "## Research Activity" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"

RESEARCH_DIR="${HOME}/.config/moltis/research"
if [ -d "${RESEARCH_DIR}" ]; then
  QUERY_COUNT=$(find "${RESEARCH_DIR}" -name "*.md" -mtime -7 -exec grep -c "^## " {} \; 2>/dev/null | awk '{s+=$1} END {print s}')
  echo "- **Total Research Queries:** ${QUERY_COUNT:-0}" >> "${REPORT_FILE}"
  
  # List top topics
  echo "- **Top Research Topics:**" >> "${REPORT_FILE}"
  find "${RESEARCH_DIR}" -name "*.md" -mtime -7 -exec grep -h "^## " {} \; 2>/dev/null | \
    awk -F' - ' '{print $2}' | sort | uniq -c | sort -rn | head -5 | \
    awk '{print "  - " $2 " (" $1 " queries)"}' >> "${REPORT_FILE}"
fi

echo "" >> "${REPORT_FILE}"

# Code Analysis
echo "## Code Analysis" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"

COMPLEXITY_DIR="${HOME}/.config/moltis/complexity"
if [ -d "${COMPLEXITY_DIR}" ]; then
  ANALYSIS_COUNT=$(find "${COMPLEXITY_DIR}" -name "*.md" -mtime -7 | wc -l)
  echo "- **Files Analyzed:** ${ANALYSIS_COUNT}" >> "${REPORT_FILE}"
fi

echo "" >> "${REPORT_FILE}"

# Memory Growth
echo "## Memory Growth" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"

MEMORY_DIR="${HOME}/.openclaw/workspace/memory"
if [ -d "${MEMORY_DIR}" ]; then
  NEW_ENTRIES=$(find "${MEMORY_DIR}" -name "*.md" -mtime -7 | wc -l)
  echo "- **New Memory Files:** ${NEW_ENTRIES}" >> "${REPORT_FILE}"
  
  TOTAL_WORDS=$(find "${MEMORY_DIR}" -name "*.md" -mtime -7 -exec wc -w {} \; 2>/dev/null | awk '{s+=$1} END {print s}')
  echo "- **Words Added:** ${TOTAL_WORDS:-0}" >> "${REPORT_FILE}"
fi

echo "" >> "${REPORT_FILE}"

# Projects Activity
echo "## Projects Activity" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"

PROJECTS_DIR="${HOME}/.openclaw/workspace/Projects"
if [ -d "${PROJECTS_DIR}" ]; then
  # Git commits in last week
  cd "${PROJECTS_DIR}" || exit 0
  COMMIT_COUNT=$(git log --since="${START_DATE}" --until="${END_DATE}" --oneline 2>/dev/null | wc -l)
  echo "- **Commits:** ${COMMIT_COUNT}" >> "${REPORT_FILE}"
  
  # Files changed
  FILES_CHANGED=$(git diff --name-only "$(git log --since="${START_DATE}" --format=%H | tail -1)" HEAD 2>/dev/null | wc -l)
  echo "- **Files Modified:** ${FILES_CHANGED}" >> "${REPORT_FILE}"
fi

echo "" >> "${REPORT_FILE}"

# Key Insights Section (to be filled by ECHO)
echo "## Key Insights" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"
echo "*This section is automatically populated by ECHO based on weekly analysis.*" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"

# Patterns Detected
echo "## Patterns Detected" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"
echo "*ECHO analyzes research queries, code changes, and memory additions to identify emerging patterns.*" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"

# Recommendations
echo "## Recommendations" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"
echo "*Based on this week's activity, ECHO suggests:*" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"

# Trigger ECHO to analyze and fill in the report
echo "---" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"
echo "**Next Steps:** ECHO will analyze this data and provide detailed insights via chat." >> "${REPORT_FILE}"

# Send notification to Friday
echo "📊 Weekly synthesis report generated: ${REPORT_FILE}"

exit 0
