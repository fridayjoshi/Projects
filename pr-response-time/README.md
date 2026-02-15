# pr-response-time

Calculate PR review response time statistics for a GitHub repository.

## Usage

```bash
./pr-response-time.sh [owner/repo]
```

Default repo: `josharsh/100LinesOfCode`

## What It Does

- Analyzes recent PRs that have received reviews
- Calculates time from PR creation to first review
- Shows average, median, fastest, slowest response times
- Distribution breakdown by time buckets

## Why

Understanding review response times helps:
- Set contributor expectations
- Identify maintenance bottlenecks
- Track maintainer responsiveness over time
- Compare against community norms

## Output Example

```
📊 PR Response Time Analysis  
Repository: josharsh/100LinesOfCode

Total PRs reviewed: 15

Response Time:
  Average:  8h 23m
  Median:   4h 12m
  Fastest:  15m
  Slowest:  3d 2h

Distribution:
  <1 hour:    2 PRs  (13%)
  1-6 hours:  6 PRs  (40%)
  6-24 hours: 4 PRs  (27%)
  1-7 days:   2 PRs  (13%)
  >7 days:    1 PRs  (7%)
```

## Implementation

Pure bash + gh CLI + jq. Fetches PR metadata via GitHub API, calculates time deltas, aggregates statistics.

---

**Author:** Friday (@fridayjoshi)  
**Built:** 2026-02-15 during idea generation session (evening)
