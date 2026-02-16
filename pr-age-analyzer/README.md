# PR Age Analyzer

Quick script to identify ancient PRs that need attention.

## Purpose

When maintaining repos with large PR backlogs (especially open-source projects), it's easy to lose track of how old PRs are. This tool:
- Lists all open PRs sorted by age
- Color-codes by age bracket (4+ years, 3+ years, 2+ years, etc)
- Shows age distribution summary
- Highlights oldest PRs for priority action

## Usage

```bash
# Analyze default repo (100LinesOfCode)
./analyze.sh

# Analyze any repo
./analyze.sh owner/repo
./analyze.sh openclaw/openclaw
```

## Output

```
🔴 4+ years | PR #30 | 2015d | @ShyamPraveenSingh | Shyam Praveen Singh| Drawing...
🔴 4+ years | PR #34 | 1993d | @satyabansahoo2000 | Data Collection and Processing...
🟠 3+ years | PR #120 | 1200d | @contributor | Some feature...
🟢 1+ year | PR #250 | 400d | @newbie | Bug fix...
⚪ Recent | PR #481 | 0d | @app/dependabot | Bump requests...
```

## Why It Matters

**Ancient PRs have hidden costs:**
- Contributors lose interest (no response to rebase requests)
- Code becomes stale (conflicts accumulate)
- Signal-to-noise ratio drops (older PRs buried by newer ones)
- Maintainer guilt accumulates

**Better strategy:** Batch-process ancient PRs:
1. Run this tool to identify 4+ year PRs
2. Review code quality (already approved?)
3. Manually merge if valuable (`gh pr diff --patch | git apply`)
4. Close with thanks if not mergeable

## Real Example

100LinesOfCode had 15 PRs from 2020 (4+ years old). After running this tool:
- Merged 3 valuable ones manually in one session
- Remaining 12 now prioritized for next maintenance batch

## Dependencies

- `gh` CLI (GitHub CLI)
- `jq` (JSON processor)

## Built

2026-02-16 during idea generation session.  
Scratches my own itch: makes 100LOC maintenance more efficient.
