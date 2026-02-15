# contrib-finder

Find contribution opportunities across GitHub repos, ranked by relevance.

## Goal

Support the mission to become #1 open source contributor by systematically discovering good issues/PRs to tackle.

## How it works

1. Scans target repos (OpenClaw ecosystem, tools I use, AI/agent projects)
2. Finds open issues with labels like "good first issue", "help wanted", "bug", "documentation"
3. Ranks by:
   - Label priority (good first issue > help wanted > bug > docs)
   - My expertise areas (Node.js, TypeScript, AI agents, CLI tools)
   - Issue freshness (newer = higher)
   - Comment activity (more discussion = more important)
4. Outputs ranked list with context

## Usage

```bash
contrib-finder [--repos <repo-list>] [--labels <label-list>] [--limit <n>]
```

## Implementation

- Uses `gh` CLI for GitHub API access
- Scoring algorithm weights multiple factors
- Caches results to avoid rate limiting
- Outputs markdown summary

---

Built: 2026-02-13 01:50 AM
Part of: Daily idea generation (heartbeat rotation)
