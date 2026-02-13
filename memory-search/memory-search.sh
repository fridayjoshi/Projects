#!/bin/bash
# memory-search.sh - Fast search across MEMORY.md and daily logs with context

set -e

WORKSPACE="${OPENCLAW_WORKSPACE:-$HOME/.openclaw/workspace}"
MEMORY_DIR="$WORKSPACE/memory"
MEMORY_FILE="$WORKSPACE/MEMORY.md"

usage() {
    echo "Usage: memory-search <query> [options]"
    echo ""
    echo "Options:"
    echo "  -c, --context N    Show N lines of context (default: 2)"
    echo "  -d, --days N       Search last N days only (default: all)"
    echo "  -m, --memory-only  Search only MEMORY.md"
    echo "  -h, --help         Show this help"
    echo ""
    echo "Examples:"
    echo "  memory-search 'Pika'"
    echo "  memory-search 'security' --context 5"
    echo "  memory-search 'email' --days 7"
    exit 1
}

# Default values
CONTEXT=2
DAYS=""
MEMORY_ONLY=false
QUERY=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--context)
            CONTEXT="$2"
            shift 2
            ;;
        -d|--days)
            DAYS="$2"
            shift 2
            ;;
        -m|--memory-only)
            MEMORY_ONLY=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            QUERY="$1"
            shift
            ;;
    esac
done

if [[ -z "$QUERY" ]]; then
    echo "Error: No query provided"
    usage
fi

echo "🔍 Searching for: $QUERY"
echo ""

# Search MEMORY.md
if [[ -f "$MEMORY_FILE" ]]; then
    echo "📝 MEMORY.md:"
    grep -i -n -C "$CONTEXT" --color=always "$QUERY" "$MEMORY_FILE" 2>/dev/null || echo "  No matches"
    echo ""
fi

# Search daily logs
if [[ "$MEMORY_ONLY" == false ]]; then
    echo "📅 Daily logs:"
    
    if [[ -n "$DAYS" ]]; then
        # Search last N days only
        find "$MEMORY_DIR" -name "*.md" -type f -mtime -"$DAYS" | sort -r | while read -r file; do
            filename=$(basename "$file")
            matches=$(grep -i -n -C "$CONTEXT" --color=always "$QUERY" "$file" 2>/dev/null || true)
            if [[ -n "$matches" ]]; then
                echo "  📄 $filename:"
                echo "$matches" | sed 's/^/    /'
                echo ""
            fi
        done
    else
        # Search all daily logs
        find "$MEMORY_DIR" -name "*.md" -type f | sort -r | while read -r file; do
            filename=$(basename "$file")
            matches=$(grep -i -n -C "$CONTEXT" --color=always "$QUERY" "$file" 2>/dev/null || true)
            if [[ -n "$matches" ]]; then
                echo "  📄 $filename:"
                echo "$matches" | sed 's/^/    /'
                echo ""
            fi
        done
    fi
fi

echo "✅ Search complete"
