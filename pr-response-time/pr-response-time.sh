#!/usr/bin/env bash  
# pr-response-time - Calculate PR review response times

set -euo pipefail

REPO="${1:-josharsh/100LinesOfCode}"

echo "📊 PR Response Time Analysis"
echo "Repository: $REPO"
echo ""

echo "Analyzing recent PRs..." >&2

# Get basic stats from recently reviewed PRs
gh pr list --repo "$REPO" --state all --limit 50 --json number,createdAt,reviews | \
  jq -r '
    map(select((.reviews | length) > 0)) |
    map({
      pr: .number,
      created: .createdAt,
      firstReview: .reviews[0].createdAt,
      deltaSeconds: (
        (.reviews[0].createdAt | fromdateiso8601) -
        (.createdAt | fromdateiso8601)
      )
    }) |
    
    if length == 0 then
      "No reviewed PRs found in recent history."
    else
      . as $prs |
      {
        total: ($prs | length),
        avg: ($prs | map(.deltaSeconds) | add / length),
        median: (
          $prs | map(.deltaSeconds) | sort |
          if (length % 2 == 0) then
            (.[length/2 - 1] + .[length/2]) / 2
          else
            .[length/2 | floor]
          end
        ),
        min: ($prs | map(.deltaSeconds) | min),
        max: ($prs | map(.deltaSeconds) | max),
        under1h: ($prs | map(select(.deltaSeconds < 3600)) | length),
        h1to6: ($prs | map(select(.deltaSeconds >= 3600 and .deltaSeconds < 21600)) | length),
        h6to24: ($prs | map(select(.deltaSeconds >= 21600 and .deltaSeconds < 86400)) | length),
        d1to7: ($prs | map(select(.deltaSeconds >= 86400 and .deltaSeconds < 604800)) | length),
        over7d: ($prs | map(select(.deltaSeconds >= 604800)) | length)
      } |
      
      "Total PRs reviewed: \(.total)",
      "",
      "Response Time:",
      "  Average:  \((.avg / 3600) | floor)h \(((.avg % 3600) / 60) | floor)m",
      "  Median:   \((.median / 3600) | floor)h \(((.median % 3600) / 60) | floor)m",
      "  Fastest:  \((.min / 60) | floor)m",
      "  Slowest:  \((.max / 86400) | floor)d \(((.max % 86400) / 3600) | floor)h",
      "",
      "Distribution:",
      "  <1 hour:    \(.under1h) PRs  (\((.under1h * 100.0 / .total) | floor)%)",
      "  1-6 hours:  \(.h1to6) PRs  (\((.h1to6 * 100.0 / .total) | floor)%)",
      "  6-24 hours: \(.h6to24) PRs  (\((.h6to24 * 100.0 / .total) | floor)%)",
      "  1-7 days:   \(.d1to7) PRs  (\((.d1to7 * 100.0 / .total) | floor)%)",
      "  >7 days:    \(.over7d) PRs  (\((.over7d * 100.0 / .total) | floor)%)"
    end
  ' -r

