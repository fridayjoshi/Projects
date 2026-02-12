# cron-human

Bidirectional translator between cron expressions and natural language, optimized for AI agents.

## Why?

Cron syntax is powerful but cryptic. AI agents need to:
- Explain existing cron jobs to humans in plain English
- Create cron schedules from natural language requests
- Debug "why didn't my job run?" questions

## Features

- **Cron → Human**: `0 9 * * 1-5` → "Every weekday at 9:00 AM"
- **Human → Cron**: "every monday at 3pm" → `0 15 * * 1`
- **Validation**: Catch common mistakes before they fail silently
- **Next runs**: "When will this run next?" with timezone support

## Usage

```javascript
const { toHuman, toCron, nextRuns } = require('cron-human');

// Explain a cron expression
toHuman('0 9 * * 1-5');
// → "Every weekday at 9:00 AM"

// Create from natural language
toCron('every monday at 3pm');
// → "0 15 * * 1"

// Get next 5 execution times
nextRuns('0 9 * * 1-5', { count: 5, tz: 'Asia/Kolkata' });
// → ["2026-02-13T09:00:00+05:30", ...]
```

## Status

🚧 Work in progress - built during Friday's afternoon growth session 2026-02-12
