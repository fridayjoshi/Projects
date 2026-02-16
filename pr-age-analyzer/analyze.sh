#!/bin/bash
# PR Age Analyzer - Find ancient PRs that need attention
# Usage: ./analyze.sh [owner/repo]

REPO="${1:-josharsh/100LinesOfCode}"

echo "==================================================="
echo "PR AGE ANALYZER"
echo "Repository: $REPO"
echo "==================================================="
echo ""

# Get all open PRs with creation date
gh pr list --repo "$REPO" --limit 100 --json number,title,author,createdAt,updatedAt --jq '.[] | 
  {
    number: .number,
    title: .title,
    author: .author.login,
    created: .createdAt,
    updated: .updatedAt,
    age_days: ((now - (.createdAt | fromdateiso8601)) / 86400 | floor)
  }' | jq -s '
  # Sort by age descending
  sort_by(.age_days) | reverse | 
  .[] | 
  # Calculate age bracket
  (if .age_days >= 1460 then "🔴 4+ years"
   elif .age_days >= 1095 then "🟠 3+ years"
   elif .age_days >= 730 then "🟡 2+ years"
   elif .age_days >= 365 then "🟢 1+ year"
   elif .age_days >= 180 then "🔵 6+ months"
   else "⚪ Recent"
   end) as $bracket |
  "\($bracket) | PR #\(.number) | \(.age_days)d | @\(.author) | \(.title[:60])"
' | tee /tmp/pr-age-report.txt

echo ""
echo "==================================================="
echo "SUMMARY"
echo "==================================================="

# Count by age bracket
echo ""
echo "Age Distribution:"
grep -c "🔴 4+ years" /tmp/pr-age-report.txt 2>/dev/null | xargs -I{} echo "  4+ years: {}"
grep -c "🟠 3+ years" /tmp/pr-age-report.txt 2>/dev/null | xargs -I{} echo "  3+ years: {}"
grep -c "🟡 2+ years" /tmp/pr-age-report.txt 2>/dev/null | xargs -I{} echo "  2+ years: {}"
grep -c "🟢 1+ year" /tmp/pr-age-report.txt 2>/dev/null | xargs -I{} echo "  1+ year: {}"
grep -c "🔵 6+ months" /tmp/pr-age-report.txt 2>/dev/null | xargs -I{} echo "  6+ months: {}"
grep -c "⚪ Recent" /tmp/pr-age-report.txt 2>/dev/null | xargs -I{} echo "  Recent: {}"

echo ""
echo "Oldest PRs (priority for closure):"
head -5 /tmp/pr-age-report.txt | sed 's/^/  /'

echo ""
echo "Report saved to: /tmp/pr-age-report.txt"
