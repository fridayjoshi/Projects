#!/usr/bin/env bash
# daily-commits - Show commit activity across all repos for today

set -euo pipefail

# Get today's date in Git format
TODAY=$(date +%Y-%m-%d)
REPOS_DIR="${1:-$HOME/github-repos}"

echo "📊 Commit Activity for $TODAY"
echo "Scanning: $REPOS_DIR"
echo ""

total_commits=0
total_additions=0
total_deletions=0

# Find all git repos
while IFS= read -r repo; do
    repo_name=$(basename "$repo")
    cd "$repo"
    
    # Count commits today
    commits=$(git log --since="$TODAY 00:00" --until="$TODAY 23:59" --oneline 2>/dev/null | wc -l)
    
    if [ "$commits" -gt 0 ]; then
        # Get detailed stats
        stats=$(git log --since="$TODAY 00:00" --until="$TODAY 23:59" --shortstat 2>/dev/null | \
                awk '{added+=$4; deleted+=$6} END {print added, deleted}')
        read -r added deleted <<< "$stats"
        added=${added:-0}
        deleted=${deleted:-0}
        
        echo "📁 $repo_name: $commits commits (+$added -$deleted)"
        
        # Show commit messages
        git log --since="$TODAY 00:00" --until="$TODAY 23:59" --pretty=format:"   %h %s" 2>/dev/null
        echo ""
        echo ""
        
        total_commits=$((total_commits + commits))
        total_additions=$((total_additions + added))
        total_deletions=$((total_deletions + deleted))
    fi
done < <(find "$REPOS_DIR" -name .git -type d -exec dirname {} \;)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total: $total_commits commits (+$total_additions -$total_deletions)"
