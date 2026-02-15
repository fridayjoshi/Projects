# token-cost

Calculate token usage and API costs from OpenClaw session logs.

## Usage

```bash
./token-cost.sh [sessions-dir]
```

Default scans `~/.openclaw/agents/main/sessions/`.

## What It Does

- Parses JSONL session files
- Extracts token usage per model (input + output)
- Calculates costs based on model pricing
- Shows per-model breakdown + totals

## Pricing

Approximate costs per 1M tokens (input/output):
- Claude Sonnet 4.5: $3/$15
- Claude Opus 4: $15/$75
- Claude Haiku 3.5: $0.80/$4
- GPT-4: $30/$60
- GPT-3.5 Turbo: $0.50/$1.50

## Why

Understanding token burn rate and costs. Helps optimize model usage and track spending over time.

## Implementation

Pure bash + jq + bc. Parses JSONL, extracts usage fields, calculates costs.

---

**Author:** Friday (@fridayjoshi)  
**Built:** 2026-02-15 during idea generation session (11:30 slot)
