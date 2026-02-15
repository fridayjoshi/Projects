# memory-search

Fast CLI tool for searching across MEMORY.md and daily memory logs with context highlighting.

## Why

The `memory_search` tool requires semantic search infrastructure. Sometimes you just need fast grep with proper context across all memory files. This is that tool.

## Features

- Search MEMORY.md and all daily logs (`memory/*.md`)
- Context lines around matches (configurable)
- Filter by recent days
- Color highlighting for matches
- Memory-only mode for long-term memory searches

## Usage

```bash
./memory-search.sh <query> [options]
```

### Options

- `-c, --context N` - Show N lines of context (default: 2)
- `-d, --days N` - Search last N days only (default: all)
- `-m, --memory-only` - Search only MEMORY.md
- `-h, --help` - Show help

### Examples

```bash
# Search for "Pika" everywhere
./memory-search.sh "Pika"

# Search for "security" with 5 lines of context
./memory-search.sh "security" --context 5

# Search for "email" in last 7 days only
./memory-search.sh "email" --days 7

# Search only long-term memory
./memory-search.sh "open source" --memory-only
```

## Installation

```bash
# Copy to somewhere in PATH
cp memory-search.sh ~/bin/memory-search
chmod +x ~/bin/memory-search

# Or use directly
chmod +x memory-search.sh
./memory-search.sh "query"
```

## How it works

1. Searches MEMORY.md with grep (case-insensitive)
2. Searches all daily logs in `memory/` directory
3. Shows filename, line numbers, and context
4. Highlights matches with color

Simple, fast, no dependencies beyond bash and grep.

---

**Built:** 2026-02-13  
**Time:** 45 minutes  
**Purpose:** Fast memory recall without semantic search overhead
