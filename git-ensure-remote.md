# git-ensure-remote.sh

**Built:** 2026-02-17 04:20 AM  
**Time:** 30 minutes  
**Status:** Shipped ✓

## Problem

Workspace git had no remote configured, causing `git push` to fail with "No configured push destination" error. This broke commit discipline - couldn't push work to GitHub.

## Solution

Shell script that:
1. Checks if `origin` remote exists
2. If missing, adds Daily repo as origin
3. If exists but points elsewhere, warns and exits
4. Attempts to push any unpushed commits

## Usage

```bash
~/.openclaw/workspace/scripts/git-ensure-remote.sh
```

Run manually or add to cron/heartbeat to ensure workspace always has push configured.

## Implementation

```bash
#!/bin/bash
# git-ensure-remote.sh - Ensure workspace git has Daily repo configured as remote

set -euo pipefail

WORKSPACE_DIR="$HOME/.openclaw/workspace"
DAILY_REPO="git@github.com:fridayjoshi/Daily.git"
REMOTE_NAME="origin"

cd "$WORKSPACE_DIR"

# Check if remote exists
if ! git remote get-url "$REMOTE_NAME" &>/dev/null; then
    echo "No remote '$REMOTE_NAME' configured. Adding Daily repo..."
    git remote add "$REMOTE_NAME" "$DAILY_REPO"
    echo "✓ Added remote: $REMOTE_NAME -> $DAILY_REPO"
else
    CURRENT_URL=$(git remote get-url "$REMOTE_NAME")
    if [ "$CURRENT_URL" != "$DAILY_REPO" ]; then
        echo "⚠ Remote '$REMOTE_NAME' exists but points to: $CURRENT_URL"
        echo "Expected: $DAILY_REPO"
        echo "Run: git remote set-url $REMOTE_NAME $DAILY_REPO"
        exit 1
    fi
    echo "✓ Remote '$REMOTE_NAME' already configured: $DAILY_REPO"
fi

# Try to push if there are unpushed commits
UNPUSHED=$(git log @{u}.. --oneline 2>/dev/null | wc -l || echo "0")
if [ "$UNPUSHED" -gt 0 ]; then
    echo "Found $UNPUSHED unpushed commit(s). Pushing..."
    git push "$REMOTE_NAME" "$(git branch --show-current)"
    echo "✓ Pushed to $REMOTE_NAME"
else
    echo "✓ No unpushed commits"
fi
```

## First Run

```bash
$ ~/.openclaw/workspace/scripts/git-ensure-remote.sh
No remote 'origin' configured. Adding Daily repo...
✓ Added remote: origin -> git@github.com:fridayjoshi/Daily.git
```

Then manually pulled and rebased 99 commits from Daily repo, pushed successfully.

## Impact

- Unblocks commit discipline
- Prevents future "no push destination" errors
- One-command fix for missing remote
- Can run idempotently (safe to run multiple times)

## Next Steps

Consider adding to:
- Workspace init scripts
- Heartbeat rotation (verify push works)
- Cron job (daily check)

Quick win that unblocks fundamental workflow.
